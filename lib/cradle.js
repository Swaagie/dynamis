'use strict';

var fuse = require('fusing');

/**
 * Setup CouchDB persistence layer via cradle.
 *
 * @Constructor
 * @param {Cache} cache layer instance
 * @param {Connection} persistence cradle.Connection instance
 * @api private
 */
function Cradle(cache, persistence) {
  //
  // Cradle requires a database name to persist to.
  //
  if (!cache.options.database) {
    cache.emit('error', new Error('[Cradle] Provide a database name'));
  }

  //
  // Init database instance from Cradle.
  //
  this.database = persistence.database(cache.options.database);

  //
  // Add API functionality to the cache layer.
  //
  this.api(cache);
}

//
// Add emit capacities and fusing helper methods.
//
fuse(Cradle, require('events').EventEmitter);

/**
 * Prepare and create the database in CouchDB.
 *
 * @param {Function} done [description]
 * @return {[type]}        [description]
 */
Cradle.readable('prepare', function prepare(done) {
  var database = this.database;

  database.exists(function next(error, exists) {
    if (error || exists) return done(error);
    database.create(done);
  });
});

/**
 * Check if the persistence layer is ready.
 *
 * @param {Function} done completion callback
 * @api private
 */
Cradle.readable('ready', function ready(done) {
  var cradle = this;

  if (cradle.ready) return done(null, cradle.ready);
  cradle.prepare(function next(error) {
    if (error) return done(error);

    cradle.emit('ready');
    done(null, cradle.ready = true);
  });
});

/**
 * Extend the API of Cache layer.
 *
 * @param {Cache} cache API
 * @return {Cradle} fluent interface
 */
Cradle.readable('api', function api(cache) {
  var cradle = this;

  /**
   * Get the key from cache.
   *
   * @param {String} key of cached value
   * @param {Function} done completion callback
   * @api public
   */
  cache.api('get', function get(key, done) {
    cradle.ready(function next(error, ready) {
      if (error) return done(error);

      cradle.database.get(key, done);
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
    cradle.ready(function next(error, ready) {
      if (error) return done(error);

      cradle.database.save(key, value, done);
    });
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

  return cradle;
});

//
// Expose the module.
//
module.exports = Cradle;