// This file contains an engine that runs "API recipes", which allow to create whole Farms, etc.

var app = angular.module('ScalrStorefront');

app.factory('apiRecipes', function() {
    var apiRecipes = {};
    var recipes = {};

    apiRecipes.run = function(recipe, params, onSuccess, onError) {
        var run = angular.copy(apiRecipes.get(recipe));
        if (!run) {
            console.log('Recipe not found! ' + recipe);
            onError();
        }
        run.params = angular.copy(params);
        console.log(run);
        if (!run.validateParams(run.data, params)) {
            console.log('Invalid params:', params, 'for recipe:', recipe);
            return false;
        }
        doStep(run, 0, onSuccess, onError)
    };

    var doStep = function(recipe, stepNb, onSuccess, onError) {
        if (stepNb >= recipe.steps.length) {
            return onSuccess(recipe.data);
        }
        var step = recipe.steps[stepNb];
        console.log(stepNb, step);
        if ('type' in step) {
            if (step.type == 'parallel-for') {
                var deferreds = [];
                for (var i = 0; i < step.iterations(recipe.data, recipe.params); i ++) {
                    deferreds.push(makeCall(recipe.data, recipe.params, step, function(index) {
                        return function(response) {
                            step.done(response, recipe.data, recipe.params, index);
                        }
                    }(i), function() {}, i));
                }
                $.when.apply(null, deferreds).done(function() {
                    doStep(recipe, stepNb+1, onSuccess, onError);
                }).fail(function() {
                    console.log('parralel for step failed:', step);
                    revert(recipe, stepNb-1, onError);
                });
            } else {
                console.log('unrecognised step type:', step);
            }
        } else {
            makeCall(recipe.data, recipe.params, step, function(response) {
                step.done(response, recipe.data, recipe.params);
                doStep(recipe, stepNb+1, onSuccess, onError);
            }, function(response) {
                // API call failed, start reverting from previous step.
                revert(recipe, stepNb-1, onError);
            });
        }
    };

    var revert = function(recipe, stepNb, onError) {
        if (stepNb < 0) {
            return onError();
        }
        var step = recipe.steps[stepNb];
        console.log(stepNb, step);
        var nextRevert = function(response) {
            revert(recipe, stepNb-1, onError);
        }
        // Keep reverting whether or not this call succeeded
        if ('undo' in step) {
            makeCall(recipe.data, recipe.params, step.undo, nextRevert, nextRevert);
        } else {
            nextRevert();            
        }
    };

    var makeCall = function(data, params, obj, onSuccess, onError, index) {
        var method = obj.method;
        var path = obj.url(data, params, index);
        if (!path || path.length <= 0) {
            //skip this step if path is empty
            return onSuccess({});
        }
        var p;
        if ('params' in obj) {
            p = obj.params(data, params, index);
        } else {
            p = '';
        }
        var body;
        if ('body' in obj) {
            body = obj.body(data, params, index);
        } else {
            body = '';
        }
        if (method == 'scroll') {
            return ScalrAPI.scroll(path, p, onSuccess, onError);
        } else {
            return ScalrAPI.makeApiCall(method, path, p, body, onSuccess, onError);
        }
    };

    apiRecipes.register = function(name, recipe) {
        recipes[name] = recipe;
    };

    apiRecipes.get = function(name) {
        return recipes[name];
    };

    apiRecipes.mkValidateParams = function(required) {
        return function(data, params) {
            for (var i = 0; i < required.length; i ++) {
                if (!(required[i] in params)) {
                    return false;
                }
            }
            return true;
        }
    }

    makeFarmOp = function(method, operation) {
        return {
            data: {},   //Used to store data that needs to be saved across steps, and is passed to the success callback
            validateParams: apiRecipes.mkValidateParams(['envId', 'farmId']),
            steps: [
                {
                    description: method + ' farm ' + operation,
                    method: method,
                    url: function(data, params) {
                        return '/api/v1beta0/user/{envId}/farms/{farmId}/{op}'.replace('{envId}', params.envId).replace('{farmId}', params.farmId).replace('{op}', operation);
                    },
                    done: function(response, data, params) {
                        if (response) {
                            data.result = response.data;
                        }
                    }
                    // Undo not needed for last step (never executed)
                }
            ]
        };
    }

    //apiRecipes.register('stopFarm', makeFarmOp('POST', 'actions/terminate/'));
    apiRecipes.register('startFarm', {
        data: {},   //Used to store data that needs to be saved across steps, and is passed to the success callback
        validateParams: apiRecipes.mkValidateParams(['envId', 'farmId']),
        steps: [
            {
                description: 'Start farm',
                method: 'POST',
                url: function(data, params) {
                    return '/api/v1beta0/user/{envId}/farms/{farmId}/actions/launch/'.replace('{envId}', params.envId).replace('{farmId}', params.farmId);
                },
                done: function(response, data, params) {
                    if (response) {
                        data.result = response.data;
                    }
                }
            },
            {
                description: 'Set launch date GV',
                method: 'POST',
                url: function(data, params) {
                    return '/api/v1beta0/user/{envId}/farms/{farmId}/global-variables/'.replace('{envId}', params.envId).replace('{farmId}', params.farmId);
                },
                body: function(data, params) {
                    return JSON.stringify({
                        name: 'STOREFRONT_LAUNCH_DATE',
                        category: 'STOREFRONT',
                        value: Math.floor((new Date()).getTime() / 1000).toString()
                    });
                },
                done: function(response, data, params) {}
            }
        ]
    });
    apiRecipes.register('deleteFarm', makeFarmOp('DELETE', ''));

    apiRecipes.register('listFarms', {
        data: {},
        validateParams: apiRecipes.mkValidateParams(['envId', 'uid', 'email']),
        steps: [
            {
                description: 'List all farms',
                method: 'scroll',   //Special method to scroll on an endpoint
                url: function(data, params) {
                    return '/api/v1beta0/user/{envId}/farms/'.replace('{envId}', params.envId);
                },
                done: function(response, data, params) {
                    data.farms = response.all_data;
                    var myFarms = [];
                    // Filter farms by uid
                    for (var i = 0; i < data.farms.length; i ++) {
                        if (data.farms[i].name.startsWith('[STOREFRONT-'+params.uid+']')) {
                            data.farms[i].name = data.farms[i].name.replace('[STOREFRONT-'+params.uid+']', '');
                            myFarms.push(data.farms[i]);
                        }
                    }
                    data.myFarms = myFarms;
                }
                // Nothing to undo
            },
            {
                description: 'Get server list for each farm',
                type: 'parallel-for',
                iterations: function(data, params) {
                    return data.myFarms.length;
                },
                method: 'scroll',
                url: function(data, params, index) {
                    return '/api/v1beta0/user/{envId}/farms/{farmId}/servers/'.replace('{envId}', params.envId).replace('{farmId}', data.myFarms[index].id);
                },
                done: function(response, data, params, index) {
                    data.myFarms[index].servers = response.all_data;
                }
                // Nothing to undo
            },
            {
                description: 'Get farm roles for each farm',
                type: 'parallel-for',
                iterations: function(data, params) {
                    return data.myFarms.length;
                },
                method: 'scroll',
                url: function(data, params, index) {
                    return '/api/v1beta0/user/{envId}/farms/{farmId}/farm-roles/'.replace('{envId}', params.envId).replace('{farmId}', data.myFarms[index].id);
                },
                done: function(response, data, params, index) {
                    data.myFarms[index].farmRoles = response.all_data;
                    for (var f = 0; f < data.myFarms[index].farmRoles.length; f ++) {
                        data.myFarms[index].farmRoles[f].servers = [];
                        for (var s = 0; s < data.myFarms[index].servers.length; s ++) {
                            if (data.myFarms[index].farmRoles[f].id == data.myFarms[index].servers[s]['farmRole']['id']) {
                                data.myFarms[index].farmRoles[f].servers.push(data.myFarms[index].servers[s]);
                            }
                        }
                    }
                }
            }
        ]
    });

    apiRecipes.register('stopFarm',{
        data: {},
        validateParams: apiRecipes.mkValidateParams(['envId', 'farmId', 'approvalNeeded']),
        steps: [
            {
                description: 'Stop if possible',
                method: 'POST',
                url: function(data, params) {
                    if (params.approvalNeeded) {
                        return '';
                    }
                    else {
                        return '/api/v1beta0/user/{envId}/farms/{farmId}/actions/terminate/'.
                        replace('{envId}', params.envId).
                        replace('{farmId}', params.farmId);
                    }
                },
                done: function(response, data, params) {
                    return;
                }
            },
            {
                description: 'Delete launch date GV',
                method: 'DELETE',
                url: function(data, params) {
                    return '/api/v1beta0/user/{envId}/farms/{farmId}/global-variables/STOREFRONT_LAUNCH_DATE/'.replace('{envId}', params.envId).replace('{farmId}', params.farmId);
                },
                done: function(response, data, params) {}
            }
        ]
    });

    apiRecipes.register('getUserAndEnvs', {
        data: {},
        validateParams: apiRecipes.mkValidateParams([]),
        steps: [
            {
                description: 'List environments in the user\'s account',
                method: 'scroll',
                url: function(data, params) {
                    return '/api/v1beta0/account/environments/';
                },
                done: function(response, data, params) {
                    data.all_envs = response.data;
                    data.envs = {};
                    for (var i = 0; i < data.all_envs.length; i ++) {
                        var env = data.all_envs[i];
                        if (params.activated_envs.indexOf(env.id.toString()) != -1) {
                            data.envs[env.id.toString()] = env;
                            data.test_env = env;
                        }
                    }
                }
            },
            {
                description: 'Get any farm to get an existing projectId',
                method: 'scroll',
                url: function(data, params) {
                    return '/api/v1beta0/user/{envId}/farms/'.replace('{envId}', data.test_env.id);
                },
                body: function(data, params) {
                    return '';
                },
                done: function(response, data, params) {
                    data.projectId = response.data[0].project.id;
                }
            },
            {
                description: 'Create a dummy farm',
                method: 'POST',
                url: function(data, params) {
                    return '/api/v1beta0/user/{envId}/farms/'.replace('{envId}', data.test_env.id);
                },
                body: function(data, params) {
                    return JSON.stringify({
                        name: '[STOREFRONT-TEMP]' + Math.random().toString(36).substring(7),
                        project: {
                            id: data.projectId,
                        },
                    });
                },
                done: function(response, data, params) {
                    data.farmId = response.data.id;
                    data.uid = response.data['owner']['id'];
                    data.email = response.data['owner']['email'];
                }
            },
            {
                description: 'Delete the dummy farm',
                method: 'DELETE',
                url: function(data, params) {
                    return '/api/v1beta0/user/{envId}/farms/{farmId}/'.replace('{envId}', data.test_env.id).replace('{farmId}', data.farmId);
                },
                done: function(response, data, params) {
                }
            }
        ]
    });

    apiRecipes.register('getAllProjects', {
        data: {},
        validateParams: apiRecipes.mkValidateParams(["envId"]),
        steps: [
            {
                description: 'List all projects in current environment',
                method: 'scroll',
                url: function(data, params) {
                    return '/api/v1beta0/user/{envId}/projects/'.replace('{envId}', params.envId);
                },
                done: function(response, data, params) {
                    data.all_projs = response.data;
                    data.projects = {};
                    for (var i = 0; i < data.all_projs.length; i ++) {
                        var project = data.all_projs[i];
                        data.projects[project.id] = project.billingCode;
                    }
                }
            }
        ]
    });

    apiRecipes.recipes = recipes;
    return apiRecipes;
});
