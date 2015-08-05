# Dynamis

[![Version npm][version]](http://browsenpm.org/package/dynamis)[![Build Status][build]](https://travis-ci.org/Swaagie/dynamis)[![Dependencies][david]](https://david-dm.org/Swaagie/dynamis)[![Coverage Status][cover]](https://coveralls.io/r/Swaagie/dynamis?branch=master)

[version]: http://img.shields.io/npm/v/dynamis.svg?style=flat-square
[build]: http://img.shields.io/travis/Swaagie/dynamis/master.svg?style=flat-square
[david]: https://img.shields.io/david/Swaagie/dynamis.svg?style=flat-square
[cover]: http://img.shields.io/coveralls/Swaagie/dynamis/master.svg?style=flat-square


Node.JS cache API for various persistence layers. Dynamis aims to implement a
minimal cache API with maximal reusability. If you don't want to bother with
specifics Dynamis is made for you. However, if you like full control and features
than you should want to use any persistence layer directly.

## Installation and usage

```bash
npm install dynamis --save
```

Dynamis does not depend on the supported persistence layers to keep the amount of
dependencies small. You'll have to add your desired persistence layer to t

```js
var Dynamis = require('dynamis');
  , redis = require('redis').createClient();

//
// Initialize cache layer, by providing the connection object and options.
//
var dynamis = new Dynamis('redis', redis, { database: 1 });
```

## Supported

- Memory: In process memory.
- Memcached: Memcached
- Redis: Node-redis
- CouchDB: Cradle
- LevelDB: LevelUp

## Table of Contents

Any persistence layer will have access to the following methods, newly
developed layers should implement all methods below.

**API**

- [Dynamis: get](#dynamis-get)
- [Dynamis: set](#dynamis-set)
- [Dynamis: del](#dynamis-del)
- [Dynamis: expire](#dynamis-expire)
- [Dynamis: flush](#dynamis-flush)

**Internal**

- [Dynamis.before](#dynamisbefore)
- [Dynamis.execute](#dynamisexecute)

**Events**

- [Dynamis.on: error](#dynamison-error)

### Dynamis: get

Get a cached value from the persistence layer.

**key:** String _(required)_ database key<br>
**done:** Function _(required)_ completion callback

```js
dynamis.get('key', function done(error, value) {
  console.log(value);
});
```

### Dynamis: set

Store key:value data in the persistence layer, with an optional time to live.

**key:** String _(required)_ database key<br>
**value:** String _(required)_ value to JSON.stringify<br>
**ttl:** Number _(optional)_ time to live in seconds, defaults to 0 (never)<br>
**done:** Function _(required)_ completion callback

```js
var value = { valid: 'json' };
dynamis.set('key', value, function done(error, result) {
  console.log(result);
});
```

### Dynamis: expire

Set or refresh a time to live on the key.

**key:** String _(required)_ database key<br>
**ttl:** Number _(required)_ time to live in seconds<br>
**done:** Function _(required)_ completion callback

```
dynamis.expire('key', 10, function done(error, result) {
  console.log(result);
});
```

### Dynamis: del

Delete the key and value from the persistence layer

**key:** String _(required)_ database key<br>
**done:** Function _(required)_ completion callback

```js
dynamis.del('key', function done(error, result) {
  console.log(result);
});
```

### Dynamis: flush

Flush all data that is in the persistence layer. This feature is also available by
setting a environment variable, per example `CACHE=flush:redis` would flush all
data from the redis database by adding `flush` as [before hook](#dynamisbefore).

**done:** Function _(required)_ completion callback

```js
dynamis.flush(function done(error, result) {
  console.log(result);
});
```

### Dynamis.execute

All API calls will flow through this function. `Execute` will emit `before` so that
any [registered functions](#dynamisbefore) will be executed. `before` will only be
run once, thereafter any provided function will executed immediately.

**context:** Object _(required)_ usually the persistence layer<br>
**fn:** Function _(required)_ persistence layer method to call on context<br>
**arguments:** Mixed _(optional)_ additional arguments to supply to the function

```js
dynamis.execute(redis.database, redis.database.set, key, value, done)
```

### Dynamis.before

Loops over a set of API functions defined in `dynamis.pre`. Before will be executed
once, as soon as any API method is called, per example `dynamis.create` in cradle.

**context:** Object _(required)_ usually the persistence layer<br>
**fn:** Function _(required)_ persistence layer method to call on context<br>
**args:** Array _(required)_ arguments to supply to the function

```js
dynamis.before(redis.database, redis.database.set, [ key, value, done ])
```

### Dynamis.on: error

Errors or failures emitted by the persistence layer will be emitted from dynamis.
Handling connection or persistence errors from any layer will be done for you.
Ignoring these errors is possible, [EventEmitter3] will **not** throw the error
when no listener is registered.

```js
var Dynamis = require('dynamis');
  , redis = require('redis').createClient();

//
// Initialize cache layer and listen to emitted errors.
//
var dynamis = new Dynamis('redis', redis, {});
dynamis.on('error', function handleError() {
  console.log(arguments);
});
```

[EventEmitter3]: https://github.com/primus/EventEmitter3
