const kafkaExpress = require('../lib/kafka-express');

const server = kafkaExpress();

server.use('test.topic.user', (req, res, next) => {
  console.log('received on test.topic.user ', req.topic);
  next();
});

function myguy1(req, res, next) {
  console.log('hello topic 1');
  res.end();
}
server.use('test-topic-1', myguy1);

server.use('test.:type.*', (req, res, next) => {
  console.log('received on test.topic.* ', req.topic);
  console.log('received params ', req.params);
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
