describe('Levelup persistence layer', function () {
  'use strict';

  var common = require('../common')
    , expect = common.expect
    , sinon = common.sinon
    , Dynamis = common.Dynamis
    , Persist = common.persist('levelup')
    , levelup = common.levelup()
    , persist, dynamis;

  beforeEach(function () {
    dynamis = new Dynamis('levelup', levelup, { interface: require('leveldown') });
    persist = new Persist(dynamis, levelup);
  });

  afterEach(function () {
    dynamis = null;
    persist = null;
  });

  after(function (done) {
    levelup.close(done);
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

    persist.database.emit('error', new Error('this is a test message'));
  });

  it('will open the database or use the provided instance', function () {
    expect(persist.database.db).to.be.an('object');
    expect(persist.database.db).to.have.property('location', '/tmp/test');

    persist = new Persist(dynamis, require('levelup')('/tmp/different'));

    expect(persist.database.db).to.be.an('object');
    expect(persist.database.db).to.have.property('location', '/tmp/different');
  });

  it('will store the persistence connection to `database`', function () {
    expect(persist).to.have.property('database');
    expect(persist.database).to.be.an('object');
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
      levelup.del(key, done);
    });

    it('is a function', function () {
      expect(dynamis.set).to.be.a('function');
    });

    it('will store a key:value in LevelDB', function (done) {
      var data = 'any value';

      dynamis.set(key, data, function (error) {
        expect(error).to.equal(undefined);

        levelup.get(key, function (error, result) {
          expect(error).to.equal(null);
          expect(result).to.equal(JSON.stringify(data));
          done();
        });
      });
    });

    it('will JSON.stringify object values', function (done) {
      var data = { json: 'data' };

      dynamis.set(key, data, function (error, result) {
        expect(error).to.equal(undefined);

        levelup.get(key, function (error, result) {
          expect(error).to.equal(null);
          expect(result).to.equal(JSON.stringify(data));
          done();
        });
      });
    });

    // it('has optional 3rd argument for TTL in seconds', function (done) {
    //   var ttl = 10
    //     , data = { json: 'data' };

    //   dynamis.set(key, data, ttl, function (error, result) {
    //     expect(error).to.equal(null);
    //     expect(result).to.equal('OK');

    //     redis.ttl(key, function (error, result) {
    //       expect(error).to.equal(null);

    //       // be a bit defensive, the test can't run longer than 2 seconds.
    //       expect(result).to.be.above(7);
    //       done();
    //     });
    //   });
    // });

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
  });

  describe('#get', function () {
    var key = 'test'
      , data = JSON.stringify('value');

    beforeEach(function (done) {
      levelup.put(key, data, done);
    });

    afterEach(function (done) {
      levelup.del(key, done);
    });

    it('is a function', function () {
      expect(dynamis.get).to.be.a('function');
    });

    it('will fetch the data from LevelDB by key', function (done) {
      dynamis.get(key, function (error, result) {
        expect(error).to.equal(null);
        expect(result).to.equal('value');
        done();
      });
    });

    it('will return status 404 when key does not exist', function (done) {
      dynamis.get('random', function (error, result) {
        expect(error).to.be.an('object');
        expect(error).to.have.property('notFound', true);
        expect(error).to.have.property('status', 404);
        expect(result).to.equal(undefined);
        done();
      });
    });
  });

  describe('#del', function () {
    var key = 'test'
      , data = JSON.stringify('value');

    beforeEach(function (done) {
      levelup.put(key, data, done);
    });

    afterEach(function (done) {
      levelup.del(key, done);
    });

    it('is a function', function () {
      expect(dynamis.del).to.be.a('function');
    });

    it('will delete the key from LevelDB', function (done) {
      dynamis.del(key, function (error) {
        expect(error).to.equal(undefined);

        levelup.get(key, function (error, result) {
          expect(error).to.be.an('object');
          expect(error).to.have.property('notFound', true);
          expect(error).to.have.property('status', 404);
          expect(result).to.equal(undefined);
          done();
        });
      });
    });

    it('will do nothing if the key does not exist', function (done) {
      dynamis.del('random', function (error, result) {
        expect(error).to.equal(undefined);
        done();
      });
    });
  });

  // describe('#expire', function () {
  //   var key = 'test'
  //     , data = JSON.stringify('value');

  //   beforeEach(function (done) {
  //     redis.set(key, data, done);
  //   });

  //   afterEach(function (done) {
  //     redis.del(key, done);
  //   });

  //   it('is a function', function () {
  //     expect(dynamis.expire).to.be.a('function');
  //   });

  //   it('will add TTL to key', function (done) {
  //     dynamis.expire(key, 10, function (error, result) {
  //       expect(error).to.equal(null);
  //       expect(result).to.equal(1);

  //       redis.ttl(key, function (error, time) {
  //         expect(error).to.equal(null);
  //         expect(time).to.be.above(8);
  //         done();
  //       });
  //     });
  //   });

  //   it('will return 0 if the key does not exist', function (done) {
  //     dynamis.expire('random', 100, function (error, result) {
  //       expect(error).to.equal(null);
  //       expect(result).to.equal(0);

  //       redis.ttl(key, function (error, time) {
  //         expect(error).to.equal(null);
  //         expect(time).to.equal(-1);
  //         done();
  //       });
  //     });
  //   });
  // });

  describe('#flush', function () {
    var key = 'test'
      , data = JSON.stringify('value');

    beforeEach(function (done) {
      levelup.put(key, data, done);
    });

    it('is a function', function () {
      expect(dynamis.flush).to.be.a('function');
    });

    it('will flush the entire database', function (done) {
      levelup.get('test', function (error, result) {
        expect(error).to.equal(null);
        expect(result).to.equal(data);

        dynamis.flush(function (error, result) {
          expect(error).to.equal(undefined);

          //
          // Flush will close to db to actually destroy it, make sure to reopen,
          // do not do this in production.
          //
          levelup.open(function () {
            levelup.get('test', function (error, result) {
              expect(error).to.be.an('object');
              expect(error).to.have.property('notFound', true);
              expect(error).to.have.property('status', 404);
              expect(result).to.equal(undefined);
              done();
            });
          });
        });
      });
    });
  });
});