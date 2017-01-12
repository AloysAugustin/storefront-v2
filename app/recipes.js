//This file contains some recipes
var app = angular.module('ScalrStorefront');
app.factory("recipes", ["apiRecipes",function(apiRecipes){

    var mkStdFarmRecipe = function(initialFarmId) {
        return {
            data: {
                initialFarmId: initialFarmId
            },
            validateParams: apiRecipes.mkValidateParams(['uid', 'envId', 'flavor', 'name', 'approval_required', 'email']),
            steps: [
                {
                    description: 'Clone base farm',
                    method: 'POST',
                    url: function(data, params) {
                        return '/api/v1beta0/user/{envId}/farms/{farmId}/actions/clone/'.replace('{envId}', params.envId).replace('{farmId}', data.initialFarmId);
                    },
                    body: function(data, params) {
                        if (!params.approval_required) {
                            var name = '[STOREFRONT-' + params.uid + ']' + params.name;
                        } else {
                            var name = '[STOREFRONT-' + params.uid + '][PENDING_APPROVAL]' + params.name
                        }
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
                        delete settings.uid;
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
                        if (params.approval_required) {
                            return '';
                        }
                        return '/api/v1beta0/user/{envId}/farms/{farmId}/actions/launch/'.replace('{envId}', params.envId).replace('{farmId}', data.newFarm.id);
                    },
                    done: function(response, data, params) {},
                }
            ]

        };
    }

    var mkMultiPlatformFarmRecipe = function(initialFarmIds) {
        return {
            data: {
                initialFarmIds: initialFarmIds
            },
            validateParams: apiRecipes.mkValidateParams(['uid', 'envId', 'name', 'flavor', 'approval_required', 'platform']),
            steps: [
                {
                    description: 'Clone base farm',
                    method: 'POST',
                    url: function(data, params) {
                        var farmId = data.initialFarmIds[params.platform];
                        return '/api/v1beta0/user/{envId}/farms/{farmId}/actions/clone/'.replace('{envId}', params.envId).replace('{farmId}', farmId);
                    },
                    body: function(data, params) {
                        if (!params.approval_required) {
                            var name = '[STOREFRONT-' + params.uid + ']' + params.name;
                        } else {
                            var name = '[STOREFRONT-' + params.uid + '][PENDING_APPROVAL]' + params.name
                        }
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
                        delete settings.uid;
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
                        if (params.platform != 'aws') return ''; // Setting instance type supported only on aws
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
                        if (params.approval_required) {
                            return '';
                        }
                        return '/api/v1beta0/user/{envId}/farms/{farmId}/actions/launch/'.replace('{envId}', params.envId).replace('{farmId}', data.newFarm.id);
                    },
                    done: function(response, data, params) {},
                }
            ]

        };
    }

    apiRecipes.register('ubuntu', mkMultiPlatformFarmRecipe({aws: 183, gce: 654}));
    apiRecipes.register('ubuntu-approval', mkStdFarmRecipe(806));
    apiRecipes.register('redis', mkStdFarmRecipe(191));
    apiRecipes.register('windows', mkStdFarmRecipe(192));
    apiRecipes.register('mysql', mkMultiPlatformFarmRecipe({aws: 190, gce: 655}));
    apiRecipes.register('node', mkStdFarmRecipe(188));
    apiRecipes.register('django', mkStdFarmRecipe(187));
    apiRecipes.register('rails', mkStdFarmRecipe(184));
    apiRecipes.register('sapHanaExpress', mkStdFarmRecipe(760));
}]);

