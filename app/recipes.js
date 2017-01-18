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
                        var name;
                        if (!params.approval_required) {
                            name = '[STOREFRONT-' + params.uid + ']' + params.name;
                        } else {
                            name = '[STOREFRONT-' + params.uid + '][PENDING_APPROVAL]' + params.name
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
                    description: 'Set farm billing code',
                    method: 'PATCH',
                    url: function(data, params) {
                        if (!('projectCode' in params)) return '';
                        return '/api/v1beta0/user/{envId}/farms/{farmId}/'.replace('{envId}', params.envId).replace('{farmId}', data.newFarm.id);
                    },
                    body: function(data, params) {
                        var settings = angular.copy(params);
                        delete settings.uid;
                        return JSON.stringify({
                            "project":{
                                "id": settings.projectCode
                            }
                            ,
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
                    description: 'Set new farm role availability zone',
                    method: 'PATCH',
                    url: function(data, params) {
                        if (data.newFarmRoles[0].platform !== 'ec2' || !('availabilityZone' in params) || params.availabilityZone === '_01any') return '';
                        return '/api/v1beta0/user/{envId}/farm-roles/{farmRoleId}/placement/'.replace('{envId}', params.envId).replace('{farmRoleId}', data.newFarmRoles[0].id);
                    },
                    body: function(data, params) {
                        return JSON.stringify({
                                "placementConfigurationType": data.newFarmRoles[0].placement.placementConfigurationType,
                                "region": data.newFarmRoles[0].placement.region,
                                "availabilityZones": [data.newFarmRoles[0].placement.region + params.availabilityZone]
                        });
                    },
                    done: function(response, data, params) {},
                    // The Farm Role will be deleted with the farm, nothing to undo
                },
                {
                    description: 'Adjust min instances',
                    method: 'PATCH',
                    url: function(data, params) {
                        if (!('availability' in params)) return '';
                        return '/api/v1beta0/user/{envId}/farm-roles/{farmRoleId}/scaling/'.replace('{envId}', params.envId).replace('{farmRoleId}', data.newFarmRoles[0].id);
                    },
                    body: function(data, params) {
                        var scalingObject = angular.copy(data.newFarmRoles[0].scaling);
                        scalingObject.minInstances = {
                            _01bh: 0,
                            _02_247: 1,
                            _03ha: 1,
                            _02_125: 0,
                        }[params.availability];
                        return JSON.stringify(scalingObject);
                    },
                    done: function(response, data, params) {},
                },
                {
                    description: 'Set DateTime Scaling Rules',
                    method: 'POST',
                    url : function(data,params) {
                        if (!('availability' in params) || params.availability === '_02_247'){
                            return '';
                        }
                        return '/api/v1beta0/user/{envId}/farm-roles/{farmRoleId}/scaling/'.replace('{envId}', params.envId).replace('{farmRoleId}', data.newFarmRoles[0].id);
                    },
                    body: function(data, params) {
                        var scalingRule = {
                            "name": "DateAndTime",
                            "ruleType": "DateAndTimeScalingRule",
                            "schedule": []
                        };
                        if (params.availability === '_02_125'){
                            scalingRule.schedule.push({
                                "daysOfWeek": [
                                    "mon","tue","wed","thu","fri"
                                ],
                                "end": "8:00 PM",
                                "instanceCount": 1,
                                "start": "8:00 AM"
                            });
                        }
                        if (params.availability === '_01bh'){
                            scalingRule.schedule.push({
                                "daysOfWeek": [
                                    "mon","tue","wed","thu","fri"
                                ],
                                "end": "6:00 PM",
                                "instanceCount": 1,
                                "start": "8:00 AM"
                            });
                        }
                        return JSON.stringify(scalingRule);
                    },
                    done: function(response,data, params) {}
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
                        if (!('runtime' in params) || params.runtime === '_03forever') return '';
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
                        var name;
                        if (!params.approval_required) {
                            name = '[STOREFRONT-' + params.uid + ']' + params.name;
                        } else {
                            name = '[STOREFRONT-' + params.uid + '][PENDING_APPROVAL]' + params.name;
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
                    description: 'Set farm billing code',
                    method: 'PATCH',
                    url: function(data, params) {
                        if (!('projectCode' in params)) return '';
                        return '/api/v1beta0/user/{envId}/farms/{farmId}/'.replace('{envId}', params.envId).replace('{farmId}', data.newFarm.id);
                    },
                    body: function(data, params) {
                        var settings = angular.copy(params);
                        delete settings.uid;
                        return JSON.stringify({
                            "project":{
                                "id": settings.projectCode
                            }
                            ,
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
                    description: 'Set new farm role availability zone',
                    method: 'PATCH',
                    url: function(data, params) {
                        if (data.newFarmRoles[0].platform !== 'ec2' || !('availabilityZone' in params) || params.availabilityZone === '_01any') return '';
                        return '/api/v1beta0/user/{envId}/farm-roles/{farmRoleId}/placement/'.replace('{envId}', params.envId).replace('{farmRoleId}', data.newFarmRoles[0].id);
                    },
                    body: function(data, params) {
                        return JSON.stringify({
                            "placementConfigurationType": data.newFarmRoles[0].placement.placementConfigurationType,
                            "region": data.newFarmRoles[0].placement.region,
                            "availabilityZones": [data.newFarmRoles[0].placement.region + params.availabilityZone]
                        });
                    },
                    done: function(response, data, params) {},
                    // The Farm Role will be deleted with the farm, nothing to undo
                },
                {
                    description: 'Adjust min instances',
                    method: 'PATCH',
                    url: function(data, params) {
                        if (!('availability' in params)) return '';
                        return '/api/v1beta0/user/{envId}/farm-roles/{farmRoleId}/scaling/'.replace('{envId}', params.envId).replace('{farmRoleId}', data.newFarmRoles[0].id);
                    },
                    body: function(data, params) {
                        var scalingObject = angular.copy(data.newFarmRoles[0].scaling);
                        scalingObject.minInstances = {
                            _01bh: 0,
                            _02_247: 1,
                            _03ha: 1,
                            _02_125: 0,
                        }[params.availability];
                        return JSON.stringify(scalingObject);
                    },
                    done: function(response, data, params) {},
                },
                {
                    description: 'Set DateTime Scaling Rules',
                    method: 'POST',
                    url : function(data,params) {
                        if (!('availability' in params) || params.availability === '_02_247'){
                            return '';
                        }
                        return '/api/v1beta0/user/{envId}/farm-roles/{farmRoleId}/scaling/'.replace('{envId}', params.envId).replace('{farmRoleId}', data.newFarmRoles[0].id);
                    },
                    body: function(data, params) {
                        var scalingRule = {
                            "name": "DateAndTime",
                            "ruleType": "DateAndTimeScalingRule",
                            "schedule": []
                        };
                        if (params.availability === '_02_125'){
                            scalingRule.schedule.push({
                                "daysOfWeek": [
                                    "mon","tue","wed","thu","fri"
                                ],
                                "end": "8:00 PM",
                                "instanceCount": 1,
                                "start": "8:00 AM"
                            });
                        }
                        if (params.availability === '_01bh'){
                            scalingRule.schedule.push({
                                "daysOfWeek": [
                                    "mon","tue","wed","thu","fri"
                                ],
                                "end": "6:00 PM",
                                "instanceCount": 1,
                                "start": "8:00 AM"
                            });
                        }
                        return JSON.stringify(scalingRule);
                    },
                    done: function(response,data, params) {}
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
                        if (!('runtime' in params) || params.runtime === '_03forever') return '';
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

