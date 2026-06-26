from fastapi import APIRouter
from fastapi import UploadFile
from fastapi import File

import pandas as pd
import os

from app.utils.schema_detector import detect_columns

router = APIRouter()

UPLOAD_DIR = "uploads"

os.makedirs(UPLOAD_DIR,
            exist_ok=True)

@router.post("/upload")
async def upload(file: UploadFile = File(...)):

    path = os.path.join(
        UPLOAD_DIR,
        file.filename
    )

    with open(path,"wb") as f:
        f.write(await file.read())

    from app.services.spark_service import (
        create_spark_session,
        load_dataset,
        clean_dataset,
        feature_engineering,
        aggregate_sales,
        convert_to_pandas
    )

    spark = create_spark_session()
    df_spark = load_dataset(spark, path)
    df_clean = clean_dataset(df_spark)
    df_feat = feature_engineering(df_clean)
    df_agg = aggregate_sales(df_feat)
    df = convert_to_pandas(df_agg)

    schema = detect_columns(df.columns)

    return {
        "rows": len(df),
        "columns": len(df.columns),
        "detected_schema": schema,
        "file_path": path
    }