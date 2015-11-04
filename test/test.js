/*!
 * parse-code-context <https://github.com/jonschlinkert/parse-code-context>
 *
 * Copyright (c) 2014-2015 Jon Schlinkert.
 * Some of the regex was sourced from https://github.com/visionmedia/dox
 * Licensed under the MIT License
 */

'use strict';

require('mocha');
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var should = require('should');
var parse = require('..');

function fixtures(fp, cb) {
  return fs.readFile(path.join('test/fixtures', fp), 'utf8', cb);
}

describe('constructor:', function() {
  it('should create an instance of Parser', function() {
    var parser = new parse.Parser();
    assert(parser instanceof parse.Parser);
  });

  it('should register parsers for matching', function() {
    var parser = new parse.Parser('foo(a, b, c)');
    parser.use(/foo\(([^)]+)\)/, function (m) {
      return {
        params: m[1].split(/[, ]+/)
      }
    });
    var ctx = parser.parse();
    assert.deepEqual(ctx.params, ['a', 'b', 'c']);
  });

  it('should support passing the parent name on the constructor', function() {
    var parser = new parse.Parser('enabled: true;\nasdf', 'Foo');
    var ctx = parser.parse();
    ctx.ctor.should.equal('Foo');
    ctx.type.should.equal('property');
    ctx.name.should.equal('enabled');
    ctx.string.should.equal('Foo.enabled');
  });
});

describe('parse context:', function() {
  it('should return null when no matches are found', function() {
    var ctx = parse('foo');
    assert.equal(ctx, null);
  });

  it('should extract function statements', function() {
    var ctx = parse('function app(a, b, c) {\n\n}');
    ctx.type.should.equal('function');
    ctx.subtype.should.equal('statement');
    ctx.name.should.equal('app');
    ctx.params.should.eql([ 'a', 'b', 'c' ]);
  });

  it('should extract function statements', function() {
    var ctx = parse('function app(a, b, c) {\n\n}');
    ctx.type.should.equal('function');
    ctx.subtype.should.equal('statement');
    ctx.name.should.equal('app');
    ctx.params.should.eql([ 'a', 'b', 'c' ]);
  });

  it('should extract function expressions', function() {
    var ctx = parse('var app = function(a, b, c) {\n\n}');
    ctx.type.should.equal('function');
    ctx.subtype.should.equal('expression');
    ctx.name.should.equal('app');
    ctx.params.should.eql([ 'a', 'b', 'c' ]);
  });

  it('should extract `module.exports` function expressions', function() {
    var ctx = parse('module.exports = function foo(a, b, c) {\n\n}');
    ctx.type.should.equal('function');
    ctx.subtype.should.equal('expression');
    ctx.name.should.equal('foo');
    ctx.params.should.eql([ 'a', 'b', 'c' ]);
  });

  it('should support class, extends and is exported as default', function() {
    var ctx = parse('export default class FooBar extends Foo.Baz {');
    ctx.type.should.be.equal('class');
    ctx.name.should.be.equal('FooBar');
    ctx.ctor.should.be.equal('FooBar');
    ctx.extends.should.be.equal('Foo.Baz');
    ctx.string.should.be.equal('new FooBar()');
  });

  it('should parse inline prototype properties', function() {
    var ctx = parse('App.prototype = {');
    ctx.type.should.equal('prototype');
    ctx.ctor.should.equal('App');
    ctx.name.should.equal('App');
    ctx.string.should.equal('App.prototype');
  });

  it('should extract prototype methods', function() {
    var ctx = parse('App.prototype.get = function(a, b, c) {}');
    ctx.type.should.equal('prototype method');
    ctx.ctor.should.equal('App');
    ctx.name.should.equal('get');
    ctx.params.should.eql([ 'a', 'b', 'c' ]);
  });

  it('should support passing a parent name to properties', function() {
    var ctx = parse('enabled: true;\nasdf', 'Foo');
    ctx.ctor.should.equal('Foo');
    ctx.type.should.equal('property');
    ctx.name.should.equal('enabled');
    ctx.string.should.equal('Foo.enabled');
  });

  it('should extract prototype properties', function() {
    var ctx = parse('App.prototype.enabled = true;\nasdf');
    ctx.type.should.equal('prototype property');
    ctx.ctor.should.equal('App');
    ctx.name.should.equal('enabled');
    ctx.value.should.equal('true');
  });

  it('should extract methods', function() {
    var ctx = parse('option.get = function(a, b, c) {}');
    ctx.type.should.equal('method');
    ctx.receiver.should.equal('option');
    ctx.name.should.equal('get');
    ctx.params.should.eql([ 'a', 'b', 'c' ]);
  });

  it('should extract properties', function() {
    var ctx = parse('option.name = "delims";\nasdf');
    ctx.type.should.equal('property');
    ctx.receiver.should.equal('option');
    ctx.name.should.equal('name');
    ctx.value.should.equal('"delims"');
  });

  it('should extract declarations', function() {
    var ctx = parse('var name = "delims";\nasdf');
    ctx.type.should.equal('declaration');
    ctx.name.should.equal('name');
    ctx.value.should.equal('"delims"');
  });
});

describe('context params:', function() {
  it('should extract function statement params', function() {
    var ctx = parse('function app(a, b) {\n\n}');
    ctx.type.should.equal('function');
    ctx.subtype.should.equal('statement');
    ctx.params.should.eql(['a', 'b']);
  });

  it('should extract function expression params', function() {
    var ctx = parse('var app = function(foo, bar) {\n\n}');
    ctx.type.should.equal('function');
    ctx.subtype.should.equal('expression');
    ctx.params.should.eql(['foo', 'bar']);
  });

  it('should extract function expression params', function() {
    var ctx = parse('var app=function(foo,bar) {\n\n}');
    ctx.type.should.equal('function');
    ctx.subtype.should.equal('expression');
    ctx.params.should.eql(['foo', 'bar']);
  });

  it('should extract prototype method params', function() {
    var ctx = parse('App.prototype.get = function(key, value, options) {}');
    ctx.type.should.equal('prototype method');
    ctx.ctor.should.equal('App');
    ctx.params.should.eql(['key', 'value', 'options']);
  });

  it('should extract class', function(cb) {
    fixtures('class.js', function(err, str) {
      var matches = [];
      str.split('\n').forEach(function (line) {
        line = line.replace(/^\s+/, '');
        var ctx = parse(line);
        if (ctx) {
          matches.push(ctx);
        }
      });

      assert.equal(matches[0].type, 'class');
      assert.equal(matches[0].ctor, 'FooBar');
      assert.equal(matches[0].name, 'FooBar');
      assert.equal(matches[0].extends, 'Foo.Baz');
      assert.equal(matches[0].string, 'new FooBar()');

      assert.equal(matches[1].type, 'constructor');
      assert.equal(matches[1].ctor, undefined);
      assert.equal(matches[1].name, 'constructor');
      assert.equal(matches[1].params[0], '');
      assert.equal(matches[1].string, 'constructor()');

      assert.equal(matches[2].type, 'property');
      assert.equal(matches[2].receiver, 'this');
      assert.equal(matches[2].name, 'options');
      assert.equal(matches[2].value, 'options');
      assert.equal(matches[2].string, 'this.options');

      assert.equal(matches[3].type, 'method');
      assert.equal(matches[3].ctor, undefined);
      assert.equal(matches[3].name, 'undefinedfor');
      assert.deepEqual(matches[3].params, ['let', 'arg', 'of', 'this.args']);
      assert.equal(matches[3].string, 'undefinedfor()');

      assert.equal(matches[4].type, 'property');
      assert.equal(matches[4].receiver, 'this');
      assert.equal(matches[4].name, 'blah');
      assert.equal(matches[4].value, '"blah"');
      assert.equal(matches[4].string, 'this.blah');

      assert.equal(matches[5].type, 'class');
      assert.equal(matches[5].ctor, 'Baz');
      assert.equal(matches[5].name, 'Baz');
      assert.equal(matches[5].extends, 'FooBar');
      assert.equal(matches[5].string, 'new Baz()');

      assert.equal(matches[6].type, 'constructor');
      assert.equal(matches[6].ctor, undefined);
      assert.equal(matches[6].name, 'constructor');
      assert.deepEqual(matches[6].params, ['']);
      assert.equal(matches[6].string, 'constructor()');

      assert.equal(matches[7].type, 'property');
      assert.equal(matches[7].receiver, 'this');
      assert.equal(matches[7].name, 'options');
      assert.equal(matches[7].value, 'options');
      assert.equal(matches[7].string, 'this.options');

      assert.equal(matches[8].type, 'class');
      assert.equal(matches[8].ctor, 'Lorem');
      assert.equal(matches[8].name, 'Lorem');
      assert.equal(matches[8].extends, undefined);
      assert.equal(matches[8].string, 'new Lorem()');

      assert.equal(matches[9].type, 'constructor');
      assert.equal(matches[9].ctor, undefined);
      assert.equal(matches[9].name, 'constructor');
      assert.deepEqual(matches[9].params, ['']);
      assert.equal(matches[9].string, 'constructor()');

      assert.equal(matches[10].type, 'property');
      assert.equal(matches[10].receiver, 'this');
      assert.equal(matches[10].name, 'options');
      assert.equal(matches[10].value, 'options');
      assert.equal(matches[10].string, 'this.options');

      assert.equal(matches[11].type, 'class');
      assert.equal(matches[11].ctor, 'Ipsum');
      assert.equal(matches[11].name, 'Ipsum');
      assert.equal(matches[11].extends, 'mixin(Foo.Bar, Baz)');
      assert.equal(matches[11].string, 'new Ipsum()');

      assert.equal(matches[12].type, 'constructor');
      assert.equal(matches[12].ctor, undefined);
      assert.equal(matches[12].name, 'constructor');
      assert.deepEqual(matches[12].params, ['']);
      assert.equal(matches[12].string, 'constructor()');

      assert.equal(matches[13].type, 'property');
      assert.equal(matches[13].receiver, 'this');
      assert.equal(matches[13].name, 'options');
      assert.equal(matches[13].value, 'options');
      assert.equal(matches[13].string, 'this.options');

      cb();
    });
  });
});
