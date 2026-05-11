# Reference: WebSocket Architecture (Imported)

Source: /Users/byronwall/Projects/llm-question-asker/docs/websocket-architecture.md

# WebSocket Implementation and Cross-Process Communication

## Overview

This document describes the websocket-based real-time job tracking system implemented for the LLM Question Asker application. The architecture addresses a unique challenge: how to push updates to connected websocket clients when the work happens in a different Node.js process than the one handling the websocket connection.

### The Problem

In a typical SolidStart/Vinxi application:

- Server actions run in one process/worker
- WebSocket handlers run in a different process/worker
- File-based job tracking (`jobs-db.ts`) persists job state to disk
- Multiple clients need real-time updates when job state changes

The challenge is bridging the gap: when a job is updated in the server action process, how do we notify the websocket process so it can broadcast updates to connected clients?

### The Solution: Node.js BroadcastChannel

The solution uses Node.js's built-in `BroadcastChannel` API (from `node:worker_threads`) to create a lightweight pub/sub mechanism that works across worker threads in the same Node.js instance.

## Architecture Components

### 1. Cross-Process Event Bus (`job-events.ts`)

**Location:** `app/src/server/job-events.ts`

This module provides a minimal event bus for publishing and subscribing to job updates across process boundaries.

```typescript
import { BroadcastChannel } from "node:worker_threads";
import type { Job } from "../lib/job-types";

type JobEventListener = (job: Job) => void;

const channel = new BroadcastChannel("jobs-updates");

type JobUpdateMessage = {
  type: "job:update";
  job: Job;
};

export const publishJobUpdate = (job: Job) => {
  const message: JobUpdateMessage = { type: "job:update", job };
  channel.postMessage(message);
};

export const subscribeJobUpdates = (listener: JobEventListener) => {
  const handleMessage = (event: { data: JobUpdateMessage }) => {
    if (event.data?.type !== "job:update") return;
    listener(event.data.job);
  };

  channel.addEventListener("message", handleMessage);
  console.log("job-events:subscribe", {
    pid: process.pid,
    thread: process.threadId,
  });

  return () => {
    channel.removeEventListener("message", handleMessage);
    console.log("job-events:unsubscribe", {
      pid: process.pid,
      thread: process.threadId,
    });
  };
};
```

**Key Design Decisions:**

1. **Single Channel:** All job updates flow through one named channel (`"jobs-updates"`)
2. **Typed Messages:** Message format is strictly typed with a discriminated union
3. **Cleanup Functions:** `subscribeJobUpdates` returns an unsubscribe function for proper resource cleanup
4. **Process Logging:** Includes PID and thread ID in logs to help debug cross-process behavior

### 2. Jobs Database with Event Publishing (`jobs-db.ts`)

**Location:** `app/src/server/jobs-db.ts`

The jobs database layer is enhanced with two notification mechanisms:

- In-process listeners (for same-process subscribers)
- Cross-process events via BroadcastChannel (for other workers)

```typescript
import { publishJobUpdate } from "./job-events";

type JobListener = (job: Job) => void;
const listeners = new Set<JobListener>();

const notifyJobUpdate = (job: Job) => {
  console.log("jobs-db:notifyJobUpdate", {
    jobId: job.id,
    listeners: listeners.size,
  });
  if (listeners.size === 0) return;
  for (const listener of listeners) {
    try {
      listener(job);
    } catch (err) {
      console.error("jobs-db:listener:error", err);
    }
  }
};

class JobsDb {
  // ... other methods ...

  private async modifyJob<T>(
    jobId: string,
    fn: (job: Job) => Promise<T>
  ): Promise<T> {
    let result: T;
    this.writeQueue = this.writeQueue.then(async () => {
      const data = await this.readJobFile(jobId);
      if (!data) throw new Error("Job not found");
      result = await fn(data);
      await this.writeJobFile(jobId, data);
      notifyJobUpdate(data); // In-process notification
      publishJobUpdate(data); // Cross-process notification
    });
    await this.writeQueue;
    return result;
  }

  onJobUpdate(listener: JobListener) {
    listeners.add(listener);
    console.log("jobs-db:listener:add", { listeners: listeners.size });
    return () => {
      listeners.delete(listener);
      console.log("jobs-db:listener:remove", { listeners: listeners.size });
    };
  }
}
```

**Key Points:**

1. **Dual Notification:** Every job update triggers both in-process and cross-process notifications
2. **Error Isolation:** Listener errors are caught and logged without breaking the update flow
3. **Write Queue:** Updates are serialized through a promise chain to prevent race conditions
4. **Cleanup Pattern:** `onJobUpdate` returns an unsubscribe function

### 3. WebSocket Server Handler (`ws/jobs.ts`)

**Location:** `app/src/ws/jobs.ts`

The websocket handler manages connected clients and subscribes to job updates from the event bus.

```typescript
import { eventHandler } from "vinxi/http";
import type { JobSocketServerMessage } from "../lib/job-socket-messages";
import type { Job } from "../lib/job-types";
import { jobsDb } from "../server/jobs-db";
import { subscribeJobUpdates } from "../server/job-events";

const sendMessage = (peer: Peer, message: JobSocketServerMessage) => {
  peer.send(JSON.stringify(message));
};

const peers = new Set<Peer>();
let unsubscribe: (() => void) | null = null;

const broadcastJob = (job: Job) => {
  for (const peer of peers) {
    try {
      sendMessage(peer, { type: "jobs:update", job });
    } catch (err) {
      console.error("job-socket:broadcast:error", { id: peer.id, err });
    }
  }
};

const ensureSubscription = () => {
  if (unsubscribe) return;
  unsubscribe = subscribeJobUpdates((job) => {
    broadcastJob(job);
  });
  console.log("job-socket:subscription:start");
};

const stopSubscriptionIfIdle = () => {
  if (peers.size > 0) return;
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
    console.log("job-socket:subscription:stop");
  }
};

const handler = eventHandler({
  handler() {},
  websocket: {
    async open(peer) {
      peers.add(peer);
      console.log("job-socket:open", {
        id: peer.id,
        url: peer.request.url,
        peers: peers.size,
      });
      ensureSubscription();
      try {
        const activeJobs = await jobsDb().listActiveJobs();
        sendMessage(peer, { type: "jobs:init", jobs: activeJobs });
      } catch (err) {
        console.error("job-socket:init:error", err);
      }
    },
    close(peer, details) {
      peers.delete(peer);
      console.log("job-socket:close", {
        id: peer.id,
        url: peer.request.url,
        code: details.code,
        reason: details.reason,
        peers: peers.size,
      });
      stopSubscriptionIfIdle();
    },
    message(peer, message) {
      console.log("job-socket:message", {
        id: peer.id,
        url: peer.request.url,
        hasData: !!message,
      });
    },
    error(peer, error) {
      console.error("job-socket:error", {
        id: peer.id,
        url: peer.request.url,
        error,
      });
    },
  },
});

export default handler;
```

**Key Design Patterns:**

1. **Lazy Subscription:** Only subscribe to updates when at least one client is connected
2. **Automatic Cleanup:** Unsubscribe when the last client disconnects to avoid memory leaks
3. **Initial Snapshot:** Send current active jobs on connection (`jobs:init` message)
4. **Broadcast Updates:** Forward all job updates to all connected clients
5. **Error Isolation:** Broadcast errors don't break the loop (failed sends are logged)

### 4. WebSocket Route Configuration (`app.config.ts`)

**Location:** `app/app.config.ts`

SolidStart requires explicit configuration for websocket support:

```typescript
import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  server: {
    experimental: {
      websocket: true, // Enable websocket support
    },
  },
}).addRouter({
  name: "ws",
  type: "http",
  handler: "./src/ws/jobs.ts",
  target: "server",
  base: "/ws/jobs", // Websocket endpoint path
});
```

**Important Notes:**

- Websocket support is still experimental in SolidStart
- The router type is `"http"` even though it handles websockets
- The `base` path defines where clients connect (`ws://host/ws/jobs`)

### 5. Client-Side WebSocket Client (`job-socket-client.ts`)

**Location:** `app/src/lib/job-socket-client.ts`

A robust websocket client with automatic reconnection and exponential backoff.

```typescript
export type JobSocketStatus =
  | "idle"
  | "connecting"
  | "open"
  | "closed"
  | "error";

type JobSocketClientOptions = {
  path: string;
  onMessage: (message: JobSocketServerMessage) => void;
  onStatus?: (status: JobSocketStatus) => void;
};

const MAX_RECONNECT_DELAY_MS = 15000;
const BASE_RECONNECT_DELAY_MS = 500;
const RECONNECT_JITTER_MS = 300;

const makeSocketUrl = (path: string) => {
  if (!isBrowser()) return path;
  const base = window.location.origin.replace(/^http/, "ws");
  return new URL(path, base).toString();
};

const nextDelay = (attempt: number) => {
  const jitter = Math.floor(Math.random() * RECONNECT_JITTER_MS);
  const delay = BASE_RECONNECT_DELAY_MS * 2 ** attempt + jitter;
  return Math.min(delay, MAX_RECONNECT_DELAY_MS);
};

export function createJobSocketClient(
  options: JobSocketClientOptions
): JobSocketClient {
  let socket: WebSocket | null = null;
  let reconnectTimer: number | null = null;
  let reconnectAttempt = 0;
  let shouldReconnect = true;

  const scheduleReconnect = () => {
    if (!isBrowser() || !shouldReconnect) return;
    clearReconnectTimer();
    const delay = nextDelay(reconnectAttempt);
    reconnectAttempt += 1;
    reconnectTimer = window.setTimeout(() => {
      connect();
    }, delay);
  };

  const handleClose = (event: CloseEvent) => {
    console.warn("job-socket:close", {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
    });
    setStatus("closed");
    scheduleReconnect();
  };

  const connect = () => {
    if (!isBrowser()) return;
    if (socket && socket.readyState !== WebSocket.CLOSED) return;
    clearReconnectTimer();
    setStatus("connecting");
    const url = makeSocketUrl(options.path);
    socket = new WebSocket(url);
    socket.addEventListener("open", handleOpen);
    socket.addEventListener("close", handleClose);
    socket.addEventListener("error", handleError);
    socket.addEventListener("message", handleMessage);
  };

  return { connect, close, send };
}
```

**Client Features:**

1. **Exponential Backoff:** Reconnect delays double with each attempt (capped at 15s)
2. **Jitter:** Random jitter prevents thundering herd on server restarts
3. **Automatic Reconnection:** Handles disconnects gracefully
4. **URL Construction:** Automatically converts HTTP URLs to WS URLs
5. **Browser-Only:** Guards against SSR execution

### 6. SolidJS Integration (`job-context.tsx`)

**Location:** `app/src/components/jobs/job-context.tsx`

The JobProvider integrates the websocket client into the SolidJS reactive system.

```typescript
export function JobProvider(props: ParentProps) {
  const [jobsById, setJobsById] = createStore<Record<string, Job>>({});
  const [activeJobIds, setActiveJobIds] = createSignal<string[]>([]);

  const handleJobUpdate = (job: Job) => {
    batch(() => {
      setJobsById(job.id, job);
      if (isActiveStage(job.stage)) {
        setActiveJobIds((prev) => sortJobIds([...prev, job.id]));
      } else {
        setActiveJobIds((prev) => prev.filter((id) => id !== job.id));
      }
    });
  };

  const handleSocketMessage = (message: JobSocketServerMessage) => {
    if (message.type === "jobs:init") {
      console.log("JobProvider:socket:init", {
        count: message.jobs.length,
      });
      applyActiveJobsSnapshot(message.jobs);
      return;
    }

    if (message.type === "jobs:update") {
      handleJobUpdate(message.job);
    }
  };

  onMount(() => {
    if (typeof window === "undefined") return;
    const socket = createJobSocketClient({
      path: "/ws/jobs",
      onMessage: handleSocketMessage,
      onStatus: (status) => {
        console.log("JobProvider:socket:status", { status });
      },
    });
    socket.connect();

    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      socket.connect();
      fetchJobs();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    onCleanup(() => {
      document.removeEventListener("visibilitychange", handleVisibility);
      socket.close();
    });
  });

  return <Ctx.Provider value={value()}>{props.children}</Ctx.Provider>;
}
```

**Integration Patterns:**

1. **Store for Jobs:** Uses `createStore` for reactive job data
2. **Batch Updates:** Wraps multiple signal updates in `batch()` to prevent unnecessary renders
3. **Visibility Handling:** Reconnects when tab becomes visible again
4. **Proper Cleanup:** Removes listeners and closes socket on unmount
5. **SSR Guard:** Only initializes socket in browser (`typeof window !== "undefined"`)

## Message Flow

### Scenario: Long-Running Job Updates

1. **User triggers job** (e.g., creates a session)

   - Client calls server action `createSession()`
   - Action runs in worker process A

2. **Job is created**

   - `jobsDb().createJob()` writes to disk
   - Calls `notifyJobUpdate(job)` → no in-process listeners
   - Calls `publishJobUpdate(job)` → posts to BroadcastChannel

3. **Update crosses process boundary**

   - BroadcastChannel delivers message to all workers
   - Worker process B (running websocket handler) receives it
   - `subscribeJobUpdates` callback fires with job data

4. **WebSocket broadcasts to clients**

   - `broadcastJob()` iterates all connected peers
   - Each peer receives `{ type: "jobs:update", job }` message

5. **Client updates UI**
   - `handleSocketMessage` receives update
   - `handleJobUpdate` updates SolidJS store
   - Components reactively re-render with new job state

### Visual Flow Diagram

```
Server Action Process (Worker A)          WebSocket Process (Worker B)
─────────────────────────                ────────────────────────────

createSession()
    │
    ▼
jobsDb.createJob()
    │
    ├─► Write to disk
    │
    ├─► notifyJobUpdate() (no-op)
    │
    └─► publishJobUpdate()
            │
            └──► BroadcastChannel ─────► subscribeJobUpdates()
                                               │
                                               ▼
                                         broadcastJob()
                                               │
                                               ▼
                                         WebSocket.send()
                                               │
                                               └──────► Client
                                                         │
                                                         ▼
                                                    JobProvider
                                                         │
                                                         ▼
                                                    UI Updates
```

## Evolution: From File Watching to BroadcastChannel

### Initial Implementation (File Watching)

The first implementation used Node.js's `fs.watch()` API to monitor the jobs directory:

```typescript
// OLD APPROACH - removed in favor of BroadcastChannel
import { watch, type FSWatcher } from "node:fs";

const pendingUpdates = new Map<string, ReturnType<typeof setTimeout>>();
let watcher: FSWatcher | null = null;

const scheduleJobBroadcast = (jobId: string) => {
  const existing = pendingUpdates.get(jobId);
  if (existing) clearTimeout(existing);

  const timeout = setTimeout(async () => {
    pendingUpdates.delete(jobId);
    const job = await jobsDb().getJob(jobId);
    if (!job) return;
    broadcastJob(job);
  }, 50);

  pendingUpdates.set(jobId, timeout);
};

const handleWatchEvent = (eventType: string, filename?: string | Buffer) => {
  if (!filename) return;
  const name = typeof filename === "string" ? filename : filename.toString();
  if (!name.endsWith(".json")) return;
  const jobId = name.slice(0, -".json".length);
  scheduleJobBroadcast(jobId);
};

const ensureWatcher = async () => {
  if (watcher) return;
  const dir = getJobsDirPath();
  await mkdir(dir, { recursive: true });
  watcher = watch(dir, handleWatchEvent);
};
```

### Problems with File Watching

1. **Debouncing Required:** File system events fired multiple times per update
2. **Extra I/O:** Required reading the file back from disk after just writing it
3. **Timing Issues:** Race conditions between write completion and watch events
4. **Platform Differences:** `fs.watch()` behavior varies across operating systems
5. **Resource Overhead:** Watching directories has OS-level overhead

### Benefits of BroadcastChannel

1. **Direct Communication:** No file I/O round-trip needed
2. **Immediate:** Updates arrive instantly without polling or debouncing
3. **Structured Data:** Pass Job objects directly instead of parsing files
4. **Built-in:** No external dependencies, just Node.js standard library
5. **Clean API:** Simple pub/sub with proper cleanup

### The Git Diff

The key change shows the simplification:

```diff
-import { watch, type FSWatcher } from "node:fs";
-import { mkdir } from "node:fs/promises";
-import path from "node:path";
+import { subscribeJobUpdates } from "../server/job-events";

-const pendingUpdates = new Map<string, ReturnType<typeof setTimeout>>();
-let watcher: FSWatcher | null = null;
+let unsubscribe: (() => void) | null = null;

-const scheduleJobBroadcast = (jobId: string) => { /* ... */ };
-const handleWatchEvent = (eventType: string, filename?: string | Buffer) => { /* ... */ };
-const ensureWatcher = async () => { /* ... */ };
+const ensureSubscription = () => {
+  if (unsubscribe) return;
+  unsubscribe = subscribeJobUpdates((job) => {
+    broadcastJob(job);
+  });
+  console.log("job-socket:subscription:start");
+};
```

## Testing the Implementation

### Dummy Job for Testing

The implementation includes a "dummy job" flow that simulates long-running work without making real LLM API calls:

```typescript
const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

async function processDummySession(jobId: string, sessionId: string) {
  const jobs = jobsDb();
  const database = db();

  try {
    console.log("processDummySession:extract", { jobId });
    await jobs.updateJobStage(jobId, "extract");
    await sleep(400);

    console.log("processDummySession:analyze", { jobId });
    await jobs.updateJobStage(jobId, "analyze");
    await sleep(400);

    console.log("processDummySession:generate", { jobId });
    await jobs.updateJobStage(jobId, "generate");
    await sleep(500);

    console.log("processDummySession:finalize", { jobId });
    await jobs.updateJobStage(jobId, "finalize");
    await sleep(400);

    const round = {
      id: crypto.randomUUID(),
      questions: makeDummyQuestions(),
      answers: [],
      result: null,
      createdAt: new Date().toISOString(),
    };
    await database.updateSession(sessionId, {
      title: "Sample Consultation",
      description: "Demo session generated without LLM calls.",
      rounds: [round],
    });

    console.log("processDummySession:completed", { jobId, sessionId });
    await jobs.completeJob(jobId, sessionId);
  } catch (err) {
    console.error("processDummySession:failed", { jobId, error: err });
    await jobs.failJob(jobId, String(err));
  }
}
```

**Why This Matters:**

- Allows testing the full websocket flow without API costs
- Predictable timing for verifying UI responsiveness
- Each stage update triggers a broadcast
- Useful for load testing with multiple concurrent dummy jobs

## Key Takeaways

### Architecture Patterns

1. **Event-Driven Architecture:** Decouple producers (jobs-db) from consumers (websocket handler)
2. **Pub/Sub Pattern:** BroadcastChannel enables clean publish/subscribe across processes
3. **Lazy Resources:** Only subscribe when needed, cleanup when idle
4. **Resilient Clients:** Exponential backoff and jitter for reconnection

### SolidJS Best Practices

1. **Batch Updates:** Use `batch()` when updating multiple signals
2. **SSR Guards:** Check `typeof window !== "undefined"` before browser APIs
3. **Cleanup Functions:** Always return cleanup from `onMount`
4. **Visibility Handling:** Reconnect websockets when tabs become visible

### Operational Considerations

1. **Logging Strategy:** Process ID and thread ID help debug multi-process issues
2. **Error Isolation:** Catch errors in loops to prevent cascade failures
3. **Resource Cleanup:** Unsubscribe when no longer needed
4. **State Synchronization:** Send full snapshot on connect + incremental updates

## Future Enhancements

### Potential Improvements

1. **Message Acknowledgment:** Track which clients received which updates
2. **Reconnection State:** Resume from last known state instead of full refresh
3. **Selective Subscriptions:** Allow clients to subscribe to specific job IDs
4. **Compression:** Enable websocket compression for larger payloads
5. **Metrics:** Track connection count, message rates, reconnection frequency

### Scaling Considerations

The current BroadcastChannel approach works within a single Node.js instance (multiple workers). For multi-server deployments, consider:

1. **Redis Pub/Sub:** Replace BroadcastChannel with Redis for cross-server communication
2. **Shared State:** Move from file-based storage to Redis or database
3. **Sticky Sessions:** Ensure websocket connections stick to same server
4. **Message Queue:** Use RabbitMQ/SQS for reliable message delivery

## Related Files

- `app/src/server/job-events.ts` - Cross-process event bus
- `app/src/server/jobs-db.ts` - Job persistence with event publishing
- `app/src/ws/jobs.ts` - WebSocket server handler
- `app/src/lib/job-socket-client.ts` - WebSocket client with reconnection
- `app/src/lib/job-socket-messages.ts` - Type definitions for messages
- `app/src/lib/job-types.ts` - Job domain types
- `app/src/components/jobs/job-context.tsx` - SolidJS integration
- `app/app.config.ts` - SolidStart websocket configuration
- `app/src/server/actions.ts` - Server actions that trigger job updates

## References

- [Node.js BroadcastChannel API](https://nodejs.org/api/worker_threads.html#class-broadcastchannel)
- [MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [SolidStart Documentation](https://start.solidjs.com/)
- [Vinxi Framework](https://vinxi.vercel.app/)
