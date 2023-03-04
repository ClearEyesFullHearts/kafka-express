/*!
 * kafka-express
 * Copyright(c) 2023 MFT
 * MIT Licensed
 */

/**
 * Module dependencies.
 * @private
 */

const { Layer } = require('middlewary');
const Application = require('./application');
const Topic = require('./topic');

function createApplication() {
  const app = new Application();

  return app;
}

/**
 * Expose the prototypes.
 */
module.exports = () => createApplication();
module.exports.Topic = Topic;
module.exports.Layer = Layer;
module.exports.Application = Application;
