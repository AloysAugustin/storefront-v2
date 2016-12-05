var app = angular.module('ScalrStorefront');
app.factory('environments', function() {
    return {
        '6':{
                'label':'Test',
            },
        '15':{
                'label':'Production',
            }
    };
});