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

    this.isEnded = false;
  }

  end() {
    if (this.isEnded) throw new Error('Response end should be called only once');

    this.isEnded = true;
    this.req.end();
    this.completeCallback();
  }
}

/**
 * Module exports.
 * @public
 */

module.exports = Response;
