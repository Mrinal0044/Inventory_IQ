def detect_columns(columns):

    columns_lower = [c.lower() for c in columns]

    detected = {
        "date": None,
        "sales": None,
        "inventory": None,
        "category": None,
        "product": None
    }

    for col in columns:

        name = col.lower()

        if "date" in name:
            detected["date"] = col

        elif "sale" in name:
            detected["sales"] = col

        elif "stock" in name or "inventory" in name:
            detected["inventory"] = col

        elif "category" in name:
            detected["category"] = col

        elif "product" in name:
            detected["product"] = col

    return detected