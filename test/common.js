'use strict';

var chai = require('chai')
  , sinon = require('sinon')
  , sinonChai = require('sinon-chai')
  , redis = require('redis')
  , Memcached = require('memcached')
  , cradle = require('cradle');

chai.config.includeStack = true;
chai.use(sinonChai);

//
// Expose Dynamis and layer helpers.
//
exports.Dynamis = require('../');

exports.persist = function (layer) {
  return require('../lib/' + layer);
};

exports.redis = function () {
  return redis.createClient();
};

exports.cradle = function () {
  return new cradle.Connection;
};

exports.memcache = function () {
  return new Memcached;
};

//
// Expose our assertations.
//
exports.expect = chai.expect;
exports.sinon = sinon;