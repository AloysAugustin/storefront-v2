//This file contains some recipes
var app = angular.module('ScalrStorefront');
app.factory("recipes", ["apiRecipes",function(apiRecipes){

    var mkMultiPlatformFarmRecipe = function(initialFarmIds) {
        return {
            data: {
                initialFarmIds: initialFarmIds
            },
            validateParams: apiRecipes.mkValidateParams(['keyId', 'envId', 'name', 'flavor', 'approval_required', 'platform', 'runtime']),
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
                        if (params.platform != 'aws') return ''; // Setting instance type supported only on aws: SCALRCORE-4518
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
                },
                {
                    description: 'Set launch date GV',
                    method: 'POST',
                    url: function(data, params) {
                        return '/api/v1beta0/user/{envId}/farms/{farmId}/global-variables/'.replace('{envId}', params.envId).replace('{farmId}', data.newFarm.id);
                    },
                    body: function(data, params) {
                        return JSON.stringify({
                            name: 'STOREFRONT_LAUNCH_DATE',
                            category: 'STOREFRONT',
                            value: Math.floor((new Date()).getTime() / 1000).toString()
                        });
                    },
                    done: function(response, data, params) {}
                },
                {
                    description: 'Set lifetime GV',
                    method: 'POST',
                    url: function(data, params) {
                        return '/api/v1beta0/user/{envId}/farms/{farmId}/global-variables/'.replace('{envId}', params.envId).replace('{farmId}', data.newFarm.id);
                    },
                    body: function(data, params) {
                        var val = {_01_1day: '86400', _02_7days: '604800'}[params.runtime];
                        return JSON.stringify({
                            name: 'STOREFRONT_LIFETIME',
                            category: 'STOREFRONT',
                            value: val
                        });
                    },
                    done: function(response, data, params) {}
                },
            ]

        };
    }

    apiRecipes.register('qadEE2016ui', mkMultiPlatformFarmRecipe({aws: 183, gce: 654, openstack: 1, vmware: 1}));
}]);

