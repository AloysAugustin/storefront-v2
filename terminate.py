#!/usr/bin/env python

import base64
import datetime
import hashlib
import hmac
import json
import logging
import os
import pytz
import requests
import requests.auth
import requests.exceptions
import urllib
import urlparse
from collections import Mapping, Iterable

### Farm termination

credentials_file = './credentials.json'
"""
Credentials file contents must look like:
{
   "api_url": "https://demo.scalr.com/",
    "api_key_id": "KEYID",
    "api_key_secret": "keysecret",
    "envs": [2, 3, 4]
}
"""

logging.basicConfig()
log = logging.getLogger()

def main():
    with open(credentials_file) as f:
        creds = json.load(f)
        api_url, api_key_id, api_key_secret, envs = \
                [creds.get(k, '') for k in ['api_url', 'api_key_id', 'api_key_secret', 'envs']]

    client = ScalrApiClient(api_url.rstrip("/"), api_key_id, api_key_secret)
    now = int((datetime.datetime.utcnow() - datetime.datetime.utcfromtimestamp(0)).total_seconds())
    for envId in envs:
        processEnv(client, str(envId), now)

def processEnv(client, envId, now):
    farms = client.list('/api/v1beta0/user/{}/farms/'.format(envId))
    for farm in farms:
        if farm["status"] != "running":
            continue
        try:
            json.loads(farm['description'])
        except ValueError:
            # No valid JSON description, this farm was not created by the storefront
            continue
        try:
            startGV = client.fetch('/api/v1beta0/user/{}/farms/{}/global-variables/STOREFRONT_LAUNCH_DATE/'.format(envId, farm["id"]))
        except requests.exceptions.HTTPError:
            # No start date
            continue
        try:
            lifetimeGV = client.fetch('/api/v1beta0/user/{}/farms/{}/global-variables/STOREFRONT_LIFETIME/'.format(envId, farm["id"]))
        except requests.exceptions.HTTPError:
            # No lifetime - print error since all farms with a start date set should have a lifetime
            log.error('Farm {} has start date set but no lifetime'.format(farm["id"]))
            continue
        try:
            shutdownDate = int(startGV["computedValue"]) + int(lifetimeGV["computedValue"])
        except:
            log.error("Can't parse lifetime or start date GV for farm {}".format(farm["id"]))
        if shutdownDate < now:
            # Shutdown this farm
            try:
                log.info("Shutting farm {} down".format(farm["id"]))
                client.post("/api/v1beta0/user/{}/farms/{}/actions/terminate/".format(envId, farm["id"]))
            except Exception as e:
                log.error("Error shutting farm {} down: {}".format(farm["id"], e))


### Scalr API
class ScalrApiClient(object):
    def __init__(self, api_url, key_id, key_secret):
        self.api_url = api_url
        self.key_id = key_id
        self.key_secret = key_secret
        self.logger = logging.getLogger("api[{0}]".format(self.api_url))
        self.session = ScalrApiSession(self)

    def list(self, path, **kwargs):
        data = []
        ident = False
        while path is not None:
            if ident:
                print
            body = self.session.get(path, **kwargs).json()
            data.extend(body["data"])
            path = body["pagination"]["next"]
            ident = True
        return data

    def create(self, *args, **kwargs):
        self._fuzz_ids(kwargs.get("json", {}))
        return self.session.post(*args, **kwargs).json().get("data")

    def fetch(self, *args, **kwargs):
        return self.session.get(*args, **kwargs).json()["data"]

    def delete(self, *args, **kwargs):
        self.session.delete(*args, **kwargs)

    def post(self, *args, **kwargs):
        return self.session.post(*args, **kwargs).json()["data"]


class ScalrApiSession(requests.Session):
    def __init__(self, client):
        self.client = client
        super(ScalrApiSession, self).__init__()

    def prepare_request(self, request):
        if not request.url.startswith(self.client.api_url):
            request.url = "".join([self.client.api_url, request.url])
        request = super(ScalrApiSession, self).prepare_request(request)

        now = datetime.datetime.now(tz=pytz.timezone(os.environ.get("TZ", "UTC")))
        date_header = now.isoformat()

        url = urlparse.urlparse(request.url)

        # TODO - Spec isn't clear on whether the sorting should happen prior or after encoding
        if url.query:
            pairs = urlparse.parse_qsl(url.query, keep_blank_values=True, strict_parsing=True)
            pairs = [map(urllib.quote, pair) for pair in pairs]
            pairs.sort(key=lambda pair: pair[0])
            canon_qs = "&".join("=".join(pair) for pair in pairs)
        else:
            canon_qs = ""

        # Authorize
        sts = "\n".join([
            request.method,
            date_header,
            url.path,
            canon_qs,
            request.body if request.body is not None else ""
        ])

        sig = " ".join([
            "V1-HMAC-SHA256",
            base64.b64encode(hmac.new(str(self.client.key_secret), sts, hashlib.sha256).digest())
        ])

        request.headers.update({
            "X-Scalr-Key-Id": self.client.key_id,
            "X-Scalr-Signature": sig,
            "X-Scalr-Date": date_header,
            "X-Scalr-Debug": "1"
        })

        self.client.logger.debug("URL: %s", request.url)
        self.client.logger.debug("StringToSign: %s", repr(sts))
        self.client.logger.debug("Signature: %s", repr(sig))

        return request

    def request(self, *args, **kwargs):
        res = super(ScalrApiSession, self).request(*args, **kwargs)
        self.client.logger.info("%s - %s", " ".join(args), res.status_code)
        try:
            errors = res.json().get("errors", None)
            if errors is not None:
                for error in errors:
                    self.client.logger.warning("API Error (%s): %s", error["code"], error["message"])
        except ValueError:
            self.client.logger.error("Received non-JSON response from API!")
        res.raise_for_status()
        self.client.logger.debug("Received response: %s", res.text)
        return res


if __name__ == '__main__':
    main()

