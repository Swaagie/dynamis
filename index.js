'use strict';

var fuse = require('fusing')
  , async = require('async')
  , debug = require('debug')('dynamis');

//
// Supported persistence layers.
//
var enabled = ['cradle', 'redis'];

/**
 * Implementation of dynamis layer with basic get and set.
 *
 * @param {Object} persistence layer connection, e.g. couchdb or redis connection.
 * @param {Object} options
 * @Constructor
 * @api public
 */
function Dynamis(type, persistence, options) {
  this.fuse();

  this.readable('options', options = options || {});
  this.readable('api', Dynamis.predefine(this, { enumerable: true, writable: false }));

  this.writable('persistence');
  this.writable('pre', options.before || {});

  //
  // Check if a persistence layer was provided.
  //
  if ('undefined' === typeof persistence) {
    this.emit('error', new Error('[Dynamis] persistence layer is not provided'));
  }

  //
  // Check if the provided type is supported by Dynamis.
  //
  if (!~enabled.indexOf(type)) {
    this.emit('error', new Error('[Dynamis] unknown persistence layer'));
  }

  //
  // Initialize dynamis persistence layer and listen to before emits, any command
  // can `execute` the before hook so it is unknown when it will be called.
  //
  this.once('before', this.before);
  this.persistence = new (require('./lib/' + type))(this, persistence);
}

//
// Add emit capacities and fusing helper methods.
//
fuse(Dynamis, require('events').EventEmitter);

/**
 * Before init hook will be deferred.
 *
 * @param {Object} fn
 * @param {}
 * @param {Array} args
 * @api private
 */
Dynamis.readable('before', function before(context, fn, args) {
  var dynamis = this
    , list = Object.keys(this.pre);

  debug('Iterating %s before hooks', list.length);
  async.each(list, function iterate(item) {
    debug('Running before hook for: %s', item);

    dynamis[item].apply(dynamis, dynamis.pre[item].concat(arguments[arguments.length - 1]));
  }, function done(error) {
    if (error) dynamis.emit('error', error);
    debug('Before hook finished without errors, executing: %s', fn.name);

    fn.apply(context, args);
  });
});

/**
 * Execute the provided fn in context, additional arguments are extracted.
 *
 * @param {Object} context persistence layer
 * @param {Function} fn function to call on context
 * @return {Dynamis} fluent interface
 * @api public
 */
Dynamis.readable('execute', function execute(context, fn) {
  var args = Array.prototype.slice.call(arguments, 2);

  //
  // No more registered `once` before event, shirtcircuit the before/after loop
  // and execute the required function.
  //
  if (!this._events.before) {
    debug('No before hooks found, executing: %s', fn.name);
    return fn.apply(context, args);
  }

  this.emit('before', context, fn, args);
  return this;
});

//
// Export our dynamis layer.
//
module.exports = Dynamis;
