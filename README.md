# kafka-express
A kafka consuming server in the style of Express.js
  
### "kafka consuming server"  
Start a server that consumes messages from a kafka server, listening to one or more topics, powered by [KafkaJS](https://kafka.js.org/docs/getting-started).  
  
### "in the style of Express.js"  
Defines the topics you want to listen to as express routes and add middlewares to them, just like you would to an express server.  
  
# Usage  
```
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
  console.log('another-test-topic middleware');
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

const clConf = {
  clientId: 'kafka-express-test',
  brokers: ['localhost:9092'],
};

const csConf = {
  groupId: 'kafka-express-test-consumer',
};

server.listen(clConf, csConf);

```