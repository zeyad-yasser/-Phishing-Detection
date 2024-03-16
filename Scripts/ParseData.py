import mailbox
import os
import re
import pandas as pd
from bs4 import BeautifulSoup


def check_text_types(message):
    type_list = ['text/plain', 'text/html']
    content_type = message.get_content_type()
    if content_type in type_list:
        return content_type
    return None

def parse_html(input_string):
    soup = BeautifulSoup(input_string, 'lxml')
    return soup.get_text('\n', strip=True)


def extract_urls(input_string):
    pattern = r"(?i)\b((?:https?://|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'\".,<>?«»“”‘’]))"
    urls = [match.group(0) for match in re.finditer(pattern, input_string)]

    return ', '.join(urls)


def mbox_to_df(filename, filepath):
    file = os.path.join(filepath, filename)
    mbox = mailbox.mbox(file)

    data = []

    for key in mbox.iterkeys():   # Loop through the keys (email indices) in the mbox file
        # Try to get the email message for the current key
        try:
            message = mbox[key]
        except UnicodeDecodeError:
            # Skip this email if there's a UnicodeDecodeError
            continue

        # Extract headers from the message and convert keys to lowercase

        # items() for header fields
        # get_payload() for retrieving body
        headers = {key.lower(): value for key, value in message.items()}
        subject = headers.get('subject', '')
        sender = headers.get('from', '')
        date = headers.get('date', '')
        receiver = headers.get('to', '')

        row = {'subject': subject, 'sender': sender, 'date': date, 'receiver': receiver}
        content = []

        for part in message.walk():

            # Skip multipart parts (i.e attachments, images)
            if part.is_multipart():
                continue

            type = check_text_types(part)
            if type:
                try:
                    new_content = part.get_payload(decode=True).decode('iso-8859-1')
                except UnicodeDecodeError:
                    new_content = part.get_payload(decode=True).decode('utf-8')

                if type == 'text/html':
                    content.append(parse_html(new_content))
                elif type == 'text/plain':
                    content.append(new_content)

        joined = '\n'.join(content)
        row['body'] = joined
        row['urls'] = extract_urls(joined)

        data.append(row)

    return pd.DataFrame(data)


def read_and_save_dataset(input_path, exceptions, output_path, output_filename):
    mbox_files = [name for name in os.listdir(input_path) if name not in exceptions]

    df = pd.DataFrame()
    for file in mbox_files:
        print("Now reading file:", file)
        file_data = mbox_to_df(file, input_path)
        df = pd.concat([df, file_data], ignore_index=True)

    save_to_csv(df, output_path, output_filename)


def save_to_csv(data, path, filename):
    name = os.path.join(path, filename)
    print(f"Saving to {name}")
    data.to_csv(name, index=False)


input_folder = r'C:\Users\Karim\Desktop\monkey.org\~jose\phishing'
exceptions_list = ['README.txt', 'UMBoxViewer']
output_folder = r'C:\Users\Karim\parseData'
output_csv_filename = 'Nazario.csv'

read_and_save_dataset(input_folder, exceptions_list, output_folder, output_csv_filename)
