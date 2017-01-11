var app = angular.module('ScalrStorefront');
app.factory('settings', function() {
    return {
        'apiV2Url' : "http://demo.scalr.com/",
        'oAuthGrantUrl' : "http://demo.scalr.com/public/oauth",
        'oAuthClientId' : "56866536e49f",
        'oAuthRedirectUrl' : "http://oauth.demo.scalr.com/"
    };
});
