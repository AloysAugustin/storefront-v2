//This file contains some recipes
var app = angular.module('ScalrStorefront');
app.factory("recipes", ["apiRecipes",function(apiRecipes){
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
}])

