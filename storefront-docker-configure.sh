#!/bin/bash
echo "Enter Scalr URL:(e.g. https://demo.scalr.com/)"
read SCALR_URL
SCALR_URL_OAUTH=$SCALR_URL"public/oauth"
echo "Enter OAuth client-id:"
read SCALR_OAUTH_CLIENTID
echo "Enter Storefront external url"
read SCALR_OAUTH_REDIRECT_URL
SCALR_OAUTH_REDIRECT_URL_APPROVAL=$SCALR_OAUTH_REDIRECT_URL"approval/"
echo "Enter the list of environment ids for the storefront (e.g. ['2','3']):"
read SCALR_ENVS
cat << EOF > app/settings.js.tmp
var app = angular.module('ScalrStorefront');
app.factory('settings', function() {
    return {
        'apiV2Url' : "$SCALR_URL",
        'oAuthGrantUrl' : "$SCALR_URL_OAUTH",
        'oAuthClientId' : "$SCALR_OAUTH_CLIENTID",
        'oAuthRedirectUrl' : "$SCALR_OAUTH_REDIRECT_URL",
        'oAuthRedirectUrlApproval' : "$SCALR_OAUTH_REDIRECT_URL_APPROVAL",
        'environments' : $SCALR_ENVS
    };
});
EOF
echo "Enter APIKEY for farm termination script (lifetime management):"
read SCALR_APIKEY
echo "Enter API Key secret:"
read SCALR_APIKEY_SECRET
SCALR_ENVS_NO_QUOTE=`echo "$SCALR_ENVS" | sed -e 's/'\''//g'`
cat << EOF > config/credentials.json.tmp
{
  "api_url": "$SCALR_URL",
  "api_key_id": "$SCALR_APIKEY",
  "api_key_secret": "$SCALR_APIKEY_SECRET",
  "envs": $SCALR_ENVS_NO_QUOTE
}
EOF
