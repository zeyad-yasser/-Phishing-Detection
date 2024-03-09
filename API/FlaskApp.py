from flask import Flask, jsonify, request
import torch
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins="*")

tokenizer = DistilBertTokenizer.from_pretrained("distilbert-base-uncased-finetuned-sst-2-english")
model = DistilBertForSequenceClassification.from_pretrained("distilbert-base-uncased-finetuned-sst-2-english")

model.eval()
threshold = 0.5

@app.route('/predict', methods=['POST'])
def predict():
    text = request.json['body']

    chunks = [text[i:i + tokenizer.model_max_length] for i in range(0, len(text), tokenizer.model_max_length)]

    outputs_list = []

    for chunk in chunks:
        inputs = tokenizer(chunk, return_tensors='pt')

        with torch.no_grad():
            logits = model(**inputs).logits

        predicted_class_id = logits.argmax().item()
        outputs_list.append(predicted_class_id)

    final_prediction = max(set(outputs_list), key=outputs_list.count)

    result_message = 'This email has a high sentiment.' if final_prediction == 0 else 'This email has a low sentiment.'

    return jsonify({'message': result_message, 'output': final_prediction})

if __name__ == '__main__':
    app.run(debug=True)
