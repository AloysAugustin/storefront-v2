var app = angular.module('ScalrStorefront', ['LocalStorageModule', 'angular.filter', 'ui.bootstrap']);

app.controller('StorefrontController', ["$scope", "$location", "$filter", "localStorageService",
  function ($scope, $location, $filter, localStorageService) {

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
  $scope.myFarms = [];
  $scope.availableFarmSets = [];

  $scope.showError = function(reason, obj) {
    console.log(reason, obj);
  };

  $scope.fetchAllFarms = function() {
    $scope.myFarms = [];
    $scope.availableFarmSets = [];
    $scope.$apply();
    var path = '/api/v1beta0/user/{envId}/farms/';
    path = path.replace('{envId}', $scope.apiSettings.envId);
    ScalrAPI.setSettings($scope.apiSettings);
    ScalrAPI.scroll(path, '', $scope.farmsFetched, $scope.fetchError);
  };

  $scope.fetchError = function(response) {
    $scope.showError("Error fetching the list of Farms, check your credentials", response);
  };

  $scope.getFarmSettings = function(farm) {
    //Get Global variables and Farm Roles' global variables
    // Disabled bc too many farms
    return;
    $scope.addFarmGVOptions(farm);
    $scope.addFarmRoleOptions(farm);
  };

  $scope.addFarmGVOptions = function(farm) {
    var path = '/api/v1beta0/user/{envId}/farms/{farmId}/global-variables/';
    path = path.replace('{envId}', $scope.apiSettings.envId);
    path = path.replace('{farmId}', farm.id);
    ScalrAPI.setSettings($scope.apiSettings);
    ScalrAPI.scroll(path, '', $scope.farmGVFetched(farm), $scope.farmGVFetchError(farm));
  };

  $scope.farmGVFetched = function(farm) {
     return function(response) {
        var gv = response.data;
        for (var i = 0; i < gv.length; i++) {
            if (gv[i].name == "STOREFRONT_CONFIGURABLE_GV") {
                try {
                  options_list = JSON.parse(gv[i].value);
                } catch(e) {
                  options_list = [];
                }
                if (options_list.length > 0) {
                  farm.has_advanced = true;
                }
                farm.gv_options = {};
                for (var j = 0; j < options_list.length; j ++) {
                  farm.gv_options[options_list[j]] = {'name': options_list[j], 'value': ''};
                }
            }
        }
     };
  };

  $scope.farmGVFetchError = function(farm) {
    return function(response) {
      $scope.showError("Error fetching GVs", {'response': response, 'farm': farm})
    };
  };

  $scope.addFarmRoleOptions = function(farm) {
    var path = '/api/v1beta0/user/{envId}/farms/{farmId}/farm-roles/';
    path = path.replace('{envId}', $scope.apiSettings.envId);
    path = path.replace('{farmId}', farm.id);
    ScalrAPI.setSettings($scope.apiSettings);
    ScalrAPI.scroll(path, '', $scope.farmRolesFetched(farm), $scope.farmRoleFetchError(farm));
  };

  $scope.farmRoleFetchError = function(farm) {
    return function(response) {
      $scope.showError("Error fetching Farm Roles", {'response': response, 'farm': farm})
    };
  };

  $scope.farmRolesFetched = function(farm) {
    return function(response) {
      farm.farmRoles = response.data;
      for (var i = 0; i < farm.farmRoles.length; i ++) {
        $scope.fetchFarmRoleGVOptions(farm, farm.farmRoles[i]);
      }
    };
  };

  $scope.fetchFarmRoleGVOptions = function(farm, farmRole) {
    var path = '/api/v1beta0/user/{envId}/farm-roles/{farmRoleId}/global-variables/';
    path = path.replace('{envId}', $scope.apiSettings.envId);
    path = path.replace('{farmRoleId}', farmRole.id);
    ScalrAPI.setSettings($scope.apiSettings);
    ScalrAPI.scroll(path, '', $scope.farmRoleGVFetched(farm, farmRole), $scope.farmRoleGVFetchError(farmRole));
  };

  $scope.farmRoleGVFetchError = function(farmRole) {
    return function(response) {
      $scope.showError("Error fetching GV for Farm Role", {'farmRole': farmRole, 'response': response});
    };
  };

  $scope.farmRoleGVFetched = function(farm, farmRole) {
    return function(response) {
      farmRole.gv = response.data;
      for (var i = 0; i < farmRole.gv.length; i ++) {
        if (farmRole.gv[i].name == 'STOREFRONT_SCALING_ENABLED') {
          farm.has_advanced = true;
          try {
            farmRole.sf_scaling = JSON.parse(farmRole.gv[i].value);
          } catch(e) {
            farmRole.sf_scaling = {'min': 1, 'max': 3, 'value': 1}
          }
          if (! 'min' in farmRole.sf_scaling) {
            farmRole.sf_scaling['min'] = 1;
          }
          if (! 'max' in farmRole.sf_scaling) {
            farmRole.sf_scaling['max'] = 3; //arbitrary
          }
          if (! 'value' in farmRole.sf_scaling) {
            farmRole.sf_scaling['value'] = 1;
          }
        }
      };
    };
  };

  $scope.hasScaling = function(farmRole) {
    return 'sf_scaling' in farmRole;
  };

  $scope.addFarmToSets = function(farm) {
    var id = farm.id.toString();

    var info = farm.name.substring(1, farm.name.indexOf(']')).split(',');
    farm.perf_level = info[0];
    farm.availability = info[1];
    farm.duration = info[2];

    var perf_level = farm.perf_level;
    var availability = farm.availability;
    var duration = farm.duration;
    var id = farm.id;

    farm.name = farm.name.substring(farm.name.indexOf(']')+1, farm.name.length);
    farm.new_name = farm.name;
    farm.show_advanced = false;
    farm.has_advanced = false;

    for (var i = 0; i < $scope.availableFarmSets.length; i ++) {
      if ($scope.availableFarmSets[i].name == farm.name) {
        
        // Add to this set and return
        if (perf_level in $scope.availableFarmSets[i].farms) {
          if (availability in $scope.availableFarmSets[i].farms[perf_level]) {
            $scope.availableFarmSets[i].farms[perf_level][availability][duration] = farm;
          } else {
            $scope.availableFarmSets[i].farms[perf_level][availability] = {
              [duration]: farm
            }
          }
        } else {
          $scope.availableFarmSets[i].farms[perf_level] = {
            [availability]: {
              [duration]: farm
            }
          };
        }
        $scope.$apply();
        // Get settings in the background
        $scope.getFarmSettings(farm);
        return;
      }
    }
    var farms = {
      [perf_level]: {
        [availability]: {
          [duration]: farm
        }
      }
    };
    $scope.availableFarmSets.push({
      'name': farm.name,
      'logo': farm.description.logo,
      'description': farm.description.description,
      'selected_perf': perf_level,
      'selected_availability': availability,
      'selected_duration': duration,
      'internet_access': false,
      'show_launch': false,
      'launching': false,
      'farms': farms,
      'day_only': '1'
    });
    $scope.$apply();
    // Get settings in the background
    $scope.getFarmSettings(farm);
  };

  $scope.farmsFetched = function(response) {
    var farms = response.all_data;
    for (var i = 0; i < farms.length; i ++) {
      var farm = farms[i];
      try {
        farm.description = JSON.parse(farm.description);
        if (farm.name.startsWith('['+$scope.apiSettings.keyId+']')) {
          farm.name = farm.name.replace('['+$scope.apiSettings.keyId+']', '');
          if (farm.name.startsWith('[PENDING_APPROVAL]')) {
            farm.name = farm.name.replace('[PENDING_APPROVAL]', '');
            farm.pending_approval = true;
          } else {
            farm.pending_approval = false;
          }
          farm.name = farm.name.substring(farm.name.indexOf(']')+1, farm.name.length);
          farm.showDetails = false;
          farm.working = false;
          farm.terminating_servers_count = 0;
          $scope.myFarms.push(farm);
          $scope.updateFarmDetails(farm);
        } else if (farm.name.startsWith('[TEMPLATE]')) {
          farm.name = farm.name.replace('[TEMPLATE]', '').trim();
          $scope.addFarmToSets(farm);
        }
      } catch (e) {
        // non-interesting farm, pass
        console.log("Skipped farm: ", farm, e);
      }
    }
    $scope.$apply();
    // Show my farms
    $('#tab-control a[href="#my_farms"]').tab("show");
  };

  $scope.cloneAndLaunch = function(farm, with_approval) {
    farmId = farm.id;
    if (with_approval) {
      var newName = '[' + $scope.apiSettings.keyId + '][PENDING_APPROVAL][' + farm.availability + ',' + farm.duration + ']' + farm.new_name;
    } else {
      var newName = '[' + $scope.apiSettings.keyId + '][' + farm.availability + ',' + farm.duration + ']' + farm.new_name;
    }
    var path = '/api/v1beta0/user/{envId}/farms/{farmId}/actions/clone/';
    path = path.replace('{envId}', $scope.apiSettings.envId);
    path = path.replace('{farmId}', farmId);
    ScalrAPI.setSettings($scope.apiSettings);
    ScalrAPI.create(path, {name: newName}, $scope.farmCloned(farm, with_approval), $scope.cloneError);
  }

  $scope.cloneError = function(response) {
    $scope.showError("Error cloning the Farm", response);
  };

  $scope.farmCloned = function(farm, with_approval) {
    return function(response) {
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
      console.log('Farm cloned, getting new farm roles');
      var newFarm = response.data;
      $scope.getNewFarmRoles(farm, newFarm, with_approval);
    }
  };

  $scope.getNewFarmRoles = function(farm, newFarm, with_approval) {
    var path = '/api/v1beta0/user/{envId}/farms/{farmId}/farm-roles/';
    path = path.replace('{envId}', $scope.apiSettings.envId);
    path = path.replace('{farmId}', newFarm.id);
    ScalrAPI.scroll(path, '', $scope.configureFarm(farm, newFarm, with_approval), $scope.getNewFarmRolesError);
  };

  $scope.getNewFarmRolesError = function(response) {
    $scope.showError('Unable to get new farm roles', response);
  };

  $scope.configureFarm = function(farm, newFarm, with_approval) {
    return function(response) {
      // Set GVs and scaling rules
      var newFarmRoles = response.data;
      var deferreds = [];
      if ('farmRoles' in farm) {
        for (var i = 0; i < farm.farmRoles.length; i ++) {
          if ($scope.hasScaling(farm.farmRoles[i])) {
            // Find new corresponding farm role
            for (var j = 0; j < newFarmRoles.length; j ++) {
              if (newFarmRoles[j].name == farm.farmRoles[i].name) {
                deferreds.push($scope.setFarmRoleScaling(farm.farmRoles[i], newFarmRoles[j]));
                break;
              }
            }
          }
        }
      }
      if ('gv_options' in farm) {
        for (var name in farm.gv_options) {
          if (farm.gv_options[name].value) {
            deferreds.push($scope.setFarmGV(newFarm.id, name, farm.gv_options[name].value));
          }
        }
      }
      $.when.apply(null, deferreds).done(function() {
        console.log('config done, launching', with_approval);
        if (with_approval) {
          $scope.sendApprovalEmail(farm, newFarm);
          //$scope.fetchAllFarms();
          window.location.reload()
          console.log('Done. Approval pending.')
        } else {
          $scope.farmUpdated(newFarm.id);
        }
      });
    }
  };

  $scope.setFarmGV = function(newId, name, value) {
    console.log('Setting gv', name, value);
    var path = '/api/v1beta0/user/{envId}/farms/{farmId}/global-variables/{globalVariableName}/';
    path = path.replace('{envId}', $scope.apiSettings.envId);
    path = path.replace('{farmId}', newId);
    path = path.replace('{globalVariableName}', name);
    return ScalrAPI.edit(path, {'value': value}, function(){return true;}, $scope.setFarmGVError(newId, name, value));
  };

  $scope.setFarmGVError = function(farm, name, value) {
    return function(response) {
      $scope.showError("Error setting GV for farm", {'id': farm, 'name': name, 'value': value, 'response': response});
    }
  }

  $scope.setFarmRoleScaling = function(oldFarmRole, newFarmRole) {
    console.log('setting scaling for', newFarmRole);
    var path = '/api/v1beta0/user/{envId}/farm-roles/{farmRoleId}/scaling/';
    path = path.replace('{envId}', $scope.apiSettings.envId);
    path = path.replace('{farmRoleId}', newFarmRole.id);
    return ScalrAPI.edit(path, {
      'enabled': true,
      'maxInstances': oldFarmRole.sf_scaling.value,
      'minInstances': oldFarmRole.sf_scaling.value
    }, function() {return true;}, $scope.setFarmRoleScalingError(newFarmRole));
  };

  $scope.setFarmRoleScalingError = function(farmRole) {
    return function(response) {
      $scope.showError("Error setting scaling for Farm Role", {'farmRole': farmRole, 'response': response});
    };
  };

  $scope.updateError = function(response) {
    $scope.showError("Error updating the Farm's description", response);
  };

  $scope.farmUpdated = function(id) {
    // Final step, launch the farm.
    var path = '/api/v1beta0/user/{envId}/farms/{farmId}/actions/launch/';
    path = path.replace('{envId}', $scope.apiSettings.envId);
    path = path.replace('{farmId}', id);
    ScalrAPI.create(path, '', $scope.farmLaunched, $scope.launchError);
  }

  $scope.launchError = function(response) {
    $scope.showError("Error launching Farm", response);
  };

  $scope.farmLaunched = function(response) {
    console.log("Success!");
    //$scope.fetchAllFarms();
    window.location.reload()
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
    farm.servers = [];
    farm.terminating_servers_count = 0;
    for (var i = 0; i < servers.length; i ++) {
      if (servers[i].status != 'terminated' && servers[i].status != 'pending_terminate') {
        farm.servers.push(servers[i]);
      } else {
        farm.terminating_servers_count ++;
      }
    }
    $scope.$apply();
  };

  $scope.toggleDetails = function(farm) {
    farm.showDetails = ! farm.showDetails;
  };

  $scope.startFarm = function(farm) {
    $scope.farmUpdated({data: farm});
  };

  $scope.stopFarm = function(farm) {
    var path = '/api/v1beta0/user/{envId}/farms/{farmId}/actions/terminate/';
    path = path.replace('{envId}', $scope.apiSettings.envId);
    path = path.replace('{farmId}', farm.id);
    ScalrAPI.create(path, '', function() {window.location.reload();}, $scope.stopError);
  };

  $scope.stopError = function(response) {
    $scope.showError('Error stopping farm', response);
  };

  $scope.deleteFarm = function(farm) {
    farm.working = true;
    $scope.$apply();
    var path = '/api/v1beta0/user/{envId}/farms/{farmId}/';
    path = path.replace('{envId}', $scope.apiSettings.envId);
    path = path.replace('{farmId}', farm.id);
    ScalrAPI.delete(path, function() {window.location.reload();}, $scope.deleteError);
  };

  $scope.deleteError = function(response) {
    $scope.showError('Error deleting farm', response);
  };

  // Approval mechanism
  $scope.isApprovalRequired = function(farmSet) {
    return farmSet.selected_perf == 'High' || farmSet.selected_duration == 'Forever' || farmSet.selected_availability == '24/7' || farmSet.internet_access;
  };

  $scope.requestApproval = function(farmSet, farm) {
    farm.internet_access_required = farmSet.internet_access;
    $scope.cloneAndLaunch(farm, true);
  };

  $scope.sendApprovalEmail = function(template, newFarm) {
    console.log('sending email');
    var internet_access = template.internet_access_required ? true : false;
    $.post('http://disney-portal.demo.scalr.com:5000/send/', JSON.stringify({
      user: $scope.apiSettings.keyId,
      farmId: newFarm.id,
      url: $scope.apiSettings.apiUrl,
      env: $scope.apiSettings.envId,
      appName: template.name,
      perf: template.perf_level,
      avail: template.availability,
      duration: template.duration,
      internet: internet_access
    }), function() {
      console.log('email sent');
    }, function() {
      console.log('email failed');
    })
  };

  /*
   * Initialisation
   */
  $scope.loggedIn = false;
  $scope.autoLoggedIn = false;
  $scope.credentialsSaved = false;
  $scope.loadApiSettings();

  /*
   * Front
   */
  $scope.shouldHideFarmSet = function(this_hidden) {
    if (!this_hidden) return '';
    for (var i = 0; i < $scope.availableFarmSets.length; i ++) {
      if ($scope.availableFarmSets[i].show_launch) return 'hide';
    }
    return '';
  };

  $scope.shouldHideRunning = function(this_hidden) {
    if (!this_hidden) return '';
    for (var i = 0; i < $scope.myFarms.length; i ++) {
      if ($scope.myFarms[i].showDetails) return 'hide';
    }
    return '';
  };

  $scope.resetCatalog = function() {
    for (var i = 0; i < $scope.availableFarmSets.length; i ++) {
      $scope.availableFarmSets[i].show_launch = false;
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
    if (v == 'Medium') return 2;
    if (v == 'High') return 3;
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
