const {
  describe, expect, test,
} = require('@jest/globals');

const LayerClass = require('../src/topic/layer');

describe('Layer tests', () => {
  test('layer can be instantiated', () => {
    const layer = new LayerClass();
    expect(layer).toBeInstanceOf(LayerClass);
  });

  test('layer uses a function', () => {
    const layer = new LayerClass();
    layer.use(() => true);
    expect(layer.stack.length).toBe(1);
  });
  test('layer uses only one function', () => {
    const layer = new LayerClass();
    layer.use(() => true);
    layer.use(() => true);
    layer.use(() => true);
    expect(layer.stack.length).toBe(1);
  });
  test('layer uses only the last function', () => {
    const layer = new LayerClass();
    layer.use({ name: 'first function' });
    layer.use({ name: 'second function' });
    layer.use({ name: 'third function' });
    expect(layer.stack.length).toBe(1);
    const [{ name }] = layer.stack;
    expect(name).toBe('third function');
  });
  test('layer takes its name from the function it uses', () => {
    const layer = new LayerClass();
    expect(layer.name).toBe('<anonymous>');
    layer.use({ name: 'first function' });
    expect(layer.name).toBe('first function');
    layer.use(() => true);
    expect(layer.name).toBe('<anonymous>');
    layer.use({ name: 'third function' });
    expect(layer.name).toBe('third function');
  });
  test('layer handles the request', (done) => {
    const layer = new LayerClass();
    const mockLayerHandle = jest.fn((req, res, next) => {
      next();
    });
    layer.use(mockLayerHandle);
    layer.handle({}, {}, () => {
      expect(mockLayerHandle).toHaveBeenCalled();
      done();
    });
  });
  test('layer do not handle an error with its middleware', (done) => {
    const layer = new LayerClass();
    const mockLayerHandle = jest.fn((req, res, next) => {
      next();
    });
    layer.use(mockLayerHandle);
    const myError = new Error();
    layer.handleError(myError, {}, {}, (err) => {
      expect(mockLayerHandle).not.toHaveBeenCalled();
      expect(err === myError).toBeTruthy();
      done();
    });
  });
  test('layer do not handle a request with an error middleware', (done) => {
    const layer = new LayerClass();
    const mockLayerHandle = jest.fn((err, req, res, next) => {
      next(err);
    });
    layer.use(mockLayerHandle);
    layer.handle({}, {}, () => {
      expect(mockLayerHandle).not.toHaveBeenCalled();
      done();
    });
  });
  test('layer handles an error with its error middleware', (done) => {
    const layer = new LayerClass();
    const mockLayerHandle = jest.fn((err, req, res, next) => {
      next(new Error('test error'));
    });
    layer.use(mockLayerHandle);
    const myError = new Error('original error');
    layer.handleError(myError, {}, {}, (err) => {
      expect(mockLayerHandle).toHaveBeenCalled();
      expect(err === myError).toBeFalsy();
      done();
    });
  });
  test('layer pass through an error coming from its middleware', (done) => {
    const layer = new LayerClass();
    const mockLayerHandle = jest.fn(() => {
      throw new Error();
    });
    layer.use(mockLayerHandle);
    layer.handle({}, {}, (err) => {
      expect(mockLayerHandle).toHaveBeenCalled();
      expect(err).toBeInstanceOf(Error);
      done();
    });
  });
  test('layer pass through an error coming from its error middleware', (done) => {
    const layer = new LayerClass();
    const mockLayerHandle = jest.fn((err, req, res, next) => {
      throw new Error();
    });
    layer.use(mockLayerHandle);
    layer.handleError(new Error(), {}, {}, (err) => {
      expect(mockLayerHandle).toHaveBeenCalled();
      expect(err).toBeInstanceOf(Error);
      done();
    });
  });
});
