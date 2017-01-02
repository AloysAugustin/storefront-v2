var app = angular.module('ScalrStorefront');
app.factory('environments', function() {
    return {
        '5':{
                'label':'Test',
            },
        '10':{
                'label':'Production',
            }
    };
});
