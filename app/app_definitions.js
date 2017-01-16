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
		var k;
		for (var key in def){
			if (key.endsWith("List")){
				k = key.slice(0,-4);
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
				k = key.slice(0,-5);
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
				k = key.slice(0, -3);
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
	
	var defaultApprover = 'storefrontapprovers@scalr.com';

	var ubuntuDef = {
		name: "Ubuntu instance",
		logoUrl: "http://design.ubuntu.com/wp-content/uploads/ubuntu-logo112.png",
		price: defaultPriceFunction,
		environment: 2,
		recipeId: 'ubuntu',
		description: "Just an Ubuntu Server",
		flavorList: defaultFlavorList,
		availabilityList: defaultAvailabilityList,
		runtimeList: defaultRuntimeList,
		platformList: defaultPlatformList,
		internetBox: 'Make this application accessible from the internet',
		approvalNeeded: defaultApprovalFunction,
		approver: defaultApprover,
		//Advanced User Options are here
	};
	appDefinitions.registerDef(ubuntuDef);

	var largeUbuntuDef = {
		name: "Large ubuntu instance",
		logoUrl: "http://design.ubuntu.com/wp-content/uploads/ubuntu-logo112.png",
		price: defaultPriceFunction,
		environment: 39,
		recipeId: 'ubuntu-approval',
		description: "Just an Ubuntu Server",
		flavorList: defaultFlavorList,
		internetBox: 'Make this application accessible from the internet',
		approvalNeeded: always,
		approver: defaultApprover,
		justificationField: 'Justification',
		//Advanced User Options are here
	};
	appDefinitions.registerDef(largeUbuntuDef);

	var railsDef = {
		name: "Apache rails",
		logoUrl: "https://upload.wikimedia.org/wikipedia/commons/1/16/Ruby_on_Rails-logo.png",
		price: defaultPriceFunction,
		environment: 2,
		recipeId: 'rails',
		description: "A Rails / Apache server",
		flavorList: defaultFlavorList,
		availabilityList: defaultAvailabilityList,
		runtimeList: defaultRuntimeList,
		internetBox: 'Make this application accessible from the internet',
		approvalNeeded: defaultApprovalFunction,
		approver: defaultApprover,
		//Advanced User Options are here
	};
	appDefinitions.registerDef(railsDef);

	var djangoDef = {
		name: "Apache Django",
		logoUrl: "http://www.unixstickers.com/image/data/stickers/django/django-neg.sh.png",
		price: defaultPriceFunction,
		environment: 2,
		recipeId: 'django',
		description: "A Django / Apache server",
		flavorList: defaultFlavorList,
		availabilityList: defaultAvailabilityList,
		runtimeList: defaultRuntimeList,
		internetBox: 'Make this application accessible from the internet',
		approvalNeeded: defaultApprovalFunction,
		approver: defaultApprover,
		//Advanced User Options are here
	};
	appDefinitions.registerDef(djangoDef);

	var nodeDef = {
		name: "Node.JS",
		logoUrl: "https://node-os.com/images/nodejs.png",
		price: defaultPriceFunction,
		environment: 2,
		recipeId: 'node',
		description: "A Node.JS server",
		flavorList: defaultFlavorList,
		availabilityList: defaultAvailabilityList,
		runtimeList: defaultRuntimeList,
		internetBox: 'Make this application accessible from the internet',
		approvalNeeded: defaultApprovalFunction,
		approver: defaultApprover,
		//Advanced User Options are here
	};
	appDefinitions.registerDef(nodeDef);

	var mysqlDef = {
		name: "MySQL",
		logoUrl: "https://www.mysql.fr/common/logos/logo-mysql-170x115.png",
		price: defaultPriceFunction,
		environment: 2,
		recipeId: 'mysql',
		description: "A MySQL server, on Ubuntu 14.04",
		flavorList: defaultFlavorList,
		availabilityList: defaultAvailabilityList,
		runtimeList: defaultRuntimeList,
		platformList: defaultPlatformList,
		internetBox: 'Make this application accessible from the internet',
		approvalNeeded: defaultApprovalFunction,
		approver: defaultApprover,
		//Advanced User Options are here
	};
	appDefinitions.registerDef(mysqlDef);

	var redisDef = {
		name: "Redis",
		logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/6/6b/Redis_Logo.svg/1280px-Redis_Logo.svg.png",
		price: defaultPriceFunction,
		environment: 2,
		recipeId: 'redis',
		description: "A Redis server",
		flavorList: defaultFlavorList,
		availabilityList: defaultAvailabilityList,
		runtimeList: defaultRuntimeList,
		internetBox: 'Make this application accessible from the internet',
		approvalNeeded: defaultApprovalFunction,
		approver: defaultApprover,
		//Advanced User Options are here
	};
	appDefinitions.registerDef(redisDef);

	var windowsDef = {
		name: "Windows instance",
		logoUrl: "http://itiscloudy.com/wp-content/uploads/2015/08/logo_winserver2012R2.png",
		price: defaultPriceFunction,
		environment: 2,
		recipeId: 'windows',
		description: "Just a Windows 2012 Server",
		flavorList: defaultFlavorList,
		availabilityList: defaultAvailabilityList,
		runtimeList: defaultRuntimeList,
		internetBox: 'Make this application accessible from the internet',
		approvalNeeded: defaultApprovalFunction,
		approver: defaultApprover,
		//Advanced User Options are here
	};
	appDefinitions.registerDef(windowsDef);

	var sapHanaExpressDef = {
		name: "SAP HANA Express",
		logoUrl: "http://www.virtustream.com/images/SAP-HANA-logo_160330_154207.png",
		price: function(settings) {
			return 20.16;
		},
		recipeId: 'sapHanaExpress',
		environment: 2,
		description: "An Ubuntu 14.04 with a running SAP Hana Express",
		availabilityList: defaultAvailabilityList,
		runtimeList: defaultRuntimeList,
		internetBox: 'Make this application accessible from the internet',
		approvalNeeded: defaultApprovalFunction,
		approver: defaultApprover,
	};
	appDefinitions.registerDef(sapHanaExpressDef);

	return appDefinitions;
});
