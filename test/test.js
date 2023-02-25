const { Kafka } = require('kafkajs');

async function mytest() {
  const kafka = new Kafka({
    clientId: 'test-kafka',
    brokers: ['localhost:9092'],
  });

  const producer = kafka.producer();

  await producer.connect();
  await producer.send({
    topic: 'test-topic-1',
    messages: [
      { key: 'key1', value: JSON.stringify({ message: 'hello world' }) },
      { key: 'key2', value: JSON.stringify({ message: 'hey hey!' }) },
    ],
  });

  await producer.send({
    topic: 'test-topic-3',
    messages: [
      { key: 'key1', value: JSON.stringify({ message: 'Im gonna errored' }) },
    ],
  });

  await producer.send({
    topic: 'test-topic-4',
    messages: [
      { key: 'key1', value: JSON.stringify({ message: 'im a request' }) },
    ],
  });

  await producer.send({
    topic: 'test-topic-2',
    messages: [
      { key: 'key1', value: JSON.stringify({ message: 'chain me' }) },
    ],
  });
}

mytest();
