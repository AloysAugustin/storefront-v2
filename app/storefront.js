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
    $scope.apps = [];
    $scope.myApps = [];


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

    back.listAppsByAPIKey($scope.apiSettings.keyId, function(apps) {
      for (var i in apps) {
        $scope.myApps.push({
          id: i,
          model: angular.copy(apps[i].def),
          settings: angular.copy(apps[i].defData),
          status: angular.copy(apps[i].status),
          props: angular.copy(apps[i].readOnlyProperties),
          showDetails: false,
          working: false
        });
      }
    }, null);
  };

  $scope.default_settings = function(form, name) {
    var r = {name: name};
    for (var i = 0; i < form.length; i ++) {
      if (form[i].type == 'option') {
        for (k in form[i].options) {
          r[form[i].identifier] = k;
          break;
        }
      }
    }
    return r;
  };

  $scope.launch = function(app) {
    back.runAppDef($scope.apiSettings.keyId, app.model, app.settings, function() {
      app.launching = false;
      $scope.fetchAllFarms();
    }, null);
  };

  $scope.startApp = function(app) {
    back.startApp($scope.apiSettings.keyId, app.id, function() {
      $scope.fetchAllFarms();
    }, null)
  };

  $scope.stopApp = function(app) {
    back.stopApp($scope.apiSettings.keyId, app.id, function() {
      $scope.fetchAllFarms();
    }, null)
  };

  $scope.deleteApp = function(app) {
    back.deleteApp($scope.apiSettings.keyId, app.id, function() {
      $scope.fetchAllFarms();
    }, null)
  };

  /*
   * Initialisation
   */
  $scope.loggedIn = false;
  $scope.autoLoggedIn = false;
  $scope.credentialsSaved = false;
  $scope.loadApiSettings();

  $scope.settings = {
    advanced_user: true,
    show_advanced: false,
  }

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
    for (var i = 0; i < $scope.myFarms.length; i ++) {
      $scope.myFarms[i].showDetails = false;
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
                    var clickAction = attr.ngClick;
                    element.bind('click',function (event) {
                        if ( window.confirm(msg) ) {
                            scope.$eval(clickAction)
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
