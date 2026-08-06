# Palakkad Agricultural Decision Support System

Palakkad DSS is a web application for crop advisory and crop image classification. It combines a FastAPI backend, a React frontend, local machine-learning models, and district-level agricultural data to support agricultural decision-making.

## Overview

The application provides:

- Climate stress assessment for a selected location, crop, and date range
- Crop image classification with model-based recommendations
- Weather-aware advisory logic
- A browser-based dashboard for daily use
- Local model inference with external weather data from Open-Meteo

## Repository Structure

- `backend/` - FastAPI application, DSS logic, classifiers, templates, and model assets
- `frontend/` - React application built with Vite
- `data/` - CSV datasets used by the backend and supporting analysis
- `research_analysis/` - Research notebooks, scripts, and intermediate analysis artifacts
- `requirements.txt` - Python dependencies for the backend
- `frontend/package.json` - Frontend dependencies and scripts
- `QUICK_START.md` - Short setup guide

## Requirements

- Python 3.12 or later
- Node.js 18 or later
- Git
- A Python virtual environment is recommended

## Setup

### Backend dependencies

From the repository root:

```bash
python -m pip install -r requirements.txt
```

### Frontend dependencies

```bash
cd frontend
npm install
```

## Running the application

Run the backend and frontend in separate terminals.

### Backend

Start the backend from the `backend` directory so the relative model paths resolve correctly.

```bash
cd backend
python -m uvicorn app:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm run dev
```

The frontend usually runs at `http://localhost:5174`.

## Important runtime assets

The backend expects trained model files in these locations:

- `backend/model/`
- `backend/models/`

Do not rename or move these directories unless the model-loading code is updated as well.

## Main API Endpoints

### Climate and DSS analysis

`POST /dss`

Example payload:

```json
{
  "location": "Palakkad",
  "crop": "rice",
  "sowing_date": "2024-06-15",
  "check_date": "2024-07-15"
}
```

### Crop classification

`POST /classify-crop`

Send a multipart form request with an image file field named `file`.

## Development Notes

- The backend loads local model assets at startup.
- Some first-run warnings from TensorFlow or external model checks may appear during initialization.
- The frontend is intended to be run as a browser application during development.

## Troubleshooting

If the backend does not start:

- Run it from the `backend` directory.
- Confirm that the model files exist in `backend/model/` and `backend/models/`.
- Check that port `8000` is available.

If the frontend does not load:

- Confirm that the backend is running.
- Verify the frontend is pointing to the correct backend URL.
- Reinstall frontend dependencies with `npm install` if needed.

If model loading fails:

- Check that `lstm_model.h5`, `lstm_model.keras`, and the files under `backend/models/` are present.
- Make sure the working directory is correct before starting the backend.

## Project Notes

The repository has been trimmed to keep application source, runtime assets, and essential datasets while removing generated reports, thesis artifacts, and helper scripts.

## License

This project was developed for the Palakkad agricultural decision-support use case. Review dataset and model licensing before publishing it publicly.
