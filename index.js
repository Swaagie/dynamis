'use strict';

var fuse = require('fusing')
  , async = require('async')
  , support = require('./support')
  , debug = require('debug')('dynamis');

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
  if (!~support.enabled.indexOf(type)) {
    this.emit('error', new Error('[Dynamis] unknown persistence layer'));
  }

  //
  // If `CACHE=flush:store`, where store is a storage layer, add flush hook.
  //
  if (process.env.CACHE === 'flush:'+ support.list[type]) this.pre.flush = [];

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
fuse(Dynamis, require('eventemitter3'));

/**
 * Before init hook will be deferred.
 *
 * @param {Object} context on which to call fn
 * @param {Function} fn function to call when before hooks are done
 * @param {Array} args arguments to apply to fn
 * @api private
 */
Dynamis.readable('before', function before(context, fn, args) {
  var list = Object.keys(this.pre)
    , dynamis = this;

  debug('Iterating %s before hooks', list.length);
  async.each(list, function iterate(item, next) {
    var provided = dynamis.pre[item] || [];
    if (!Array.isArray(provided)) provided = [ provided ];

    debug('Running before hook: %s', item);
    dynamis[item].apply(dynamis, provided.concat(next));
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
  // No more registered `once` before event, shirtcircuit the before loop
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
