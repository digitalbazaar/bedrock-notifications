/*!
 * Copyright (c) 2016 Digital Bazaar, Inc. All rights reserved.
 */
define([
  'angular',
  './notification-directive',
  './notification-service'
], function(angular, notificationDirective, notificationService) {

'use strict';

console.log("%%%%%%%%%%%%%%%%%%BEDROCK-NOTIFICATIONS-ANGULAR%%%%%%%%%%%%%%%%%%%%%%%%%5")

var module = angular.module('bedrock-notifications', []);

module.directive(notificationDirective);
module.service(notificationService);

return module.name;

});
