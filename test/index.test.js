describe('Dynamis', function () {
  'use strict';

  var common = require('./common')
    , expect = common.expect
    , sinon = common.sinon
    , Dynamis = common.Dynamis
    , redis, dynamis;

  beforeEach(function () {
    redis = common.redis();
    dynamis = new Dynamis('redis', redis, { database: 0 });
  });

  afterEach(function () {
    redis = null;
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
    expect(dynamis.persistence.database.connectionOption.port).to.equal(6379);
    expect(dynamis.persistence.database.connectionOption.host).to.equal('127.0.0.1');
  });

  it('instance has property pre', function () {
    expect(dynamis).to.have.property('pre');
    expect(dynamis.pre).to.be.an('object');
  });

  it('has readonly #before', function () {
    expect(dynamis.before).to.be.a('function');
  });

  it('has readonly #execute', function () {
    expect(dynamis.before).to.be.a('function');
  });

  it('registers a `before` listener once', function (done) {
    var once = new Dynamis('redis', redis, {
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

  describe('#before', function () {
    it('will call function with supplied arguments', function (done) {
      var once = new Dynamis('redis', redis, {});

      function test(value) {
        expect(value).to.equal('test');
        done();
      }

      once.before(this, test, ['test']);
    });

    it('will call registered `pre` functions', function (done) {
      var once = new Dynamis('redis', redis, {
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
      once.before(this, done);
    });
  });

  describe('#execute', function () {
    it('will call methods directly if there is no more before listener', function (done) {
      var spy = sinon.spy(dynamis, 'emit');

      function run() {
        expect(spy).to.not.have.been.calledWith(run);
        done();
      }

      dynamis.removeAllListeners();
      dynamis.execute(this, run);
    });

    it('will emit before with the supplied arguments', function (done) {
      var ctx = this;

      dynamis.removeAllListeners(); // remove default before listener.
      dynamis.once('before', function (context, fn) {
        expect(context).to.equal(ctx);
        expect(context).to.be.an('object');
        expect(fn).to.equal(done);
        expect(fn).to.be.a('function');
        done();
      });

      dynamis.execute(ctx, done);
    });
  });
});