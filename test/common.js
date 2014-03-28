'use strict';

var chai = require('chai')
  , sinon = require('sinon')
  , sinonChai = require('sinon-chai')
  , redis = require('redis')
  , cradle = require('cradle');

chai.config.includeStack = true;
chai.use(sinonChai);

//
// Expose Cradle, Redis, Cradle instance.
//
exports.Dynamis = require('../');
exports.redis = redis.createClient();
exports.cradle = new cradle.Connection();

//
// Expose our assertations.
//
exports.expect = chai.expect;
exports.sinon = sinon;