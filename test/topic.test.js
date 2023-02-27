const {
  describe, expect, test,
} = require('@jest/globals');

const TopicClass = require('../src/topic');
const LayerClass = require('../src/topic/layer');

describe('Topic tests', () => {
  test('topic can be instantiated', () => {
    const topic = new TopicClass();
    expect(topic).toBeInstanceOf(TopicClass);
  });

  test('topic uses a function and adds a layer', () => {
    const topic = new TopicClass('my.topic.kafka');
    topic.use(() => true);
    expect(topic.stack.length).toBe(1);
    const [layer] = topic.stack;
    expect(layer).toBeInstanceOf(LayerClass);
  });

  test('topic uses functions and adds a layer for each', () => {
    const topic = new TopicClass('my.topic.kafka');

    const mockLayerHandle = jest.fn((req, res, next) => {
      next();
    });

    topic.use(mockLayerHandle, mockLayerHandle, mockLayerHandle, mockLayerHandle);
    expect(topic.stack.length).toBe(4);
    topic.stack.forEach((t) => {
      expect(t).toBeInstanceOf(LayerClass);
    });

    topic.use([mockLayerHandle, mockLayerHandle, mockLayerHandle]);
    expect(topic.stack.length).toBe(7);
  });

  test('topic handles only the matching topic messages', (done) => {
    const topic = new TopicClass('my.topic.kafka');

    const mockLayerHandle = jest.fn((req, res, next) => {
      next();
    });
    topic.use(mockLayerHandle);
    topic.handle({ topic: 'my.topic.kafka' }, {}, () => {
      expect(mockLayerHandle).toHaveBeenCalledTimes(1);
      topic.handle({ topic: 'not.my.topic.kafka' }, {}, () => {
        expect(mockLayerHandle).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });
  test('topic handles only the matching topic messages on error', (done) => {
    const topic = new TopicClass('my.topic.kafka');

    const mockErrorHandle = jest.fn((err, req, res, next) => {
      next(err);
    });

    const myError = new Error();
    topic.use(mockErrorHandle);

    topic.handleError(myError, { topic: 'my.topic.kafka' }, {}, () => {
      expect(mockErrorHandle).toHaveBeenCalledTimes(1);
      topic.handleError(myError, { topic: 'not.my.topic.kafka' }, {}, () => {
        expect(mockErrorHandle).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });
  test('topic handles parametered matching topic', () => {});
  test('topic handles parametered matching topic on error', () => {});
});
