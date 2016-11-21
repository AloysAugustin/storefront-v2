//This file contains some recipes
var app = angular.module('ScalrStorefront');
app.factory("recipes", ["apiRecipes",function(apiRecipes){

    var mkStdFarmRecipe = function(initialFarmId,forceInstanceType) {
        return {
            data: {
                initialFarmId: initialFarmId
            },
            validateParams: apiRecipes.mkValidateParams(['keyId', 'envId', 'flavor', 'name', 'approval_required']),
            steps: [
                {
                    description: 'Clone base farm',
                    method: 'POST',
                    url: function(data, params) {
                        return '/api/v1beta0/user/{envId}/farms/{farmId}/actions/clone/'.replace('{envId}', params.envId).replace('{farmId}', data.initialFarmId);
                    },
                    body: function(data, params) {
                        if (!params.approval_required) {
                            var name = '[' + params.keyId + ']' + params.name;
                        } else {
                            var name = '[' + params.keyId + '][PENDING_APPROVAL]' + params.name
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
                        if (typeof forceInstanceType !== 'undefined') {
                            instanceType = forceInstanceType;
                        }
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
            validateParams: apiRecipes.mkValidateParams(['keyId', 'envId', 'name', 'flavor', 'approval_required', 'platform']),
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
                            var name = '[' + params.keyId + ']' + params.name;
                        } else {
                            var name = '[' + params.keyId + '][PENDING_APPROVAL]' + params.name
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

    var rapidDeploymentRecipe = {
        data: {
            initialFarmId: 758
        },
        validateParams: apiRecipes.mkValidateParams(['keyId', 'envId', 'name', 'appNum', 'dbNum']),
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
                // Nothing to undo
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
                description: 'Set app farm role scaling',
                method: 'PATCH',
                url: function(data, params) {
                    for (var i = 0; i < data.newFarmRoles.length; i ++) {
                        if (data.newFarmRoles[i].alias == 'mysql-ubuntu1404') {
                            data.appFarmRoleId = data.newFarmRoles[i].id;
                        }
                        if (data.newFarmRoles[i].alias == 'Webapp') {
                            data.dbFarmRoleId = data.newFarmRoles[i].id;
                        }
                    }
                    return '/api/v1beta0/user/{envId}/farm-roles/{farmRoleId}/scaling/'.replace('{envId}', params.envId).replace('{farmRoleId}', data.appFarmRoleId);
                },
                body: function(data, params) {
                    return JSON.stringify({
                        enabled: true,
                        minInstances: params.appNum.substring(3),
                        maxInstances: params.appNum.substring(3),
                        scalingBehavior: "launch-terminate",
                        considerSuspendedServers: "running",
                    });
                },
                done: function(response, data, params) {},
                // The Farm Role will be deleted with the farm, nothing to undo
            },
            {
                description: 'Set db farm role scaling',
                method: 'PATCH',
                url: function(data, params) {
                    return '/api/v1beta0/user/{envId}/farm-roles/{farmRoleId}/scaling/'.replace('{envId}', params.envId).replace('{farmRoleId}', data.dbFarmRoleId);
                },
                body: function(data, params) {
                    return JSON.stringify({
                        enabled: true,
                        minInstances: params.dbNum.substring(3),
                        maxInstances: params.dbNum.substring(3),
                        scalingBehavior: "launch-terminate",
                        considerSuspendedServers: "running",
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
            },
            {
                description: 'Scale up rapidly app server',
                type: 'parallel-for',
                iterations: function(data, params) {
                    return parseInt(params.appNum.substring(3)) - 1;
                },
                method: 'POST',
                url: function(data, params, index) {
                    return '/api/v1beta0/user/{envId}/servers/'.replace('{envId}', params.envId);
                },
                body: function(data, params) {
                    return JSON.stringify({
                      "farmRole": {
                        "id": data.appFarmRoleId
                      }
                    });
                },
                done: function(response, data, params, index) {}
            },
            {
                description: 'Scale up rapidly db server',
                type: 'parallel-for',
                iterations: function(data, params) {
                    return parseInt(params.dbNum.substring(3)) - 1;
                },
                method: 'POST',
                url: function(data, params, index) {
                    return '/api/v1beta0/user/{envId}/servers/'.replace('{envId}', params.envId);
                },
                body: function(data, params) {
                    return JSON.stringify({
                      "farmRole": {
                        "id": data.dbFarmRoleId
                      }
                    });
                },
                done: function(response, data, params, index) {}
            }
        ]
    };

    apiRecipes.register('ubuntu', mkMultiPlatformFarmRecipe({aws: 183, gce: 654}));
    apiRecipes.register('redis', mkStdFarmRecipe(191));
    apiRecipes.register('postgre', mkStdFarmRecipe(757));
    apiRecipes.register('winiis', mkStdFarmRecipe(756));
    apiRecipes.register('windows', mkStdFarmRecipe(192));
    apiRecipes.register('mysql', mkMultiPlatformFarmRecipe({aws: 190, gce: 655}));
    apiRecipes.register('node', mkStdFarmRecipe(188));
    apiRecipes.register('django', mkStdFarmRecipe(187));
    apiRecipes.register('rails', mkStdFarmRecipe(184));
    apiRecipes.register('fastscaling', rapidDeploymentRecipe);
    apiRecipes.register('sapHanaExpress', mkStdFarmRecipe(760,'c3.4xlarge'))
    apiRecipes.register('apacheChef', mkStdFarmRecipe(763))

}]);

