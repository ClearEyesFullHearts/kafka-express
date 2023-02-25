/*!
 * kafka-express
 * Copyright(c) 2023 MFT
 * MIT Licensed
 */

/**
 * Module dependencies.
 * @private
 */

const debug = require('debug')('kafka-express:router:layer');
const Handler = require('../handler');

class Layer extends Handler {
  constructor() {
    super();

    this.name = '<anonymous>';
  }

  use(...fns) {
    const [fn] = fns;
    this.stack = [fn];
    this.name = fn.name || '<anonymous>';
  }

  handleError(error, req, res, next) {
    const [fn] = this.stack;

    if (fn.length !== 4) {
      debug(`Layer ${this.name} cannot handle error (not a standard error handler)`);
      next(error);
      return;
    }

    debug(`Layer ${this.name} is handling error`);

    try {
      fn(error, req, res, next);
    } catch (err) {
      next(err);
    }
  }

  handle(req, res, next) {
    const [fn] = this.stack;

    if (fn.length > 3) {
      debug(`Layer ${this.name} cannot handle request (not a standard request handler)`);
      next();
      return;
    }

    debug(`Layer ${this.name} is handling request`);
    try {
      fn(req, res, next);
    } catch (err) {
      next(err);
    }
  }
}

/**
 * Module exports.
 * @public
 */

module.exports = Layer;
