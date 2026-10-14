from pathlib import Path
import re

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "routing_model.joblib"

if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Model not found at {MODEL_PATH}. "
        "Copy routing_model.joblib from Colab into the project root."
    )

model = joblib.load(MODEL_PATH)

app = FastAPI(
    title="Kestrel Service Request Routing",
    description="AI-assisted service request routing API.",
    version="1.0.0",
)
app.mount(
    "/static",
    StaticFiles(directory=str(BASE_DIR / "static")),
    name="static",
)

templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

FEATURE_COLUMNS = [
    "request_text",
    "channel",
    "product_family",
    "warranty_status",
    "source",
    "created_month",
    "created_dayofweek",
]


class PredictionRequest(BaseModel):
    request_id: str | None = None
    created_at_ist: str | None = None
    channel: str = Field(min_length=1, max_length=100)
    product_family: str = Field(min_length=1, max_length=150)
    warranty_status: str = Field(min_length=1, max_length=100)
    request_text: str = Field(min_length=3, max_length=10000)
    source: str = Field(min_length=1, max_length=100)


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={},
    )


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "service": "Kestrel Service Request Routing",
    }


@app.post("/predict")
def predict(payload: PredictionRequest):
    try:
        # Match the date-derived features used during training.
        timestamp = pd.to_datetime(
            payload.created_at_ist,
            errors="coerce",
        )

        if pd.isna(timestamp):
            month = np.nan
            day_of_week = np.nan
        else:
            month = timestamp.month
            day_of_week = timestamp.dayofweek

        text = " ".join(payload.request_text.split())

        row = pd.DataFrame(
            [{
                "request_text": text,
                "channel": payload.channel,
                "product_family": payload.product_family,
                "warranty_status": payload.warranty_status,
                "source": payload.source,
                "created_month": month,
                "created_dayofweek": day_of_week,
            }],
            columns=FEATURE_COLUMNS,
        )

        predicted_team = str(model.predict(row)[0])

        # These probabilities are model estimates, not guarantees.
        probabilities = model.predict_proba(row)[0]
        classes = model.classes_

        ranked = sorted(
            [
                {
                    "team": str(team),
                    "confidence": float(probability),
                }
                for team, probability in zip(classes, probabilities)
            ],
            key=lambda item: item["confidence"],
            reverse=True,
        )

        confidence = next(
            item["confidence"]
            for item in ranked
            if item["team"] == predicted_team
        )

        alternatives = [
            item for item in ranked
            if item["team"] != predicted_team
        ][:3]

        # These are visible input cues, not causal explanations
        # of the model's internal decision.
        signals = [
            "The request description was included in the prediction."
        ]

        if payload.product_family.strip():
            signals.append(
                f"Product family supplied: {payload.product_family.strip()}."
            )

        if payload.warranty_status.strip():
            signals.append(
                f"Warranty status supplied: {payload.warranty_status.strip()}."
            )

        if payload.channel.strip():
            signals.append(
                f"Request channel supplied: {payload.channel.strip()}."
            )

        # Surface a few recognizable terms as a simple text preview.
        terms = re.findall(r"[A-Za-z][A-Za-z0-9'-]{2,}", text.lower())
        text_preview_terms = list(dict.fromkeys(terms))[:6]

        return {
            "request_id": payload.request_id,
            "team": predicted_team,
            "confidence": round(confidence, 4),
            "confidence_percent": round(confidence * 100, 1),
            "alternatives": [
                {
                    "team": item["team"],
                    "confidence": round(item["confidence"], 4),
                    "confidence_percent": round(
                        item["confidence"] * 100, 1
                    ),
                }
                for item in alternatives
            ],
            "signals": signals,
            "text_terms_preview": text_preview_terms,
            "disclaimer": (
                "This is an AI-generated routing recommendation. "
                "Confidence is a model estimate, not a guarantee. "
                "Review the request before acting on the recommendation."
            ),
        }

    except Exception as exc:
        # Details are logged by the server; avoid exposing internal
        # exception details to the browser.
        print(f"Prediction error: {type(exc).__name__}: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Prediction failed. Check the server terminal for details.",
        ) from exc