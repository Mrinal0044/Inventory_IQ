# pyrefly: ignore [missing-import]
from fastapi import APIRouter
import pandas as pd
import os

from app.services.forecast_service import train_forecast
from app.utils.schema_detector import detect_columns

router = APIRouter()

DEFAULT_DATASET = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "..", "..", "datasets",
    "InventoryIQ_Synthetic_Dataset.csv"
)

@router.post("/forecast")
def forecast(data: dict = None):
    if data is None:
        data = {}

    path = data.get("file_path")
    if path and not os.path.exists(path):
        from app.services.mongodb_service import get_analysis_by_file_path
        saved = get_analysis_by_file_path(path)
        if saved:
            forecast_results = saved["forecast_results"]
            products = sorted(list(forecast_results.keys()))
            
            selected_product = data.get("product")
            if not selected_product or selected_product not in products:
                selected_product = products[0] if products else ""
                
            return {
                "product": selected_product,
                "products": products,
                "next_7_day_forecast": forecast_results.get(selected_product, [])
            }

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

    # Detect schema
    schema = detect_columns(df.columns)

    # Get product column
    product_col = schema["product"]

    if product_col is None:
        return {
            "error": "Product column not found in dataset"
        }

    # Get all products
    products = sorted(df[product_col].dropna().unique().tolist())

    if len(products) == 0:
        return {
            "error": "No products found"
        }

    # Use requested product or default to first
    selected_product = data.get("product")
    if not selected_product or selected_product not in products:
        selected_product = products[0]

    # Filter dataset for that product
    product_df = df[
        df[product_col] == selected_product
    ]

    # Generate forecast
    preds = train_forecast(
        product_df,
        schema["date"],
        schema["sales"]
    )

    return {
        "product": selected_product,
        "products": products,
        "next_7_day_forecast": preds
    }