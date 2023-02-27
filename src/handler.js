/*!
 * kafka-express
 * Copyright(c) 2023 MFT
 * MIT Licensed
 */

/**
 * Module dependencies.
 * @private
 */

const debug = require('debug')('kafka-express:handler');

class Handler {
  constructor() {
    this.stack = [];
    this.name = 'generic handler';

    this.restore = (fn, obj, ...args) => {
      const props = new Array(args.length);
      const vals = new Array(args.length);

      for (let i = 0; i < props.length; i += 1) {
        props[i] = args[i];
        vals[i] = obj[props[i]];
      }

      return (...fnArgs) => {
        for (let i = 0; i < props.length; i += 1) {
          obj[props[i]] = vals[i]; // eslint-disable-line no-param-reassign
        }

        return fn.apply(this, fnArgs);
      };
    };

    this.getnext = (done, req, res) => {
      let idx = 0;
      const handlerName = this.name;

      // middleware and routes
      const { stack } = this;

      function next(err) {
        const layerError = err === 'handled'
          ? null
          : err;

        // signal to exit router
        if (layerError === 'handler-exit') {
          setImmediate(done, null);
          return;
        }

        // no more matching layers
        if (idx >= stack.length) {
          debug(`Handler ${handlerName} stack is done`);
          setImmediate(done, layerError);
          return;
        }

        // find next layer
        const layer = stack[idx];
        idx += 1;

        if (layerError) {
          debug('have error for ', layer.name);
          layer.handleError(layerError, req, res, next);
          return;
        }

        layer.handle(req, res, next);
      }
      return next;
    };
  }

  handleError(err, req, res, out) { // eslint-disable-line class-methods-use-this
    debug(`Handler ${this.name} is out with an error`);
    return out(err);
  }

  handle(req, res, out) {
    const handlerName = this.name;

    // // middleware and routes
    const done = this.restore(out, req, 'next');

    const next = this.getnext(done, req, res);

    // setup next layer
    req.next = next;

    debug(`Handler ${handlerName} begins`);
    next();
  }

  addLayer(layer, handle) {
    if (typeof handle !== 'function') {
      const type = toString.call(handle);
      const msg = `Handler requires a callback function but got a ${type}`;
      throw new Error(msg);
    }

    debug('Handler adds a layer');
    layer.use(handle);

    this.stack.push(layer);
  }
}

/**
 * Module exports.
 * @public
 */

module.exports = Handler;
