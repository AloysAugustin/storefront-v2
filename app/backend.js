// This file contain a client-side backend

var app = angular.module('ScalrStorefront');

app.factory('backend', ['appDefinitions', 'apiRecipes', 'localStorageService','recipes', function(appDefinitions, apiRecipes, localStorageService, recipes) {
    var backend = {};

    backend.isUserAdvanced = function(credentials) {
        return true;
    };

    backend.runAppDef = function(credentials, def, settings, success_cb, failure_cb) {
        ScalrAPI.setSettings(credentials);
        var s = angular.copy(settings);
        s.def_name = def.name;
        s.keyId = credentials.keyId;
        s.envId = credentials.envId;
        apiRecipes.run(def.recipeId, s, success_cb, failure_cb);
    };

    backend.listAppsByAPIKey = function(credentials, success_cb, failure_cb) {
        ScalrAPI.setSettings(credentials);
         var params = {
            envId: credentials.envId,
            keyId: credentials.keyId
        };
        apiRecipes.run('listFarms', params, success_cb, failure_cb);
    };

    backend.stopApp = function(credentials, instId, success_cb, failure_cb) {
        ScalrAPI.setSettings(credentials);
        var params = {
            envId: credentials.envId,
            farmId: instId
        };
        apiRecipes.run('stopFarm', params, success_cb, failure_cb);
    };

    backend.deleteApp = function(credentials, instId, success_cb, failure_cb) {
        ScalrAPI.setSettings(credentials);
        var params = {
            envId: credentials.envId,
            farmId: instId
        };
        apiRecipes.run('deleteFarm', params, success_cb, failure_cb);
    };

    backend.updateApp = function(credentials, instId, newData, success_cb, failure_cb) {
        console.log("Not implemented");
        failure_cb();
    };

    backend.startApp = function(credentials, instId, success_cb, failure_cb) {
        ScalrAPI.setSettings(credentials);
        var params = {
            envId: credentials.envId,
            farmId: instId
        };
        apiRecipes.run('startFarm', params, success_cb, failure_cb);
    };


    return backend;
}]);
