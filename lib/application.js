/*!
 * kafka-express
 * Copyright(c) 2023 MFT
 * MIT Licensed
 */

/**
 * Module dependencies.
 * @private
 */

const { Router } = require('middlewary');
const { Kafka } = require('kafkajs');
const debug = require('debug')('kafka-express:application');

const Request = require('./request');
const Response = require('./response');

class Application extends Router {
  async listen(clientConfig, consumerConfig) {
    const { clientId, brokers } = clientConfig;
    const { groupId } = consumerConfig;

    // minimum required config for kafka
    if (!clientId) throw new Error('clientId is mandatory in clientConfig');
    if (!brokers) throw new Error('brokers is mandatory in clientConfig');
    if (!groupId) throw new Error('groupId is mandatory in consumerConfig');
    if (!this.topics || !this.topics.length || this.topics.length < 1) throw new Error('You need to subscribe to at least one topic');

    const kafka = new Kafka(clientConfig);

    this.consumer = kafka.consumer(consumerConfig);

    debug('Server connecting...');
    await this.consumer.connect();
    await this.consumer.subscribe({ topics: this.topics });

    await this.consumer.run({
      eachMessage: async (kafkaMessage) => {
        await this.onMessage(kafkaMessage);
      },
    });

    debug(`Server connected to ${brokers}`);
  }

  async onMessage(kafkaMessage) {
    await new Promise((resolve, reject) => {
      const req = new Request(kafkaMessage);
      const res = new Response(req, resolve);
      req.res = res;

      function endNext(err) {
        if (err) {
          reject(err);
          return;
        }
        res.end();
      }
      this.handle(req, res, endNext);
    });
  }

  async stop() {
    await this.consumer.disconnect();
  }
}

/**
 * Module exports.
 * @public
 */

module.exports = Application;
