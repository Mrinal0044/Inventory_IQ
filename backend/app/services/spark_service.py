import os

# Avoid compatibility issues with Java 24 by pointing PySpark to JDK 17 if installed via Homebrew
jdk17_path = "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
if os.path.exists(jdk17_path):
    os.environ["JAVA_HOME"] = jdk17_path

from pyspark.sql import SparkSession
from pyspark.sql.functions import col, to_date, dayofmonth, month, dayofweek, quarter, sum as spark_sum, mean as spark_mean, first as spark_first
import pandas as pd
from app.utils.schema_detector import detect_columns

_spark_session = None

def create_spark_session():
    """
    Creates and returns a singleton SparkSession configured for local execution.
    """
    global _spark_session
    if _spark_session is None:
        _spark_session = SparkSession.builder \
            .appName("InventoryIQ") \
            .config("spark.driver.bindAddress", "127.0.0.1") \
            .config("spark.sql.execution.arrow.pyspark.enabled", "true") \
            .getOrCreate()
    return _spark_session

def load_dataset(spark: SparkSession, path: str):
    """
    Loads a dataset from the specified path. Supports CSV natively through Spark
    and falls back to Pandas conversion for Excel files.
    """
    if path.endswith(".csv"):
        return spark.read.csv(path, header=True, inferSchema=True)
    else:
        # Load via Pandas and convert to Spark DataFrame
        pdf = pd.read_excel(path)
        pdf.columns = [str(c) for c in pdf.columns]
        for col_name in pdf.select_dtypes(include=['object']).columns:
            pdf[col_name] = pdf[col_name].astype(object).where(pdf[col_name].notnull(), None)
        return spark.createDataFrame(pdf)

def clean_dataset(df, schema=None):
    """
    Cleans the dataset by dropping duplicates, removing rows with null values
    in critical keys (Date, Product), and casting/filtering numeric columns.
    """
    if schema is None:
        schema = detect_columns(df.columns)

    # 1. Drop duplicate rows
    df = df.dropDuplicates()

    # 2. Drop rows where date or product is null
    essential_cols = []
    if schema.get("date"):
        essential_cols.append(schema["date"])
    if schema.get("product"):
        essential_cols.append(schema["product"])

    if essential_cols:
        df = df.dropna(subset=essential_cols)

    # 3. Clean and cast Sales
    if schema.get("sales"):
        sales_col = schema["sales"]
        df = df.withColumn(sales_col, col(sales_col).cast("double"))
        df = df.filter(col(sales_col) >= 0).fillna({sales_col: 0.0})

    # 4. Clean and cast Inventory/Stock
    if schema.get("inventory"):
        inventory_col = schema["inventory"]
        df = df.withColumn(inventory_col, col(inventory_col).cast("double"))
        df = df.filter(col(inventory_col) >= 0).fillna({inventory_col: 0.0})

    return df

def feature_engineering(df, schema=None):
    """
    Adds datetime features (day, month, weekday, quarter) based on the Date column.
    Ensures that the weekday feature aligns with Pandas dt.weekday (0=Monday, 6=Sunday).
    """
    if schema is None:
        schema = detect_columns(df.columns)

    date_col = schema.get("date")
    if not date_col:
        return df

    # Ensure Date column is of DateType
    df = df.withColumn(date_col, to_date(col(date_col)))

    # Feature engineering using Spark functions
    df = df.withColumn("day", dayofmonth(col(date_col)))
    df = df.withColumn("month", month(col(date_col)))
    # Spark dayofweek: 1 (Sunday) to 7 (Saturday).
    # To map Sunday -> 6, Monday -> 0, ..., Saturday -> 5: (dayofweek + 5) % 7
    df = df.withColumn("weekday", (dayofweek(col(date_col)) + 5) % 7)
    df = df.withColumn("quarter", quarter(col(date_col)))

    return df

def aggregate_sales(df, schema=None):
    """
    Aggregates the sales and inventory data by Date, Product, Category, and Time features.
    Computes sum of sales, average of inventory, and retains/aggregates other columns dynamically.
    """
    if schema is None:
        schema = detect_columns(df.columns)

    date_col = schema.get("date")
    product_col = schema.get("product")
    category_col = schema.get("category")
    sales_col = schema.get("sales")
    inventory_col = schema.get("inventory")

    if not date_col or not product_col:
        return df

    # Columns to group by
    group_cols = [date_col, product_col]
    if category_col and category_col in df.columns:
        group_cols.append(category_col)

    # If time features are engineered, group by them to preserve them
    for time_col in ["day", "month", "weekday", "quarter"]:
        if time_col in df.columns:
            group_cols.append(time_col)

    # Aggregations list
    agg_exprs = []
    if sales_col:
        agg_exprs.append(spark_sum(sales_col).alias(sales_col))
    if inventory_col:
        agg_exprs.append(spark_mean(inventory_col).alias(inventory_col))

    # Identify other columns to preserve
    known_cols = {date_col, product_col, category_col, sales_col, inventory_col, "day", "month", "weekday", "quarter"}.union(set(group_cols))
    for col_name in df.columns:
        if col_name not in known_cols:
            col_type = [t[1] for t in df.dtypes if t[0] == col_name][0]
            if col_type in ("double", "float", "int", "bigint", "long"):
                agg_exprs.append(spark_mean(col_name).alias(col_name))
            else:
                agg_exprs.append(spark_first(col_name, ignorenulls=True).alias(col_name))

    if agg_exprs:
        df = df.groupBy(*group_cols).agg(*agg_exprs)

    return df

def convert_to_pandas(df):
    """
    Converts Spark DataFrame back to a Pandas DataFrame.
    """
    return df.toPandas()