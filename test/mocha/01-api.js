/*
 * Copyright (c) 2015-2016 Digital Bazaar, Inc. All rights reserved.
 */
 /* globals describe, before, after, it, should, beforeEach, afterEach */
 /* jshint node: true */

'use strict';

var async = require('async');
var bedrock = require('bedrock');
var brIdentity = require('bedrock-identity');
var brMessages = require('bedrock-messages');
var brNotifications = require('bedrock-notifications');
var config = bedrock.config;
var database = require('bedrock-mongodb');
var helpers = require('../helpers');
var mockData = require('../mock.data');

var store = database.collections.messagesPush;
var userSettings = database.collections.notificationPushUserSettings;

describe('bedrock-notifications API', function() {
  before(function(done) {
    helpers.prepareDatabase(mockData, done);
  });
  after(function(done) {
    helpers.removeCollections(done);
  });
  describe('updateSettings function', function() {
    it('save a users notification settings', function(done) {
      var user = mockData.identities.rsa4096.identity.id;
      async.auto({
        getIdentity: function(callback) {
          brIdentity.get(null, user, callback);
        },
        act: ['getIdentity', function(callback, results) {
          var o = {
            id: user,
            email: {
              enable: true,
              interval: 'daily'
            }
          };
          brNotifications._updateSettings(
            results.getIdentity[0], o, callback);
        }],
        checkDatabase: ['act', function(callback, results) {
          userSettings.find({}).toArray(callback);
        }],
        test: ['checkDatabase', function(callback, results) {
          should.exist(results.checkDatabase);
          results.checkDatabase[0].should.be.an('object');
          var settings = results.checkDatabase[0];
          should.exist(settings.id);
          settings.id.should.be.a('string');
          settings.id.should.equal(database.hash(user));
          should.exist(settings.value);
          settings.value.should.be.an('object');
          should.exist(settings.value.email);
          settings.value.email.should.be.an('object');
          should.exist(settings.value.email.enable);
          settings.value.email.enable.should.be.true;
          should.exist(settings.value.email.interval);
          settings.value.email.interval.should.be.a('string');
          settings.value.email.interval.should.equal('daily');
          callback();
        }]
      }, done);
    });
    it('update a users notification settings', function(done) {
      var user = mockData.identities.rsa4096.identity.id;
      async.auto({
        getIdentity: function(callback) {
          brIdentity.get(null, user, callback);
        },
        first: ['getIdentity', function(callback, results) {
          // save initial settings
          var o = {
            id: user,
            email: {
              enable: true,
              interval: 'daily'
            }
          };
          brNotifications._updateSettings(results.getIdentity[0], o, callback);
        }],
        act: ['first', function(callback, results) {
          // update settings
          var o = {
            id: user,
            email: {
              enable: false,
              interval: 'immediate'
            }
          };
          brNotifications._updateSettings(results.getIdentity[0], o, callback);
        }],
        checkDatabase: ['act', function(callback, results) {
          userSettings.find({id: database.hash(user)}).toArray(callback);
        }],
        test: ['checkDatabase', function(callback, results) {
          should.exist(results.checkDatabase);
          results.checkDatabase[0].should.be.an('object');
          var settings = results.checkDatabase[0];
          should.exist(settings.id);
          settings.id.should.be.a('string');
          settings.id.should.equal(database.hash(user));
          should.exist(settings.value);
          settings.value.should.be.an('object');
          should.exist(settings.value.email);
          settings.value.email.should.be.an('object');
          should.exist(settings.value.email.enable);
          settings.value.email.enable.should.be.false;
          should.exist(settings.value.email.interval);
          settings.value.email.interval.should.be.a('string');
          settings.value.email.interval.should.equal('immediate');
          callback();
        }]
      }, done);
    });
    it('does not allow changing another user\'s settings', function(done) {
      var userAlpha = mockData.identities.rsa4096.identity.id;
      var userBeta = mockData.identities.rsa2048.identity.id;
      async.auto({
        getIdentityAlpha: function(callback) {
          brIdentity.get(null, userAlpha, callback);
        },
        getIdentityBeta: function(callback) {
          brIdentity.get(null, userBeta, callback);
        },
        setAlpha: ['getIdentityAlpha', function(callback, results) {
          var o = {
            id: userAlpha,
            email: {
              enable: true,
              interval: 'daily'
            }
          };
          brNotifications._updateSettings(
            results.getIdentityAlpha[0], o, callback);
        }],
        act: ['getIdentityBeta', 'setAlpha', function(callback, results) {
          // userBeta attempts to change userAlpha's settings
          var o = {
            id: userAlpha,
            email: {
              enable: false,
              interval: 'immediate'
            }
          };
          brNotifications._updateSettings(
            results.getIdentityBeta[0], o, function(err, results) {
              // should return permission denied error
              should.exist(err);
              err.should.be.an('object');
              err.name.should.be.a('string');
              err.name.should.equal('PermissionDenied');
              should.exist(err.details);
              err.details.should.be.an('object');
              err.details.sysPermission.should.be.a('string');
              err.details.sysPermission.should.equal('MESSAGE_ACCESS');
              callback();
            });
        }],
        checkDatabase: ['act', function(callback, results) {
          userSettings.find({id: database.hash(userAlpha)}).toArray(callback);
        }],
        test: ['checkDatabase', function(callback, results) {
          // ensure that the settings were not changed
          var settings = results.checkDatabase[0];
          settings.value.email.enable.should.be.true;
          settings.value.email.interval.should.equal('daily');
          callback();
        }]
      }, done);
    });
  }); // end updateSettings
});
