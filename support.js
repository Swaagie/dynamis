'use strict';

//
// Supported persistence layers.
//
exports.enabled = ['cradle', 'redis', 'memory', 'memcached', 'levelup'];

//
// List of stores per persistence layer.
//
exports.list = {
  memcached: 'memcached',
  levelup: 'leveldb',
  cradle: 'couchdb',
  memory: 'memory',
  redis: 'redis'
};
