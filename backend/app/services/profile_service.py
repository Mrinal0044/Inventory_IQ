import pandas as pd

def profile_dataset(df, sales_col, product_col, category_col):

    summary = {
        "rows": len(df),
        "columns": len(df.columns),
        "missing_values": int(df.isnull().sum().sum()),

        "sales_summary": {
            "min": float(df[sales_col].min()),
            "max": float(df[sales_col].max()),
            "avg": float(df[sales_col].mean())
        },

        "top_products":
            df.groupby(product_col)[sales_col]
              .sum()
              .sort_values(ascending=False)
              .head(5)
              .to_dict(),

        "top_categories":
            df.groupby(category_col)[sales_col]
              .sum()
              .sort_values(ascending=False)
              .head(5)
              .to_dict()
    }

    return summary