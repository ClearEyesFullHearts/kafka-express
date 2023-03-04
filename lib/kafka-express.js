/*!
 * kafka-express
 * Copyright(c) 2023 MFT
 * MIT Licensed
 */

/**
 * Module dependencies.
 * @private
 */

const { Router, Layer } = require('middlewary');
const Application = require('./application');

function createApplication() {
  const app = new Application();

  return app;
}

/**
 * Expose the prototypes.
 */
module.exports = () => createApplication();
module.exports.Topic = Router;
module.exports.Layer = Layer;
module.exports.Application = Application;
