describe('Redis persistence layer', function () {
  'use strict';

  var common = require('../common')
    , binary = require('binarypack')
    , expect = common.expect
    , sinon = common.sinon
    , Dynamis = common.Dynamis
    , Persist = common.persist('redis')
    , redis, persist, dynamis;

  beforeEach(function () {
    redis = common.redis();
    dynamis = new Dynamis('redis', redis, { database: 10 });
    persist = new Persist(dynamis, redis);
  });

  afterEach(function () {
    redis = null;
    dynamis = null;
    persist = null;
  });

  it('is constructor that can be provided with persistence layer', function () {
    expect(Persist).to.be.a('function');
    expect(persist).to.be.an.instanceof(Persist);
  });

  it('registers an error event listener that emits on dynamis', function (done) {
    dynamis.once('error', function (error) {
      expect(error).to.be.an.instanceof(Error);
      expect(error.message).to.equal('this is a test message');
      done();
    });

    redis.emit('error', new Error('this is a test message'));
  });

  it('will select the a database if provided to the options', function () {
    var local = common.redis()
      , spy = sinon.spy(local, 'select');

    new Dynamis('redis', local, { database: 10 });

    expect(spy.callCount).to.equal(1);
    expect(spy.calledWith(10)).to.equal(true);

    spy.restore();
  });

  it('will store the persistence connection to `database`', function () {
    expect(persist).to.have.property('database', redis);
  });

  it('will extend the API of dynamis', function () {
    expect(persist).to.have.property('api');
    expect(persist.api).to.be.a('function');

    expect(dynamis).to.have.property('get');
    expect(dynamis).to.have.property('flush');
    expect(dynamis).to.have.property('set');
    expect(dynamis).to.have.property('expire');
    expect(dynamis).to.have.property('del');
  });

  describe('#set', function () {
    var key = 'test';

    afterEach(function (done) {
      redis.del(key, done);
    });

    it('is a function', function () {
      expect(dynamis.set).to.be.a('function');
    });

    it('will store a key:value in Redis', function (done) {
      var data = 'any value';

      dynamis.set(key, data, function (error, result) {
        expect(error).to.equal(null);
        expect(result).to.equal('OK');

        redis.get(key, function (error, result) {
          expect(error).to.equal(null);
          expect(result).to.equal(JSON.stringify(data));
          done();
        });
      });
    });

    it('will JSON.stringify object values', function (done) {
      var data = { json: 'data' };

      dynamis.set(key, data, function (error, result) {
        expect(error).to.equal(null);
        expect(result).to.equal('OK');

        redis.get(key, function (error, result) {
          expect(error).to.equal(null);
          expect(result).to.equal(JSON.stringify(data));
          done();
        });
      });
    });

    it('has optional 3rd argument for TTL in seconds', function (done) {
      var ttl = 10
        , data = { json: 'data' };

      dynamis.set(key, data, ttl, function (error, result) {
        expect(error).to.equal(null);
        expect(result).to.equal('OK');

        redis.ttl(key, function (error, result) {
          expect(error).to.equal(null);

          // be a bit defensive, the test can't run longer than 2 seconds.
          expect(result).to.be.above(7);
          done();
        });
      });
    });

    it('will return an error when data cannot be JSON.stringified', function (done) {
      var cyclic = {};
      cyclic.data = cyclic;

      dynamis.set(key, cyclic, function (error, result) {
        expect(error).to.be.an.instanceof(Error);
        expect(error.message).to.equal('Converting circular structure to JSON');
        expect(result).to.equal(undefined);
        done();
      });
    });

    it('will binary-pack buffers', function (done) {
      var data = new Buffer('test');

      redis = require('redis').createClient({ return_buffers: true });
      dynamis = new Dynamis('redis', redis, { database: 10 });
      persist = new Persist(dynamis, redis);

      dynamis.set(key, data, function (error, result) {
        expect(error).to.equal(null);
        expect(result.toString()).to.equal('OK');

        redis.get(key, function  (error, result) {
          expect(error).to.equal(null);
          expect(binary.unpack(result).length).to.equal(data.length);
          expect(binary.unpack(result).toString()).to.equal(data.toString());
          done();
        });
      });
    });
  });

  describe('#get', function () {
    var key = 'test'
      , data = JSON.stringify('value');

    beforeEach(function (done) {
      redis.set(key, data, done);
    });

    afterEach(function (done) {
      redis.del(key, done);
    });

    it('is a function', function () {
      expect(dynamis.get).to.be.a('function');
    });

    it('will fetch the data from Redis by key', function (done) {
      dynamis.get(key, function (error, result) {
        expect(error).to.equal(null);
        expect(result).to.equal('value');
        done();
      });
    });

    it('will return undefined when key does not exist', function (done) {
      dynamis.get('random', function (error, result) {
        expect(error).to.equal(null);
        expect(result).to.equal(null);
        done();
      });
    });
  });

  describe('#del', function () {
    var key = 'test'
      , data = JSON.stringify('value');

    beforeEach(function (done) {
      redis.set(key, data, done);
    });

    afterEach(function (done) {
      redis.del(key, done);
    });

    it('is a function', function () {
      expect(dynamis.del).to.be.a('function');
    });

    it('will delete the key from Redis', function (done) {
      dynamis.del(key, function (error, result) {
        expect(error).to.equal(null);
        expect(result).to.equal(1);
        done();
      });
    });

    it('will return 0 if the key does not exist', function (done) {
      dynamis.del('random', function (error, result) {
        expect(error).to.equal(null);
        expect(result).to.equal(0);
        done();
      });
    });
  });

  describe('#expire', function () {
    var key = 'test'
      , data = JSON.stringify('value');

    beforeEach(function (done) {
      redis.set(key, data, done);
    });

    afterEach(function (done) {
      redis.del(key, done);
    });

    it('is a function', function () {
      expect(dynamis.expire).to.be.a('function');
    });

    it('will add TTL to key', function (done) {
      dynamis.expire(key, 10, function (error, result) {
        expect(error).to.equal(null);
        expect(result).to.equal(1);

        redis.ttl(key, function (error, time) {
          expect(error).to.equal(null);
          expect(time).to.be.above(8);
          done();
        });
      });
    });

    it('will return 0 if the key does not exist', function (done) {
      dynamis.expire('random', 100, function (error, result) {
        expect(error).to.equal(null);
        expect(result).to.equal(0);

        redis.ttl(key, function (error, time) {
          expect(error).to.equal(null);
          expect(time).to.equal(-1);
          done();
        });
      });
    });
  });

  describe('#flush', function () {
    var key = 'test'
      , data = JSON.stringify('value');

    beforeEach(function (done) {
      redis.set(key, data, done);
    });

    it('is a function', function () {
      expect(dynamis.flush).to.be.a('function');
    });

    it('will flush the entire database', function (done) {
      redis.keys('*', function (error, result) {
        expect(error).to.equal(null);
        expect(result).to.be.an('array');
        expect(result).to.include(key);

        dynamis.flush(function (error, result) {
          expect(error).to.equal(null);
          expect(result).to.equal('OK');

          redis.keys('*', function (error, result) {
            expect(error).to.equal(null);
            expect(result).to.be.an('array');
            expect(result).to.have.length(0);

            done();
          });
        });
      });
    });
  });
});