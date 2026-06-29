export function createLogger(serviceName) {
  const prefix = `[${serviceName}]`;
  return {
    info: (...args) => console.log(prefix, ...args),
    warn: (...args) => console.warn(prefix, ...args),
    error: (...args) => console.error(prefix, ...args),
    debug: (...args) => {
      if (process.env.NODE_ENV !== "production") console.debug(prefix, ...args);
    }
  };
}
