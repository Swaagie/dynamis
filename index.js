'use strict';

var fuse = require('fusing')
  , async = require('async')
  , debug = require('debug')('cache');

//
// Supported persistence layers.
//
var enabled = ['cradle', 'redis'];

/**
 * Implementation of cache layer with basic get and set.
 *
 * @param {Object} persistence layer connection, e.g. couchdb or redis connection.
 * @param {Object} options
 * @Constructor
 * @api public
 */
function Cache(type, persistence, options) {
  var readable = Cache.predefine(this, Cache.predefine.READABLE)
    , writable = Cache.predefine(this, Cache.predefine.WRITABLE);

  writable('_events', []);
  writable('persistence');
  readable('api', readable);
  readable('options', options = options || {});
  writable('pre', options.before || {});

  //
  // Check if a persistence layer was provided.
  //
  if ('undefined' === typeof persistence) {
    this.emit('error', new Error('[Cache] persistence layer is not provided'));
  }

  //
  // Check if the provided type is supported by Cache.
  //
  if (!~enabled.indexOf(type)) {
    this.emit('error', new Error('[Cache] unknown persistence layer'));
  }

  //
  // Initialize cache persistence layer and listen to before emits, any command
  // can `execute` the before hook so it is unknown when it will be called.
  //
  this.once('before', this.before);
  this.persistence = new (require('./' + type))(this, persistence);
}

//
// Add emit capacities and fusing helper methods.
//
fuse(Cache, require('events').EventEmitter);

/**
 * Before init hook will be deferred.
 *
 * @param {Object} fn
 * @param {}
 * @param {Array} args
 * @api private
 */
Cache.readable('before', function before(context, fn, args) {
  var cache = this
    , list = Object.keys(this.pre);

  async.each(list, function iterate(item) {
    cache[item].apply(cache, cache.pre[item].concat(arguments[arguments.length - 1]));
  }, function done(error) {
    if (error) cache.emit('error', error);
    fn.apply(context, args);
  });
});

/**
 * Execute the provided fn in context, additional arguments are extracted.
 *
 * @param {Object} context persistence layer
 * @param {Function} fn function to call on context
 * @return {Cache} fluent interface
 * @api public
 */
Cache.readable('execute', function execute(context, fn) {
  var args = Array.prototype.slice.call(arguments, 2);

  //
  // No more registered `once` before event, shirtcircuit the before/after loop
  // and execute the required function.
  //
  if (!this._events.before) return fn.apply(context, args);
  this.emit('before', context, fn, args);

  return this;
});

//
// Export our cache layer.
//
module.exports = Cache;