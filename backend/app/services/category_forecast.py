def category_demand(df,
                    category_col,
                    sales_col):

    result = (
        df.groupby(category_col)[sales_col]
        .sum()
        .sort_values(ascending=False)
        .to_dict()
    )

    return result