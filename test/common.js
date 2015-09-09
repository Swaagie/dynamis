'use strict';

var chai = require('chai')
  , sinon = require('sinon')
  , sinonChai = require('sinon-chai');

chai.use(sinonChai);

//
// Expose Dynamis and layer helpers.
//
exports.Dynamis = require('../');

exports.persist = function (layer) {
  return require('../lib/' + layer);
};

exports.redis = function () {
  return require('redis').createClient();
};

exports.levelup = function () {
  return require('levelup')('/tmp/test');
};

exports.cradle = function () {
  return new require('cradle').Connection;
};

exports.memcache = function () {
  return new (require('memcached'));
};

//
// Expose our assertations.
//
exports.expect = chai.expect;
exports.sinon = sinon;