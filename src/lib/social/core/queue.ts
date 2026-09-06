import fs from "node:fs";
import path from "node:path";
import { Redis } from "@upstash/redis";

export type QueuePlatform =
  | "instagram"
  | "pinterest"
  | "facebook"
  | "tiktok"
  | "youtube";
export type QueueStatus = "queued" | "posted" | "failed";
export type QueueAssetType = "image" | "video";
export type QueueContentType = "recipe" | "guide" | "store";
export type QueueContentKind = "standard" | "ebook";
export type QueueErrorCategory =
  | "authentication"
  | "media"
  | "validation"
  | "platform_api"
  | "unknown";

export type QueueItem = {
  id: string;
  slug: string;
  title: string;
  platform: QueuePlatform;
  caption: string;
  url: string;
  board?: string | null;
  scheduledFor: string;
  status: QueueStatus;
  createdAt: string;
  attemptedAt?: string;
  completedAt?: string;
  postedAt?: string;
  error?: string;
  errorCategory?: QueueErrorCategory;
  retryable?: boolean;
  platformResponseId?: string | null;
  contentType?: QueueContentType;
  kind?: QueueContentKind;
  assetType?: QueueAssetType;
  imageUrl?: string;
  publishImageUrl?: string;
  videoUrl?: string;
  attemptCount?: number;
  requiresApproval?: boolean;
};

export type QueueAttemptMetadata = {
  attemptedAt?: string;
  completedAt?: string;
  platformResponseId?: string | null;
  errorCategory?: QueueErrorCategory;
  retryable?: boolean;
};

const ROOT = process.env.VERCEL ? "/tmp" : process.cwd();
const QUEUE_DIR = path.join(ROOT, "generated");
const QUEUE_FILE = path.join(QUEUE_DIR, "social-queue.json");
const REDIS_ITEM_PREFIX = "social_queue:item:";
const REDIS_LOCK_PREFIX = "social_queue:lock:";
export const MAX_AUTOMATIC_ATTEMPTS = 3;
const MAX_ITEMS_PER_RUN = 6;

function getRedis() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  return url && token ? new Redis({ url, token }) : null;
}

function itemKey(id: string) {
  return `${REDIS_ITEM_PREFIX}${id}`;
}

function lockKey(id: string) {
  return `${REDIS_LOCK_PREFIX}${id}`;
}

async function redisQueueItems(redis: Redis): Promise<QueueItem[]> {
  const keys: string[] = [];
  let cursor = "0";
  do {
    const [nextCursor, batch] = await redis.scan(cursor, {
      match: `${REDIS_ITEM_PREFIX}*`,
      count: 100,
    });
    cursor = String(nextCursor);
    keys.push(...batch);
  } while (cursor !== "0");

  if (!keys.length) return [];
  const values = await Promise.all(keys.map((key) => redis.get<QueueItem>(key)));
  return values.filter((item): item is QueueItem => Boolean(item));
}

function ensureDir() {
  fs.mkdirSync(QUEUE_DIR, { recursive: true });
}

function readQueueFile(): QueueItem[] {
  try {
    ensureDir();

    if (!fs.existsSync(QUEUE_FILE)) {
      return [];
    }

    const raw = fs.readFileSync(QUEUE_FILE, "utf8");
    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueueFile(items: QueueItem[]) {
  ensureDir();
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(items, null, 2), "utf8");
}

function resetAttemptMetadata(item: QueueItem): QueueItem {
  return {
    ...item,
    attemptedAt: undefined,
    completedAt: undefined,
    postedAt: undefined,
    error: undefined,
    errorCategory: undefined,
    retryable: undefined,
    platformResponseId: undefined,
  };
}

function applyAttemptMetadata(
  item: QueueItem,
  metadata: QueueAttemptMetadata,
  nextStatus: QueueStatus,
  error?: string
): QueueItem {
  return {
    ...item,
    status: nextStatus,
    attemptedAt: metadata.attemptedAt || item.attemptedAt,
    completedAt: metadata.completedAt || new Date().toISOString(),
    postedAt: nextStatus === "posted" ? metadata.completedAt || new Date().toISOString() : undefined,
    error,
    errorCategory: metadata.errorCategory,
    retryable: metadata.retryable,
    platformResponseId: metadata.platformResponseId ?? undefined,
  };
}

export function classifyQueueFailure(error: unknown): {
  errorCategory: QueueErrorCategory;
  retryable: boolean;
} {
  const message = String(error || "").toLowerCase();

  if (
    message.includes("auth") ||
    message.includes("oauth") ||
    message.includes("token") ||
    message.includes("login") ||
    message.includes("expired") ||
    message.includes("not connected") ||
    message.includes("session has expired")
  ) {
    return { errorCategory: "authentication", retryable: false };
  }

  if (
    message.includes("no permission") ||
    message.includes("permission denied") ||
    message.includes("insufficient permission") ||
    message.includes("not authorized") ||
    message.includes("not authorised") ||
    message.includes("invalid scope")
  ) {
    return { errorCategory: "validation", retryable: false };
  }

  if (
    message.includes("image url") ||
    message.includes("video url") ||
    message.includes("media") ||
    message.includes("public url") ||
    message.includes("publicly reachable") ||
    message.includes("download") ||
    message.includes("fetch") ||
    message.includes("file not found") ||
    message.includes("image not found") ||
    message.includes("video not found")
  ) {
    const retryable =
      message.includes("timeout") ||
      message.includes("fetch") ||
      message.includes("download") ||
      message.includes("network") ||
      message.includes("temporary");

    return { errorCategory: "media", retryable };
  }

  if (
    message.includes("required") ||
    message.includes("missing") ||
    message.includes("invalid") ||
    message.includes("unsupported") ||
    message.includes("preflight") ||
    message.includes("board required") ||
    message.includes("slug not found") ||
    message.includes("only supports")
  ) {
    return { errorCategory: "validation", retryable: false };
  }

  if (
    message.includes("api") ||
    message.includes("container") ||
    message.includes("graph.facebook.com") ||
    message.includes("pinterest pin creation failed") ||
    message.includes("publish failed") ||
    message.includes("timeout") ||
    message.includes("rate limit") ||
    message.includes("service unavailable")
  ) {
    return { errorCategory: "platform_api", retryable: true };
  }

  return { errorCategory: "unknown", retryable: true };
}

export async function allQueueItems(): Promise<QueueItem[]> {
  const redis = getRedis();
  const items = redis ? await redisQueueItems(redis) : readQueueFile();
  return items.sort((a, b) => {
    const aTime = new Date(a.scheduledFor).getTime();
    const bTime = new Date(b.scheduledFor).getTime();
    return aTime - bTime;
  });
}

export async function addQueueItem(
  item: Omit<QueueItem, "id" | "createdAt" | "status">
): Promise<QueueItem> {

  const next: QueueItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    status: "queued",
    attemptCount: 0,
  };

  const redis = getRedis();
  if (redis) {
    await redis.set(itemKey(next.id), next);
  } else {
    const items = readQueueFile();
    items.push(next);
    writeQueueFile(items);
  }

  return next;
}

export async function dueQueueItems(): Promise<QueueItem[]> {
  const now = Date.now();
  const redis = getRedis();
  const items = redis ? await redisQueueItems(redis) : readQueueFile();
  const due = items
    .filter((item) => {
      if (item.status !== "queued") return false;
      if (item.requiresApproval) return false;
      return new Date(item.scheduledFor).getTime() <= now;
    })
    .sort(
      (a, b) =>
        new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
    )
    .slice(0, MAX_ITEMS_PER_RUN);

  if (!redis) return due;

  const claimed: QueueItem[] = [];
  for (const item of due) {
    const lock = await redis.set(lockKey(item.id), "1", { nx: true, ex: 300 });
    if (lock === "OK") claimed.push(item);
  }
  return claimed;
}

export async function findQueueItemById(id: string): Promise<QueueItem | null> {
  const redis = getRedis();
  if (redis) return (await redis.get<QueueItem>(itemKey(id))) || null;
  return readQueueFile().find((item) => item.id === id) || null;
}

export async function markQueueItemPosted(id: string): Promise<void> {
  await markQueueItemPostedWithMetadata(id, {});
}

export async function markQueueItemPostedWithMetadata(
  id: string,
  metadata: QueueAttemptMetadata = {}
): Promise<void> {
  const redis = getRedis();
  if (redis) {
    const item = await redis.get<QueueItem>(itemKey(id));
    if (!item) return;
    await redis.set(itemKey(id), {
      ...item,
      status: "posted" as const,
      attemptCount: (item.attemptCount || 0) + 1,
      attemptedAt: metadata.attemptedAt || item.attemptedAt,
      completedAt: metadata.completedAt || new Date().toISOString(),
      postedAt: metadata.completedAt || new Date().toISOString(),
      error: undefined,
      errorCategory: undefined,
      retryable: undefined,
      platformResponseId: metadata.platformResponseId ?? undefined,
    });
    await redis.del(lockKey(id));
    return;
  }
  const items = readQueueFile();
  const next = items.map((item) =>
    item.id === id
      ? {
          ...item,
          status: "posted" as const,
          attemptedAt: metadata.attemptedAt || item.attemptedAt,
          completedAt: metadata.completedAt || new Date().toISOString(),
          postedAt: metadata.completedAt || new Date().toISOString(),
          error: undefined,
          errorCategory: undefined,
          retryable: undefined,
          platformResponseId: metadata.platformResponseId ?? undefined,
        }
      : item
  );

  writeQueueFile(next);
}

export async function markQueueItemFailed(id: string, error: string): Promise<void> {
  await markQueueItemFailedWithMetadata(id, error, {});
}

export async function markQueueItemFailedWithMetadata(
  id: string,
  error: string,
  metadata: QueueAttemptMetadata = {}
): Promise<void> {
  const redis = getRedis();
  if (redis) {
    const item = await redis.get<QueueItem>(itemKey(id));
    if (!item) return;
    const attemptCount = (item.attemptCount || 0) + 1;
    const retryAutomatically = metadata.retryable === true && attemptCount < MAX_AUTOMATIC_ATTEMPTS;
    const retryDelayMinutes = Math.min(60, 5 * 2 ** Math.max(0, attemptCount - 1));
    await redis.set(itemKey(id), {
      ...item,
      status: retryAutomatically ? ("queued" as const) : ("failed" as const),
      scheduledFor: retryAutomatically
        ? new Date(Date.now() + retryDelayMinutes * 60_000).toISOString()
        : item.scheduledFor,
      attemptCount,
      attemptedAt: metadata.attemptedAt || item.attemptedAt,
      completedAt: metadata.completedAt || new Date().toISOString(),
      postedAt: undefined,
      error,
      errorCategory: metadata.errorCategory,
      retryable: metadata.retryable,
      platformResponseId: metadata.platformResponseId ?? undefined,
    });
    await redis.del(lockKey(id));
    return;
  }
  const items = readQueueFile();
  const existing = items.find((item) => item.id === id);
  const attemptCount = (existing?.attemptCount || 0) + 1;
  const retryAutomatically = metadata.retryable === true && attemptCount < MAX_AUTOMATIC_ATTEMPTS;
  const retryDelayMinutes = Math.min(60, 5 * 2 ** Math.max(0, attemptCount - 1));
  const next = items.map((item) =>
    item.id === id
      ? {
          ...item,
          status: retryAutomatically ? ("queued" as const) : ("failed" as const),
          scheduledFor: retryAutomatically
            ? new Date(Date.now() + retryDelayMinutes * 60_000).toISOString()
            : item.scheduledFor,
          attemptCount,
          attemptedAt: metadata.attemptedAt || item.attemptedAt,
          completedAt: metadata.completedAt || new Date().toISOString(),
          postedAt: undefined,
          error,
          errorCategory: metadata.errorCategory,
          retryable: metadata.retryable,
          platformResponseId: metadata.platformResponseId ?? undefined,
        }
      : item
  );

  writeQueueFile(next);
}

export async function retryQueueItem(id: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    const item = await redis.get<QueueItem>(itemKey(id));
    if (!item) return;
    await redis.set(itemKey(id), { ...resetAttemptMetadata(item), status: "queued" as const, attemptCount: 0 });
    await redis.del(lockKey(id));
    return;
  }
  const items = readQueueFile();
  const next = items.map((item) =>
    item.id === id
      ? {
          ...resetAttemptMetadata(item),
          status: "queued" as const,
          attemptCount: 0,
        }
      : item
  );

  writeQueueFile(next);
}

export async function rescheduleQueueItemNow(id: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    const item = await redis.get<QueueItem>(itemKey(id));
    if (!item) return;
    await redis.set(itemKey(id), {
      ...resetAttemptMetadata(item),
      status: "queued" as const,
      scheduledFor: new Date().toISOString(),
      attemptCount: 0,
    });
    await redis.del(lockKey(id));
    return;
  }
  const items = readQueueFile();
  const next = items.map((item) =>
    item.id === id
      ? {
          ...resetAttemptMetadata(item),
          status: "queued" as const,
          scheduledFor: new Date().toISOString(),
          attemptCount: 0,
        }
      : item
  );

  writeQueueFile(next);
}

export async function deleteQueueItem(id: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await Promise.all([redis.del(itemKey(id)), redis.del(lockKey(id))]);
    return;
  }
  const items = readQueueFile();
  const next = items.filter((item) => item.id !== id);
  writeQueueFile(next);
}
