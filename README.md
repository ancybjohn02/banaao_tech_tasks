# Kestrel Home — Service Request Routing

<img width="1422" height="762" alt="image" src="https://github.com/user-attachments/assets/9a1a8c49-d498-46bf-849e-6faa548864cd" />

An AI-assisted service-request routing prototype. It predicts a destination
team from request text, request metadata, and date-derived features.

## Features

- FastAPI JSON prediction endpoint
- HTML, CSS, and JavaScript frontend
- Predicted destination and alternative teams
- Model-estimated confidence
- Health check and interactive API documentation
- Human review remains part of the workflow

## Project structure

- `app.py` — FastAPI application and prediction logic
- `templates/index.html` — frontend page
- `static/styles.css` — responsive interface
- `static/app.js` — form submission and results rendering
- `routing_model.joblib` — trained scikit-learn model
- `predictions.csv` — held-out test-set predictions

## Requirements

Python 3.10 or later is recommended.

Install the Python dependencies:

```bash
python -m venv .venv
