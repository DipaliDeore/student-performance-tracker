# Student Performance Tracker (EduTrack Pro)

Lightweight Flask app that predicts student pass/fail outcomes using a trained Random Forest model and provides individual and batch analytics with visualizations.

## Features
- Individual student prediction (interactive UI)
- Batch CSV upload for bulk predictions and analytics
- Sample CSV template download
- Client-side interactive charts (Chart.js) and server-side model inference
- Simple model training script (`train_model.py`) to retrain the Random Forest

## Quick Start (Windows PowerShell)

1. Open PowerShell and change to the project directory:
```powershell
cd 'C:\Users\DELL\Desktop\Projects\student-performance-tracker'
```

2. Create & activate a virtual environment:
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

3. Install dependencies (recommended):
If you have a `requirements.txt` use:
```powershell
pip install -r requirements.txt
```
Otherwise install the main packages:
```powershell
pip install flask pandas joblib numpy scikit-learn matplotlib seaborn
```

4. Verify the trained model exists:
```powershell
Test-Path .\model\student_model.pkl
```
If `False`, train the model with:
```powershell
python train_model.py
```

5. Run the app:
```powershell
python app.py
```
Open http://127.0.0.1:5000 in your browser.

## API Endpoints
- `GET /` — Frontend UI (index page)
- `POST /predict` — Individual prediction (expects JSON)
	- Example:
		```powershell
		curl -X POST http://127.0.0.1:5000/predict -H "Content-Type: application/json" -d '{"studytime":2,"failures":0,"absences":3,"G1":12,"G2":13,"famsup":"no","schoolsup":"no","internet":"yes","paid":"no"}'
		```
- `POST /predict_batch` — Upload CSV file (`multipart/form-data`) and receive a CSV with predictions
- `GET /download_sample` — Download sample CSV template
- `GET /insights` — Small insights JSON based on recent predictions
- `GET /recent_entries` — Returns recent predictions stored in-memory

## File Overview
- `app.py`: Flask application and API endpoints (prediction, batch processing, sample download, insights).
- `train_model.py`: Script to train and save the Random Forest model to `model/student_model.pkl` (uses `data/student-mat.csv`).
- `model/student_model.pkl`: Pretrained model used by the app.
- `templates/index.html`: Single-page frontend implementing Individual, Batch, and Recent sections.
- `static/js/script.js`: Frontend logic, form handling, chart rendering and basic fallbacks when backend unavailable.
- `static/css/style.css`: Styles for the dashboard and components.
- `data/`: Contains the source CSV files used for training (`student-mat.csv`, `student-por.csv`).

## CSV Format (batch uploads)
Required columns: `studytime`, `failures`, `absences`, `G1`, `G2`
Optional columns: `famsup`, `schoolsup`, `internet`, `paid` (yes/no or truthy values)

Example header row:
```
studytime,failures,absences,G1,G2,famsup,schoolsup,internet,paid
```

## Retraining the Model
To retrain the model with the training data and update `model/student_model.pkl`:
```powershell
python train_model.py
```
This will train a RandomForestClassifier and save the model in the `model/` folder.

## Troubleshooting
- If `python app.py` exits with an error, run it inside the activated virtual environment and read the traceback. Common issues:
	- Missing packages: `pip install <package>`
	- Model load error: confirm `model/student_model.pkl` exists and is compatible with the scikit-learn version used to create it.
	- Port already in use: stop the process using port 5000 or change port in `app.run(port=5001)`.

## Notes & Limitations
- Batch results and recent entries are stored in memory — not persisted to disk or database. For production, replace in-memory storage with a database.
- The frontend contains graceful fallbacks that simulate predictions when the backend is unavailable; ensure the real backend is running for accurate results.

## Optional Improvements
- Add `requirements.txt` and/or `pyproject.toml` for reproducible installs.
- Add unit tests for endpoints and model inference.
- Persist batch results to a lightweight DB (SQLite) and add user authentication.

---
If you want, I can generate a `requirements.txt` from the imports and add basic run scripts. Would you like that? 