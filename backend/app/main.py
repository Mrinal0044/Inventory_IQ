
# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware

from app.routes.upload import router as upload_router
from app.routes.forecast import router as forecast_router
from app.routes.inventory import router as inventory_router
from app.routes.profile import router as profile_router
from app.routes.category import router as category_router
from app.routes.history import router as history_router

app = FastAPI(title="InventoryIQ")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(upload_router)
app.include_router(forecast_router)
app.include_router(inventory_router)
app.include_router(profile_router)
app.include_router(category_router)
app.include_router(history_router)

@app.get("/")
def root():
    return {
        "message": "InventoryIQ Backend Running"
    }

@app.get("/health")
def health():
    return {
        "status": "running"
    }

@app.get("/debug")
def debug_info():
    import os
    import sys
    import subprocess
    
    java_home = os.environ.get("JAVA_HOME")
    java_version = "Not found"
    try:
        res = subprocess.run(["java", "-version"], capture_output=True, text=True, check=True)
        java_version = res.stderr or res.stdout
    except Exception as e:
        java_version = f"Error running java: {e}"
        
    spark_status = "Not tested"
    try:
        from pyspark.sql import SparkSession
        spark = SparkSession.builder.appName("Test").getOrCreate()
        spark_status = f"Spark version: {spark.version}"
        spark.stop()
    except Exception as e:
        import traceback
        spark_status = f"Spark failed: {e}\n{traceback.format_exc()}"
        
    mongo_status = "Not tested"
    try:
        from app.database.mongodb import verify_connection
        mongo_status = f"Connected: {verify_connection()}"
    except Exception as e:
        mongo_status = f"Mongo failed: {e}"
        
    # Exclude sensitive environment variables for security
    safe_env = {
        k: v for k, v in os.environ.items()
        if not any(x in k.upper() for x in ["URI", "PASS", "KEY", "SECRET", "TOKEN"])
    }
        
    return {
        "java_home": java_home,
        "java_version": java_version.strip().split("\n") if isinstance(java_version, str) else java_version,
        "spark_status": spark_status,
        "mongo_status": mongo_status,
        "python_version": sys.version,
        "cwd": os.getcwd(),
        "env": safe_env
    }

