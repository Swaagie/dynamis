'use strict';

var fuse = require('fusing');

/**
 * Setup memory persistence layer via memcached.
 *
 * @Constructor
 * @param {Dynamis} dynamis layer instance
 * @param {Memcached} persistence Memcached instance
 * @api private
 */
function Memcached(dynamis, persistence) {
  this.fuse();

  //
  // Store the persistence layer as database.
  //
  persistence.on('failure', dynamis.emits('error'));
  this.database = persistence;

  //
  // Add API functionality to the dynamis layer.
  //
  this.api(dynamis);
}

//
// Add emit capacities and fusing helper methods.
//
fuse(Memcached, require('eventemitter3'));

/**
 * Extend the API of Dynamis.
 *
 * @param {Dynamis} dynamis API
 * @return {Redis} fluent interface
 */
Memcached.readable('api', function api(dynamis) {
  var memcached = this;

  /**
   * Flush the entire dataset, flush everything.
   *
   * @param {Function} done completion callback
   * @api public
   */
  dynamis.api('flush', function flush(done) {
    dynamis.execute(memcached.database, memcached.database.flush, done);
  });

  /**
   * Get the key from memory.
   *
   * @param {String} key of value
   * @param {Function} done completion callback
   * @api public
   */
  dynamis.api('get', function get(key, done) {
    dynamis.execute(memcached.database, memcached.database.get, key, done);
  });

  /**
   * Store value with key in memory.
   *
   * @param {String} key of value
   * @param {Mixed} value content to store
   * @param {Number} ttl optional time to live
   * @param {Function} done completion callback
   * @api public
   */
  dynamis.api('set', function set(key, value, ttl, done) {
    if ('function' === typeof ttl) {
      done = ttl;
      ttl = 0;
    }

    dynamis.execute(memcached.database, memcached.database.set, key, value, ttl, done);
  });

  /**
   * Set the time to live for the key.
   *
   * @param {String} key of value
   * @param {Number} ttl optional time to live
   * @param {Function} done completion callback
   * @api public
   */
  dynamis.api('expire', function expire(key, ttl, done) {
    dynamis.execute(memcached.database, memcached.database.touch, key, ttl, done);
  });

  /**
   * Remove the value from memory.
   *
   * @param {String} key to delete
   * @param {Function} done completion callback
   * @api public
   */
  dynamis.api('del', function del(key, done) {
    dynamis.execute(memcached.database, memcached.database.del, key, done);
  });

  return memcached;
});

//
// Expose the module.
//
module.exports = Memcached;
