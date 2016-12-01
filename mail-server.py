from flask import Flask
from flask import request
from flask import abort
import urllib
import traceback
import json
import requests

app = Flask(__name__)

@app.after_request
def after_request(response):
  response.headers.add('Access-Control-Allow-Origin', '*')
  response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
  return response

@app.route('/send/',methods=['POST'])
def handle_query():
    try:
        data = request.get_json(force=True)
        print("Data:")
        print(data)
        destination = data['admin']
        param_dict = {}
        param_dict['user'] = urllib.quote(data['user'],'')
        param_dict['url'] = urllib.quote(data['url'],'')
        param_dict['env'] = data['env']
        param_dict['name'] = urllib.quote(data['appName'],'')
        param_dict['farm-id'] = urllib.quote(str(data['farmId']),'')
        param_dict['params'] = urllib.quote(json.dumps(data['params']), '')
        param_dict['storeFrontOrigin'] = data['storeFrontOrigin']
        url_to_send = "{storeFrontOrigin}/approval/#?u={user}&s={url}&e={env}&t={name}&f={farm-id}&p={params}".format(**param_dict)
        resp = requests.post(
            "https://api.mailgun.net/v3/sandbox8fdd69ee92db404db4a4454837aad7e4.mailgun.org/messages",
            auth=("api", "key-1a0c7531e47353bd6ca131a8cfeaa018"),
            data={"from": "storefront@scalr.com",
                  "to": [destination],
                  "cc": [data['user']],
                  "subject": "Storefront approval required",
                  "text": "Hello,\n" + "Your approval is required. Please go to the following address to review:\n" + url_to_send,
                  "html": "Hello,\n<br>\n" + "Your approval is required for a new "+data['appName']+" application. Please click the following link to review:\n" + '<a href="' + url_to_send + '"> Review here </a>'})
        return "OK!"
    except Exception as e:
        print(e)
        traceback.print_exc()
        abort(401)


if __name__=='__main__':
    app.run(debug=False, host='0.0.0.0')
