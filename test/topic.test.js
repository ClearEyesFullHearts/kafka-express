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

  test('topic do not handle error directly', (done) => {
    const topic = new TopicClass('my.topic.kafka');

    const mockErrorHandle = jest.fn((err, req, res, next) => {
      next(err);
    });
    topic.use(mockErrorHandle);

    topic.handleError(new Error(), { topic: 'my.topic.kafka' }, {}, (err1) => {
      expect(err1).toBeInstanceOf(Error);
      expect(mockErrorHandle).not.toHaveBeenCalled();
      topic.handleError(new Error(), { topic: 'another.topic.kafka' }, {}, (err2) => {
        expect(err2).toBeInstanceOf(Error);
        expect(mockErrorHandle).not.toHaveBeenCalled();
        done();
      });
    });
  });

  test('topic handles parametered matching topic', (done) => {
    const topic = new TopicClass('my.topic.:id');
    let myParam = '';
    const mockLayerHandle = jest.fn((req, res, next) => {
      myParam = req.params.id;
      next();
    });
    topic.use(mockLayerHandle);
    topic.handle({ topic: 'my.topic.138' }, {}, () => {
      expect(mockLayerHandle).toHaveBeenCalledTimes(1);
      expect(myParam).toBe('138');
      done();
    });
  });

  test('* topic handles every messages', (done) => {
    const topic = new TopicClass('*');

    const mockLayerHandle = jest.fn((req, res, next) => {
      next();
    });
    topic.use(mockLayerHandle);
    topic.handle({ topic: 'my.topic.138' }, {}, () => {
      expect(mockLayerHandle).toHaveBeenCalledTimes(1);
      topic.handle({ topic: 'test.test' }, {}, () => {
        expect(mockLayerHandle).toHaveBeenCalledTimes(2);
        topic.handle({ topic: 'notatopic' }, {}, () => {
          expect(mockLayerHandle).toHaveBeenCalledTimes(3);
          done();
        });
      });
    });
  });
});
