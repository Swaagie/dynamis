'use strict';

var fuse = require('fusing')
  , binary = require('binarypack');

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
   * Flush the entire dataset, flush everything.
   *
   * @param {Function} done completion callback
   * @api public
   */
  dynamis.api('flush', function flush(done) {
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
      try {
        if (Buffer.isBuffer(value)) value = binary.unpack(value);
        else value = JSON.parse(value);
      } catch (err) { error = error || err; }
      done(error, value);
    });
  });

  /**
   * Store value with key in Redis.
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
      ttl = null;
    }

    try {
      if (Buffer.isBuffer(value)) value = binary.pack(value);
      else value = JSON.stringify(value);
    } catch (error) { return done(error); }

    if (!ttl) return dynamis.execute(redis.database, redis.database.set, key, value, done);
    dynamis.execute(redis.database, redis.database.setex, key, ttl, value, done);
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
    dynamis.execute(redis.database, redis.database.expire, key, ttl, done);
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
