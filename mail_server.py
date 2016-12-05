from flask import Flask
from flask import request
from flask import abort
import urllib
import traceback
import json
from subprocess import Popen, PIPE
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

app = Flask(__name__)

@app.after_request
def after_request(response):
  response.headers.add('Access-Control-Allow-Origin', '*')
  response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
  return response

def send_notification(message):
    p = Popen(["/usr/sbin/sendmail", "-t", "-oi"], stdin=PIPE)
    p.communicate(msg.as_string())
    return p.wait()

def build_message(data):
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
    msg = MIMEMultipart('alternative')
    msg['Subject'] = "Storefront approval request"
    msg['From'] = "storefront@scalr.com"
    msg['To'] = [destination]
    msg['Cc'] = [data['user']]
    text = "Hello,\n" + "Your approval is required. Please go to the following address to review:\n" + url_to_send
    html = """<html>
          <head></head>
          <body>
            Hello,<br>
            Your approval is required {a} application. Please click the following link to review:
            <a href="{link}"> Review here </a>
          </body>
        </html>""".format({a: ( "to terminate a " if data['params']['action'] == 'stop' else "for a new ") + data['appName'], link: url_to_send})
    part1 = MIMEText(text, 'plain') 
    part2 = MIMEText(html, 'html')
    msg.attach(part1)
    msg.attach(part2)
    return send_notification(msg)

@app.route('/send/',methods=['POST'])
def handle_query():
    try:
        data = request.get_json(force=True)
        if build_message(data) != 0:
            abort(500)
        else:
            return 'Ok!'
    except Exception as e:
        print(e)
        traceback.print_exc()
        abort(401)


if __name__=='__main__':
    app.run(debug=False, host='0.0.0.0')
