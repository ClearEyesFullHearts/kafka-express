/*!
 * kafka-express
 * Copyright(c) 2023 MFT
 * MIT Licensed
 */

/**
 * Module dependencies.
 * @private
 */

class Response {
  constructor(req, complete) {
    this.req = req;
    this.completeCallback = complete;
  }

  end() {
    this.req.end();
    this.completeCallback();
  }
}

/**
 * Module exports.
 * @public
 */

module.exports = Response;
