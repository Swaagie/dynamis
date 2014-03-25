'use strict';

//
// Supported persistence layers.
//
exports.enabled = ['cradle', 'redis'];

//
// List of stores per persistence layer.
//
exports.list = {
  cradle: 'couchdb',
  redis: 'redis'
};