/*!
 * Copyright (c) 2016 Digital Bazaar, Inc. All rights reserved.
 */
define([], function() {

'use strict';

/* @ngInject */
function factory(brNotificationService, config) {
  return {
    restrict: 'E',
    scope: {
      userId: '=brUserId'
    },
    templateUrl: requirejs.toUrl(
      'bedrock-notifications/components/notification-directive.html'),
    link: Link
  };

  function Link(scope) {
    var model = scope.model = {};
    model.loading = true;
    model.registeredOptions =
      config.data['bedrock-notifications'].registeredServices;
    var defaultSettings = {};
    for(var key in model.registeredOptions) {
      var option = model.registeredOptions[key];
      defaultSettings[option.type] = {
        enable: false,
        interval: option.intervals[0].value
      };
    }
    model.settings = defaultSettings;
    var storedSettings = {};

    brNotificationService.get(scope.userId)
      .then(function(result) {
        storedSettings = result.data;
        // required so that angular extend does not link model.storedSettings
        // with model.settings
        var stored = angular.copy(storedSettings);
        var def = angular.copy(defaultSettings);
        angular.extend(model.settings, def, stored);
        model.loading = false;
        scope.$apply();
      });

    model.update = function() {
      model.loading = true;
      var options = {
        id: scope.userId
      };
      for(var type in model.settings) {
        if(type === 'id') {
          continue;
        }
        var value = model.settings[type];
        options[type] = value;
      }
      brNotificationService.update(options)
        .then(function(result) {
          model.loading = false;
          storedSettings = angular.copy(model.settings);
          scope.$apply();
        });
    };

    model.cancel = function() {
      // stored settings might be an empty object
      var stored = angular.copy(storedSettings);
      var def = angular.copy(defaultSettings);
      angular.extend(model.settings, def, stored);
    };
  }
}

return {brPushNotification: factory};

});
