import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB = os.getenv("MONGO_DB")

if not MONGO_URI or not MONGO_DB:
    raise ValueError(
        "Missing required environment variables: MONGO_URI and MONGO_DB. "
        "Please add these in the Replit Secrets panel."
    )

client = MongoClient(MONGO_URI)
db = client[MONGO_DB]
users_collection = db["user"]