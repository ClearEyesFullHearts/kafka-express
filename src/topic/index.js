/*!
 * kafka-express
 * Copyright(c) 2023 MFT
 * MIT Licensed
 */

/**
 * Module dependencies.
 * @private
 */

const flatten = require('array-flatten');
const pathRegexp = require('path-to-regexp');
const debug = require('debug')('kafka-express:router:topic');

const Handler = require('../handler');
const Layer = require('./layer');

const { slice } = Array.prototype;

class Topic extends Handler {
  constructor(name, opts = {
    sensitive: true,
    strict: true,
    delimiter: '.',
  }) {
    super();

    this.name = name || '*';
    this.keys = [];
    this.params = undefined;
    this.path = undefined;
    this.regexp = pathRegexp(name, this.keys, opts);

    // set fast path flags
    this.regexp.fast_star = name === '*';

    this.matchTopic = (path) => {
      let match = false;

      if (path != null) {
        // fast path for * (everything matched in a param)
        if (this.regexp.fast_star) {
          this.params = { 0: decodeURIComponent(path) };
          this.path = path;
          return true;
        }

        // match the path
        match = this.regexp.exec(path);
      }

      if (!match) {
        this.params = undefined;
        this.path = undefined;
        return false;
      }

      // store values
      this.params = {};
      const [matchPath] = match;
      this.path = matchPath;

      const { keys } = this;
      const { params } = this;

      for (let i = 1; i < match.length; i += 1) {
        const key = keys[i - 1];
        const prop = key.name;
        const val = decodeURIComponent(match[i]);

        if (val !== undefined || !(hasOwnProperty.call(params, prop))) {
          params[prop] = val;
        }
      }

      return true;
    };
  }

  use(...args) {
    const handles = flatten(slice.call(args));

    debug(`Topic ${this.name} adds ${handles.length} layer`);

    for (let i = 0; i < handles.length; i += 1) {
      const handle = handles[i];

      const layer = new Layer();
      this.addLayer(layer, handle);
    }

    return this;
  }

  handleError(err, req, res, out) {
    if (req.topic !== this.name) {
      debug(`Topic ${this.name} do not handle ${req.topic} errors`);
      setImmediate(out, err);
      return;
    }

    super.handleError(err, req, res, out);
  }

  handle(req, res, out) {
    if (this.matchTopic(req.topic)) {
      req.params = this.params;
      super.handle(req, res, out);
      return;
    }

    debug(`Topic ${this.name} do not handle ${req.topic}`);
    setImmediate(out, null);
  }
}

/**
 * Module exports.
 * @public
 */

module.exports = Topic;
