/*
 * Copyright (c) 2015 Digital Bazaar, Inc. All rights reserved.
 */
 /* globals describe, before, after, it, should, beforeEach, afterEach */
 /* jshint node: true */

'use strict';

var _ = require('lodash');
var async = require('async');
var bedrock = require('bedrock');
var brIdentity = require('bedrock-identity');
var brNotifications = require('../lib/notifications');
var config = bedrock.config;
var uuid = require('node-uuid').v4;

describe('bedrock-notifications testing', function() {
  describe('notifications', function() {
    it('do a thing', function(done) {
      'test'.should.equal('test');
      done();
    });
  });
});
