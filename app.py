from flask import Flask , render_template , request

import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def get_database_connection():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        print("Database connect sucessfully")
        return conn
    except Exception as e:
        print("Data base connection failed: ",e)
        return None


app = Flask(__name__)

@app.route('/' , methods = ["GET" , "POST"])
def home():
    all_movies = []
    # if request.method == "POST":
    if request.method == "POST" and "movies" in request.form and "search" not in request.form:
        movie_list = request.form.getlist("movies")
        print(movie_list)
        new_movie_list = []
        for movie in movie_list:
            movie = movie.strip()
            if movie:
                new_movie_list.append(movie)
        print(new_movie_list)

    elif request.method == "POST" and "search" in request.form:
        conn = get_database_connection()
        if conn:
            cursor = conn.cursor()
            search_movie = request.form.get("search").strip()
            print(search_movie)
            if search_movie:
                cursor.execute(
                    """
                        SELECT id , title , release , rate , 
                        genre , star_cast , poster_link , movie_link
                        FROM movies
                        WHERE title ILIKE %s
                        ORDER BY title  
                    """,
                    (f"%{search_movie}%",)
                )

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
    else:
        conn = get_database_connection()
        if conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT id , title , release , rate , genre , star_cast, poster_link , movie_link
                FROM movies
                ORDER BY title
                """
            )

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
    return render_template('index.html' ,all_movies = all_movies )




if __name__ == "__main__":
    app.run(debug=True)