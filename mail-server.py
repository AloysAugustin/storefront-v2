from flask import Flask
from flask import request

import json

users = {
    'APIKKJYDM1TVXXREDLWM': 'demos@scalr.com',
    'APIKRJ0I0VGEP1AJP86Z': 'sebastian@scalr.com',
    'APIKO6W78RJZ6NVL8AU5': 'sebastian@scalr.com',
    'APIKU6XU0VDDDCWP28MF': 'aloys@scalr.com'
}

@app.route('/send/',methods=['POST'])
def handle_query():
    try:
        data = json.loads(request.data)
        
