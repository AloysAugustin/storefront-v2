//This file contains some recipes
var app = angular.module('ScalrStorefront');
app.factory("recipes", ["apiRecipes",function(apiRecipes){
    apiRecipes.register('ubuntu', {
        data: {
            initialFarmId: 184
        },
        validateParams: apiRecipes.mkValidateParams(['keyId']),
        steps: [
            {
                description: 'Clone base farm',
                method: 'POST',
                url: function(data, params) {
                    return '/api/v1beta0/user/{envId}/farms/{farmId}/actions/clone/'.replace('{envId}', params.envId).replace('{farmId}', data.initialFarmId);
                },
                body: function(data, params) {
                    return JSON.stringify({
                        'name': '[' + params.keyId + ']' + params.name
                    });
                },
                done: function(response, data, params) {
                    data.newFarm = response.data;
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
            {
                description: 'Set new farm role instance type',
                method: 'PATCH',
                url: function(data, params) {
                    return '/api/v1beta0/user/{envId}/farm-roles/{farmRoleId}/instance/'.replace('{envId}', params.envId).replace('{farmRoleId}', data.newFarmRoles[0].id);
                },
                body: function(data, params) {
                    var instanceType = {
                        _01small: "m3.medium",
                        _02medium: "m3.large",
                        _03large: "m3.xlarge",
                    }[params.flavor];
                    return JSON.stringify({
                        instanceConfigurationType: "AwsInstanceConfiguration",
                        instanceType: {
                          id: instanceType
                        }
                    });
                },
                done: function(response, data, params) {},
                // The Farm Role will be deleted with the farm, nothing to undo
            },
            {
                description: 'Launch farm',
                method: 'POST',
                url: function(data, params) {
                    return '/api/v1beta0/user/{envId}/farms/{farmId}/actions/launch/'.replace('{envId}', params.envId).replace('{farmId}', data.newFarm.id);
                },
                done: function(response, data, params) {},
            }
        ]

    });    
}])

