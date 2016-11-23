//This file contains some recipes
var app = angular.module('ScalrStorefront');
app.factory("recipes", ["apiRecipes",function(apiRecipes){

    var mkStdFarmRecipe = function(initialFarmId) {
        return {
            data: {
                initialFarmId: initialFarmId
            },
            validateParams: apiRecipes.mkValidateParams(['keyId', 'envId', 'name']),
            steps: [
                {
                    description: 'Clone base farm',
                    method: 'POST',
                    url: function(data, params) {
                        return '/api/v1beta0/user/{envId}/farms/{farmId}/actions/clone/'.replace('{envId}', params.envId).replace('{farmId}', data.initialFarmId);
                    },
                    body: function(data, params) {
                        var name = '[' + params.keyId + ']' + params.name;
                        return JSON.stringify({
                            'name': name
                        });
                    },
                    done: function(response, data, params) {
                        data.newFarm = response.data;
                        data.params = params;
                    },
                    undo: {
                        method: 'DELETE',
                        url: function(data, params) {
                            return '/api/v1beta0/user/{envId}/farms/{farmId}/'.replace('{envId}', params.envId).replace('{farmId}', data.newFarm.id);
                        }
                    }
                },
                {
                    description: 'Set farm description',
                    method: 'PATCH',
                    url: function(data, params) {
                        return '/api/v1beta0/user/{envId}/farms/{farmId}/'.replace('{envId}', params.envId).replace('{farmId}', data.newFarm.id);
                    },
                    body: function(data, params) {
                        var settings = angular.copy(params);
                        delete settings.keyId;
                        return JSON.stringify({
                            description: JSON.stringify({
                                settings: settings
                            }),
                        });
                    },
                    done: function(response, data, params) {},
                },
                {
                    description: 'Get new farm role',
                    method: 'GET',
                    url: function(data, params) {
                        return '/api/v1beta0/user/{envId}/farms/{farmId}/farm-roles/'.replace('{envId}', params.envId).replace('{farmId}', data.newFarm.id);
                    },
                    done: function(response, data, params) {
                        data.newFarmRoles = response.data;
                    }
                    // Nothing to undo
                },
                // Nothing done on the farm roles for the moment
                {
                    description: 'Launch farm',
                    method: 'POST',
                    url: function(data, params) {
                        return '/api/v1beta0/user/{envId}/farms/{farmId}/actions/launch/'.replace('{envId}', params.envId).replace('{farmId}', data.newFarm.id);
                    },
                    done: function(response, data, params) {},
                }
            ]

        };
    }


    apiRecipes.register('centos-apache', mkStdFarmRecipe(9));
}]);

