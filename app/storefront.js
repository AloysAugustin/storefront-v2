var app = angular.module('ScalrStorefront', ['LocalStorageModule', 'angular.filter', 'ui.bootstrap']);

app.controller('StorefrontController', ["$scope", "$location", "$filter", "localStorageService", 
  function ($scope, $location, $filter, localStorageService) {
  $scope.singleModel = 1;
  /* Docker */

  $scope.docker_apps = {
    "MySQL Server" : {
      id: "docker-1",
      name: "MySQL Server",
      description: {
        "logo": "https://www.mysql.fr/common/logos/logo-mysql-170x115.png",
        "description": "A MySQL server, running on Ubuntu 14.04",
        "dailyPrice": "0.55"
      }
    },
    "Wordpress" : {
      id: "docker-2",
      name: "Wordpress",
      description: {
        "logo": "https://s.w.org/about/images/logos/wordpress-logo-stacked-rgb.png",
        "description": "A fully configured Wordpress installation. Default credentials: user / no password.",
        "dailyPrice": "0.86"
      }
    }
  };

  $scope.fetchDockerApps = function() {
    path = 'http://54.157.59.2:5000/pg04LqaNfqqZJ+wR8P74WQeBJ71AsZu4SSf2sa7KSU/'+$scope.apiSettings.keyId+'//status';
    $.ajax({
      type: 'GET',
      url: path,
      success: $scope.onDockerFetchSuccess,
      error: $scope.onDockerError
    });
  };

  $scope.onDockerError = function(response) {
    $scope.showError('Error with docker call', response);
  };

  $scope.onDockerFetchSuccess = function(response) {
    response = JSON.parse(response);
    console.log(response);
    for (var app_name in response) {
      var newFarm = angular.copy($scope.docker_apps[app_name])
      newFarm.showDetails = false;
      newFarm.servers = [];
      for (var i = 0; i < response[app_name].length; i ++) {
        var container = response[app_name][i];
        var p = container['NetworkSettings']['Ports'];
        for (var a in p) {
          if (a.indexOf('tcp') > 0 && p[a] && p[a].length > 0) {
            var address = p[a][0].HostIp + ':' + p[a][0].HostPort;
            console.log(p[a][0], address);
            newFarm.servers.push({publicIp: [address]});
          }
        }
      }
      $scope.myFarms.push(newFarm);
      // TODO get URL
    }
    $scope.$apply();
  };

  $scope.createDockerApp = function(app_name) {
    path = 'http://54.157.59.2:5000/pg04LqaNfqqZJ+wR8P74WQeBJ71AsZu4SSf2sa7KSU/'+$scope.apiSettings.keyId+'/'+encodeURIComponent(app_name)+'/create';
    $.ajax({
      type: 'GET',
      url: path,
      success: $scope.onDockerCreateSuccess,
      error: $scope.onDockerError
    });
  };

  $scope.onDockerCreateSuccess = function(response) {
    console.log("Success creating docker app:", response);
    $scope.fetchAllFarms();
  };

  $scope.stopDockerApp = function(app_name) {
    path = 'http://54.157.59.2:5000/pg04LqaNfqqZJ+wR8P74WQeBJ71AsZu4SSf2sa7KSU/'+$scope.apiSettings.keyId+'/'+encodeURIComponent(app_name)+'/stop';
    $.ajax({
      type: 'GET',
      url: path,
      success: $scope.onDockerStopSuccess,
      error: $scope.onDockerError
    });
  };

  $scope.onDockerStopSuccess = function(response) {
    console.log("Success stopping docker app:", response);
    $scope.fetchAllFarms();
  };

  $scope.startDockerApp = function(app_name) {
    path = 'http://54.157.59.2:5000/pg04LqaNfqqZJ+wR8P74WQeBJ71AsZu4SSf2sa7KSU/'+$scope.apiSettings.keyId+'/'+encodeURIComponent(app_name)+'/start';
    $.ajax({
      type: 'GET',
      url: path,
      success: $scope.onDockerStartSuccess,
      error: $scope.onDockerError
    });
  };

  $scope.onDockerStartSuccess = function(response) {
    console.log("Success starting docker app:", response);
    $scope.fetchAllFarms();
  };

  $scope.deleteDockerApp = function(app_name) {
    path = 'http://54.157.59.2:5000/pg04LqaNfqqZJ+wR8P74WQeBJ71AsZu4SSf2sa7KSU/'+$scope.apiSettings.keyId+'/'+encodeURIComponent(app_name)+'/delete';
    $.ajax({
      type: 'GET',
      url: path,
      success: $scope.onDockerDeleteSuccess,
      error: $scope.onDockerError
    });
  };

  $scope.onDockerDeleteSuccess = function(response) {
    console.log("Success starting docker app:", response);
    $scope.fetchAllFarms();
  };


  /*
   * Credentials management
   */
  $scope.defaultApiSettings = {
    apiUrl: "https://my.scalr.com/",
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
  $scope.myFarms = [];
  $scope.availableFarmSets = [];

  $scope.showError = function(reason, obj) {
    console.log(reason, obj);
  };

  $scope.fetchAllFarms = function() {
    $scope.myFarms.length = 0;
    $scope.availableFarmSets.length = 0;
    var path = '/api/v1beta0/user/{envId}/farms/';
    path = path.replace('{envId}', $scope.apiSettings.envId);
    ScalrAPI.setSettings($scope.apiSettings);
    ScalrAPI.scroll(path, '', $scope.farmsFetched, $scope.fetchError);
    $scope.fetchDockerApps();
  };

  $scope.fetchError = function(response) {
    $scope.showError("Error fetching the list of Farms, check your credentials", response);
  };

  $scope.addFarmToSets = function(farm) {
    var id = farm.id.toString();

    if (id.startsWith('docker')) {
      farm.platform = 'Docker Swarm';
    } else {
      farm.platform = farm.name.substring(1, farm.name.indexOf(']'))
      farm.name = farm.name.substring(farm.name.indexOf(']')+1, farm.name.length);
    }
    farm.new_name = farm.name;

    for (var i = 0; i < $scope.availableFarmSets.length; i ++) {
      if ($scope.availableFarmSets[i].name == farm.name) {
        $scope.availableFarmSets[i].farms[id] = farm;
        return;
      }
    }
    var farms = {};
    farms[id] = farm;
    $scope.availableFarmSets.push({
      'name': farm.name,
      'logo': farm.description.logo,
      'description': farm.description.description,
      'selected': id,
      'show_launch': false,
      'farms': farms,
      'day_only': '1'
    });
  };

  $scope.farmsFetched = function(response) {
    var farms = response.all_data;
    for (var i = 0; i < farms.length; i ++) {
      var farm = farms[i];
      try {
        farm.description = JSON.parse(farm.description);
        if (farm.name.startsWith('['+$scope.apiSettings.keyId+']')) {
          farm.name = farm.name.replace('['+$scope.apiSettings.keyId+']', '');
          farm.showDetails = false;
          $scope.myFarms.push(farm);
          $scope.updateFarmDetails(farm);
        } else if (farm.name.startsWith('[TEMPLATE]')) {
          farm.name = farm.name.replace('[TEMPLATE]', '').trim();
          $scope.addFarmToSets(farm);
        }
      } catch (e) {
        // non-interesting farm, pass
        console.log("Skipped farm: ", farm);
      }
    }
    // Add docker apps to catalog
    for (i in $scope.docker_apps) {
      $scope.addFarmToSets($scope.docker_apps[i]);
    }
    $scope.$apply();
  };

  $scope.cloneAndLaunch = function(farm) {
    if (farm.id.toString().startsWith('docker')) {
      $scope.createDockerApp(farm.name);
      return;
    }
    farmId = farm.id;
    newName = '[' + $scope.apiSettings.keyId + ']' + farm.new_name;
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
    /*var farmId = response.data.id;
    var description = JSON.parse(response.data.description);
    description.createdBy = $scope.apiSettings.keyId;
    description.createdOn = new Date().toISOString();
    var path = '/api/v1beta0/user/{envId}/farms/{farmId}/';
    path = path.replace('{envId}', $scope.apiSettings.envId);
    path = path.replace('{farmId}', farmId);
    ScalrAPI.edit(path, {
      'description': JSON.stringify(description)
    }, $scope.farmUpdated, $scope.updateError);*/
    $scope.farmUpdated(response);
  };

  $scope.updateError = function(response) {
    $scope.showError("Error updating the Farm's description", response);
  };

  $scope.farmUpdated = function(response) {
    // Final step, launch the farm.
    var farmId = response.data.id;
    var path = '/api/v1beta0/user/{envId}/farms/{farmId}/actions/launch/';
    path = path.replace('{envId}', $scope.apiSettings.envId);
    path = path.replace('{farmId}', farmId);
    ScalrAPI.create(path, '', $scope.farmLaunched, $scope.launchError);
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
    var servers = response.data;
    farm.servers = servers;
    $scope.$apply();
  };

  $scope.toggleDetails = function(farm) {
    farm.showDetails = ! farm.showDetails;
  };

  $scope.startFarm = function(farm) {
    if (farm.id.toString().startsWith('docker')) {
      $scope.startDockerApp(farm.name);
      return;
    }
    $scope.farmUpdated({data: farm});
  };

  $scope.stopFarm = function(farm) {
    if (farm.id.toString().startsWith('docker')) {
      $scope.stopDockerApp(farm.name);
      return;
    }
    var path = '/api/v1beta0/user/{envId}/farms/{farmId}/actions/terminate/';
    path = path.replace('{envId}', $scope.apiSettings.envId);
    path = path.replace('{farmId}', farm.id);
    ScalrAPI.create(path, '', $scope.fetchAllFarms, $scope.stopError);
  };

  $scope.stopError = function(response) {
    $scope.showError('Error stopping farm', response);
  };

  $scope.deleteFarm = function(farm) {
    if (farm.id.toString().startsWith('docker')) {
      $scope.deleteDockerApp(farm.name);
      return;
    }
    var path = '/api/v1beta0/user/{envId}/farms/{farmId}/';
    path = path.replace('{envId}', $scope.apiSettings.envId);
    path = path.replace('{farmId}', farm.id);
    ScalrAPI.delete(path, $scope.fetchAllFarms, $scope.deleteError);
  };

  $scope.deleteError = function(response) {
    $scope.showError('Error deleting farm', response);
  };

  /*
   * Initialisation
   */
  $scope.loggedIn = false;
  $scope.autoLoggedIn = false;
  $scope.credentialsSaved = false;
  $scope.loadApiSettings();
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


