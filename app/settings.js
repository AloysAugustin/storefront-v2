var app = angular.module('ScalrStorefront');
app.factory('settings', function() {
    return {
        'apiV2Url' : "https://demo.scalr.com/",
        'oAuthGrantUrl' : "https://demo.scalr.com/public/oauth",
        'oAuthClientId' : "56866536e49f",
        'oAuthRedirectUrl' : "http://oauth.demo.scalr.com/",
        'oAuthRedirectUrlApproval' : "http://oauth.demo.scalr.com/approval/"
    };
});
