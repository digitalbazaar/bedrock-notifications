/*!
 * Copyright (c) 2015-2016 Digital Bazaar, Inc. All rights reserved.
 */
define([
  'angular',
  './notification-directive',
  './notification-service'
], function(angular, notificationDirective, notificationService) {

'use strict';

var module = angular.module('bedrock-notifications', []);

module.directive(notificationDirective);
module.service(notificationService);

return module.name;

});
