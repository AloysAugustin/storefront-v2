var app = angular.module('ScalrStorefront');
app.factory('environments', function() {
    return {
        '2':{
                'label':'Test',
            },
        '5':{
                'label':'Production',
            }
    };
});
