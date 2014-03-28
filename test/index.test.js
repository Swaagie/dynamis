describe('Dynamis', function () {
  'use strict';

  var common = require('./common')
    , expect = common.expect
    , Dynamis = common.Dynamis
    , redis = common.redis
    , cradle = common.cradle
    , dynamis;

  beforeEach(function () {
    dynamis = new Dynamis('redis', redis, { database: 'dynamis' });
  });

  afterEach(function () {
    dynamis = null;
  });

  it('is constructor that can be provided with persistence layer', function () {
    expect(Dynamis).to.be.a('function');
    expect(dynamis).to.be.an.instanceof(Dynamis);
  });

  it('instance has property options', function () {
    expect(dynamis).to.have.property('options');
    expect(dynamis.options).to.be.an('object');
  });

  it('instance has property api', function () {
    expect(dynamis).to.have.property('api');
    expect(dynamis.api).to.be.a('function');
  });

  it('instance has property persistence', function () {
    expect(dynamis).to.have.property('persistence');
    expect(dynamis.persistence).to.be.an('object');
    expect(dynamis.persistence.domain).to.equal(null);
    expect(dynamis.persistence.database.port).to.equal(6379);
    expect(dynamis.persistence.database.host).to.equal('127.0.0.1');
  });

  it('instance has property pre', function () {
    expect(dynamis).to.have.property('pre');
    expect(dynamis.pre).to.be.an('object');
  });

  it('has readonly #before', function () {
    expect(dynamis.before).to.be.a('function');
  });

  it('registers a `before` listener once', function (done) {
    var once = new Dynamis('redis', redis, {
      database: 'dynamis',
      before: {
        test: ['test'] // call test before with arguments
      }
    });

    // hack in function test as part of the api.
    once.test = function test(value, next) {
      expect(value).to.equal('test');
      expect(next).to.be.a('function');
      next();
    };

    expect(once).to.have.property('_events');
    once.emit('before', this, done);
  });
});