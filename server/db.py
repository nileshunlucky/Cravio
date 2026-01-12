import os
from pymongo import MongoClient
from dotenv import load_dotenv

# 1. Load the .env file
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB = os.getenv("MONGO_DB")

# --- DEBUGGING CHECK ---
if MONGO_DB is None:
    raise ValueError("CRITICAL: MONGO_DB is not set in .env file or .env is not found.")

if MONGO_URI is None:
    raise ValueError("CRITICAL: MONGO_URI is not set in .env file.")
# -----------------------

client = MongoClient(MONGO_URI)

# This will now work because we've verified MONGO_DB is a string
db = client[str(MONGO_DB)] 
users_collection = db["user"]