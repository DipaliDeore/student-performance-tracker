# train_model.py
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib
import matplotlib.pyplot as plt
import seaborn as sns

# 1️⃣ Load dataset
df = pd.read_csv("data/student-mat.csv", sep=";")
print("Dataset shape:", df.shape)
print(df.head())

# 2️⃣ Create target variable: Pass/Fail based on final grade G3
df["pass_fail"] = np.where(df["G3"] >= 10, 1, 0)  # 1 = Pass, 0 = Fail

# 3️⃣ Encode categorical features
categorical_features = ["famsup", "schoolsup", "internet", "paid"]
for col in categorical_features:
    df[col] = df[col].map({"yes": 1, "no": 0})

# 4️⃣ Select features
features = ["studytime", "failures", "absences", "G1", "G2", "famsup", "schoolsup", "internet", "paid"]
X = df[features]
y = df["pass_fail"]

# 5️⃣ Split dataset
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 6️⃣ Train Random Forest Classifier
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 7️⃣ Test accuracy
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"Model Accuracy: {accuracy*100:.2f}%")

# 8️⃣ Save the trained model
joblib.dump(model, "model/student_model.pkl")
print("Model saved as 'model/student_model.pkl'")

# 9️⃣ Optional: Plot feature importance
feat_importances = pd.Series(model.feature_importances_, index=features)
plt.figure(figsize=(8,6))
sns.barplot(x=feat_importances, y=feat_importances.index)
plt.title("Feature Importance")
plt.xlabel("Importance Score")
plt.ylabel("Features")
plt.tight_layout()
plt.show()
