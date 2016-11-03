var app = angular.module('ScalrStorefront', ['LocalStorageModule', 'angular.filter', 'ui.bootstrap','ngRoute','ngStorage', 'afOAuth2']);

app.controller('StorefrontController', [
  "backend",
  "appDefinitions",
  "environments",
  "$scope",
  "$location",
  "$filter",
  "$interval",
  "localStorageService",
  function (back, apps, environments, $scope, $location, $filter, $interval, localStorageService) {
  /*
   * Credentials management
   */
  for (var anyEnv in environments) break;
  $scope.defaultApiSettings = {
    apiUrl: "https://demo.scalr.com/",
    keyId: "",
    secretKey: "",
    envId: anyEnv,
  };

  $scope.apiSettings = {};
  $scope.storedApiSettings = null;

  $scope.loadApiSettings = function () {
    var storedApiSettings = angular.fromJson(localStorageService.get('apiSettings'));
    if (storedApiSettings === null) {
      $scope.storedApiSettings = $scope.defaultApiSettings;
      $scope.apiSettings = angular.copy($scope.storedApiSettings);
    } else {
      for (var prop in $scope.defaultApiSettings) {
        if ($scope.defaultApiSettings.hasOwnProperty(prop) && !storedApiSettings.hasOwnProperty(prop)) {
          storedApiSettings[prop] = $scope.defaultApiSettings[prop];
        }
      }
      if (!(storedApiSettings.envId in environments)) {
        storedApiSettings.envId = anyEnv;
      }
      $scope.storedApiSettings = storedApiSettings;
      $scope.apiSettings = angular.copy($scope.storedApiSettings);
      if ($scope.apiSettings.keyId.length > 0 && $scope.apiSettings.secretKey.length > 0 && $scope.apiSettings.envId.length > 0) {
        $scope.autoLoggedIn = true;
        $scope.apiSettingsDone();
        $scope.credentialsSaved = true;
      }
    }
  }

  $scope.saveApiSettings = function () {
    $scope.storedApiSettings = angular.copy($scope.apiSettings);
    $scope.apiSettingsDone();
    $scope.credentialsSaved = true;
  }

  $scope.clearApiSettings = function () {
    $scope.storedApiSettings = angular.copy($scope.defaultApiSettings);
    $scope.autoLoggedIn = false;
    $scope.loggedIn = false;
  }

  // Update storage on save
  $scope.$watch('storedApiSettings', function (newSettings, oldSettings) {
    if (newSettings === oldSettings) return;  // Same object --> initialization.
    localStorageService.set('apiSettings', angular.toJson(newSettings));
  }, true);

  $scope.apiSettingsDone = function() {

    $scope.credentialsSaved = false;
    $scope.loggedIn = true;
    $scope.settings.advanced_user = back.isUserAdvanced($scope.apiSettings);
    $scope.fetchCatalog();
    $scope.fetchAllFarms();
  }

  $scope.envIdChanged = function(envId) {
    $scope.apiSettings.envId = envId;
    $scope.storedApiSettings.envId = envId;
    $scope.fetchCatalog();
    $scope.fetchAllFarms();
  }

  // TODO: validation

  /*
   * Farms
   */
  $scope.myApps = [];
  $scope.apps = [];
  $scope.availableEnvs = environments;

  $scope.showError = function(reason, obj) {
    console.log(reason, obj);
  };

  $scope.fetchCatalog = function() {
    if (!$scope.loggedIn){
      return;
    }
    $scope.apps.length = 0;
    var env_apps = apps.getEnvApps($scope.apiSettings.envId);
    console.log(env_apps);
    for (var i = 0; i < env_apps.length; i ++) {
      var form = angular.copy(apps.parseDefToDict(env_apps[i]));
      $scope.apps.push({
        model: angular.copy(env_apps[i]),
        form: form,
        show_launch: false,
        launching: false,
        settings: $scope.default_settings(form, env_apps[i].name)
      });
    }
  }

  $scope.fetchAllFarms = function() {
    if (!$scope.loggedIn){
      return;
    }
    //$scope.myApps.length = 0;
    //Create a set with myApps
    var myAppsSet = {};
    for (var i = 0; i < $scope.myApps.length; i ++) {
      myAppsSet[$scope.myApps[i].id] = $scope.myApps[i];
    }
    back.listAppsByAPIKey($scope.apiSettings, function(data) {
      var myFarms = data.myFarms;
      console.log(myFarms);
      for (var i = 0; i < myFarms.length; i ++) {
        var farm = myFarms[i];
        farm.terminating_servers_count = 0;
        try {
          farm.description = JSON.parse(farm.description);
        } catch(e) {
          console.log(e, 'for farm', farm);
          return;
        }
        if (!farm.description.settings) {
          continue;
        }
        var def_name = farm.description.settings.def_name;
        delete farm.description.settings.def_name;
        var def = apps.getDefinition(def_name, $scope.apiSettings.envId);

        farm.running_servers = [];
        var readOnlyProperties = {};
        var status = '';
        for (var j = 0; j < farm.servers.length; j ++) {
          if (farm.servers[j].status != 'pending_terminate' && farm.servers[j].status != 'terminated') {
            farm.running_servers.push(farm.servers[j]);
          } else if (farm.servers[j].status == 'pending_terminate'){
            farm.terminating_servers_count ++;
          }
        }

        if (farm.name.startsWith('[PENDING_APPROVAL]')) {
          farm.name = farm.name.replace('[PENDING_APPROVAL]', '');
          status = 'pending_approval';
        } else if (farm.running_servers.length > 0) {
          status = 'running';
          readOnlyProperties.endpoints = {};
          for (var j = 0; j < farm.farmRoles.length; j ++) {
            var serversEP = [];
            for (var k = 0; k < farm.farmRoles[j].servers.length; k ++) {
              if (farm.farmRoles[j].servers[k].status != 'pending_terminate' && farm.farmRoles[j].servers[k].status != 'terminated') {
                serversEP.push(farm.farmRoles[j].servers[k].publicIp[0]);
              }
            }
            readOnlyProperties.endpoints[farm.farmRoles[j].alias] = serversEP;
          }
        } else if (farm.terminating_servers_count > 0) {
          status = 'terminating';
        } else {
          status = 'stopped';
        }
        //Look if the current app is already loaded
        if (farm.id in myAppsSet){
          myAppsSet[farm.id].id = farm.id;
          myAppsSet[farm.id].ownerEmail = farm.owner.email;
          myAppsSet[farm.id].model = angular.copy(def);
          myAppsSet[farm.id].settings = angular.copy(farm.description.settings);
          myAppsSet[farm.id].orig_settings = angular.copy(farm.description.settings);
          myAppsSet[farm.id].status = angular.copy(status);
          myAppsSet[farm.id].form = apps.parseDefToDict(def);
          myAppsSet[farm.id].props = angular.copy(readOnlyProperties);
          myAppsSet[farm.id].old = false;
        } else {
          $scope.myApps.push({
            id: farm.id,
            ownerEmail: farm.owner.email,
            model: angular.copy(def),
            settings: angular.copy(farm.description.settings),
            orig_settings: angular.copy(farm.description.settings),
            status: angular.copy(status),
            form: apps.parseDefToDict(def),
            props: angular.copy(readOnlyProperties),
            showDetails: false,
            working: false,
            show_edition: false,
            old: false,
          });
        }
        
      }
      //Delete old apps
      for (var i = 0; i < $scope.myApps.length; i++){
        if ($scope.myApps[i].old){
          $scope.myApps.splice(i,1);
          i--;
        } else {
          $scope.myApps[i].old = true;
        }
      }
      console.log($scope.myApps);
      $scope.$apply();
    }, function() {
      alert("Can't list applications. Check your credentials.");
      $scope.loggedIn = false;
      $scope.autoLoggedIn = false;
    });
  };

  $scope.applyChanges = function(app) {
    back.updateApp($scope.apiSettings, app.id, app.settings, function() {
      $scope.fetchCatalog();
      $scope.fetchAllFarms();
    }, null)
  };

  $scope.default_settings = function(form, name) {
    var r = {name: name};
    for (var i = 0; i < form.length; i ++) {
      if (form[i].type == 'option') {
        if (localStorageService.get("userPrefs." + form[i].identifier) == null){
          for (k in form[i].options) {
            r[form[i].identifier] = k;
            break;
          }
        }
        else {
          r[form[i].identifier] = localStorageService.get("userPrefs." + form[i].identifier);
        }
      }
      if (form[i].type == 'text' && localStorageService.get("userPrefs." + form[i].identifier) != null){
        r[form[i].identifier] = localStorageService.get("userPrefs." + form[i].identifier);
      }
      if (form[i].type == 'checkbox') {
        if (localStorageService.get("userPrefs." + form[i].identifier)) {
          r[form[i].identifier] = true;
        } else {
          r[form[i].identifier] = false;
        }
      }
    }
    return r;
  };

  $scope.hasModifiableSettings = function(form) {
    var count = 0;
    for (var i = 0; i < form.length; i ++) {
      if (form[i].isModifiable) {
        count += 1;
      }
    }
    return count > 0;
  }

  $scope.numAdvancedSettings = function(form) {
    var count = 0;
    for (var i = 0; i < form.length; i ++) {
      if (form[i].advOption) {
        count += 1;
      }
    }
    return count;
  }

  $scope.launch = function(app) {
    for (k in app.settings){
      if (k != 'name'){
        localStorageService.set('userPrefs.' + k, app.settings[k]);
      }
    }
    app.launching = true;
    app.settings.approval_required = app.model.approvalNeeded(app.settings);
    back.runAppDef($scope.apiSettings, app.model, app.settings, function(result) {
      app.launching = false;
      if (app.settings.approval_required) {
        $scope.request_approval(result, 'launch');
      } else {
        $scope.fetchCatalog();
        $scope.fetchAllFarms();
      }
    }, function() {
      alert("Farm launched failed. Please check that you don't already have a farm by this name.");
      $scope.fetchCatalog();
      $scope.fetchAllFarms();
    });
  };

  $scope.request_approval = function(app, action) {
    console.log('sending email');
    var params = {};
    var def = {};
    if (action == 'launch'){
      params = angular.copy(app.params);
      def = apps.getDefinition(params.def_name, $scope.apiSettings.envId);
    }
    if (action == 'stop'){
      params = angular.copy(app.settings);
      def = app.model;
    }
    delete params['def_name']
    delete params['keyId']
    delete params['name']
    delete params['approval_required']
    params['action'] = action;
    var body = {
      admin: def.approver,
      url: $scope.apiSettings.apiUrl,
      storeFrontOrigin: window.location.origin,
      env: $scope.apiSettings.envId,
      appName: def.name,
      params: params,
    };
    if (action == 'stop') {
      body.farmId = app.id;
      body.user = app.ownerEmail;
    }
    if (action == 'launch') {
      body.farmId = app.newFarm.id;
      body.user = app.newFarm.owner.email;
    }
    $.post('http://' + window.location.hostname + '/send/', JSON.stringify(body), function() {
      console.log('email sent');
      $scope.fetchCatalog();
      $scope.fetchAllFarms();
    });
  }

  $scope.startApp = function(app) {
    back.startApp($scope.apiSettings, app.id, function() {
      app.working = false;
      app.showDetails = false;
      $scope.fetchCatalog();
      $scope.fetchAllFarms();
    }, function() {
      app.working = false;
      alert("Operation failed.");
      $scope.fetchCatalog();
      $scope.fetchAllFarms();
    });
  };

  $scope.stopApp = function(app) {
    back.stopApp($scope.apiSettings, app, function() {
      app.working = false;
      app.showDetails = false;
      if (app.model.approvalNeeded(app.settings)){
        $scope.request_approval(app, 'stop');
      } else {
        $scope.fetchCatalog();
        $scope.fetchAllFarms();
      }
    }, function() {
      alert("Operation failed.");
      app.working = false;
      $scope.fetchCatalog();
      $scope.fetchAllFarms();
    });
  };

  $scope.deleteApp = function(app) {
    back.deleteApp($scope.apiSettings, app.id, function() {
      app.working = false;
      app.showDetails = false;
      $scope.fetchCatalog();
      $scope.fetchAllFarms();
    }, function() {
      alert("Operation failed.");
      app.working = false;
      $scope.fetchCatalog();
      $scope.fetchAllFarms();
    });
  };

  /*
   * Initialisation
   */
  $scope.loggedIn = false;
  $scope.autoLoggedIn = false;
  $scope.credentialsSaved = false;

  $scope.settings = {
    advanced_user: true,
    show_advanced: false,
  }

  $scope.loadApiSettings();
  $scope.pollingPromise = $interval($scope.fetchAllFarms, 10000);


  /*
   * Front
   */
  $scope.shouldHideFarmSet = function(this_hidden) {
    if (!this_hidden) return '';
    for (var i = 0; i < $scope.apps.length; i ++) {
      if ($scope.apps[i].show_launch) return 'hide';
    }
    return '';
  };

  $scope.shouldHideRunning = function(this_hidden) {
    if (!this_hidden) return '';
    for (var i = 0; i < $scope.myApps.length; i ++) {
      if ($scope.myApps[i].showDetails) return 'hide';
    }
    return '';
  };

  $scope.resetCatalog = function() {
    for (var i = 0; i < $scope.apps.length; i ++) {
      $scope.apps[i].show_launch = false;
    }
  };

  $scope.resetApps = function() {
    for (var i = 0; i < $scope.myApps.length; i ++) {
      $scope.myApps[i].showDetails = false;
    }
  };

  $scope.keys = function(obj){
    return obj? Object.keys(obj) : [];
  }

  $scope.sortIndex = function(v) {
    if (v == 'Low') return 1;
    if (v == 'Small') return 1;
    if (v == 'Medium') return 2;
    if (v == 'High') return 3;
    if (v == 'Large') return 3;
    if (v == 'Business hours') return 1;
    if (v == '24/7') return 2;
    if (v == 'HA') return 3;
    return v;
  }

}]);

app.directive('ngConfirmClick', [
        function(){
            return {
                priority: 1,
                terminal: true,
                link: function (scope, element, attr) {
                    var msg = attr.ngConfirmClick || "Are you sure?";
                    var clickAction = attr.confirmedClick;
                    element.bind('click',function (event) {
                        if ( window.confirm(msg) ) {
                            scope.$apply(clickAction);
                        }
                    });
                }
            };
    }]);

app.filter('safe', function() {
    return function(x) {
        var txt = x.replace(' ', '-').toLowerCase();
        return txt;
    };
});
