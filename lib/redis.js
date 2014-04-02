'use strict';

var fuse = require('fusing');

/**
 * Setup Redis persistence layer via node-redis.
 *
 * @Constructor
 * @param {Dynamis} dynamis layer instance
 * @param {RedisClient} persistence RedisClient instance
 * @api private
 */
function Redis(dynamis, persistence) {
  this.fuse();

  //
  // Redis can switch databases by number, only allow those
  //
  if (dynamis.options.database && 'number' !== typeof dynamis.options.database) {
    dynamis.emit('error', new Error('[Redis] Provide a database number'));
  }

  //
  // Select the database that will be used in Redis.
  //
  persistence.on('error', dynamis.emits('error'));
  persistence.select(dynamis.options.database || 0);
  this.database = persistence;

  //
  // Add API functionality to the dynamis layer.
  //
  this.api(dynamis);
}

//
// Add emit capacities and fusing helper methods.
//
fuse(Redis, require('eventemitter3'));

/**
 * Extend the API of Dynamis.
 *
 * @param {Dynamis} dynamis API
 * @return {Redis} fluent interface
 */
Redis.readable('api', function api(dynamis) {
  var redis = this;

  /**
   * Flush the entire dataset, destroy everything.
   *
   * @param {Function} done completion callback
   * @api public
   */
  dynamis.api('destroy', function destroy(done) {
    dynamis.execute(redis.database, redis.database.flushdb, done);
  });

  /**
   * Get the key from Redis.
   *
   * @param {String} key of value
   * @param {Function} done completion callback
   * @api public
   */
  dynamis.api('get', function get(key, done) {
    dynamis.execute(redis.database, redis.database.get, key, function complete(error, value) {
      done(error, JSON.parse(value));
    });
  });

  /**
   * Store value with key in Redis.
   *
   * @param {String} key of value
   * @param {Function} done completion callback
   * @api public
   */
  dynamis.api('set', function set(key, value, done) {
    try { value = JSON.stringify(value); } catch (error) { return done(error); }
    dynamis.execute(redis.database, redis.database.set, key, value, done);
  });

  /**
   * Remove the value from Redis.
   *
   * @param {String} key to delete from Redis
   * @param {Function} done completion callback
   * @api public
   */
  dynamis.api('del', function del(key, done) {
    dynamis.execute(redis.database, redis.database.del, key, done);
  });

  return redis;
});

//
// Expose the module.
//
module.exports = Redis;
