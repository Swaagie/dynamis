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
  this.database = persistence;

  //
  // Add API functionality to the dynamis layer.
  //
  this.api(dynamis);
}

//
// Add emit capacities and fusing helper methods.
//
fuse(Memcached, require('events').EventEmitter);

/**
 * Extend the API of Dynamis.
 *
 * @param {Dynamis} dynamis API
 * @return {Redis} fluent interface
 */
Memcached.readable('api', function api(dynamis) {
  var memcached = this;

  /**
   * Flush the entire dataset, destroy everything.
   *
   * @param {Function} done completion callback
   * @api public
   */
  dynamis.api('destroy', function destroy(done) {
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
    dynamis.execute(memcached.database, memcached.database.get, key, function complete(error, value) {
      done(error, JSON.parse(value));
    });
  });

  /**
   * Store value with key in memory.
   *
   * @param {String} key of value
   * @param {Function} done completion callback
   * @api public
   */
  dynamis.api('set', function set(key, value, done) {
    try { value = JSON.stringify(value); } catch (error) { return done(error); }
    dynamis.execute(memcached.database, memcached.database.set, key, value, done);
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
