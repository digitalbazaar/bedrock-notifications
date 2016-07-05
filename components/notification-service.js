/*!
 * Copyright (c) 2015-2016 Digital Bazaar, Inc. All rights reserved.
 */
define([], function() {

'use strict';

/* @ngInject */
function factory($http, config) {
  var service = {};
  var settingsEndpoint =
    config.data['bedrock-notifications'].endpoints.settings;

  service.get = function(id) {
    return Promise.resolve(
      $http({method: 'GET', url: settingsEndpoint + '/' + encodeURIComponent(id)}));
  };

  service.update = function(options) {
    return Promise.resolve(
      $http({
        method: 'POST',
        url: settingsEndpoint + '/' + encodeURIComponent(options.id),
        data: options
      }));
  };

  return service;

}

return {brNotificationService: factory};

});
