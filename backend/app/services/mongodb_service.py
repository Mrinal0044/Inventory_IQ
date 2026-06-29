import datetime
from app.database.mongodb import get_collection

def save_analysis(
    analysis_id: str,
    original_file_name: str,
    file_path: str,
    dataset_summary: dict,
    inventory_analysis: dict,
    forecast_results: dict,
    category_demand: dict,
    health_score: float,
    business_insights: list
):
    """
    Saves a completed analysis and its metadata to MongoDB.
    """
    collection = get_collection()
    doc = {
        "analysis_id": analysis_id,
        "upload_timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "original_file_name": original_file_name,
        "file_path": file_path,
        "dataset_summary": dataset_summary,
        "inventory_analysis": inventory_analysis,
        "forecast_results": forecast_results,
        "category_demand": category_demand,
        "health_score": health_score,
        "business_insights": business_insights
    }
    collection.insert_one(doc)
    return doc

def get_all_analyses():
    """
    Retrieves all saved analyses from MongoDB, sorted by upload timestamp descending.
    """
    collection = get_collection()
    docs = list(collection.find({}, {"_id": 0}).sort("upload_timestamp", -1))
    return docs

def get_analysis_by_id(analysis_id: str):
    """
    Retrieves a single saved analysis from MongoDB by its analysis ID.
    """
    collection = get_collection()
    doc = collection.find_one({"analysis_id": analysis_id}, {"_id": 0})
    return doc

def delete_analysis_by_id(analysis_id: str):
    """
    Deletes a saved analysis from MongoDB by its analysis ID.
    """
    collection = get_collection()
    res = collection.delete_one({"analysis_id": analysis_id})
    return res.deleted_count > 0

def get_analysis_by_file_path(file_path: str):
    """
    Retrieves a saved analysis by its temporary unique file path.
    """
    collection = get_collection()
    doc = collection.find_one({"file_path": file_path}, {"_id": 0})
    return doc
