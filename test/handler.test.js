const {
  describe, expect, test,
} = require('@jest/globals');

const HandlerClass = require('../src/handler');

describe('Handler tests', () => {
  test('handler can be instantiated', () => {
    const handler = new HandlerClass();
    expect(handler).toBeInstanceOf(HandlerClass);
  });

  test('handler can add any type of layer', () => {
    const handler = new HandlerClass();
    const layer = {
      use: (fn) => true,
    };
    handler.addLayer(layer, () => true);
    expect(handler.stack.length).toBe(1);
  });

  test('handler refuses to add a layer without a function', () => {
    const handler = new HandlerClass();
    const layer = {
      use: (fn) => true,
    };
    expect(() => {
      handler.addLayer(layer);
    }).toThrow();
  });

  test('handler refuses to add a layer with text', () => {
    const handler = new HandlerClass();
    const layer = {
      use: (fn) => true,
    };

    expect(() => {
      handler.addLayer(layer, 'text');
    }).toThrow();
  });

  test('handler refuses to add a layer with an object', () => {
    const handler = new HandlerClass();
    const layer = {
      use: (fn) => true,
    };

    expect(() => {
      handler.addLayer(layer, {});
    }).toThrow();
  });

  test('handler calls its layer when asked to handle request', (done) => {
    const handler = new HandlerClass();

    const layer = {
      use: () => true,
      handle: jest.fn((req, res, next) => {
        next();
      }),
    };

    handler.addLayer(layer, () => true);
    handler.handle({}, {}, done);

    expect(layer.handle).toHaveBeenCalled();
  });

  test('handler calls all its layers', (done) => {
    const handler = new HandlerClass();
    const mockLayerHandle = jest.fn((req, res, next) => {
      next();
    });
    const layers = [
      {
        use: () => true,
        handle: mockLayerHandle,
      },
      {
        use: () => true,
        handle: mockLayerHandle,
      },
      {
        use: () => true,
        handle: mockLayerHandle,
      },
      {
        use: () => true,
        handle: mockLayerHandle,
      },
      {
        use: () => true,
        handle: mockLayerHandle,
      },
    ];

    layers.forEach((layer) => {
      handler.addLayer(layer, () => true);
    });

    handler.handle({}, {}, done);

    expect(mockLayerHandle).toHaveBeenCalledTimes(5);
  });

  test('handler pass error through its layers and out', (done) => {
    const handler = new HandlerClass();
    const mockLayerHandle = jest.fn((req, res, next) => {
      next();
    });
    const mockLayerError = jest.fn((req, res, next) => {
      next(new Error());
    });
    const mockErrorHandler = jest.fn((err, req, res, next) => {
      next(err);
    });
    const layers = [
      {
        use: () => true,
        handle: mockLayerHandle,
      },
      {
        use: () => true,
        handle: mockLayerHandle,
      },
      {
        use: () => true,
        handle: mockLayerError,
      },
      {
        use: () => true,
        handleError: mockErrorHandler,
      },
      {
        use: () => true,
        handleError: mockErrorHandler,
      },
    ];

    layers.forEach((layer) => {
      handler.addLayer(layer, () => true);
    });

    handler.handle({}, {}, (err) => {
      expect(err).toBeInstanceOf(Error);
      done();
    });

    expect(mockLayerHandle).toHaveBeenCalledTimes(2);
    expect(mockErrorHandler).toHaveBeenCalledTimes(2);
    expect(mockLayerError).toHaveBeenCalled();
  });

  test('handler do not handle error', (done) => {
    const handler = new HandlerClass();

    handler.handleError(new Error(), {}, {}, (err) => {
      expect(err).toBeInstanceOf(Error);
      done();
    });
  });

  test('handler accepts an handled error', (done) => {
    const handler = new HandlerClass();
    const mockLayerHandle = jest.fn((req, res, next) => {
      next();
    });
    const mockLayerError = jest.fn((req, res, next) => {
      next(new Error());
    });
    const mockErrorHandler = jest.fn((err, req, res, next) => {
      next(err);
    });
    const mockErrorHandling = jest.fn((err, req, res, next) => {
      next('handled');
    });
    const layers = [
      {
        use: () => true,
        handle: mockLayerHandle,
      },
      {
        use: () => true,
        handle: mockLayerError,
      },
      {
        use: () => true,
        handleError: mockErrorHandler,
      },
      {
        use: () => true,
        handleError: mockErrorHandling,
      },
      {
        use: () => true,
        handle: mockLayerHandle,
      },
      {
        use: () => true,
        handle: mockLayerHandle,
      },
    ];

    layers.forEach((layer) => {
      handler.addLayer(layer, () => true);
    });

    handler.handle({}, {}, done);

    expect(mockLayerHandle).toHaveBeenCalledTimes(3);
    expect(mockErrorHandler).toHaveBeenCalled();
    expect(mockErrorHandling).toHaveBeenCalled();
    expect(mockLayerError).toHaveBeenCalled();
  });

  test('handler accepts an exit call', (done) => {
    const handler = new HandlerClass();
    const mockLayerHandle = jest.fn((req, res, next) => {
      next();
    });
    const mockExitLayer = jest.fn((req, res, next) => {
      next('handler-exit');
    });
    const layers = [
      {
        use: () => true,
        handle: mockLayerHandle,
      },
      {
        use: () => true,
        handle: mockLayerHandle,
      },
      {
        use: () => true,
        handle: mockExitLayer,
      },
      {
        use: () => true,
        handle: mockLayerHandle,
      },
      {
        use: () => true,
        handle: mockLayerHandle,
      },
    ];

    layers.forEach((layer) => {
      handler.addLayer(layer, () => true);
    });

    handler.handle({}, {}, done);

    expect(mockLayerHandle).toHaveBeenCalledTimes(2);
    expect(mockExitLayer).toHaveBeenCalled();
  });
});
