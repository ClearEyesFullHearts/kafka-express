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
  constructor(kafkaConsumer, kafkaMessage) {
    super();

    this.raw = {
      ...kafkaMessage,
    };
    const { topic, partition, message } = kafkaMessage;
    this.kafkaConsumer = kafkaConsumer;
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

    this.isEnded = false;
  }

  end() {
    if (this.isEnded) throw new Error('Request has already ended');

    this.isEnded = true;
    this.emit('close');
  }
}

/**
 * Module exports.
 * @public
 */

module.exports = Request;
