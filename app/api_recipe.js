// This file contains an engine that runs "API recipes", which allow to create whole Farms, etc.

var app = angular.module('ScalrStorefront');

app.factory('apiRecipes', function() {
    var apiRecipes = {};
    var recipes = {};

    apiRecipes.run = function(recipe, params, onSuccess, onError) {
        var run = angular.copy(apiRecipes.get(recipe));
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
        if ('params' in obj) {
            var p = obj.params(data, params, index);
        } else {
            var p = '';
        }
        if ('body' in obj) {
            var body = obj.body(data, params, index);
        } else {
            var body = '';
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

    apiRecipes.register('stopFarm', makeFarmOp('POST', 'actions/terminate/'));
    apiRecipes.register('startFarm', makeFarmOp('POST', 'actions/launch/'));
    apiRecipes.register('deleteFarm', makeFarmOp('DELETE', ''));

    apiRecipes.register('listFarms', {
        data: {},
        validateParams: apiRecipes.mkValidateParams(['envId', 'keyId']),
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
                    // Filter farms by key id
                    for (var i = 0; i < data.farms.length; i ++) {
                        if (data.farms[i].name.startsWith('['+params.keyId+']')) {
                            data.farms[i].name = data.farms[i].name.replace('['+params.keyId+']', '');
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
            }
        ]
    });

    apiRecipes.recipes = recipes;
    return apiRecipes;
});
