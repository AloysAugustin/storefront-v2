var app = angular.module('ScalrStorefront');
app.factory('settings', function() {
    return {
        'apiV2Url' : "http://e03172b1bb8f.test-env.scalr.com/",
        'oAuthGrantUrl' : "http://e03172b1bb8f.test-env.scalr.com/public/oauth",
        'oAuthClientId' : "82f555642d29",
        'oAuthRedirectUrl' : "http://oauth.demo.scalr.com/"
    };
});
