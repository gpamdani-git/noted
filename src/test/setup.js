import '@testing-library/jest-dom';

// Polyfill window.getSelection and Range for JSDOM
if (typeof window !== 'undefined') {
  if (!window.getSelection) {
    window.getSelection = () => ({
      rangeCount: 0,
      getRangeAt: () => null,
      removeAllRanges: () => {},
      addRange: () => {},
      toString: () => ''
    });
  }

  // Mock scroll into view and layout functions
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || function () {};
}
