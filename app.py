from flask import Flask, render_template, request, jsonify, send_file
import pandas as pd
import joblib
import numpy as np
from datetime import datetime
import io
import csv

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
            'studytime': int(data.get('studytime', 0)),
            'failures': int(data.get('failures', 0)),
            'absences': int(data.get('absences', 0)),
            'G1': int(data.get('G1', 0)),
            'G2': int(data.get('G2', 0)),
            'famsup': 1 if data.get('famsup') == 'yes' else 0,
            'schoolsup': 1 if data.get('schoolsup') == 'yes' else 0,
            'internet': 1 if data.get('internet') == 'yes' else 0,
            'paid': 1 if data.get('paid') == 'yes' else 0
        }])
        
        # Make prediction
        prediction = model.predict(df)[0]
        probability = model.predict_proba(df)[0]
        
        result = "PASS" if prediction == 1 else "FAIL"
        pass_probability = round(probability[1] * 100, 2)
        fail_probability = round(probability[0] * 100, 2)
        confidence = max(pass_probability, fail_probability)
        
        # Store in recent entries
        entry = data.copy()
        entry['prediction'] = result
        entry['confidence'] = confidence
        entry['pass_probability'] = pass_probability
        entry['fail_probability'] = fail_probability
        entry['timestamp'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        recent_entries.append(entry)
        
        # Keep last 20 entries
        if len(recent_entries) > 20:
            recent_entries.pop(0)
        
        return jsonify({
            "prediction": result,
            "confidence": confidence,
            "probability_pass": pass_probability,
            "probability_fail": fail_probability,
            "input_data": data
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/predict_batch", methods=["POST"])
def predict_batch():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not file.filename.endswith('.csv'):
            return jsonify({"error": "Please upload a CSV file"}), 400
        
        # Read CSV file
        df = pd.read_csv(file)
        
        # Check required columns
        required_columns = ['studytime', 'failures', 'absences', 'G1', 'G2']
        optional_columns = ['famsup', 'schoolsup', 'internet', 'paid']
        
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return jsonify({"error": f"Missing required columns: {', '.join(missing_columns)}"}), 400
        
        # Fill missing optional columns with default values
        for col in optional_columns:
            if col not in df.columns:
                df[col] = 0
        
        # Convert boolean columns to numeric
        bool_columns = ['famsup', 'schoolsup', 'internet', 'paid']
        for col in bool_columns:
            if col in df.columns:
                df[col] = df[col].apply(lambda x: 1 if str(x).lower() in ['yes', 'true', '1'] else 0)
        
        # Make predictions
        predictions = model.predict(df[required_columns + optional_columns])
        probabilities = model.predict_proba(df[required_columns + optional_columns])
        
        # Add results to dataframe
        df['prediction'] = ['PASS' if pred == 1 else 'FAIL' for pred in predictions]
        df['pass_probability'] = [round(prob[1] * 100, 2) for prob in probabilities]
        df['fail_probability'] = [round(prob[0] * 100, 2) for prob in probabilities]
        df['confidence'] = df[['pass_probability', 'fail_probability']].max(axis=1)
        
        # Convert to CSV for download
        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)
        
        return send_file(
            io.BytesIO(output.getvalue().encode()),
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'batch_predictions_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        )
        
    except Exception as e:
        return jsonify({"error": f"Error processing file: {str(e)}"}), 500

@app.route("/download_sample")
def download_sample():
    """Download sample CSV template"""
    sample_data = {
        'studytime': [2, 3, 1, 4],
        'failures': [0, 1, 2, 0],
        'absences': [4, 2, 10, 1],
        'G1': [12, 15, 8, 18],
        'G2': [13, 16, 7, 17],
        'famsup': ['yes', 'no', 'yes', 'yes'],
        'schoolsup': ['no', 'yes', 'no', 'no'],
        'internet': ['yes', 'yes', 'no', 'yes'],
        'paid': ['no', 'no', 'yes', 'no']
    }
    
    df = pd.DataFrame(sample_data)
    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)
    
    return send_file(
        io.BytesIO(output.getvalue().encode()),
        mimetype='text/csv',
        as_attachment=True,
        download_name='sample_student_data.csv'
    )

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
            "pass_rate": round((df['prediction'] == 'PASS').mean() * 100, 1),
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

@app.route("/recent_entries")
def get_recent_entries():
    """Get recent prediction entries"""
    return jsonify(recent_entries[-10:])

if __name__ == "__main__":
    app.run(debug=True)