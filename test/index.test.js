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

  it('is constructor that can be provided with persistance layer', function () {
    expect(Dynamis).to.be.a('function');
    expect(dynamis).to.be.an.instanceof(Dynamis);
  });
});