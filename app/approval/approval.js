var app = angular.module('ScalrStorefront', ['LocalStorageModule', 'angular.filter', 'ui.bootstrap', 'ngRoute','ngStorage', 'afOAuth2']);

app.controller('StorefrontController', ["settings", "$http", "$scope", "$location", "$filter", "localStorageService",
  function (globalSettings, $http, $scope, $location, $filter, localStorageService) {

  ScalrAPI.setHTTPService($http);
  $scope.apiSettings = {};
  $scope.config = globalSettings;
  $scope.loggedIn = false;
  /*
   * Handlers for oAuth events
   */
   $scope.$on('oauth2:authExpired', function () {
    console.log("Expired!");
    $scope.loggedIn = false;
   });

   $scope.$on('oauth2:authSuccess', function () {
    $scope.loggedIn = true;
   });
  $scope.accept = function() {
    // If it is a termination request, just do it
    var path;
    if ($scope.jParams.action == 'stop'){
      path = '/api/v1beta0/user/{envId}/farms/{farmId}/actions/terminate/';
      path = path.replace('{envId}', $scope.apiSettings.envId);
      path = path.replace('{farmId}', $scope.farmId);
      ScalrAPI.setSettings($scope.apiSettings);
      ScalrAPI.create(path, '',function(response){
        $scope.done = true;
      },
      function(response){
        alert('Termination failed');
      });
      return;
    }

    // Fetch the Farm, then edit it
    path = '/api/v1beta0/user/{envId}/farms/{farmId}/';
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
    }, function(response) {
      alert('Launching failed');
    });
  };

  $scope.reject = function() {
    // Delete the Farm if it is a launch request
    if ($scope.jParams.action != 'launch'){
      $scope.done = true;
      return;
    }
    var path = '/api/v1beta0/user/{envId}/farms/{farmId}/';
    path = path.replace('{envId}', $scope.apiSettings.envId);
    path = path.replace('{farmId}', $scope.farmId);
    ScalrAPI.setSettings($scope.apiSettings);
    ScalrAPI.delete(path, function(response) {
      console.log('Deletion successful');
      $scope.done = true;
    },function(response) {
      alert('Deletion failed');
    });
  };

  var base64UrlEncode = function(str){
    return encodeURIComponent(window.btoa(str))
  };

  var base64UrlDecode = function(str){
    return window.atob(decodeURIComponent(decodeURIComponent(str)));
  };

  var args = $location.search();
  console.log(args);
  if ( ('u' in args) ){
    console.log('state not found');
    $scope.requestData = base64UrlEncode(JSON.stringify(args));
  }
  else {
    var re = new RegExp("&*state=([^&]+)");
    stateString = re.exec(window.location.hash)[1];
    args = JSON.parse(base64UrlDecode(stateString));
    $scope.requestData = base64UrlEncode(JSON.stringify(args));
  }

  $scope.user = args['u'];
  $scope.appName = args['t'];
  var params = JSON.parse(args['p']);
  $scope.jParams = params;
  $scope.params = JSON.stringify(params, null, 2);
  $scope.farmId = args['f'];
  $scope.done = false;
  $scope.apiSettings.apiUrl = args['s'];
  $scope.apiSettings.envId = args['e'];
  console.log($scope.apiSettings, args);
}]);