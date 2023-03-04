const kafkaExpress = require('../lib/kafka-express');

const server = kafkaExpress();

function myguyShared(req, res, next) {
  console.log('Shared middleware');
  const start = Date.now();
  req.once('close', () => {
    console.log(`Request for ${req.topic} ended in ${Math.floor(Date.now() - start)} ms`);
  });
  next();
}

function myguy1(req, res) {
  console.log('hello topic 1');
  res.end();
}

function myguy3(req, res, next) {
  console.log('Error on topic 3');
  next(new Error());
}

function myguy2(nb) {
  return (req, res, next) => {
    console.log(`hello topic 2 ${nb}`);
    next();
  };
}
function myguy2Errored(req, res, next) {
  console.log('Error on topic 2');
  next(new Error());
}
function myguy2HandleError(err, req, res, next) {
  console.log('Topic 2 error middleware');
  next(err);
}

function myguyErrored(err, req, res, next) {
  console.log('Shared error middleware');
  next();
}

server.use(myguyShared);

server.use('test-topic-1', myguy1);
server.use('test-topic-3', myguy3);
server.use('test-topic-2', myguy2('a'), myguy2('b'), myguy2('c'), myguy2Errored, myguy2('ignored'), myguy2HandleError);

const outTopic = new kafkaExpress.Topic('test-topic-4');
outTopic.use((req, res) => {
  console.log('hello topic 4', req);
  res.end();
});
server.use(outTopic);

server.use(myguyErrored);

const clConf = {
  clientId: 'kafka-express-test',
  brokers: ['localhost:9092'],
};

const csConf = {
  groupId: 'kafka-express-test-consumer',
};

server.listen(clConf, csConf);

/*
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
*/
