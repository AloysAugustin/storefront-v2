//This file contains application definitions

var app = angular.module('ScalrStorefront');
//This services contains all the app definitions
// An app definition is a dictonary whose fields are either:
// def-scope values like name and logoUrl
// List values corresponds to list of choices. The name of the fields end with List. E.g. distributionList
// Field values corresponds to a field the user can type in. E.g. adminADGroupField
// When user data is serialized it must give a dictionary whose fields are like the following example:
// 
// ubuntuData = {
//   distribution: "Ubuntu 14.04",
//   flavor: "Small",
//   location: "SSF",
//   addMoreStorage: "Yes",
//   monitoring: "Yes",
//   backup: "Yes",
//   adminADGroup: "Any string is fine"
// }
//   This service also contains a helper which go through all the definitions and format them in a usable way
//   This helper is parseDefToDict. It takes a definition and return a list of dictionary such that:
//   {
//		type: "option",
//      identifier: "monitoring",
//      label: "Monitoring",
//      options: ["Yes","No"],
//      advUser: true,
//      advOption: true
//   }
// type can either be "option" or "text"
// Finally the list of all the definitions in defs

app.factory('appDefinitions', function(){
	var appDefinitions = {};
	appDefinitions.defs = [];
	appDefinitions.registerDef = function(def){
		appDefinitions.defs.push(def);
	};
	appDefinitions.identifierToLabel = function(identifier){
		return {
			distribution: "Distribution",
			flavor: "Flavor",
			location: "Location",
			addMoreStorage: "Add persistent storage",
			monitoring: "Monitoring",
			backup: "Backup",
			adminADGroup: "Admin AD Group",
			componentVersion: "Component Version"
		}[identifier];
	};
	appDefinitions.isAdvancedUser = function(identifier){
		return ([
				"location",
				"addMoreStorage",
				"monitoring",
				"backup",
				"adminADGroup",
				"componentVersion"
			].indexOf(identifier) >= 0);
	};
	appDefinitions.isAdvancedOption = function(identifier){
		return ([
				"monitoring",
				"backup",
				"adminADGroup",
				"componentVersion"
			].indexOf(identifier) >= 0);
	};
	appDefinitions.isModifiable = function(identifier){
		return ([
				"flavor"
			].indexOf(identifier) >= 0);
	};

	appDefinitions.parseDefToDict = function(def){
		var res = [];
		for (var key in def){
			if (key.endsWith("List")){
				var k = key.slice(0,-4);
				res.push({
					type: "option",
					identifier: k,
					label: appDefinitions.identifierToLabel(k),
					options: def[key],
					advUser: appDefinitions.isAdvancedUser(k),
					advOption: appDefinitions.isAdvancedOption(k),
					isModifiable: appDefinitions.isModifiable(k)
				});
			}
			if (key.endsWith("Field")){
				var k = key.slice(0,-5);
				res.push({
					type: "text",
					identifier: k,
					label: appDefinitions.identifierToLabel(k),
					advUser: appDefinitions.isAdvancedUser(k),
					advOption: appDefinitions.isAdvancedOption(k),
					isModifiable: appDefinitions.isModifiable(k)
				});
			}
		}
		return res;
	};

	var defaultFlavorList = {small:"Small", medium:"Medium", large:"Large"};
	var defaultLocationList = {ssf:"SSF", basel:"Basel", shanghai:"Shanghai"};
	var defaultYesNoList = {no:"No", yes:"Yes"};
	var defaultStorageList = {no:"No", s: "10GB", m:"100GB"};
	var defaultAdminADGroupField = "Admin AD Group";
	var ubuntuDef = {
		name: "Ubuntu",
		logoUrl: "http://design.ubuntu.com/wp-content/uploads/ubuntu-logo112.png",
		description: "An Ubuntu Server",
		distributionList: {ubnt14:"Ubuntu 14.04", ubnt16:"Ubuntu 16.04"},
		flavorList: defaultFlavorList,
		//Advanced User Options are here
		locationList: defaultLocationList,
		addMoreStorageList: defaultStorageList,
		//Advanced Options are here
		//componentVersionList: [],
		monitoringList: defaultYesNoList,
		backupList: defaultYesNoList,
		adminADGroupField: defaultAdminADGroupField

	};
	appDefinitions.registerDef(ubuntuDef);
	return appDefinitions;
});