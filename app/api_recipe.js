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
        makeCall(recipe.data, recipe.params, step, function(response) {
            step.done(response, recipe.data, recipe.params);
            doStep(recipe, stepNb+1, onSuccess, onError);
        }, function(response) {
            // API call failed, start reverting from previous step.
            revert(recipe, stepNb-1, onError);
        });
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
            return;
        } else {
            nextRevert();            
        }
    };

    var makeCall = function(data, params, obj, onSuccess, onError) {
        var method = obj.method;
        var path = obj.url(data, params);
        if ('params' in obj) {
            var params = obj.params(data, params);
        } else {
            var params = '';
        }
        if ('body' in obj) {
            var body = obj.body(data, params);
        } else {
            var body = '';
        }
        if (method == 'scroll') {
            ScalrAPI.scroll(path, params, onSuccess, onError);
        } else {
            ScalrAPI.makeApiCall(method, path, params, body, onSuccess, onError);
        }
    };


    apiRecipes.register = function(name, recipe) {
        recipes[name] = recipe;
    };

    apiRecipes.get = function(name) {
        return recipes[name];
    };

    makeFarmOp = function(method, operation) {
        return {
            data: {},   //Used to store data that needs to be saved across steps, and is passed to the success callback
            validateParams: function(data, params) {
                var paramsList = ['envId', 'farmId'];
                for (p in paramsList) {
                    if (!p in params) {
                        return false;
                    }
                }
                return true;
            },
            steps: [
                {
                    description: method + ' farm',
                    method: method,
                    url: function(data, params) {
                        return '/api/v1beta0/user/{envId}/farms/{farmId}/{op}'.replace('{envId}', params.envId).replace('{farmId}', params.farmId).replace('{op}', operation);
                    },
                    done: function(response, data, params) {
                        data.result = response.data;
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
        validateParams: function(data, params) {
            var paramsList = ['envId'];
            for (p in paramsList) {
                if (!p in params) {
                    return false;
                }
            }
            return true;
        },
        steps: [
            {
                description: 'List all farms',
                method: 'scroll',   //Special method to scroll on an endpoint
                url: function(data, params) {
                    return '/api/v1beta0/user/{envId}/farms/'.replace('{envId}', params.envId);
                },
                done: function(response, data, params) {
                    data.farms = response.all_data;
                }
                // Undo not needed for last step (never executed)
            }
        ]
    });

    apiRecipes.register('ubuntu', {
        data: {
 
        },
        validateParams: function(data, params) {
            var paramsList = ['envId', 'cloudImageId', 'name'];
            for (p in paramsList) {
                if (!p in params) {
                    return false;
                }
            }
            return true;
        },
        steps: [
            {
                description: 'Create image',
                method: 'POST',
                url: function(data, params) {
                    return '/api/v1beta0/user/{envId}/images/'.replace('{envId}', params.envId);
                },
                body: function(data, params) {
                    return JSON.stringify({
                        architecture: 'i386',
                        cloudImageId: params.cloudImageId,
                        cloudPlatform: 'ec2',
                        name: params.name,
                        os: {
                             id: 'ubuntu-16-04'
                        },
                        cloudInitInstalled: true,
                        cloudLocation: 'us-east-1',
                        scalrAgentInstalled: false
                    });
                },
                done: function(response, data, params) {
                    data.createdImage = reponse.data;
                },
                undo: {
                    method: 'DELETE',
                    url: function(data, params) {
                        return '/api/v1beta0/user/{envId}/images/{imageId}/'.replace('{envId}', params.envId).replace('{imageId}', data.createdImage.id);
                    }
                },
            },
            {

            }
        ]
    });

    apiRecipes.recipes = recipes;
    return apiRecipes;
});
