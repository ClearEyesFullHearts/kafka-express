/*!
 * kafka-express
 * Copyright(c) 2023 MFT
 * MIT Licensed
 */

/**
 * Module dependencies.
 * @private
 */
const { EventEmitter } = require('events');
const debug = require('debug')('kafka-express:response');

class Response extends EventEmitter {
  constructor(req, complete) {
    super();
    this.req = req;
    this.app = req.app;
    this.completeCallback = complete;
    this.statusCode = 200;
    this.isEnded = false;
    debug('Response created');
  }

  status(code) {
    this.statusCode = code;
    return this;
  }

  end(err) {
    if (this.isEnded) throw new Error('Response has already ended');
    this.isEnded = true;
    if (err) {
      debug('Response ended in error');
      this.statusCode = 500;
      this.emit('finish', err, this);
    } else {
      debug('Response ended');
      this.emit('finish', this);
    }

    this.completeCallback();
  }
}

/**
 * Module exports.
 * @public
 */

module.exports = Response;
