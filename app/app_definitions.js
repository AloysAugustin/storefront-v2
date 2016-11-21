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
			apachecomponentVersion: "Version",
			platform: "Cloud platform",
			appNum: 'Amount of application servers',
			dbNum: 'Amount of DB servers',
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

	var ubuntuDef = {
		name: "Ubuntu instance",
		logoUrl: "http://design.ubuntu.com/wp-content/uploads/ubuntu-logo112.png",
		price: defaultPriceFunction,
		recipeId: 'ubuntu',
		description: "Just an Ubuntu server",
		flavorList: defaultFlavorList,
		availabilityList: defaultAvailabilityList,
		runtimeList: defaultRuntimeList,
		platformList: defaultPlatformList,
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
		platformList: defaultPlatformList,
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

	var pgsDef = {
		name: "PostgreSQL",
		logoUrl: "https://wiki.postgresql.org/images/3/30/PostgreSQL_logo.3colors.120x120.png",
		price: defaultPriceFunction,
		recipeId: 'postgre',
		description: "PostgreSQL 9.3 on Ubuntu 14.04",
		flavorList: defaultFlavorList,
		availabilityList: defaultAvailabilityList,
		runtimeList: defaultRuntimeList,
		internetBox: 'Make this application accessible from the internet',
		//Advanced User Options are here
	};
	appDefinitions.registerDef(pgsDef);

	var iisDef = {
		name: "Microsoft IIS",
		logoUrl: "https://www.datadoghq.com/wp-content/uploads/2015/04/Integrations-MicrosoftIIS-340x216.png",
		price: defaultPriceFunction,
		recipeId: 'winiis',
		description: "IIS on Server 2008 r2, with SQL Server 2012",
		flavorList: defaultFlavorList,
		availabilityList: defaultAvailabilityList,
		runtimeList: defaultRuntimeList,
		internetBox: 'Make this application accessible from the internet',
		//Advanced User Options are here
	};
	appDefinitions.registerDef(iisDef);

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

	var fastScalingDef = {
		name: "3 Tier App",
		logoUrl: "https://api-explorer.scalr.com/images/scalr-logo-retina.png",
		price: function(settings) {
			return (1.06 * (3 + parseInt(settings.appNum.substring(3)))).toString().substring(0,5);
		},
		recipeId: 'fastscaling',
		description: 'Fast scale-up example',
		appNumList: { _b_10: '10', _c_20: '20', _c_50: '50', _d_100: '100'},
	};
	appDefinitions.registerDef(fastScalingDef);

	var sapHanaExpressDef = {
		name: "A SAP Hana Express instance",
		logoUrl: "http://www.virtustream.com/images/SAP-HANA-logo_160330_154207.png",
		price: defaultPriceFunction,
		recipeId: 'sapHanaExpress',
		description: "An Ubuntu 14.04 with a running SAP Hana Express",
		availabilityList: defaultAvailabilityList,
		runtimeList: defaultRuntimeList,
		internetBox: 'Make this application accessible from the internet',
		//Advanced User Options are here
	};
	appDefinitions.registerDef(sapHanaExpressDef);

	var apacheChefDef = {
		name: "Apache with Chef instance",
		logoUrl: "http://s3.amazonaws.com/opscode-corpsite/assets/121/pic-chef-logo.png",
		price: defaultPriceFunction,
		recipeId: 'apacheChef',
		description: "A Chef-provisioned Apache Server",
		flavorList: defaultFlavorList,
		availabilityList: defaultAvailabilityList,
		runtimeList: defaultRuntimeList,
		internetBox: 'Make this application accessible from the internet',
		//Advanced User Options are here
	};
	appDefinitions.registerDef(apacheChefDef);

	return appDefinitions;
});