def stock_health(days_left):

    if days_left < 7:
        return {
            "score": 20,
            "status": "CRITICAL"
        }

    elif days_left < 15:
        return {
            "score": 60,
            "status": "WARNING"
        }

    else:
        return {
            "score": 90,
            "status": "SAFE"
        }
    
    