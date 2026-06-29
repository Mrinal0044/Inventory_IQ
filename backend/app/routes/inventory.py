# pyrefly: ignore [missing-import]
from fastapi import APIRouter
import pandas as pd
import os

from app.utils.schema_detector import detect_columns
from app.services.inventory_service import inventory_analysis

router = APIRouter()

DEFAULT_DATASET = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "..", "..", "datasets",
    "InventoryIQ_Synthetic_Dataset.csv"
)

@router.post("/inventory-analysis")
def analyze(data: dict = None):
    if data is None:
        data = {}

    path = data.get("file_path")
    if path and not os.path.exists(path):
        from app.services.mongodb_service import get_analysis_by_file_path
        saved = get_analysis_by_file_path(path)
        if saved:
            return saved["inventory_analysis"]

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

    sales_col = schema["sales"]
    stock_col = schema["inventory"]
    product_col = schema["product"]
    date_col = schema["date"]

    result = inventory_analysis(
        df,
        sales_col,
        stock_col
    )

    # Calculate per-product breakdown
    if product_col and date_col:
        # Convert date to datetime
        df[date_col] = pd.to_datetime(df[date_col])

        product_stats = []
        for prod, group in df.groupby(product_col):
            group_sorted = group.sort_values(by=date_col, ascending=False)
            latest_stock = float(group_sorted.iloc[0][stock_col]) if len(group_sorted) > 0 else 0.0
            mean_sales = float(group[sales_col].mean()) if len(group) > 0 else 0.0

            if mean_sales == 0:
                days_left = 999.0
            else:
                days_left = latest_stock / mean_sales

            recommendation = max(0, int(mean_sales * 30 - latest_stock))

            from app.services.health_service import stock_health
            health = stock_health(days_left)

            category_val = "General"
            if schema["category"] and schema["category"] in group_sorted.columns:
                category_val = str(group_sorted.iloc[0][schema["category"]])

            product_stats.append({
                "product": prod,
                "category": category_val,
                "current_stock": round(latest_stock, 1),
                "average_sales": round(mean_sales, 1),
                "days_until_stockout": round(days_left, 1),
                "recommended_order": recommendation,
                "health_score": health["score"],
                "stock_status": health["status"]
            })

        result["product_analysis"] = product_stats

    return result