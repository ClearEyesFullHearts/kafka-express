const {
  describe, expect, test,
} = require('@jest/globals');

const Application = require('../lib/application');
const Topic = require('../lib/topic');

describe('Application tests', () => {
  test('Application can be instantiated', () => {
    const app = new Application();
    expect(app).toBeInstanceOf(Application);
    expect(app.route).toBe('.');
  });

  test('Application.path returns all unique middleware\'s path', () => {
    const app = new Application();

    const testTopic = new Topic('test');
    testTopic.use((req, res, next) => next());
    const timesTopic = new Topic('times');
    timesTopic.use((req, res, next) => next());

    const effortTopic = new Topic('effort');

    const muteTopic = new Topic('mute');

    app.use(effortTopic);
    effortTopic.use(timesTopic);
    timesTopic.use(testTopic);
    app.use(muteTopic);

    const firstPaths = app.paths;
    expect(firstPaths).toEqual([
      'effort.times',
      'effort.times.test',
    ]);

    muteTopic.use((req, res, next) => next());
    const secondPaths = app.paths;
    expect(secondPaths).toEqual([
      'effort.times',
      'effort.times.test',
      'mute',
    ]);
  });

  test('Application.topics returns all unique middleware\'s regex path', () => {
    const app = new Application();

    const testTopic = new Topic('test');
    testTopic.use((req, res, next) => next());
    const timesTopic = new Topic('times');
    timesTopic.use((req, res, next) => next());

    const effortTopic = new Topic('effort');

    const muteTopic = new Topic('mute');

    app.use(effortTopic);
    effortTopic.use(timesTopic);
    timesTopic.use(testTopic);
    app.use(muteTopic);

    const firstPaths = app.topics;
    expect(firstPaths).toEqual([
      /^effort\.times\/?$/i,
      /^effort\.times\.test\/?$/i,
    ]);

    muteTopic.use((req, res, next) => next());
    const secondPaths = app.topics;
    expect(secondPaths).toEqual([
      /^effort\.times\/?$/i,
      /^effort\.times\.test\/?$/i,
      /^mute\/?$/i,
    ]);
  });

  test('Application.onMessage starts the handling cycle with req, res, next', async () => {
    const kafkaMessage = {
      topic: 'topic.user',
      partition: '1',
      message: {
        key: 'id',
        value: JSON.stringify({ foo: 'bar' }),
      },
    };

    const app = new Application();
    const result = [];
    app.use((req, res, next) => {
      result.push('first');
      next();
    });

    app.use('topic.*', (req, res, next) => {
      result.push('second');
      next();
    });

    const testTopic = new Topic('topic');
    testTopic.use('user', (req, res, next) => {
      result.push('third');
      next();
    });

    app.use(testTopic);

    await app.onMessage(kafkaMessage);

    expect(result).toEqual([
      'first',
      'second',
      'third',
    ]);
  });

  test('Application.onMessage throws errors from middlewares if they are not handled', async () => {
    const kafkaMessage = {
      topic: 'topic.user',
      partition: '1',
      message: {
        key: 'id',
        value: JSON.stringify({ foo: 'bar' }),
      },
    };

    const app = new Application();
    const result = [];
    app.use((req, res, next) => {
      result.push('first');
      next();
    });

    app.use('topic.*', (req, res, next) => {
      result.push('second');
      next();
    });

    const testTopic = new Topic('topic');
    testTopic.use('user', (req, res, next) => {
      result.push('third');
      throw new Error('error from middleware');
    });

    app.use(testTopic);

    try {
      await app.onMessage(kafkaMessage);
    } catch (err) {
      expect(err.message).toBe('error from middleware');

      expect(result).toEqual([
        'first',
        'second',
        'third',
      ]);
      return;
    }

    expect(true).toBeFalsy();
  });

  test('Application.onMessage do not throw errors if they are handlded', async () => {
    const kafkaMessage = {
      topic: 'topic.user',
      partition: '1',
      message: {
        key: 'id',
        value: JSON.stringify({ foo: 'bar' }),
      },
    };

    const app = new Application();
    const result = [];
    app.use((req, res, next) => {
      result.push('first');
      next();
    });

    app.use('topic.*', (req, res, next) => {
      result.push('second');
      next(new Error('error pushed down the stack'));
    });
    app.use('nottopic', (err, req, res, next) => {
      result.push('error middleware not matching');
      next('router-exit');
    });

    const testTopic = new Topic('topic');
    testTopic.use('user', (err, req, res, next) => {
      result.push(err.message);
      next(err);
    });

    app.use(testTopic);

    app.use((err, req, res, next) => {
      result.push('global error middleware is a catch all');
      next();
    });

    await app.onMessage(kafkaMessage);

    expect(result).toEqual([
      'first',
      'second',
      'error pushed down the stack',
      'global error middleware is a catch all',
    ]);
  });
});
