import { describe, expect, it, vi } from "vitest";
import { createServerLogger } from "../../server/logger.js";

function createSink() {
  return {
    log: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  };
}

describe("server logger", () => {
  it("keeps verbose diagnostics quiet by default", () => {
    const sink = createSink();
    const logger = createServerLogger({ debugEnabled: false, sink });

    logger.log("cache hit");

    expect(sink.log).not.toHaveBeenCalled();
  });

  it("emits verbose diagnostics when debugging is enabled", () => {
    const sink = createSink();
    const logger = createServerLogger({ debugEnabled: true, sink });

    logger.log("cache hit");

    expect(sink.log).toHaveBeenCalledWith("cache hit");
  });

  it("always emits startup information and errors", () => {
    const sink = createSink();
    const logger = createServerLogger({ debugEnabled: false, sink });

    logger.info("started");
    logger.error("failed");

    expect(sink.info).toHaveBeenCalledWith("started");
    expect(sink.error).toHaveBeenCalledWith("failed");
  });
});
