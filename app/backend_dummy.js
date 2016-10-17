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

	backend.getUserByAPIKey = function(keyId){
		return backend.users[keyId];
	};

	backend.validateAPIKey = function(keyId){
		if (!(keyId in backend.users)){
			backend.users[keyId] = {
				username: keyId,
				advancedUser: false,
				runningInstances: {}
			};
			backend.saveToStorage();
		}
	}

	backend.isUserAdvanced = function(credentials){
		backend.validateAPIKey(credentials.keyId);
		return backend.users[credentials.keyId].advancedUser;
	}

	backend.runAppDef = function(credentials, def, defData, success_cb, failure_cb){
		backend.uuidCtr++;
		backend.validateAPIKey(credentials.keyId);
		backend.users[credentials.keyId].runningInstances[backend.uuidCtr] =
		{
			def: def,
			defData: defData,
			status: "running",
			readOnlyProperties: {
				address: getRandomInt(1,100) + "." + getRandomInt(0,255) + "." + getRandomInt(0,255) + "." + getRandomInt(1,254)
			}
		};
		backend.saveToStorage();
		success_cb();
	};

	backend.listAppsByAPIKey = function(credentials, success_cb, failure_cb) {
		backend.validateAPIKey(credentials.keyId);
		success_cb(backend.users[credentials.keyId].runningInstances);
	};

	backend.stopApp = function(credentials, instId, success_cb, failure_cb) {
		backend.validateAPIKey(credentials.keyId);
		backend.users[credentials.keyId].runningInstances[instId].status = "stopped";
		backend.saveToStorage();
		success_cb();
	};

	backend.deleteApp = function(credentials, instId, success_cb, failure_cb) {
		backend.validateAPIKey(credentials.keyId);
		delete backend.users[credentials.keyId].runningInstances[instId];
		backend.saveToStorage();
		success_cb();
	};

	backend.updateApp = function(credentials, instId, newData, success_cb, failure_cb) {
		backend.validateAPIKey(credentials.keyId);
		backend.users[credentials.keyId].runningInstances[instId].defData = newData;
		backend.saveToStorage();
		success_cb();
	}

	backend.startApp = function(credentials, instId, success_cb, failure_cb) {
		backend.validateAPIKey(credentials.keyId);
		backend.users[credentials.keyId].runningInstances[instId].status = "running";
		backend.saveToStorage();
		success_cb();
	}

	//Load userbase from localStorage if it exists
	if (localStorageService.get("backend.users") == null) {
		backend.users['APITEST'] = {
			username: "Test User",
			advancedUser: true,
			runningInstances: {}	
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
		parseInt(backend.uuidCtr = localStorageService.get("backend.uuidCtr"));
	}
	return backend;
}]);