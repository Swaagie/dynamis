'use strict';

var fuse = require('fusing');

/**
 * Setup Redis persistence layer via node-redis.
 *
 * @Constructor
 * @param {Cache} cache layer instance
 * @param {RedisClient} persistence RedisClient instance
 * @api private
 */
function Redis(cache, persistence) {
  //
  // Cradle requires a database name to persist to.
  //
  if (!cache.options.database) {
    cache.emit('error', new Error('[Redis] Provide a database name'));
  }

  //
  // Select the database that will be used in Redis.
  //
  persistence.select(cache.options.database);
  this.database = persistence;

  //
  // Add API functionality to the cache layer.
  //
  this.api(cache);
}

//
// Add emit capacities and fusing helper methods.
//
fuse(Redis, require('events').EventEmitter);

/**
 * Extend the API of Cache layer.
 *
 * @param {Cache} cache API
 * @return {Redis} fluent interface
 */
Redis.readable('api', function api(cache) {
  var redis = this;

  /**
   * [destroy description]
   * @param  {Function} done [description]
   * @return {[type]}        [description]
   */
  cache.api('destroy', function destroy(done) {
    cache.execute(redis.database, redis.database.flushdb, done);
  });

  /**
   * Get the key from cache.
   *
   * @param {String} key of cached value
   * @param {Function} done completion callback
   * @api public
   */
  cache.api('get', function get(key, done) {
    cache.execute(redis.database, redis.database.get, key, function complete(error, value) {
      done(error, JSON.parse(value));
    });
  });

  /**
   * Store value with key in cache.
   *
   * @param {String} key of cached value
   * @param {Function} done completion callback
   * @api public
   */
  cache.api('set', function set(key, value, done) {
    if ('object' === typeof value) {
      try { value = JSON.stringify(value); } catch (error) { return done(error); }
    }

    cache.execute(redis.database, redis.database.set, key, value, done);
  });

  /**
   * Remove the value from cache.
   *
   * @param {String} key delete the value from cache
   * @param {Function} done completion callback
   * @api public
   */
  cache.api('del', function del(key, done) {
    // TODO implement
    done();
  });

  return redis;
});

//
// Expose the module.
//
module.exports = Redis;