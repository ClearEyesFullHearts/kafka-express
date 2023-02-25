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
      this.topics.push(topic.name);
    } else {
      throw new Error('Only topics can be mounted');
    }
  }

  async listen({ clientId, brokers, groupId }) {
    const kafka = new Kafka({
      clientId,
      brokers,
    });

    this.consumer = kafka.consumer({ groupId });

    debug('Server connecting...');
    await this.consumer.connect();
    await this.consumer.subscribe({ topics: this.topics });

    debug(`Server connected to ${brokers}`);

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const req = {
          topic,
          partition,
          key: message.key.toString(),
          value: JSON.parse(message.value.toString()),
          headers: message.headers,
        };
        await new Promise((resolve, reject) => {
          function nextInApp(err) {
            if (err) {
              reject(err);
              return;
            }
            resolve();
          }
          const res = {
            end: () => resolve(),
          };
          this.handle(req, res, nextInApp);
        });
      },
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