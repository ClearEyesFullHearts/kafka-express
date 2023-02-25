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
const debug = require('debug')('kafka-express:router:topic');

const Handler = require('../handler');
const Layer = require('./layer');

const { slice } = Array.prototype;

class Topic extends Handler {
  static topic_list = {};

  constructor(name) {
    super();

    this.name = name;
    if (Topic.topic_list[name]) {
      throw new Error(`Error: Topic [${name}] is already registered.`);
    }

    Topic.topic_list[name] = true;
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
    if (req.topic !== this.name) {
      debug(`Topic ${this.name} do not handle ${req.topic}`);
      setImmediate(out, null);
      return;
    }

    super.handle(req, res, out);
  }
}

/**
 * Module exports.
 * @public
 */

module.exports = Topic;
