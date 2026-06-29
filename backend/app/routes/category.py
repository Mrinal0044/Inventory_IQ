# pyrefly: ignore [missing-import]
from fastapi import APIRouter
import pandas as pd
import os

from app.utils.schema_detector import detect_columns
from app.services.category_forecast import category_demand

router = APIRouter()

DEFAULT_DATASET = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "..", "..", "datasets",
    "InventoryIQ_Synthetic_Dataset.csv"
)

@router.post("/category-demand")
def category(data: dict = None):
    if data is None:
        data = {}

    path = data.get("file_path")
    if path and not os.path.exists(path):
        from app.services.mongodb_service import get_analysis_by_file_path
        saved = get_analysis_by_file_path(path)
        if saved:
            return saved["category_demand"]

    if not path or not os.path.exists(path):
        path = DEFAULT_DATASET

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

    return category_demand(
        df,
        schema["category"],
        schema["sales"]
    )