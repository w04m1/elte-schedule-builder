import PQueue from "p-queue";

export class QueueCapacityError extends Error {
  constructor() {
    super("Subject request queue is full");
    this.name = "QueueCapacityError";
    this.status = 503;
  }
}

/**
 * Serializes upstream Tanrend requests.
 *
 * A single worker runs at most `intervalCap` requests per `interval`, so
 * upstream traffic stays throttled instead of bursting in parallel.
 * Concurrent requests for the same term and subject are coalesced into one
 * upstream call.
 */
export class SubjectRequestQueue {
  constructor({ handler, delay = 500, maxQueued = 100 } = {}) {
    this.handler = handler;
    this.maxQueued = maxQueued;
    this.pending = new Map();
    this.queue = new PQueue({
      concurrency: 1,
      interval: delay,
      intervalCap: 1,
    });
  }

  enqueue(searchTerm, term, searchMode = "code") {
    const key = `${term}-${searchMode}-${searchTerm}`;
    const pendingRequest = this.pending.get(key);
    if (pendingRequest) return pendingRequest;

    if (this.queue.size >= this.maxQueued) {
      return Promise.reject(new QueueCapacityError());
    }

    const request = this.queue.add(() =>
      this.handler(searchTerm, term, searchMode),
    );
    const trackedRequest = request.finally(() => this.pending.delete(key));
    this.pending.set(key, trackedRequest);
    return trackedRequest;
  }
}
