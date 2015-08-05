'use strict';

//
// Supported persistence layers.
//
exports.enabled = ['levelup', 'cradle', 'redis'];

//
// List of stores per persistence layer.
//
exports.list = {
  levelup: 'leveldb',
  cradle: 'couchdb',
  redis: 'redis'
};