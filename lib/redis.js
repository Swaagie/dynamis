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
  // Cradle requires a database name to persist to.
  //
  if (!dynamis.options.database) {
    dynamis.emit('error', new Error('[Redis] Provide a database name'));
  }

  //
  // Select the database that will be used in Redis.
  //
  persistence.select(dynamis.options.database);
  this.database = persistence;

  //
  // Add API functionality to the dynamis layer.
  //
  this.api(dynamis);
}

//
// Add emit capacities and fusing helper methods.
//
fuse(Redis, require('events').EventEmitter);

/**
 * Extend the API of Dynamis layer.
 *
 * @param {Dynamis} dynamis API
 * @return {Redis} fluent interface
 */
Redis.readable('api', function api(dynamis) {
  var redis = this;

  /**
   * Flush the entire database, remove all data.
   *
   * @param {Function} done completion callback
   * @api public
   */
  dynamis.api('destroy', function destroy(done) {
    dynamis.execute(redis.database, redis.database.flushdb, done);
  });

  /**
   * Authenticate against redis.
   *
   * @param {String} password
   * @param {Function} done completion callback
   */
  dynamis.api('auth', function auth(password, done) {
    dynamis.execute(redis.database, redis.database.auth, password, done);
  });

  /**
   * Get the key from redis.
   *
   * @param {String} key of dynamisd value
   * @param {Function} done completion callback
   * @api public
   */
  dynamis.api('get', function get(key, done) {
    dynamis.execute(redis.database, redis.database.get, key, function complete(error, value) {
      done(error, JSON.parse(value));
    });
  });

  /**
   * Store value with key in redis.
   *
   * @param {String} key of dynamisd value
   * @param {Function} done completion callback
   * @api public
   */
  dynamis.api('set', function set(key, value, done) {
    try { value = JSON.stringify(value); } catch (error) { return done(error); }
    dynamis.execute(redis.database, redis.database.set, key, value, done);
  });

  /**
   * Remove the value from redis.
   *
   * @param {String} key to delete from redis
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
