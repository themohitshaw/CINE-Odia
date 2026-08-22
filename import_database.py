import os
import psycopg2
from dotenv import load_dotenv
import pandas as pd

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
excel_file_path = "database/DB_demo.xlsx"

try:
    df = pd.read_excel(excel_file_path)
    excel_columns = df.columns.to_list()
    print(excel_columns)

    required_columns = [
    "id",
    "title",
    "release",
    "rate",
    "genre",
    "star_cast",
    "poster_link",
    "movie_link",
    ]

    missing_columns = []
    for columns in required_columns:
        if columns in excel_columns:
            print(f"{columns} found")
        else:
            missing_columns.append(columns)

    print(missing_columns)

    # Data cleaning process
    df['title'] = df["title"].astype("string").str.strip()
    df['genre'] = df["genre"].astype("string").str.strip()
    df['star_cast'] = df['star_cast'].astype("string").str.strip()
    df['poster_link'] = df["poster_link"].astype("string").str.strip()
    df['movie_link'] = df["movie_link"].astype("string").str.strip()

    df['id'] = pd.to_numeric(df['id'] , errors="coerce")
    df['release'] = pd.to_numeric(df['release'] , errors="coerce")
    df['rate'] = pd.to_numeric(df['rate'] , errors="coerce")

    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    print("Database connection sucessfully")

    insert_query = """
    INSERT INTO movies
    (
        id,
        title,
        release,
        rate,
        genre,
        star_cast,
        poster_link,
        movie_link
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """

    for _ , row in df.iterrows():

        cursor.execute(
            insert_query,
            (int(row['id']),
            row['title'],
            None if pd.isnull(row['release']) else int(row['release']),
            None if pd.isnull(row['rate']) else float(row['rate']),
            None if pd.isnull(row['genre']) else row['genre'],
            None if pd.isnull(row['star_cast']) else row['star_cast'],
            None if pd.isnull(row['poster_link']) else row['poster_link'],
            None if pd.isnull(row['movie_link']) else row['movie_link'])
        ) 

    conn.commit()

    print(f"{len(df)} movies imported successfully!")

    cursor.close()
    conn.close()

except Exception as e:
    print("Database connection failed or data not imported")
    print(e)