import pandas as pd

def create_time_features(df, date_col):

    df[date_col] = pd.to_datetime(df[date_col])

    df["day"] = df[date_col].dt.day
    df["month"] = df[date_col].dt.month
    df["weekday"] = df[date_col].dt.weekday
    df["quarter"] = df[date_col].dt.quarter

    return df