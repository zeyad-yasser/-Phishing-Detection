from flask import Flask, jsonify, request
from flask_cors import CORS
from model_class import PhishingDetectionModel

app = Flask(__name__)
CORS(app, origins="*")

model = PhishingDetectionModel() 

@app.route('/predict', methods=['POST'])
def predict():
    text = request.json['body']
    prediction = model.predict(text)

    result_message = 'This email is a phishing attempt.' if prediction == 'Phishing' else 'This email is likely safe.'

    return jsonify({'message': result_message, 'output': prediction})

if __name__ == '__main__':
    app.run(debug=True)
