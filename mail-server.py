from flask import Flask
from flask import request
from flask import abort
import urllib
import traceback
import json

users = {
    'APIKKJYDM1TVXXREDLWM': 'demos@scalr.com',
    'APIKRJ0I0VGEP1AJP86Z': 'sebastian@scalr.com',
    'APIKO6W78RJZ6NVL8AU5': 'sebastian@scalr.com',
    'APIKU6XU0VDDDCWP28MF': 'aloys@scalr.com'
}


app = Flask(__name__)

@app.route('/send/',methods=['POST'])
def handle_query():
    try:
        data = request.get_json()
        param_dict = {}
        param_dict['user'] = urllib.quote_plus(users[data['user']])
        param_dict['url'] = urllib.quote_plus(data['url'])
        param_dict['env'] = data['env']
        param_dict['name'] = urllib.quote_plus(data['appName'])
        param_dict['prio'] = data['perf']
        param_dict['avai'] = urllib.quote_plus(data['avail'])
        param_dict['duration'] = urllib.quote_plus(data['duration'])
        param_dict['farm-id'] = urllib.quote_plus(data['farmId'])
        url_to_send = "http://disney-portal.demo.scalr.com/approval/#?u={user}&s={url}&e={env}&t={name}&p={prio}&a={avai}&d={duration}&f={farm-id}".format(param_dict)
        return requests.post(
            "https://api.mailgun.net/v3/sandbox8fdd69ee92db404db4a4454837aad7e4.mailgun.org/messages",
            auth=("api", "key-1a0c7531e47353bd6ca131a8cfeaa018"),
            data={"from": "storefront@scalr.com",
                  "to": ["mohammed@scalr.com"],
                  "subject": "Approval required",
                  "text": url_to_send})
    except Exception as e:
        print(e)
        traceback.print_exc()
        abort(404)


if __name__=='__main__':
    app.run(debug=True)
