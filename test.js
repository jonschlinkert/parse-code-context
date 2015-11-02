/*!
 * parse-code-context <https://github.com/jonschlinkert/parse-code-context>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors.
 * Regex sourced from https://github.com/visionmedia/dox
 * Licensed under the MIT License
 */

'use strict';

require('mocha');
var should = require('should');
var parse = require('./');

describe('parse context:', function () {
  it('should extract function statement', function () {
    var ctx = parse('function app(a, b, c) {\n\n}');
    ctx.type.should.equal('function statement');
    ctx.name.should.equal('app');
    ctx.params.should.eql([ 'a', 'b', 'c' ]);
  });

  it('should extract function expression', function () {
    var ctx = parse('var app = function(a, b, c) {\n\n}');
    ctx.type.should.equal('function expression');
    ctx.name.should.equal('app');
    ctx.params.should.eql([ 'a', 'b', 'c' ]);
  });

  it('should extract a `module.exports` function expression', function () {
    var ctx = parse('module.exports = function foo(a, b, c) {\n\n}');
    ctx.type.should.equal('function expression');
    ctx.name.should.equal('foo');
    ctx.params.should.eql([ 'a', 'b', 'c' ]);
  });

  it('should extract a `module.exports` method', function () {
    var ctx = parse('module.exports = function(a, b, c) {\n\n}');
    ctx.type.should.equal('method');
    ctx.name.should.equal('');
    ctx.params.should.eql([ 'a', 'b', 'c' ]);
  });

  it('should extract prototype method', function () {
    var ctx = parse('Template.prototype.get = function(a, b, c) {}');
    ctx.type.should.equal('prototype method');
    ctx.class.should.equal('Template');
    ctx.name.should.equal('get');
    ctx.params.should.eql([ 'a', 'b', 'c' ]);
  });

  it('should extract prototype property', function () {
    var ctx = parse('Template.prototype.enabled = true;\nasdf');
    ctx.type.should.equal('prototype property');
    ctx.class.should.equal('Template');
    ctx.name.should.equal('enabled');
    ctx.value.should.equal('true');
  });

  it('should extract method', function () {
    var ctx = parse('option.get = function(a, b, c) {}');
    ctx.type.should.equal('method');
    ctx.receiver.should.equal('option');
    ctx.name.should.equal('get');
    ctx.params.should.eql([ 'a', 'b', 'c' ]);
  });

  it('should extract property', function () {
    var ctx = parse('option.name = "delims";\nasdf');
    ctx.type.should.equal('property');
    ctx.receiver.should.equal('option');
    ctx.name.should.equal('name');
    ctx.value.should.equal('"delims"');
  });

  it('should extract declaration', function () {
    var ctx = parse('var name = "delims";\nasdf');
    ctx.type.should.equal('declaration');
    ctx.name.should.equal('name');
    ctx.value.should.equal('"delims"');
  });
});

describe('context params:', function () {
  it('should extract function statement params', function () {
    var ctx = parse('function app(a, b) {\n\n}');
    ctx.type.should.equal('function statement');
    ctx.params.should.eql(['a', 'b']);
  });

  it('should extract function expression params', function () {
    var ctx = parse('var app = function(foo, bar) {\n\n}');
    ctx.type.should.equal('function expression');
    ctx.params.should.eql(['foo', 'bar']);
  });

  it('should extract function expression params', function () {
    var ctx = parse('var app=function(foo,bar) {\n\n}');
    ctx.type.should.equal('function expression');
    ctx.params.should.eql(['foo', 'bar']);
  });

  it('should extract prototype method params', function () {
    var ctx = parse('Template.prototype.get = function(key, value, options) {}');
    ctx.type.should.equal('prototype method');
    ctx.class.should.equal('Template');
    ctx.params.should.eql(['key', 'value', 'options']);
  });
});
