import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load env variables
load_dotenv()

# We look for MONGODB_URI or MONGO_URI in environment variables
MONGODB_URI = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI")
DATABASE_NAME = "inventory_iq"
COLLECTION_NAME = "analysis_history"

_client = None

def get_mongodb_client():
    global _client
    if _client is None:
        if not MONGODB_URI:
            raise ValueError("MONGODB_URI environment variable is not set in .env")
        _client = MongoClient(MONGODB_URI)
    return _client

def get_db():
    client = get_mongodb_client()
    return client[DATABASE_NAME]

def get_collection():
    db = get_db()
    return db[COLLECTION_NAME]

def verify_connection():
    try:
        client = get_mongodb_client()
        # The ping command is a cheap way to verify connectivity
        client.admin.command('ping')
        return True
    except Exception as e:
        print(f"MongoDB connection check failed: {e}")
        return False
