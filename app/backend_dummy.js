// This file contain a dummy backend to with a local storage for running instances

var app = angular.module('ScalrStorefront');

app.factory('backend', ['appDefinitions','localStorageService',function(appDefinitions,localStorageService) {
	var backend = {};
	backend.users = {};

	backend.users['APITEST'] = {
		username: "Test User",
		runningInstances: {
			inst1: {
				def: appDefinitions.defs[0],
				defData: {

				},
				status: "running"
			}
		}
	};
	backend.saveToStorage = function(){
		localStorageService.set("backend.users");
	};
	backend.getUserByAPIKey = function(apiKey){
		return users[apiKey];
	};

	backend.runAppDef = function(apiKey, def, defData, success_cb, failure_cb){
		backend.users[apiKey].runningInstances
	};

	return backend;
}]);