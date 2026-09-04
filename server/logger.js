export function createServerLogger({
  debugEnabled = process.env.DEBUG_SERVER === "true",
  sink = console,
} = {}) {
  return {
    log(...args) {
      if (debugEnabled) sink.log(...args);
    },
    info(...args) {
      sink.info(...args);
    },
    error(...args) {
      sink.error(...args);
    },
  };
}
