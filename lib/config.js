/*
 * Copyright (c) 2015 Digital Bazaar, Inc. All rights reserved.
 */

var config = require('bedrock').config;
var path = require('path');

config['notifications'] = {};
config['notifications'].registeredServices = [];
config['notifications'].endpoints = {
  settings: '/push-settings'
};

config.views.vars['bedrock-notifications'] = {};
config.views.vars['bedrock-notifications'].registeredServices =
  config['notifications'].registeredServices;
config.views.vars['bedrock-notifications'].endpoints =
  config['notifications'].endpoints;
