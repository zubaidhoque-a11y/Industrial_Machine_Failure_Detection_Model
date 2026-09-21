import joblib
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel,Field
from typing import Literal
from fastapi.middleware.cors import CORSMiddleware

model= joblib.load('Industrial_Machine Failure Prediction.pkl')

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class MachineData(BaseModel):
    temperature: float = Field(..., ge=0, le=150)
    vibration: float = Field(..., ge=0, le=100)
    pressure: float = Field(..., ge=0, le=100)
    humidity: float = Field(..., ge=0, le=100)

    rotation_speed: float = Field(..., ge=0, le=5000)
    voltage: float = Field(..., ge=0, le=500)
    current: float = Field(..., ge=0, le=100)

    oil_level: float = Field(..., ge=0, le=100)
    load: float = Field(..., ge=0, le=100)

    motor_temperature: float = Field(..., ge=0, le=150)
    gearbox_temperature: float = Field(..., ge=0, le=150)

    sound_level: float = Field(..., ge=0, le=150)
    fan_speed: float = Field(..., ge=0, le=5000)

    reactive_power: float = Field(..., ge=0, le=200)
    active_power: float = Field(..., ge=0, le=300)

class PredictionResponse(BaseModel):
    prediction: Literal[0, 1]
    message: str

@app.post('/predict', response_model=PredictionResponse)
def predict(data : MachineData):
    input_row = pd.DataFrame([{
        'temperature': data.temperature,
        'vibration': data.vibration,
        'pressure': data.pressure,
        'humidity': data.humidity,
        'rotation_speed': data.rotation_speed,
        'voltage': data.voltage,
        'current': data.current,
        'oil_level': data.oil_level,
        'load': data.load,
        'motor_temperature': data.motor_temperature,
        'gearbox_temperature': data.gearbox_temperature,
        'sound_level': data.sound_level,
        'fan_speed': data.fan_speed,
        'reactive_power': data.reactive_power,
        'active_power': data.active_power
}])
    prediction = model.predict(input_row)[0]
    message = "✅ Machine operating normally" if prediction == 0 else "⚠️ Machine failure risk detected"
    return PredictionResponse(
        prediction = int(prediction),
        message = message
    )

