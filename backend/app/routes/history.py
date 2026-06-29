from fastapi import APIRouter, HTTPException
from app.services.mongodb_service import get_all_analyses, get_analysis_by_id, delete_analysis_by_id

router = APIRouter(prefix="/history", tags=["History"])

@router.get("")
def read_history():
    """
    Returns all previous analyses from MongoDB.
    """
    try:
        return get_all_analyses()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{analysis_id}")
def read_analysis(analysis_id: str):
    """
    Returns a specific saved analysis by its unique analysis_id.
    """
    try:
        analysis = get_analysis_by_id(analysis_id)
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        return analysis
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.delete("/{analysis_id}")
def remove_analysis(analysis_id: str):
    """
    Deletes a specific saved analysis from MongoDB.
    """
    try:
        deleted = delete_analysis_by_id(analysis_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Analysis not found or already deleted")
        return {"status": "success", "message": "Analysis deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
