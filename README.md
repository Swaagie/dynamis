# Dynamis [![Build Status][status]](https://travis-ci.org/Moveo/dynamis) [![NPM version][npmimgurl]](http://npmjs.org/package/dynamis) [![Coverage Status][coverage]](http://coveralls.io/r/Moveo/dynamis?branch=master)

[status]: https://travis-ci.org/Moveo/dynamis.png?branch=master
[npmimgurl]: https://badge.fury.io/js/dynamis.png
[coverage]: http://coveralls.io/repos/Moveo/dynamis/badge.png?branch=master

Node.JS cache API for various persistence layers. Dynamis aims to implement a
minimal cache API with maximal reusability. If you don't want to bother with
specifics Dynamis is made for you. However, if you like full control and features
than you should want to use any persistence layer directly.

## Installation and usage

```bash
npm install dynamis --save
```

Dynamis does not depend on the supported perisistence layers to keep the amount of
dependencies small. You'll have to add your desired persistence layer to t

```js
var Dynamis = require('dynamis');
  , redis = require('redis').createClient();

//
// Database selection is optional for redis, but may be required for other layers.
// Authenticate will be called once as soon as any method is executed.
//
var options = {
  database: 1,
  before: {
    auth: [ 'mypass' ]
  }
}

//
// Initialize cache layer, by providing the connection object and options.
//
var dynamis = new Dynamis('redis', redis, options);
```

## Supported

- Memory: Memcached
- Redis: Node-redis
- CouchDB: Cradle

## Table of Contents

Any persistence layer will have access to the following methods, newly
developed layers should implement all methods below.

**API**

- [Dynamis: get](#dynamis-get)
- [Dynamis: set](#dynamis-set)
- [Dynamis: del](#dynamis-del)
- [Dynamis: auth](#dynamis-auth)
- [Dynamis: destroy](#dynamis-destroy)

**Internal**

- [Dynamis.before](#dynamisbefore)
- [Dynamis.execute](#dynamisexecute)

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

Store key:value data in the persistence layer.

**key:** String _(required)_ database key<br>
**value:** String _(required)_ value to JSON.stringify<br>
**done:** Function _(required)_ completion callback

```js
var value = { valid: 'json' };
dynamis.set('key', value, function done(error, result) {
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

### Dynamis: auth

Authenticate against the connection and/or persistence layer. Supplying `auth` with
only a password will suffice if the persistence layer is Redis. Redis only has
password authentication and no notion of users.

**username:** String _(required)_ username<br>
**password:** String _(required)_ password<br>
**done:** Function _(required)_ completion callback

```js
dynamis.auth('username', 'password', function done(error, result) {
  console.log(result);
});
```

### Dynamis: destroy

Flush all data that is in the persistence layer. This feature is also available by
setting a environment variable, per example `CACHE=destroy:redis` would flush all
data from the redis database by adding `destroy` as [before hook](#dynamisbefore).

**done:** Function _(required)_ completion callback

```js
dynamis.destroy(function done(error, result) {
  console.log(result);
});
```

### Dynamis.execute

All API calls will flow through this function. `Execute` will emit `before` so that
any [registered functions](#dynamisbefore) will be executed. `before` will only be
run once, thereafter any provided function will executed immediatly.

**context:** Object _(required)_ usually the persistence layer<br>
**fn:** Function _(required)_ persistance layer method to call on context<br>
**arguments:** Mixed _(optional)_ additional arguments to supply to the function

```js
dynamis.execute(redis.database, redis.database.set, key, value, done)
```

### Dynamis.before

Loops over a set of API functions defined in `dynamis.pre`. Before will be executed
once, as soon as any API method is called, per example [authentication](#dynamis-auth).

**context:** Object _(required)_ usually the persistence layer<br>
**fn:** Function _(required)_ persistance layer method to call on context<br>
**args:** Array _(required)_ arguments to supply to the function

```js
dynamis.before(redis.database, redis.database.set, [ key, value, done ])
```
