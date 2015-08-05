'use strict';

var fuse = require('fusing');

/**
 * Setup LevelDB persistence layer via levelup.
 *
 * @Constructor
 * @param {Dynamis} dynamis layer instance
 * @param {LevelUp} persistence LevelUp instance
 * @api private
 */
function LevelUp(dynamis, persistence) {
  var constructor = 'function' === typeof persistence;
  this.fuse();

  //
  // LevelUp requires a database name to persist to.
  //
  if (constructor && 'string' !== typeof dynamis.options.database) {
    dynamis.emit('error', new Error('[LevelUp] Provide a database name'));
  }

  //
  // LevelUp requires an intermediate interface.
  //
  if ('object' === typeof dynamis.options.interface) {
    dynamis.emit('error', new Error('[LevelUp] Provide an abstraction interface'));
  }

  //
  // Initialize the database instance.
  //
  this.database = constructor ? persistence(dynamis.options.database) : persistence;
  this.database.on('error', dynamis.emits('error'));

  //
  // Add API functionality to the dynamis layer.
  //
  this.api(dynamis);
}

//
// Add emit capacities and fusing helper methods.
//
fuse(LevelUp, require('eventemitter3'));

/**
 * Extend the API of Dynamis.
 *
 * @param {Dynamis} dynamis API
 * @return {LevelUp} fluent interface
 */
LevelUp.readable('api', function api(dynamis) {
  var levelup = this;

  /**
   * Flush the entire dataset, flush everything.
   *
   * @param {Function} done completion callback
   * @api public
   */
  dynamis.api('flush', function flush(done) {
    var db = dynamis.options.database || levelup.database.location;

    dynamis.execute(levelup.database, levelup.database.close, function complete(error, value) {
      dynamis.options.interface.destroy(db, done);
    });
  });

  /**
   * Get the key from LevelDb.
   *
   * @param {String} key of value
   * @param {Function} done completion callback
   * @api public
   */
  dynamis.api('get', function get(key, done) {
    dynamis.execute(levelup.database, levelup.database.get, key, function complete(error, value) {
      try { value = JSON.parse(value); } catch (err) { error = error || err; }
      done(error, value);
    });
  });

  /**
   * Store value with key in LevelDb.
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

    try { value = JSON.stringify(value); } catch (error) { return done(error); }
    if (!ttl) return dynamis.execute(levelup.database, levelup.database.put, key, value, done);
    // dynamis.execute(levelup.database, levelup.database.put, key, ttl, value, done);
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
    dynamis.execute(levelup.database, levelup.database.expire, key, ttl, done);
  });

  /**
   * Remove the value from LevelDb.
   *
   * @param {String} key to delete from LevelDb
   * @param {Function} done completion callback
   * @api public
   */
  dynamis.api('del', function del(key, done) {
    dynamis.execute(levelup.database, levelup.database.del, key, done);
  });

  return levelup;
});

//
// Expose the module.
//
module.exports = LevelUp;
