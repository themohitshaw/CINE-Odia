import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

try:
    psycopg2.connect(DATABASE_URL)
    print("Data base connected sucessfully")
except Exception as e:
    print("Data base connection failed")
    print(e)

