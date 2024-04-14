import tensorflow as tf
import numpy as np
import tensorflow_hub as hub
import tensorflow_text as text

class PhishingDetectionModel:
    def __init__(self, model_path='best_model.h5'):
        with tf.keras.utils.custom_object_scope({'KerasLayer': hub.KerasLayer}):
            self.loaded_model = tf.keras.models.load_model(model_path,compile=False)

    def predict(self, email_body):
        email_body_preprocessed = np.array([str(email_body)])
        prediction = "Phishing" if self.loaded_model.predict(email_body_preprocessed) > 0.7 else "Safe"
        return prediction

if __name__ == "__main__":
    model = PhishingDetectionModel()
    email_body = """eBay Suspension
    Need Help?
    Dear valued eBay member,
    During our regularly scheduled account maintenance and verification procedures, we
    have detected a slight error in your billing information.
    This might be due to either of the following reasons:
    1. A recent change in your personal information ( i.e.change of address).
    2. Submiting invalid information during the initial sign up process.
    3. An inability to accurately verify your selected option of payment due to an
    internal error within our processors.
    Once you have updated your account records your eBay session will not be
    interrupted and will
    continue as normal.
    To update your eBay records click on the following link:
    http://cgi1.ebay.com/aw-cgi/ebayISAPI.dll?UPdate
    If your account information is not updated within 48 hours then your ability to use
    eBay will become restricted.
    Regards,
    Safeharbor Department
    eBay, Inc.
    Copyright
    1995-2005 eBay Inc. All Rights Reserved.
    Designated trademarks and brands
    are the property of their respective owners.
    Use of this Web site
    constitutes acceptance of the eBay
    User
    Agreement
    and
    Privacy
    Policy"""
    prediction = model.predict(email_body)
    print("Prediction:", prediction)
