/*
 * Copyright (c) 2015-2016 Digital Bazaar, Inc. All rights reserved.
 */

var config = require('bedrock').config;

config.notifications = {};
config.notifications.registeredServices = [];
config.notifications.endpoints = {
  settings: '/push-settings'
};

// Default # of workers, can override
config.notifications.numWorkers = -1;

config.views.vars['bedrock-notifications'] = {};
config.views.vars['bedrock-notifications'].registeredServices =
  config.notifications.registeredServices;
config.views.vars['bedrock-notifications'].endpoints =
  config.notifications.endpoints;
config.views.vars['bedrock-notifications'].numWorkers =
  config.notifications.numWorkers;
