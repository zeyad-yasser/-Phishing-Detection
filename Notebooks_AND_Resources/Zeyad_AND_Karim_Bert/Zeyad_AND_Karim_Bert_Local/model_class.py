

import tensorflow as tf
import numpy as np
import pandas as pd
import tensorflow_hub as hub
import tensorflow_text

class PhishingDetectionModel:
    def __init__(self, model_path='best_model.h5'):
        self.loaded_model = tf.keras.models.load_model(model_path, custom_objects={'KerasLayer': hub.KerasLayer})

    def predict(self, email_body):
        email_body_preprocessed = np.array([str(email_body)])
        prediction = "Phishing" if self.loaded_model.predict(email_body_preprocessed) > 0.5 else "Safe"
        return prediction


model = PhishingDetectionModel()
email_body = "Hi, kimo"
prediction = model.predict(str(email_body))
print("Prediction:", prediction)



