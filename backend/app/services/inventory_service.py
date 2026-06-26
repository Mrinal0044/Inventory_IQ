from app.services.health_service import stock_health

def inventory_analysis(df,
                       sales_col,
                       stock_col):

    avg_sales = df[sales_col].mean()
    current_stock = df[stock_col].mean()

    if avg_sales == 0:
        days_left = 999
    else:
        days_left = current_stock / avg_sales

    recommendation = max(
        0,
        int(avg_sales * 30 - current_stock)
    )

    health = stock_health(days_left)

    return {
        "average_sales": round(avg_sales, 2),
        "current_stock": round(current_stock, 2),
        "days_until_stockout": round(days_left, 2),
        "recommended_order": recommendation,
        "health_score": health["score"],
        "stock_status": health["status"]
    }