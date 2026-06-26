import pandas as pd

from xgboost import XGBRegressor

from app.utils.feature_engineering import create_time_features

def train_forecast(df, date_col, sales_col):

    df = create_time_features(df, date_col)

    X = df[["day", "month", "weekday", "quarter"]]
    y = df[sales_col]

    model = XGBRegressor(
        n_estimators=100,
        max_depth=4
    )

    model.fit(X, y)

    future = pd.DataFrame({
        "day":[1,2,3,4,5,6,7],
        "month":[12]*7,
        "weekday":[0,1,2,3,4,5,6],
        "quarter":[4]*7
    })

    preds = model.predict(future)

    return preds.tolist()