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
			internet: "Internet accesss",
			flavor: "Performance level",
			location: "Location",
			addMoreStorage: "Add persistent storage",
			availability: "Availability level",
			runtime: "Application lifetime",
			monitoring: "Monitoring",
			backup: "Backup",
			adminADGroup: "Admin AD Group",
			jbcomponentVersion: "Version",
			mysqlcomponentVersion: "Version",
			apachecomponentVersion: "Version"
		}[identifier];
	};
	appDefinitions.isAdvancedUser = function(identifier){
		return ([
				"location",
				"addMoreStorage",
				"monitoring",
				"backup",
				"adminADGroup",
				"jbcomponentVersion",
				"mysqlcomponentVersion",
				"apachecomponentVersion"
			].indexOf(identifier) >= 0);
	};
	appDefinitions.isAdvancedOption = function(identifier){
		return ([
				"monitoring",
				"backup",
				"adminADGroup",
				"jbcomponentVersion",
				"mysqlcomponentVersion",
				"apachecomponentVersion"
			].indexOf(identifier) >= 0);
	};
	appDefinitions.isModifiable = function(identifier){
		return ([
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
			if (key.endsWith("Box")) {
				var k = key.slice(0, -3);
				res.push({
					type: 'checkbox',
					identifier: k,
					label: appDefinitions.identifierToLabel(k),
					text: def[key],
					advUser: appDefinitions.isAdvancedUser(k),
					advOption: appDefinitions.isAdvancedOption(k),
					isModifiable: appDefinitions.isModifiable(k)
				})
			}
		}
		return res;
	};

	var defaultFlavorList = {_01small:"Low", _02medium:"Medium", _03large:"High"};
	var defaultAvailabilityList = {_01bh: "Business hours", _02_247: "24/7", _03ha: "HA"};
	var defaultRuntimeList = {_01_7days: "7 days", _02forever: "Forever"}
	var defaultLocationList = {ssf:"SSF", basel:"Basel", shanghai:"Shanghai"};
	var defaultYesNoList = {no:"No", yes:"Yes"};
	var defaultStorageList = {_01no:"No", _02s: "10GB", _03m:"100GB"};

	var defaultPriceFunction = function(settings){
		return {
		 	_01small: "1.5",
		 	_02medium: "2.6",
		 	_03large: "3.8"
		}[settings.flavor];
	}

	var ubuntuDef = {
		name: "Ubuntu instance",
		logoUrl: "http://design.ubuntu.com/wp-content/uploads/ubuntu-logo112.png",
		price: defaultPriceFunction,
		recipeId: 'ubuntu',
		description: "Just an Ubuntu Server",
		flavorList: defaultFlavorList,
		availabilityList: defaultAvailabilityList,
		runtimeList: defaultRuntimeList,
		internetBox: 'Make this application accessible from the internet',
		//Advanced User Options are here
	};
	appDefinitions.registerDef(ubuntuDef);

	var railsDef = {
		name: "Apache rails",
		logoUrl: "https://upload.wikimedia.org/wikipedia/commons/1/16/Ruby_on_Rails-logo.png",
		price: defaultPriceFunction,
		recipeId: 'rails',
		description: "A Rails / Apache server",
		flavorList: defaultFlavorList,
		availabilityList: defaultAvailabilityList,
		runtimeList: defaultRuntimeList,
		internetBox: 'Make this application accessible from the internet',
		//Advanced User Options are here
	};
	appDefinitions.registerDef(railsDef);

	var djangoDef = {
		name: "Apache Django",
		logoUrl: "http://www.unixstickers.com/image/data/stickers/django/django-neg.sh.png",
		price: defaultPriceFunction,
		recipeId: 'django',
		description: "A Django / Apache server",
		flavorList: defaultFlavorList,
		availabilityList: defaultAvailabilityList,
		runtimeList: defaultRuntimeList,
		internetBox: 'Make this application accessible from the internet',
		//Advanced User Options are here
	};
	appDefinitions.registerDef(djangoDef);

	var nodeDef = {
		name: "Node.JS",
		logoUrl: "https://node-os.com/images/nodejs.png",
		price: defaultPriceFunction,
		recipeId: 'node',
		description: "A Node.JS server",
		flavorList: defaultFlavorList,
		availabilityList: defaultAvailabilityList,
		runtimeList: defaultRuntimeList,
		internetBox: 'Make this application accessible from the internet',
		//Advanced User Options are here
	};
	appDefinitions.registerDef(nodeDef);

	var mysqlDef = {
		name: "MySQL",
		logoUrl: "https://www.mysql.fr/common/logos/logo-mysql-170x115.png",
		price: defaultPriceFunction,
		recipeId: 'mysql',
		description: "A MySQL server, on Ubuntu 14.04",
		flavorList: defaultFlavorList,
		availabilityList: defaultAvailabilityList,
		runtimeList: defaultRuntimeList,
		internetBox: 'Make this application accessible from the internet',
		//Advanced User Options are here
	};
	appDefinitions.registerDef(mysqlDef);

	var redisDef = {
		name: "Redis",
		logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/6/6b/Redis_Logo.svg/1280px-Redis_Logo.svg.png",
		price: defaultPriceFunction,
		recipeId: 'redis',
		description: "A Redis server",
		flavorList: defaultFlavorList,
		availabilityList: defaultAvailabilityList,
		runtimeList: defaultRuntimeList,
		internetBox: 'Make this application accessible from the internet',
		//Advanced User Options are here
	};
	appDefinitions.registerDef(redisDef);

	var windowsDef = {
		name: "Windows instance",
		logoUrl: "http://itiscloudy.com/wp-content/uploads/2015/08/logo_winserver2012R2.png",
		price: defaultPriceFunction,
		recipeId: 'windows',
		description: "Just a Windows 2012 Server",
		flavorList: defaultFlavorList,
		availabilityList: defaultAvailabilityList,
		runtimeList: defaultRuntimeList,
		internetBox: 'Make this application accessible from the internet',
		//Advanced User Options are here
	};
	appDefinitions.registerDef(windowsDef);

	return appDefinitions;
});