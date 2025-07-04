import pymongo
import csv

# Replace with your actual MongoDB URI
mongo_uri = "mongodb+srv://Nilesh:Nilesh1286@cluster0.8vgam.mongodb.net/cravio?retryWrites=true&w=majority"

# Connect to MongoDB
client = pymongo.MongoClient(mongo_uri)
db = client["cravio"]
collection = db["user"]

# Open a CSV file to write
with open("emails.csv", "w", newline="") as file:
    writer = csv.writer(file)
    writer.writerow(["email"])  # CSV header

    # Find all documents with email field
    for doc in collection.find({"email": {"$exists": True}}, {"_id": 0, "email": 1}):
        email = doc.get("email")
        if email:
            writer.writerow([email])

print("✅ Exported all emails to emails.csv")
