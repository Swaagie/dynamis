'use strict';

var fuse = require('fusing');

/**
 * Setup CouchDB persistence layer via cradle.
 *
 * @Constructor
 * @param {Dynamis} dynamis layer instance
 * @param {Connection} persistence cradle.Connection instance
 * @api private
 */
function Cradle(dynamis, persistence) {
  this.fuse();

  //
  // Cradle requires a database name to persist to.
  //
  if (!dynamis.options.database) {
    dynamis.emit('error', new Error('[Cradle] Provide a database name'));
  }

  //
  // Init database instance from Cradle and add a prepare hook. This hook will
  // call `prepare` once and create the database if it does not exists.
  //
  this.database = persistence.database(dynamis.options.database);
  dynamis.pre.prepare = [];

  //
  // Add API functionality to the dynamis layer.
  //
  this.api(dynamis);
}

//
// Add emit capacities and fusing helper methods.
//
fuse(Cradle, require('eventemitter3'));

/**
 * Extend the API of Dynamis.
 *
 * @param {Dynamis} dynamis API
 * @return {Cradle} fluent interface
 */
Cradle.readable('api', function api(dynamis) {
  var cradle = this;

  /**
   * Prepare and create the database in CouchDB. This method is not exposed to the
   * API but vital for proper functioning of the database.
   *
   * @param {Function} done completion callback.
   * @api private
   */
  dynamis.readable('prepare', function prepare(done) {
    cradle.database.exists(function next(error, exists) {
      if (error || exists) return done(error);
      cradle.database.create(done);
    });
  });

  /**
   * Flush the entire dataset, flush everything.
   *
   * @param {Function} done
   * @api public
   */
  dynamis.api('flush', function flush(done) {
    dynamis.execute(cradle.database, cradle.database.destroy, done);
  });

  /**
   * Get the key from CouchDB.
   *
   * @param {String} key of value
   * @param {Function} done completion callback
   * @api public
   */
  dynamis.api('get', function get(key, done) {
    dynamis.execute(cradle.database, cradle.database.get, key, done);
  });

  /**
   * Store value with key in CouchDB.
   *
   * @param {String} key of value
   * @param {Function} done completion callback
   * @api public
   */
  dynamis.api('set', function set(key, value, done) {
    dynamis.execute(cradle.database, cradle.database.save, key, value, done);
  });

  /**
   * Remove the value from CouchDB.
   *
   * @param {String} key delete the value from dynamis
   * @param {Function} done completion callback
   * @api public
   */
  dynamis.api('del', function del(key, done) {
    dynamis.execute(cradle.database, cradle.database.remove, key, done);
  });

  return cradle;
});

//
// Expose the module.
//
module.exports = Cradle;