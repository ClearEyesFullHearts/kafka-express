/*!
 * kafka-express
 * Copyright(c) 2023 MFT
 * MIT Licensed
 */

/**
 * Module dependencies.
 * @private
 */
const debug = require('debug')('kafka-express:request');

class Request {
  constructor(app, kafkaConsumer, kafkaMessage) {
    this.app = app;
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
  }
}

/**
 * Module exports.
 * @public
 */

module.exports = Request;
