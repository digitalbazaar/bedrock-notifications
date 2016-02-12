/*
 * Bedrock notifications module.
 *
 * This module exposes an API for sending, recieving
 * and querying a database of notifications.
 *
 * Copyright (c) 2015 Digital Bazaar, Inc. All rights reserved.
 */
 /* jshint node: true */

'use strict';

var _ = require('lodash');
var async = require('async');
var bedrock = require('bedrock');
var BedrockError = bedrock.util.BedrockError;
var brPassport = require('bedrock-passport');
var brPermission = require('bedrock-permission');
var ensureAuthenticated = brPassport.ensureAuthenticated;
var config = bedrock.config;
var rest = require('bedrock-rest');
var uuid = require('node-uuid').v4;
var database = require('bedrock-mongodb');
var scheduler = require('bedrock-jobs');

var brMessages = require('bedrock-messages');

var userSettings = null;
var defaultUserSettings = {};
var registeredModules = [];

require('./config');

var PERMISSIONS = config.permission.permissions;

// Tried pushing the job only in api.register(), but it seems
// like we can't do that (Job will never get run when pushed in register).
bedrock.config.scheduler.jobs.push({
  id: 'notifications.jobs.immediate',
  type: 'notifications.jobs.immediate',
  schedule: 'R/PT1M'
});
bedrock.config.scheduler.jobs.push({
  id: 'notifications.jobs.daily',
  type: 'notifications.jobs.daily',
  schedule: 'R/P1D'
});

// configure for tests
bedrock.events.on('bedrock.test.configure', function() {
  require('./test.config');
});

var logger = bedrock.loggers.get('app');

var api = {};
module.exports = api;

api.getId = function(actor, id, callback) {
  async.auto({
    checkPermissions: function(callback) {
      brPermission.checkPermission(
        actor, PERMISSIONS.MESSAGE_ACCESS, {resource: id}, callback);
    },
    find: ['checkPermissions', function(callback) {
      var q = {
        id: database.hash(id)
      };
      var u = {
        $setOnInsert: {
          id: database.hash(id),
          value: defaultUserSettings
        }
      };
      var o = _.extend({}, database.writeOptions, {new: true, upsert: true});
      userSettings.findAndModify(q, [], u, o, function(err, results) {
        if(results.value) {
          return callback(null, results.value.value);
        }
        callback(err, {});
      });
    }]
  }, function(err, results) {
    callback(err, results.find);
  });
};

bedrock.events.on('bedrock.init', function(callback) {
  // Define immediate and daily jobs
  scheduler.define('notifications.jobs.immediate', function(job, callback) {
    console.log('$$$Running immediate job');
    async.forEachOf(registeredModules, function(module, key, callback) {
      var options = module.getOptions();
      var processOptions = {
        method: options.type,
        interval: 'immediate'
      };
      module.process(processOptions, function(err, results) {
        // FIXME: What to do in case of error?
        return callback(err);
      });
    }, function(err) {
      // Handle error
    });
  });
  // Define daily job
  scheduler.define('notifications.jobs.daily', function(job, callback) {
    // TODO: Haven't actually tested that this gets fired once daily,
    // how can we do that?
    async.forEachOf(registeredModules, function(module, key, callback) {
      var options = module.getOptions();
      var processOptions = {
        method: options.type,
        interval: 'daily'
      };
      module.process(processOptions, function(err, results) {
        // FIXME: What to do in case of error?
        return callback(err);
      });
    }, function(err) {
      // Handle error
    });
  });

  logger.debug('Creating notification settings collection.');
  async.auto({
    openCollections: function(callback) {
      database.openCollections(['notificationPushUserSettings'
      ], function(err) {
        if(!err) {
          userSettings = database.collections.notificationPushUserSettings;
        }
        callback(err);
      });
    },
    createIndexes: ['openCollections', function(callback) {
      database.createIndexes([{
        collection: 'notificationPushUserSettings',
        fields: {id: 1},
        options: {unique: true, background: false}
      }], callback);
    }]
  }, function(err) {
    callback(err);
  });
});

bedrock.events.on('bedrock.ready', function(callback) {
  var brMessagesPush = require('bedrock-messages-push');
  bedrock.events.on('bedrock-messages.NewMessage', function(message) {
    brMessagesPush.queue.add(message, function(err) {
      if(err) {
        // TODO: Handle error state, can we recover from a failed add?
        console.log('Error pushing message onto notification queue', err);
      }
    });
  });
  callback();
});

// add routes
bedrock.events.on('bedrock-express.configure.routes', function(app) {
  // FIXME: what is the permissions model for this?
  app.get(
    config.notifications.endpoints.settings + '/:id', rest.when.prefers.ld,
    ensureAuthenticated, function(req, res, next) {
      api.getId(req.user.identity, req.params.id, function(err, results) {
        if(err) {
          return next(err);
        }
        res.json(results);
      });
    });

  app.post(
    config.notifications.endpoints.settings + '/:id', rest.when.prefers.ld,
    ensureAuthenticated, function(req, res, next) {
      if(req.body.id !== req.params.id) {
        return next(new BedrockError(
          'User ID mismatch.', 'UserIdMismatch',
          {httpStatusCode: 409, 'public': true}));
      }
      updateSettings(req.user.identity, req.body, function(err, results) {
        if(err) {
          return next(err);
        }
        res.sendStatus(204);
      });
    });
});

// Lower level modules register themselves with this module to enable their
// notification processingW
api.register = function(module, callback) {
  var options = module.getOptions();
  config.notifications.registeredServices.push(options);

  registeredModules.push(module);

  // Populate default user settings for module
  if(options.defaultUserSettings) {
    defaultUserSettings[options.type] = options.defaultUserSettings;
  }

  callback(null, {test: 'test'});
};

// exposed for testing
api._updateSettings = function(actor, options, callback) {
  updateSettings(actor, options, callback);
};

// FIXME: does this module need its own set of permssions?
function updateSettings(actor, options, callback) {
  async.auto({
    checkPermissions: function(callback) {
      brPermission.checkPermission(
        actor, PERMISSIONS.MESSAGE_ACCESS, {resource: options.id}, callback);
    },
    updateSettings: ['checkPermissions', function(callback) {
      var q = {
        id: database.hash(options.id)
      };

      var set = {
        id: database.hash(options.id)
      };
      for(var type in options) {
        if(type === 'id') {
          continue;
        }
        set['value.' + type] = options[type];
      }
      var u = {
        $set: set
      };
      userSettings.update(q, u, {upsert: true}, callback);
    }]
  }, function(err, results) {
    callback(err, results.updateSettings);
  });
}