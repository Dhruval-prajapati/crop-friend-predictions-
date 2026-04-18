def predict_crop(data):
    temp = float(data.get("temperature",0))
    humidity = float(data.get("humidity",0))
    rainfall = float(data.get("rainfall",0))

    if temp > 25 and humidity > 60 and rainfall > 100:
        return "High Yield Expected"
    elif temp > 20:
        return "Moderate Yield"
    else:
        return "Low Yield"
