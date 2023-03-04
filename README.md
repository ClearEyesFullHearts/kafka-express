# kafka-express
A kafka consuming server in the style of Express.js
  
### "kafka consuming server"  
Start a server that consumes messages from a kafka server, listening to one or more topics, powered by [KafkaJS](https://kafka.js.org/docs/getting-started).  
  
### "in the style of Express.js"  
Defines the topics you want to listen to as express routes and add middlewares to them, just like you would to an express server.  
  
# Usage  
```javascript
const kafkaExpress = require('kafka-express');

const server = kafkaExpress();

server.use((req, res, next) => {
  console.log('Shared middleware');
  next();
});

server.use('my-test-topic', (req, res, next) => {
  console.log('my-test-topic middleware');
  res.end();
});

server.use('another-test-topic', (req, res, next) => {
  console.log('another-test-topic first middleware');
  next();
}, (req, res, next) => {
  console.log('another-test-topic second middleware');
  res.end();
});

server.use('test.topic.*', (req, res, next) => {
  console.log('all topics that start by test.topic middleware');
  res.end();
});

server.use((err, req, res, next) => {
  console.log('Global error middleware');
  next();
});

const clientConf = {
  clientId: 'kafka-express-test',
  brokers: ['localhost:9092'],
};

const consumerConf = {
  groupId: 'kafka-express-test-consumer',
};

server.listen(clConf, csConf);

```
  
If you are unfamiliar with how express middlewares work, I would suggest you read the [Express doc](https://expressjs.com/en/guide/using-middleware.html), here is just a reminder that you need to call either "next()" or "res.end()" in each of your middleware.  
  
## Differences
For obvious reasons the request and reponse objects you receive in your middlewares are different than for a HTTP request:  
```
const {
  raw, // raw kafka message (KafkaMessage)
  topic, // name of the topic sending the message (string)
  path, // name of the topic sending the message (string)
  partition, // partition id (string)
  key, // message key (string)
  value, // message value (string)
  body, // message value converted to JSON if possible (object)
  headers, // message headers if present (object)
  params, // converted params from the topic name if present (object)
} = req;

const {
  end(), // function to call to end the request-response cycle
} = res;
```
The request object is an event dispatcher and emits the 'close' event when the request cycle ends.  
  
The "Topic" object replaces the Router object. Note that you can mount a topic to another topic to create chained topics but only those that have a mounted middleware will be subscribed to the kafka server.  
```javascript
const kafkaExpress = require('../lib/kafka-express');

const { Topic } = kafkaExpress;

const server = kafkaExpress();

const testTopic = new Topic('test');
const outTopic = new Topic('out');
const noMiddlewareTopic = new Topic('no');

testTopic.use((req, res) => {
  console.log('hello test');
  next();
});
outTopic.use((req, res) => {
  console.log('hello out');
  res.end();
});

outTopic.use(noMiddlewareTopic);
testTopic.use(outTopic);

server.use(testTopic);

// defined paths here are ['test', 'test.out']
console.log(server.paths);
// defined topics here are [ /^test\/?$/i, /^test\.out\/?$/i ]
console.log(server.topics);
```
  
You can subscribe to topics using a Regexp and including parameters (i.e 'topic.name.:param'), these parameters will be added to the request object.  
You need to be aware that the KafkaJS client will only subscribe to the topics that match your regex AND already exists on the broker. It will not add topics that are created later.  
The default separator is "." instead of "/".  
  
## KafkaJS
The "Application.listen" consumes messages through the "eachMessage" handler and accepts a client configuration for the KafkaJS client and a consumer configuration for the KafkaJS consumer client.  
To use the "eachBatch" handler you need to manage the KafkaJS client yourself and use the onMessage function of the application:
```javascript
const kafkaExpress = require('../src/kafka-express');
const { Kafka } = require('kafkajs');

const server = kafkaExpress();

... add some middlewares here

const kafka = new Kafka(clientConfig);

const consumer = kafka.consumer(consumerConfig);

await consumer.connect();

// server.topics get you all topics that have a middleware, in regex format
await consumer.subscribe({ topics: server.topics });

await this.consumer.run({
  eachBatch: async (batch) => {
    for (let message of batch.messages) {
      await server.onMessage(message);
    }
  },
});
```
