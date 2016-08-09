/*
 * Copyright (c) 2015-2016 Digital Bazaar, Inc. All rights reserved.
 */

var pages = global.bedrock.pages || {};

pages['bedrock-notifications'] = {};
pages['bedrock-notifications'].notifications = require('./notifications');

module.exports = global.bedrock.pages = pages;
