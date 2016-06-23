var app = angular.module('ScalrStorefront', ["LocalStorageModule"]);

app.controller('StorefrontController', ["$scope", "$location", "$filter", "localStorageService", 
  function ($scope, $location, $filter, localStorageService) {

  /*
   * Credentials management
   */
  $scope.defaultApiSettings = {
    apiUrl: "https://api.scalr.net/",
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
      //$scope.apiSettingsDone();
    }
  }

  $scope.saveApiSettings = function () {
    $scope.storedApiSettings = angular.copy($scope.apiSettings);
  }

  $scope.clearApiSettings = function () {
    $scope.storedApiSettings = angular.copy($scope.defaultApiSettings);
  }

  // Update storage on save
  $scope.$watch('storedApiSettings', function (newSettings, oldSettings) {
    if (newSettings === oldSettings) return;  // Same object --> initialization.
    localStorageService.set('apiSettings', angular.toJson(newSettings));
  }, true);

  $scope.apiSettingsDone = function() {
    $scope.fetchAllFarms();
    $scope.loggedIn = true;
  }

  // TODO: validation

  /*
   * Farms
   */
  $scope.myFarms = [];
  $scope.availableFarms = [];

  $scope.showError = function(reason, obj) {
    console.log(reason, obj);
  };

  $scope.fetchAllFarms = function() {
    var path = '/api/v1beta0/user/{envId}/farms/';
    path = path.replace('{envId}', $scope.apiSettings.envId);
    ScalrAPI.setSettings($scope.apiSettings);
    ScalrAPI.scroll(path, '', $scope.farmsFetched, $scope.fetchError);
  };

  $scope.fetchError = function(response) {
    $scope.showError("Error fetching the list of Farms, check your credentials", response);
  };

  $scope.farmsFetched = function(response) {
    $scope.myFarms.length = 0;
    $scope.availableFarms.length = 0;

    var farms = response.all_data;
    for (var i = 0; i < farms.length; i ++) {
      var farm = farms[i];
      try {
        farm.description = JSON.parse(farm.description);
        if ('createdBy' in farm.description && farm.description.createdBy == $scope.apiSettings.keyId) {
          $scope.myFarms.push(farm)
        } else if (farm.name.startsWith('[TEMPLATE]')) {
          farm.name = farm.name.replace('[TEMPLATE]', '').trim();
          $scope.availableFarms.push(farm);
        }
      } catch (e) {
        // non-interesting farm, pass
      }
    }
    console.log($scope.availableFarms);
    $scope.$apply();
  };

  $scope.cloneAndLaunch = function(farmId, newName) {
    var path = '/api/v1beta0/user/{envId}/farms/{farmId}/actions/clone/';
    path = path.replace('{envId}', $scope.apiSettings.envId);
    path = path.replace('{farmId}', farmId);
    ScalrAPI.setSettings($scope.apiSettings);
    ScalrAPI.create(path, {name: newName}, $scope.farmCloned, $scope.cloneError);
  }

  $scope.cloneError = function(response) {
    $scope.showError("Error cloning the Farm", response);
  };

  $scope.farmCloned = function(response) {
    //Start by updating the description
    var farmId = response.data.id;
    var description = JSON.parse(response.data.description);
    description.createdBy = $scope.apiSettings.keyId;
    description.createdOn = new Date().toISOString();
    var path = '/api/v1beta0/user/{envId}/farms/{farmId}/';
    path = path.replace('{envId}', $scope.apiSettings.envId);
    path = path.replace('{farmId}', farmId);
    ScalrAPI.setSettings($scope.apiSettings);
    ScalrAPI.edit(path, {'description': description}, $scope.farmUpdated, $scope.updateError);
  };

  $scope.updateError = function() {
    $scope.showError("Error updating the Farm's description", response);
  };

  $scope.farmUpdated = function(response) {
    // Final step, launch the farm.
    var farmId = response.data.id;
    var path = '/api/v1beta0/user/{envId}/farms/{farmId}/actions/launch/';
    path = path.replace('{envId}', $scope.apiSettings.envId);
    path = path.replace('{farmId}', farmId);
    ScalrAPI.setSettings($scope.apiSettings);
    ScalrAPI.create(path, {name: newName}, $scope.farmLaunched, $scope.launchError);
  }

  $scope.launchError = function(response) {
    $scope.showError("Error launching Farm", response);
  };

  $scope.farmLaunched = function(response) {
    console.log("Success!");
    $scope.fetchAllFarms();
  };

  /*
   * Farm details
   */
  $scope.updateFarmDetails = function(farm) {
    var path = '/api/v1beta0/user/{envId}/farms/{farmId}/servers/';
    path = path.replace('{envId}', $scope.apiSettings.envId);
    path = path.replace('{farmId}', farm.id);
    ScalrAPI.setSettings($scope.apiSettings);
    ScalrAPI.scroll(path, '', function(response) {
      $scope.serversFetched(response, farm);
    }, $scope.serverFetchError);
  };

  $scope.serverFetchError = function(response) {
    $scope.showError("Error getting the list of servers for this Farm", response);
  };

  $scope.serversFetched = function(response, farm) {
    var servers = reponse.data;
    farm.servers = servers;
  };


  /*
   * Initialisation
   */
  $scope.loggedIn = false;
  $scope.loadApiSettings();
}]);
