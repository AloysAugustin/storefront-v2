// This file contain a dummy backend to with a local storage for running instances

var app = angular.module('ScalrStorefront');

app.factory('backend', ['appDefinitions','localStorageService',function(appDefinitions,localStorageService) {
	var backend = {};
	backend.users = {};
	backend.saveToStorage = function(){
		localStorageService.set("backend.users", angular.toJson(backend.users));
		localStorageService.set("backend.uuidCtr", backend.uuidCtr.toString());
	};

	backend.getUserByAPIKey = function(apiKey){
		return users[apiKey];
	};

	backend.runAppDef = function(apiKey, def, defData, success_cb, failure_cb){
		backend.uuidCtr++;
		backend.users[apiKey].runningInstances[backend.uuidCtr] =
		{
			def: def,
			defData: defData,
			status: "running",
		};
		backend.saveToStorage();
		success_cb();
	};

	//Load userbase from localStorage if it exists
	if (localStorageService.get("backend.users") == null) {
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

	}
	else {
		backend.users = angular.fromJson(localStorageService.get("backend.users"));
	}
	//Load the instance counter as well
	if (localStorageService.get("backend.uuidCtr") == null){
		backend.uuidCtr = 1;
	}
	else {
		backend.uuidCtr = localStorageService.get("backend.uuidCtr").parseInt();
	}
	return backend;
}]);