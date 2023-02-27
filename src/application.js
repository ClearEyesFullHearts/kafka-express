/*!
 * kafka-express
 * Copyright(c) 2023 MFT
 * MIT Licensed
 */

/**
 * Module dependencies.
 * @private
 */

const { Kafka } = require('kafkajs');
const flatten = require('array-flatten');
const debug = require('debug')('kafka-express:application');

const Handler = require('./handler');
const Topic = require('./topic');
const Layer = require('./topic/layer');
const Request = require('./request');
const Response = require('./response');

const { slice } = Array.prototype;

class Application extends Handler {
  constructor() {
    super();
    this.topics = [];
    this.name = 'Application';
    this.consumer = {};
  }

  use(...args) {
    const handles = flatten(slice.call(args));
    const [fn, ...layers] = handles;
    if (typeof fn !== 'function') {
      // first argument is a topic name
      const topic = new Topic(fn);
      topic.use(layers);

      this.mount(topic);

      return this;
    }

    for (let i = 0; i < handles.length; i += 1) {
      const handle = handles[i];

      const layer = new Layer();
      this.addLayer(layer, handle);
    }

    return this;
  }

  mount(topic) {
    if (topic instanceof Topic) {
      this.stack.push(topic);
      this.topics.push(topic.regexp);
    } else {
      throw new Error('Only topics can be mounted');
    }
  }

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

  async onMessage(kafkaMessage){
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
