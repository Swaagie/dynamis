'use strict';

//
// Supported persistence layers.
//
exports.enabled = ['cradle', 'redis', 'memory'];

//
// List of stores per persistence layer.
//
exports.list = {
  cradle: 'couchdb',
  memory: 'memory',
  redis: 'redis'
};
