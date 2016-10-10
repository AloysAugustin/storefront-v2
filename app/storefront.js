var app = angular.module('ScalrStorefront', ['LocalStorageModule', 'angular.filter', 'ui.bootstrap']);

app.controller('StorefrontController', ["backend", "appDefinitions", "$scope", "$location", "$filter", "localStorageService",
  function (back, apps, $scope, $location, $filter, localStorageService) {

  /*
   * Credentials management
   */
  $scope.defaultApiSettings = {
    apiUrl: "https://demo.scalr.com/",
    keyId: "",
    secretKey: "",
    envId: ""
  };

  $scope.apiSettings = {};
  $scope.storedApiSettings = null;

  $scope.loadApiSettings = function () {
    var storedApiSettings = angular.fromJson(localStorageService.get('apiSettings'));
    if (storedApiSettings === null) {
      $scope.storedApiSettings = $scope.defaultApiSettings;
      $scope.apiSettings = angular.copy($scope.storedApiSettings);
    } else {
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
    $scope.fetchAllFarms();
    $scope.credentialsSaved = false;
    $scope.loggedIn = true;
    $scope.settings.advanced_user = back.isUserAdvanced($scope.apiSettings);
  }

  // TODO: validation

  /*
   * Farms
   */
  $scope.myApps = [];
  $scope.apps = [];

  $scope.showError = function(reason, obj) {
    console.log(reason, obj);
  };

  $scope.fetchAllFarms = function() {
    $scope.apps.length = 0;
    $scope.myApps.length = 0;

    for (var i = 0; i < apps.defs.length; i ++) {
      var form = angular.copy(apps.parseDefToDict(apps.defs[i]));
      $scope.apps.push({
        model: angular.copy(apps.defs[i]),
        form: form,
        show_launch: false,
        launching: false,
        settings: $scope.default_settings(form, apps.defs[i].name)
      });
    }

    back.listAppsByAPIKey($scope.apiSettings, function(data) {
      var myFarms = data.myFarms;
      console.log(myFarms);
      for (var i = 0; i < myFarms.length; i ++) {
        var farm = myFarms[i];
        farm.description = JSON.parse(farm.description);
        if (!farm.description.settings) {
          continue;
        }
        var def_name = farm.description.settings.def_name;
        delete farm.description.settings.def_name;
        var def = {};
        for (var j = 0; j < apps.defs.length; j ++) {
          if (apps.defs[j].name == def_name) {
            def = apps.defs[j];
            break;
          }
        }

        // TODO
        var readOnlyProperties = [];
        var status = 'todo';

        $scope.myApps.push({
          id: farm.id,
          model: angular.copy(def),
          settings: angular.copy(farm.description.settings),
          orig_settings: angular.copy(farm.description.settings),
          status: angular.copy(status),
          form: apps.parseDefToDict(def),
          props: angular.copy(readOnlyProperties),
          showDetails: false,
          working: false,
          show_edition: false
        });
      }
      console.log($scope.myApps);
      $scope.$apply();
    }, null);
  };

  $scope.applyChanges = function(app) {
    back.updateApp($scope.apiSettings, app.id, app.settings, function() {
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
    }
    return r;
  };

  $scope.launch = function(app) {
    for (k in app.settings){
      if (k != 'name'){
        localStorageService.set('userPrefs.' + k, app.settings[k]);
      }
    }
    back.runAppDef($scope.apiSettings, app.model, app.settings, function() {
      app.launching = false;
      $scope.fetchAllFarms();
    }, null);
  };

  $scope.startApp = function(app) {
    back.startApp($scope.apiSettings, app.id, function() {
      $scope.fetchAllFarms();
    }, null)
  };

  $scope.stopApp = function(app) {
    back.stopApp($scope.apiSettings, app.id, function() {
      $scope.fetchAllFarms();
    }, null)
  };

  $scope.deleteApp = function(app) {
    back.deleteApp($scope.apiSettings, app.id, function() {
      $scope.fetchAllFarms();
    }, null)
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
