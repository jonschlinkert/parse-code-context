/* fixture from https://github.com/tj/dox */

/*
 * A Foo.
 * @class FooBar
 * @extends Foo.Baz
 */
export default class FooBar extends Foo.Baz {

  /*
   * construct a FooBar
   * @constructor
   * @param {Object} options constructor options
   */

  constructor(options) {
    this.options = options
  }

  /*
   * Method of the FooBar class.
   * @return {Overflow}
   */
  bar() {
    return 99999999999999999999999999999999999999999999999999999999999999999
  }

  /**
   * Static method of the FooBar class.
   * @return {String}
   */
  static staticMethod() {
    return 'static method'
  }

  /**
   * Static generator method of the FooBar class.
   * @return {String}
   */
  static * staticGeneratorMethod() {
    return 'static method'
  }

  /**
   * Generator method with computed name.
   * @return {String}
   */
  *[Symbol.iterator]() {
    for (let arg of this.args) yield arg
  }

  /*
   * Getter for the blah property.
   */
  get blah() {
    this._blah = "blah"
    return this._blah;
  }

  /*
   * Getter for the whatever property.
   * @return {String}
   */
  get whatever() {
    return this.whatever;
  }
}

/*
 * @class Baz
 */
export class Baz extends FooBar {

  /*
   * @param {Object} options constructor options
   */
  constructor(options) {
    this.options = options
  }
}

/*
 * @class Lorem
 */
class Lorem {
  constructor(options) {
    this.options = options
  }
}

/*
 * @class Lorem
 */
class Ipsum extends mixin(Foo.Bar, Baz) {
  constructor(options) {
    this.options = options
  }
}
