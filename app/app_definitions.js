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
			internet: "Internet access",
			flavor: "Performance level",
			location: "Location",
			availability: "Availability level",
			runtime: "Application lifetime",
			platform: "Cloud platform",
			justification: "Justification"
		}[identifier];
	};
	appDefinitions.isAdvancedUser = function(identifier){
		return ([
			].indexOf(identifier) >= 0);
	};
	appDefinitions.isAdvancedOption = function(identifier){
		return ([
			].indexOf(identifier) >= 0);
	};
	appDefinitions.isApprovalOnlyOption = function(identifier){
		return ([
				"justification"
			].indexOf(identifier) >= 0);
	};
	appDefinitions.isModifiable = function(identifier){
		return ([
			].indexOf(identifier) >= 0);
	};

	appDefinitions.getEnvApps = function(envId) {
		var envApps = [];
		for (var i = 0; i < this.defs.length; i ++) {
			if (this.defs[i].environment == envId) {
				envApps.push(this.defs[i]);
			}
		}
		return envApps;
	};

	appDefinitions.getDefinition = function(defName, envId) {
		for (var i = 0; i < this.defs.length; i ++) {
			if (this.defs[i].environment == envId && this.defs[i].name == defName) {
				return this.defs[i];
			}
		}
	}

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
					approvalOnly: appDefinitions.isApprovalOnlyOption(k),
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
					approvalOnly: appDefinitions.isApprovalOnlyOption(k),
					isModifiable: appDefinitions.isModifiable(k)
				});
			}
			if (key.endsWith("Box")) {
				var k = key.slice(0, -3);
				res.push({
					type: 'checkbox',
					identifier: k,
					label: appDefinitions.identifierToLabel(k),
					text: def[key],
					advUser: appDefinitions.isAdvancedUser(k),
					advOption: appDefinitions.isAdvancedOption(k),
					approvalOnly: appDefinitions.isApprovalOnlyOption(k),
					isModifiable: appDefinitions.isModifiable(k)
				})
			}
		}
		return res;
	};

	var defaultFlavorList = {_01small:"Low", _02medium:"Medium", _03large:"High"};
	var defaultAvailabilityList = {_01bh: "Business hours", _02_247: "24/7", _03ha: "HA"};
	var defaultRuntimeList = {_01_7days: "7 days", _02forever: "Forever"}
	var defaultYesNoList = {no:"No", yes:"Yes"};
	var defaultPlatformList = {aws: "AWS", gce: "GCE"};

	var defaultPriceFunction = function(settings){
		var platform = "aws";
		if (settings.platform) {
			platform = settings.platform;
		}
		return {
			aws: {
			 	_01small: "1.61",
			 	_02medium: "3.22",
			 	_03large: "6.44"
			},
			gce: {
				_01small: "1.85",
			 	_02medium: "3.70",
			 	_03large: "7.40"
			}
		}[platform][settings.flavor];
	}

	var defaultApprovalFunction = function(settings) {
		return settings.flavor == '_03large' 
		|| settings.availability == '_03ha'
		|| settings.availability == '_02_247'
		|| settings.runtime == '_02forever'
		|| settings.internet;
	}

	var always = function(settings) {
		return true;
	}

	var never = function(settings) {
		return false;
	}
	
	var defaultApprover = 'example@example.com';

	var ubuntuDef = {
		name: "Ubuntu instance",
		logoUrl: "http://design.ubuntu.com/wp-content/uploads/ubuntu-logo112.png",
		price: defaultPriceFunction,
		environment: 1,
		recipeId: 'ubuntu',
		description: "Just an Ubuntu Server",
		flavorList: defaultFlavorList,
		approvalNeeded: never,
		approver: defaultApprover,
		//Advanced User Options are here
	};
	appDefinitions.registerDef(ubuntuDef);


	return appDefinitions;
});
