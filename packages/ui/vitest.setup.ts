import '@testing-library/jest-dom/vitest';

if (typeof document.elementFromPoint !== 'function') {
  document.elementFromPoint = () => document.body;
}
