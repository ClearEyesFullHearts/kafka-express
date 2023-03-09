/*!
 * kafka-express
 * Copyright(c) 2023 MFT
 * MIT Licensed
 */

/**
 * Module dependencies.
 * @private
 */
const pathRegexp = require('path-to-regexp');
const { Kafka } = require('kafkajs');
const debug = require('debug')('kafka-express:application');

const Topic = require('./topic');
const Request = require('./request');
const Response = require('./response');

class Application extends Topic {
  constructor(options) {
    const rootTopic = (options && options.delimiter) ? options.delimiter : '.';
    super(rootTopic, {
      RouterClass: Topic,
      ...options,
    });
  }

  get paths() {
    return this.getTopics();
  }

  get topics() {
    const paths = this.getTopics();
    return paths.map((t) => pathRegexp(t));
  }

  async listen(clientConfig, consumerConfig, fromBeginning = false) {
    const { clientId, brokers } = clientConfig;
    const { groupId } = consumerConfig;

    // minimum required config for kafka
    if (!clientId) throw new Error('clientId is mandatory in clientConfig');
    if (!brokers) throw new Error('brokers is mandatory in clientConfig');
    if (!groupId) throw new Error('groupId is mandatory in consumerConfig');
    const myTopics = this.topics;
    if (!myTopics || !myTopics.length || myTopics.length < 1) throw new Error('You need to subscribe to at least one topic');

    const kafka = new Kafka(clientConfig);

    this.consumer = kafka.consumer(consumerConfig);

    debug('Server connecting...');
    await this.consumer.connect();
    await this.consumer.subscribe({ topics: myTopics, fromBeginning });

    await this.consumer.run({
      eachMessage: async (kafkaMessage) => {
        await this.onMessage(this.consumer, kafkaMessage);
      },
    });

    debug(`Server connected to ${brokers}`);
  }

  async onMessage(kafkaConsumer, kafkaMessage) {
    function getLastCall(res, reject) {
      return (err) => {
        if (err) {
          reject(err);
          return;
        }
        res.end();
      };
    }
    await new Promise((resolve, reject) => {
      try {
        const req = new Request(kafkaConsumer, kafkaMessage);
        const res = new Response(req, resolve);

        const next = getLastCall(res, reject);
        req.res = res;
        req.next = next;

        this.handle(req, res, next);
      } catch (error) {
        reject(error);
      }
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
