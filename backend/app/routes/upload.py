# pyrefly: ignore [missing-import]
from fastapi import APIRouter
# pyrefly: ignore [missing-import]
from fastapi import UploadFile
# pyrefly: ignore [missing-import]
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
    import uuid
    analysis_id = str(uuid.uuid4())
    path = os.path.join(
        UPLOAD_DIR,
        f"{analysis_id}_{file.filename}"
    )

    with open(path, "wb") as f:
        f.write(await file.read())

    try:
        from app.services.spark_service import (
            create_spark_session,
            load_dataset,
            clean_dataset,
            feature_engineering,
            aggregate_sales,
            convert_to_pandas
        )
        from app.services.profile_service import profile_dataset
        from app.services.inventory_service import inventory_analysis
        from app.services.category_forecast import category_demand
        from app.services.forecast_service import train_forecast
        from app.services.mongodb_service import save_analysis
        from app.services.health_service import stock_health

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
        category_col = schema["category"]
        date_col = schema["date"]

        # 1. Dataset summary
        dataset_summary = profile_dataset(df, sales_col, product_col, category_col)

        # 2. Inventory analysis & stock health
        inv_res = inventory_analysis(df, sales_col, stock_col)
        
        # Calculate product breakdown (exactly as in inventory.py router)
        product_stats = []
        if product_col and date_col:
            df[date_col] = pd.to_datetime(df[date_col])
            for prod, group in df.groupby(product_col):
                group_sorted = group.sort_values(by=date_col, ascending=False)
                latest_stock = float(group_sorted.iloc[0][stock_col]) if len(group_sorted) > 0 else 0.0
                mean_sales = float(group[sales_col].mean()) if len(group) > 0 else 0.0

                if mean_sales == 0:
                    days_left = 999.0
                else:
                    days_left = latest_stock / mean_sales

                recommendation = max(0, int(mean_sales * 30 - latest_stock))
                health = stock_health(days_left)

                category_val = "General"
                if category_col and category_col in group_sorted.columns:
                    category_val = str(group_sorted.iloc[0][category_col])

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
        inv_res["product_analysis"] = product_stats

        # 3. Category demand
        cat_demand = category_demand(df, category_col, sales_col)

        # 4. Forecast results for all products
        forecast_results = {}
        if product_col and date_col and sales_col:
            products = sorted(df[product_col].dropna().unique().tolist())
            for prod in products:
                product_df = df[df[product_col] == prod]
                preds = train_forecast(product_df, date_col, sales_col)
                forecast_results[prod] = preds

        # 5. Business insights
        insights = []
        if cat_demand:
            top_category = max(cat_demand, key=cat_demand.get)
            top_sales = cat_demand[top_category]
            insights.append(f"Top performing category is '{top_category}' with total sales of {top_sales} units.")
        
        health_score = inv_res.get("health_score", 100)
        if health_score < 50:
            insights.append("Critical Alert: Warehouse inventory health is very low. High risk of stockouts.")
        elif health_score < 75:
            insights.append("Warning: Moderate inventory imbalances detected. Review safety stock levels.")
        else:
            insights.append("Good News: Warehouse inventory levels are healthy and well-balanced.")

        critical_products = [p["product"] for p in product_stats if p["stock_status"] == "CRITICAL"]
        warning_products = [p["product"] for p in product_stats if p["stock_status"] == "WARNING"]
        if critical_products:
            insights.append(f"Critical stockouts imminent for: {', '.join(critical_products[:3])}. Immediate restock required.")
        if warning_products:
            insights.append(f"Low stock levels detected for: {', '.join(warning_products[:3])}. Consider reordering soon.")

        total_recommended = inv_res.get("recommended_order", 0)
        if total_recommended > 0:
            insights.append(f"Restock advice: Procure an aggregate of {total_recommended} units across all products to meet 30-day safety stock.")
        else:
            insights.append("Current inventory levels are sufficient to cover expected sales for the next 30 days.")

        # Save all results to MongoDB Atlas
        save_analysis(
            analysis_id=analysis_id,
            original_file_name=file.filename,
            file_path=path,
            dataset_summary=dataset_summary,
            inventory_analysis=inv_res,
            forecast_results=forecast_results,
            category_demand=cat_demand,
            health_score=health_score,
            business_insights=insights
        )

    finally:
        # Delete temporary file
        if os.path.exists(path):
            try:
                os.remove(path)
            except Exception as e:
                print(f"Failed to delete temporary file {path}: {e}")

    return {
        "rows": len(df),
        "columns": len(df.columns),
        "detected_schema": schema,
        "file_path": path
    }