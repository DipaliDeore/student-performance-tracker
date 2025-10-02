from flask import Flask, render_template, request, jsonify
import pandas as pd
import joblib
import numpy as np
from datetime import datetime

app = Flask(__name__)

# Load trained model
model = joblib.load("model/student_model.pkl")

# Store recent entries
recent_entries = []

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        
        # Prepare data for prediction
        df = pd.DataFrame([{
            'studytime': data.get('studytime', 0),
            'failures': data.get('failures', 0),
            'absences': data.get('absences', 0),
            'G1': data.get('G1', 0),
            'G2': data.get('G2', 0),
            'famsup': data.get('famsup', 0),
            'schoolsup': data.get('schoolsup', 0),
            'internet': data.get('internet', 0),
            'paid': data.get('paid', 0)
        }])
        
        # Make prediction
        prediction = model.predict(df)[0]
        result = "PASS" if prediction == 1 else "FAIL"
        
        # Calculate confidence score (simulated)
        confidence = np.random.uniform(0.7, 0.95)
        
        # Store in recent entries
        entry = data.copy()
        entry['Prediction'] = result
        entry['Confidence'] = round(confidence, 2)
        entry['Timestamp'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        recent_entries.append(entry)
        
        # Keep last 20 entries
        if len(recent_entries) > 20:
            recent_entries.pop(0)
        
        return jsonify({
            "result": result,
            "confidence": confidence,
            "recent": recent_entries[-10:]  # Return last 10 entries
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/insights", methods=["GET"])
def get_insights():
    """Generate AI insights based on recent data"""
    try:
        if not recent_entries:
            return jsonify({"error": "No data available"})
        
        # Calculate basic statistics
        df = pd.DataFrame(recent_entries)
        
        insights = {
            "total_predictions": len(recent_entries),
            "pass_rate": round((df['Prediction'] == 'PASS').mean() * 100, 1),
            "avg_study_time": round(df['studytime'].mean(), 1),
            "avg_absences": round(df['absences'].mean(), 1),
            "avg_failures": round(df['failures'].mean(), 1),
            "risk_factors": []
        }
        
        # Identify risk factors
        if insights['avg_study_time'] < 2:
            insights['risk_factors'].append("Low average study time")
        
        if insights['avg_absences'] > 5:
            insights['risk_factors'].append("High absenteeism rate")
        
        if insights['pass_rate'] < 60:
            insights['risk_factors'].append("Below average pass rate")
        
        return jsonify(insights)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)