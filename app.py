from flask import Flask, render_template, request
import os
import psycopg2
from dotenv import load_dotenv
import re

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


# =========================================================
# DATABASE CONNECTION
# =========================================================

def get_database_connection():

    try:
        conn = psycopg2.connect(DATABASE_URL)

        print("Database connected successfully")

        return conn

    except Exception as e:

        print("Database connection failed:", e)

        return None


# =========================================================
# FLASK APP
# =========================================================

app = Flask(__name__)


# =========================================================
# HOME ROUTE
# =========================================================

@app.route("/", methods=["GET", "POST"])
def home():

    # All movies for Explore
    all_movies = []

    # Search results
    search_results = []

    # Suggestions
    suggestions = []

    # True only once the "Get Suggestions" form has actually been
    # submitted. The template uses this — not `suggestions` — to
    # decide whether to show the section at all, so it can tell
    # "not submitted yet" apart from "submitted but zero matches".
    suggestions_submitted = False


    # =====================================================
    # LOAD ALL MOVIES
    # =====================================================

    conn = get_database_connection()

    if conn:

        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                id,
                title,
                release,
                rate,
                genre,
                star_cast,
                poster_link,
                movie_link
            FROM movies
            ORDER BY release DESC
        """)

        rows = cursor.fetchall()

        for row in rows:

            all_movies.append({
                "id": row[0],
                "title": row[1],
                "release": row[2],
                "rate": row[3],
                "genre": row[4],
                "star_cast": row[5],
                "poster_link": row[6],
                "movie_link": row[7]
            })

        cursor.close()
        conn.close()


    # =====================================================
    # SEARCH MOVIE
    # =====================================================

    if request.method == "POST" and "search" in request.form:

        search_movie = request.form.get("search", "").strip()

        print("Searching for:", search_movie)

        if search_movie:

            conn = get_database_connection()

            if conn:

                cursor = conn.cursor()

                cursor.execute("""
                    SELECT
                        id,
                        title,
                        release,
                        rate,
                        genre,
                        star_cast,
                        poster_link,
                        movie_link
                    FROM movies
                    WHERE title ILIKE %s
                    ORDER BY title
                """, (f"%{search_movie}%",))

                rows = cursor.fetchall()

                for row in rows:

                    search_results.append({
                        "id": row[0],
                        "title": row[1],
                        "release": row[2],
                        "rate": row[3],
                        "genre": row[4],
                        "star_cast": row[5],
                        "poster_link": row[6],
                        "movie_link": row[7]
                    })

                cursor.close()
                conn.close()


    # =====================================================
    # FAVORITE MOVIES / SUGGESTIONS
    # =====================================================

    if request.method == "POST" and "movies" in request.form:

        # The form was submitted — the suggestions section should
        # render regardless of how many (if any) matches come back.
        suggestions_submitted = True

        movie_list = request.form.getlist("movies")

        new_movie_list = []

        for movie in movie_list:

            movie = movie.strip()

            if movie:

                new_movie_list.append(movie)

        # print("Selected movies:", new_movie_list)

        input_movies = []

        for movie in new_movie_list:
            cleaned_movie = re.sub(r"\s+", " ", movie).strip()

            conn = get_database_connection()

            if not conn:
                continue

            cursor = conn.cursor()
            cursor.execute("""
                SELECT
                    id,
                    title,
                    release,
                    rate,
                    genre,
                    star_cast,
                    poster_link,
                    movie_link
                FROM movies
                WHERE title ILIKE %s
                ORDER BY title
            """, (f"%{cleaned_movie}%",))

            rows = cursor.fetchall()

            if rows:
                row = rows[0]
                input_movies.append({
                    "id": row[0],
                    "title": row[1],
                    "release": row[2],
                    "rate": row[3],
                    "genre": row[4],
                    "star_cast": row[5],
                    "poster_link": row[6],
                    "movie_link": row[7]
                })

            cursor.close()
            conn.close()

        # Only attempt to build recommendations if at least one of the
        # submitted titles actually matched something in the database.
        # This also avoids passing empty arrays into ANY(%s)/ALL(%s),
        # which errors out in Postgres.
        if input_movies:

            release_list = []
            genre_list = []
            star_cast_list = []

            for input_movie in input_movies:
                print(input_movie)

                movie_genre = input_movie["genre"].strip()
                if " " in movie_genre:
                    split_genre = movie_genre.split(',')
                    for item in split_genre:
                        genre_list.append(item.strip())
                else:
                    genre_list.append(movie_genre.strip())

                movie_release = input_movie["release"]
                release_list.append(movie_release)

                movie_star_cast = input_movie["star_cast"]
                if " " in movie_star_cast:
                    split_star_cast = movie_star_cast.split(',')
                    for item in split_star_cast:
                        star_cast_list.append(item.strip())
                else:
                    star_cast_list.append(movie_genre.strip())

            # genre_list = list(set(genre_list))

            duplicate_genre = []
            duplicate_release = []
            duplicate_star_cast = []

            for genre in genre_list:
                if genre_list.count(genre) > 1 and genre not in duplicate_genre:
                    duplicate_genre.append(genre)

            for release in release_list:
                if release_list.count(release) > 1 and release not in duplicate_release:
                    duplicate_release.append(release)

            for star_cast in star_cast_list:
                if star_cast_list.count(star_cast) > 1 and star_cast not in duplicate_star_cast:
                    duplicate_star_cast.append(star_cast)

            print(duplicate_genre)
            print(duplicate_release)
            print(duplicate_star_cast)

            input_movie_ids = [movie["id"] for movie in input_movies]
            print("Excluding IDs:", input_movie_ids)

            # Fresh connection/cursor for the recommendation query, so
            # it never depends on a cursor left over from the loop above.
            conn = get_database_connection()

            if conn:

                cursor = conn.cursor()

                cursor.execute("""
                    SELECT id, title, release, rate, genre, star_cast, poster_link, movie_link
                    FROM movies
                    WHERE release = ANY(%s)
                    AND genre ILIKE ANY(%s)
                    AND star_cast ILIKE ANY(%s)
                    AND id != ALL(%s)
                    ORDER BY title
                """, (
                    duplicate_release if duplicate_release else release_list,
                    [f"%{g}%" for g in (duplicate_genre if duplicate_genre else genre_list)],
                    [f"%{s}%" for s in (duplicate_star_cast if duplicate_star_cast else star_cast_list)],
                    input_movie_ids
                ))

                suggestion_rows = cursor.fetchall()

                for row in suggestion_rows:
                    suggestions.append({
                        "id": row[0],
                        "title": row[1],
                        "release": row[2],
                        "rate": row[3],
                        "genre": row[4],
                        "star_cast": row[5],
                        "poster_link": row[6],
                        "movie_link": row[7]
                    })

                cursor.close()
                conn.close()

            for movie in suggestions:
                print(movie)
                print("_" * 30)

            print(len(suggestions))



    # =====================================================
    # DEBUG
    # =====================================================

    print("All movies:", len(all_movies))
    print("Search results:", len(search_results))


    # =====================================================
    # SEND DATA TO HTML
    # =====================================================

    return render_template(
        "index.html",
        all_movies=all_movies,
        search_results=search_results,
        suggestions=suggestions,
        suggestions_submitted=suggestions_submitted
    )


# =========================================================
# RUN APPLICATION
# =========================================================

if __name__ == "__main__":

    app.run(debug=True)
