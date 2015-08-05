'use strict';

var fuse = require('fusing');

/**
 * Setup in-process memory layer.
 *
 * @Constructor
 * @param {Dynamis} dynamis layer instance.
 * @param {Object} persistence Object where we store everything in.
 * @api private
 */
function Memory(dynamis, persistence) {
  this.fuse();

  this.database = persistence || Object.create(null);
  this.timers = Object.create(null);

  //
  // Add API functionality to the dynamis layer.
  //
  this.api(dynamis);
}

//
// Add emit capacities and fusing helper methods.
//
fuse(Memory, require('eventemitter3'));

/**
 * Extend the API of Dynamis.
 *
 * @param {Dynamis} dynamis API
 * @return {Memory} fluent interface
 */
Memory.readable('api', function api(dynamis) {
  var memory = this;

  /**
   * Get an item from the database.
   *
   * @param {String} key Key we need to look up.
   * @param {Function} fn Completion callback.
   * @api private
   */
  function get(key, fn) {
    fn(undefined, memory[key]);
  }

  /**
   * Set an item in the database.
   *
   * @param {String} key Key we need to look up.
   * @param {Mixed} value Thing that needs to be set as value.
   * @param {Number} ttl Time to Life of the item.
   * @param {Function} fn Completion callback.
   * @api private
   */
  function set(key, value, ttl, fn) {
    del(key);

    memory.database[key] = value;

    if (+ttl >= 0) expire(key, ttl);
  }

  /**
   * Set the expire of an item.
   *
   * @param {String} key Key we need to look up.
   * @param {Number} ttl Time to Life of the item.
   * @param {Function} fn Completion callback.
   * @api private
   */
  function expire(key, ttl, fn) {
    memory.timers[key] = setTimeout(function timeout() {
      del(key);
    }, ttl);

    if (fn) fn();
  }

  /**
   * Nuke an item from the database.
   *
   * @param {String} key Key we need to look up.
   * @param {Function} fn Completion callback.
   * @api private
   */
  function del(key, fn) {
    clearTimeout(memory.timers[key]);

    delete memory.database[key];
    delete memory.timers[key];

    if (fn) fn();
  }

  /**
   * Nuke all items from the database.
   *
   * @param {Function} fn Completion callback.
   * @api private
   */
  function flush(fn) {
    Object.keys(memory.database).forEach(function each(key) {
      del(key);
    });

    fn();
  }

  /**
   * Flush the entire dataset, flush everything.
   *
   * @param {Function} done completion callback
   * @api public
   */
  dynamis.api('flush', function flushapi(done) {
    dynamis.execute(flush, flush, done);
  });

  /**
   * Get the key from memory.
   *
   * @param {String} key of value
   * @param {Function} done completion callback
   * @api public
   */
  dynamis.api('get', function getapi(key, done) {
    dynamis.execute(get, get, key, done);
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
  dynamis.api('set', function setapi(key, value, ttl, done) {
    if ('function' === typeof ttl) {
      done = ttl;
      ttl = 0;
    }

    dynamis.execute(set, set, key, value, ttl, done);
  });

  /**
   * Set the time to live for the key.
   *
   * @param {String} key of value
   * @param {Number} ttl optional time to live
   * @param {Function} done completion callback
   * @api public
   */
  dynamis.api('expire', function expireapi(key, ttl, done) {
    dynamis.execute(expire, expire, key, ttl, done);
  });

  /**
   * Remove the value from memory.
   *
   * @param {String} key to delete
   * @param {Function} done completion callback
   * @api public
   */
  dynamis.api('del', function delapi(key, done) {
    dynamis.execute(del, del, key, done);
  });

  return memory;
});

//
// Expose the module.
//
module.exports = Memory;
