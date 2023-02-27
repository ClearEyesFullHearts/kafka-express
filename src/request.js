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
const debug = require('debug')('kafka-express:request');

class Request extends EventEmitter {
  constructor(kafkaMessage) {
    super();

    this.raw = {
      ...kafkaMessage,
    };
    const { topic, partition, message } = kafkaMessage;
    this.topic = topic;
    this.path = topic;
    this.partition = partition;
    this.key = message.key.toString();
    this.value = message.value.toString();
    this.body = null;
    try {
      this.body = JSON.parse(message.value.toString());
    } catch (err) {
      debug('message.value is not a json body');
    }
    this.headers = message.headers;

    this.params = {};
  }

  end() {
    this.emit('close');
  }
}

/**
 * Module exports.
 * @public
 */

module.exports = Request;
