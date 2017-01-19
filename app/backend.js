// This file contain a client-side backend

var app = angular.module('ScalrStorefront');

app.factory('backend', ['appDefinitions', 'apiRecipes', 'localStorageService','recipes','$http', function(appDefinitions, apiRecipes, localStorageService, recipes, $http) {
    var backend = {};

    backend.isUserAdvanced = function(credentials) {
        return true;
    };
    ScalrAPI.setHTTPService($http);
    backend.runAppDef = function(credentials, def, settings, success_cb, failure_cb) {
        ScalrAPI.setSettings(credentials);
        var s = angular.copy(settings);
        s.def_name = def.name;
        s.uid = credentials.uid;
        s.email = credentials.uid;
        s.envId = credentials.envId;
        apiRecipes.run(def.recipeId, s, success_cb, failure_cb);
    };

    backend.listAppsForUser= function(credentials, success_cb, failure_cb) {
        ScalrAPI.setSettings(credentials);
         var params = {
            envId: credentials.envId,
            uid: credentials.uid,
            email: credentials.email
        };
        apiRecipes.run('listFarms', params, success_cb, failure_cb);
    };

    backend.stopApp = function(credentials, app, success_cb, failure_cb) {
        ScalrAPI.setSettings(credentials);
        var params = {
            envId: credentials.envId,
            farmId: app.id,
            approvalNeeded: app.model.approvalNeeded(app.settings)
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

    backend.retrieveUserAndEnvs = function(credentials, settings, success_cb, failure_cb){
        ScalrAPI.setSettings(credentials);
        var params = {
            activated_envs: settings.environments
        }
        apiRecipes.run('getUserAndEnvs', params, success_cb, failure_cb);
    }

    backend.getAllProjects = function(credentials, success_cb, failure_cb){
        ScalrAPI.setSettings(credentials);
        var params = {
            envId: credentials.envId,
        };
        apiRecipes.run('getAllProjects', params, success_cb, failure_cb);
    }
    return backend;
}]);
