// This file contain a dummy backend to with a local storage for running instances

var app = angular.module('ScalrStorefront');

app.factory('backend', ['appDefinitions','localStorageService',function(appDefinitions,localStorageService) {
	var backend = {};
	backend.users = {};
	//Utilities
	function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
	}

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
			readOnlyProperties: {
				address: getRandomInt(1,100) + "." getRandomInt(0,255) + "." + getRandomInt(0,255) + "." + getRandomInt(1,254); 
			}
		};
		backend.saveToStorage();
		success_cb();
	};

	backend.listAppsByAPIKey = function(apiKey, success_cb, failure_cb) {
		success_cb(backend.users[apiKey].runningInstances);
	};

	backend.stopApp = function(apiKey, instId, success_cb, failure_cb) {
		backend.users[apiKey].runningInstances[instId].status = "stopped";
		backend.saveToStorage();
		success_cb();
	};

	backend.deleteApp = function(apiKey, instId, success_cb, failure_cb) {
		delete backend.users[apiKey].runningInstances[instId];
		backend.saveToStorage();
		success_cb();
	};

	backend.updateApp = function(apiKey, instId, newData, success_cb, failure_cb) {
		backend.users[apiKey].runningInstances[instId].defData = newData;
		backend.saveToStorage();
		success_cb();
	}

	backend.startApp = function(apiKey, instId, success_cb, failure_cb) {
		backend.users[apiKey].runningInstances[instId].status = "running";
		backend.saveToStorage();
		success_cb();
	}

	//Load userbase from localStorage if it exists
	if (localStorageService.get("backend.users") == null) {
		backend.users['APITEST'] = {
			username: "Test User",
			runningInstances: {
				inst1: {
					def: appDefinitions.defs[0],
					defData: {

					},
					status: "running",
					readOnlyProperties: {
						address: "192.168.0.1"
					}
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