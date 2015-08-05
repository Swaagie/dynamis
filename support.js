'use strict';

//
// Supported persistence layers.
//
exports.enabled = ['cradle', 'redis', 'memory', 'memcached'];

//
// List of stores per persistence layer.
//
exports.list = {
  memcached: 'memcached',
  cradle: 'couchdb',
  memory: 'memory',
  redis: 'redis'
};
