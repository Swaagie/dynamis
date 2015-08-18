describe('Memory persistence layer', function () {
  'use strict';

  var common = require('../common')
    , expect = common.expect
    , sinon = common.sinon
    , Dynamis = common.Dynamis
    , Persist = common.persist('memory')
    , persist, dynamis, database;

  beforeEach(function () {
    database = Object.create(null);
    dynamis = new Dynamis('memory', database);
    persist = new Persist(dynamis, database);
  });

  afterEach(function () {
    dynamis = null;
    persist = null;
    database = null;
  });

  it('is constructor that can be provided with persistence layer', function () {
    expect(Persist).to.be.a('function');
    expect(persist).to.be.an.instanceof(Persist);
  });

  it('will store the persistence connection to `database`', function () {
    expect(persist).to.have.property('database', database);
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

    afterEach(function () {
      delete database[key];
    });

    it('is a function', function () {
      expect(dynamis.set).to.be.a('function');
    });

    it('will store a key:value in the database', function (done) {
      var data = 'any value';

      dynamis.set(key, data, function (error, result) {
        expect(error).to.equal(undefined);
        expect(result).to.equal('OK');

        expect(database[key]).equals(data);

        done();
      });
    });

    it('has optional 3rd argument for TTL in seconds', function (done) {
      var ttl = 10
        , data = { json: 'data' };

      dynamis.set(key, data, ttl, function (error, result) {
        expect(error).to.equal(undefined);
        expect(result).to.equal('OK');

        done();
      });
    });
  });

  describe('#get', function () {
    var key = 'test'
      , data = 'value';

    beforeEach(function () {
      database[key] = data;
    });

    afterEach(function () {
      delete database[key];
    });

    it('is a function', function () {
      expect(dynamis.get).to.be.a('function');
    });

    it('will fetch the data from Memory by key', function (done) {
      dynamis.get(key, function (error, result) {
        expect(error).to.equal(undefined);
        expect(result).to.equal('value');
        done();
      });
    });

    it('will return undefined when key does not exist', function (done) {
      dynamis.get('random', function (error, result) {
        expect(error).to.equal(undefined);
        expect(result).to.equal(undefined);
        done();
      });
    });

    it('returns a clone of the set object', function (done) {
      dynamis.set('foo', { example: 'lol' }, function () {
        dynamis.get('foo', function (error, result) {
          expect(result).to.be.a('object');
          expect(result.lol).to.equal(undefined);

          result.lol = 1;

          dynamis.get('foo', function (error, res) {
            expect(res.lol).to.equal(undefined);
            done();
          });
        });
      });
    });
  });

  describe('#del', function () {
    var key = 'test'
      , data = 'value';

    beforeEach(function () {
      database[key] = data;
    });

    afterEach(function () {
      delete database[key];
    });

    it('is a function', function () {
      expect(dynamis.del).to.be.a('function');
    });

    it('will delete the key from Memory', function (done) {
      dynamis.del(key, function (error, result) {
        expect(error).to.equal(undefined);
        expect(result).to.equal(1);
        done();
      });
    });

    it('will return 0 if the key does not exist', function (done) {
      dynamis.del('random', function (error, result) {
        expect(error).to.equal(undefined);
        expect(result).to.equal(0);
        done();
      });
    });
  });

  describe('#expire', function () {
    var key = 'test'
      , data = 'value';

    beforeEach(function () {
      database[key] = data;
    });

    afterEach(function () {
      delete database[key];
    });

    it('is a function', function () {
      expect(dynamis.expire).to.be.a('function');
    });

    it('will add TTL to key', function (done) {
      dynamis.expire(key, 10, function (error, result) {
        expect(error).to.equal(undefined);
        expect(result).to.equal(1);

        done();
      });
    });

    it('will return 0 if the key does not exist', function (done) {
      dynamis.expire('random', 100, function (error, result) {
        expect(error).to.equal(undefined);
        expect(result).to.equal(0);

        done();
      });
    });
  });

  describe('#flush', function () {
    var key = 'test'
      , data = 'value';

    beforeEach(function () {
      database[key] = data;
    });

    afterEach(function () {
      delete database[key];
    });

    it('is a function', function () {
      expect(dynamis.flush).to.be.a('function');
    });

    it('will flush the entire database', function (done) {
      dynamis.flush(function (error, results) {

      expect(Object.keys(database).length).to.equal(0);
      done();

      });
    });
  });
});
