const { initIntersectionObserver } = require('./main');

describe('IntersectionObserver Tests', () => {
  let observeMock;
  let unobserveMock;
  let disconnectMock;

  beforeEach(() => {
    // Reset mocks before each test
    observeMock = jest.fn();
    unobserveMock = jest.fn();
    disconnectMock = jest.fn();

    // Mock IntersectionObserver
    global.IntersectionObserver = jest.fn().mockImplementation((callback) => {
      // Store the callback so we can manually trigger it in tests
      global.intersectionCallback = callback;
      return {
        observe: observeMock,
        unobserve: unobserveMock,
        disconnect: disconnectMock,
      };
    });

    // Clear DOM
    document.body.innerHTML = '';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should observe elements with class .fade-in on initialization', () => {
    // Setup DOM elements
    const el1 = document.createElement('div');
    el1.classList.add('fade-in');
    document.body.appendChild(el1);

    const el2 = document.createElement('div');
    el2.classList.add('fade-in');
    document.body.appendChild(el2);

    // Run the function
    initIntersectionObserver();

    // Verify observe was called for each element
    expect(observeMock).toHaveBeenCalledTimes(2);
    expect(observeMock).toHaveBeenCalledWith(el1);
    expect(observeMock).toHaveBeenCalledWith(el2);
  });

  test('should add .visible class and unobserve when element intersects', () => {
    // Setup DOM element
    const el = document.createElement('div');
    el.classList.add('fade-in');
    document.body.appendChild(el);

    initIntersectionObserver();

    // Simulate intersection
    const entry = {
      target: el,
      isIntersecting: true,
    };

    // Trigger the observer callback
    global.intersectionCallback([entry]);

    // Verify .visible class was added
    expect(el.classList.contains('visible')).toBe(true);

    // Verify unobserve was called
    expect(unobserveMock).toHaveBeenCalledWith(el);
  });

  test('should NOT add .visible class if element does not intersect', () => {
    // Setup DOM element
    const el = document.createElement('div');
    el.classList.add('fade-in');
    document.body.appendChild(el);

    initIntersectionObserver();

    // Simulate NO intersection
    const entry = {
      target: el,
      isIntersecting: false,
    };

    // Trigger the observer callback
    global.intersectionCallback([entry]);

    // Verify .visible class was NOT added
    expect(el.classList.contains('visible')).toBe(false);

    // Verify unobserve was NOT called
    expect(unobserveMock).not.toHaveBeenCalled();
  });
});
