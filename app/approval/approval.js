var app = angular.module('ScalrStorefront', ['LocalStorageModule', 'angular.filter', 'ui.bootstrap']);

app.controller('StorefrontController', ["$scope", "$location", "$filter", "localStorageService",
  function ($scope, $location, $filter, localStorageService) {

  /*
   * Credentials management
   */
  $scope.defaultApiSettings = {
    apiUrl: "",
    keyId: "",
    secretKey: "",
    envId: ""
  };

  $scope.apiSettings = {};

  $scope.loadApiSettings = function () {
    var storedApiSettings = angular.fromJson(localStorageService.get('apiSettings'));
    if (storedApiSettings === null) {
      $scope.apiSettings = $scope.defaultApiSettings;
    } else {
      $scope.apiSettings = storedApiSettings;
    }
  };

  $scope.accept = function() {
    // Fetch the Farm, then edit it
    var path = '/api/v1beta0/user/{envId}/farms/{farmId}/';
    path = path.replace('{envId}', $scope.apiSettings.envId);
    path = path.replace('{farmId}', $scope.farmId);
    ScalrAPI.setSettings($scope.apiSettings);
    ScalrAPI.fetch(path, '', $scope.farmFetched, function(response) {
      alert('Request not found');
    });
  };

  $scope.farmFetched = function(response) {
    var farm = response.data;
    var edit_body = {};
    edit_body.name = farm.name.replace('[PENDING_APPROVAL]', '');
    edit_body.project = farm.project;

    var path = '/api/v1beta0/user/{envId}/farms/{farmId}/';
    path = path.replace('{envId}', $scope.apiSettings.envId);
    path = path.replace('{farmId}', $scope.farmId);
    ScalrAPI.setSettings($scope.apiSettings);
    ScalrAPI.edit(path, edit_body, $scope.launchFarm, function(response) {
      alert('Renaming failed');
    });
  };

  $scope.launchFarm = function(response) {
    var path = '/api/v1beta0/user/{envId}/farms/{farmId}/actions/launch/';
    path = path.replace('{envId}', $scope.apiSettings.envId);
    path = path.replace('{farmId}', $scope.farmId);
    ScalrAPI.setSettings($scope.apiSettings);
    ScalrAPI.create(path, {}, function(response) {
      console.log("All set");
      $scope.done = true;
      $scope.$apply();
    }, function(response) {
      alert('Launching failed');
    });
  };

  $scope.reject = function() {
    // Delete the Farm
    var path = '/api/v1beta0/user/{envId}/farms/{farmId}/';
    path = path.replace('{envId}', $scope.apiSettings.envId);
    path = path.replace('{farmId}', $scope.farmId);
    ScalrAPI.setSettings($scope.apiSettings);
    ScalrAPI.delete(path, function(response) {
      console.log('Deletion successful');
      $scope.done = true;
      $scope.$apply();
    },function(response) {
      alert('Deletion failed');
    });
  };

  $scope.loadApiSettings();

  var args = $location.search();

  $scope.user = args['u'];
  $scope.appName = args['t'];
  var params = JSON.parse(args['p']);
  $scope.params = JSON.stringify(params, null, 2);
  $scope.farmId = args['f'];
  $scope.done = false;
  $scope.apiSettings.apiUrl = args['s'];
  $scope.apiSettings.envId = args['e'];
  console.log($scope.apiSettings, args);
}]);