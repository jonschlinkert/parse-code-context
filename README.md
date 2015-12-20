# parse-code-context [![NPM version](https://img.shields.io/npm/v/parse-code-context.svg)](https://www.npmjs.com/package/parse-code-context) [![Build Status](https://img.shields.io/travis/jonschlinkert/parse-code-context.svg)](https://travis-ci.org/jonschlinkert/parse-code-context)

> Parse code context in a single line of javascript, for functions, variable declarations, methods, prototype properties, prototype methods etc.

## Install

Install with [npm](https://www.npmjs.com/)

```sh
$ npm i parse-code-context --save
```

## Usage

```js
var parse = require('parse-code-context');
```

## Examples

### function statement

```js
parse("function app(a, b, c) {\n\n}");
```

Results in:

```js
{ type: 'function statement',
  name: 'app',
  params: [ 'a', 'b', 'c' ],
  string: 'app()',
  original: 'function app() {\n\n}' }
```

### function expression

```js
parse("var app = function(a, b, c) {\n\n}");
```

Results in:

```js
{ type: 'function expression',
  name: 'app',
  params: [ 'a', 'b', 'c' ],
  string: 'app()',
  original: 'var app = function() {\n\n}' }
```

### `module.exports` function expression

```js
parse("module.exports = function foo(a, b, c) {\n\n}");
```

Results in:

```js
{ type: 'function expression',
  receiver: 'module.exports',
  name: 'foo',
  params: [ 'a', 'b', 'c' ],
  string: 'module.exports()',
  original: 'module.exports = function foo(a, b, c) {\n\n}' }
```

### `module.exports` method

```js
parse("module.exports = function() {\n\n}");
```

Results in:

```js
{ type: 'method',
  receiver: 'module.exports',
  name: '',
  params: [],
  string: 'module.exports.() {\n\n}()',
  original: 'module.exports = function() {\n\n}' }
```

### prototype method

```js
parse("Template.prototype.get = function() {}");
```

Results in:

```js
{ type: 'prototype method',
  class: 'Template',
  name: 'get',
  params: [],
  string: 'Template.prototype.get()',
  original: 'Template.prototype.get = function() {}' }
```

### prototype property

```js
parse("Template.prototype.enabled = true;\nasdf");
```

Results in:

```js
{ type: 'prototype property',
  class: 'Template',
  name: 'enabled',
  value: 'true',
  string: 'Template.prototype.enabled',
  original: 'Template.prototype.enabled = true;\nasdf' }
```

### method

```js
parse("option.get = function() {}");
```

Results in:

```js
{ type: 'method',
  receiver: 'option',
  name: 'get',
  params: [],
  string: 'option.get()',
  original: 'option.get = function() {}' }
```

### property

```js
parse("option.name = \"delims\";\nasdf");
```

Results in:

```js
{ type: 'property',
  receiver: 'option',
  name: 'name',
  value: '"delims"',
  string: 'option.name',
  original: 'option.name = "delims";\nasdf' }
```

### declaration

```js
parse("var name = \"delims\";\nasdf");
```

Results in:

```js
{ type: 'declaration',
  name: 'name',
  value: '"delims"',
  string: 'name',
  original: 'var name = "delims";\nasdf' }
```

### function statement params

```js
parse("function app(a, b) {\n\n}");
```

Results in:

```js
{ type: 'function statement',
  name: 'app',
  params: [ 'a', 'b' ],
  string: 'app()',
  original: 'function app(a, b) {\n\n}' }
```

### function expression params

```js
parse("var app = function(foo, bar) {\n\n}");
```

Results in:

```js
{ type: 'function expression',
  name: 'app',
  params: [ 'foo', 'bar' ],
  string: 'app()',
  original: 'var app = function(foo, bar) {\n\n}' }
```

### function expression params

```js
parse("var app=function(foo,bar) {\n\n}");
```

Results in:

```js
{ type: 'function expression',
  name: 'app',
  params: [ 'foo', 'bar' ],
  string: 'app()',
  original: 'var app=function(foo,bar) {\n\n}' }
```

### prototype method params

```js
parse("Template.prototype.get = function(key, value, options) {}");
```

Results in:

```js
{ type: 'prototype method',
  class: 'Template',
  name: 'get',
  params: [ 'key', 'value', 'options' ],
  string: 'Template.prototype.get()',
  original: 'Template.prototype.get = function(key, value, options) {}' }
```

## Related projects

* [code-context](https://www.npmjs.com/package/code-context): Parse a string of javascript to determine the context for functions, variables and comments based… [more](https://www.npmjs.com/package/code-context) | [homepage](https://github.com/jonschlinkert/code-context)
* [snapdragon](https://www.npmjs.com/package/snapdragon): snapdragon is an extremely pluggable, powerful and easy-to-use parser-renderer factory. | [homepage](https://github.com/jonschlinkert/snapdragon)
* [strip-comments](https://www.npmjs.com/package/strip-comments): Strip comments from code. Removes line comments, block comments, the first comment only, or all… [more](https://www.npmjs.com/package/strip-comments) | [homepage](https://github.com/jonschlinkert/strip-comments)

## Running tests

Install dev dependencies:

```sh
$ npm i -d && npm test
```

## Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/jonschlinkert/parse-code-context/issues/new).

## Author

**Jon Schlinkert**

* [github/jonschlinkert](https://github.com/jonschlinkert)
* [twitter/jonschlinkert](http://twitter.com/jonschlinkert)
Regex originally sourced and modified from [https://github.com/visionmedia/dox](https://github.com/visionmedia/dox).

## License

Copyright © 2015 [Jon Schlinkert](https://github.com/jonschlinkert)
Released under the MIT license.

***

_This file was generated by [verb](https://github.com/verbose/verb) on December 20, 2015._