import { logError } from './log/log-error.js';

export function handleError(callback) {
  return (...args) => {
    try {
      const result = callback(...args);
      if (result instanceof Promise) {
        return result.catch(logError);
      }
    } catch (error) {
      logError(error);
    }
  };
}
