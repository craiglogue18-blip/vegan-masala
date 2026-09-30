import { google } from "googleapis";
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

import { guardAdmin } from "@/lib/admin/guard";
import { youtubeOauthClient, youtubeRefreshToken } from "@/lib/social/core/youtubeAuth";
import { getMetaConfig } from "@/lib/social/publishers/metaCore";

const GRAPH = "https://graph.facebook.com/v23.0";
const DISMISSED_INBOX_KEY = "social_inbox:dismissed:v1";

type Platform = "facebook" | "instagram" | "youtube";

type InboxItem = {
  kind?: "comment" | "message";
  canReply?: boolean;
  id: string;
  platform: Platform;
  author: string;
  text: string;
  createdAt: string;
  contentTitle: string;
  contentUrl: string;
  replied: boolean;
  replyCount: number;
};

type FacebookReply = { from?: { id?: string } };
type FacebookComment = { id?: string; message?: string; created_time?: string; from?: { id?: string; name?: string }; permalink_url?: string; comments?: { data?: FacebookReply[] } };
type FacebookPost = { message?: string; permalink_url?: string; created_time?: string; comments?: { data?: FacebookComment[] } };
type InstagramReply = { username?: string };
type InstagramComment = { id?: string; text?: string; timestamp?: string; username?: string; replies?: { data?: InstagramReply[] } };
type InstagramMedia = { caption?: string; permalink?: string; timestamp?: string; comments?: { data?: InstagramComment[] } };

function redisClient() {
  const url = process.env.KV_REST_API_URL?.trim();
  const token = process.env.KV_REST_API_TOKEN?.trim();
  return url && token ? new Redis({ url, token }) : null;
}

function inboxItemKey(item: Pick<InboxItem, "id" | "kind" | "platform">) {
  return `${item.platform}:${item.kind === "message" ? "message" : "comment"}:${item.id}`;
}

async function dismissedInboxItems() {
  const redis = redisClient();
  if (!redis) return new Set<string>();
  return new Set(await redis.smembers<string[]>(DISMISSED_INBOX_KEY));
}

async function graphGet(path: string, token: string, fields: string, query: Record<string, string> = {}) {
  const url = new URL(`${GRAPH}/${path}`);
  url.searchParams.set("fields", fields);
  url.searchParams.set("limit", "20");
  url.searchParams.set("access_token", token);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message || `Meta returned ${response.status}`);
  return body;
}

async function graphPost(path: string, token: string, message: string) {
  const form = new URLSearchParams({ access_token: token, message });
  const response = await fetch(`${GRAPH}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message || `Meta returned ${response.status}`);
  return body;
}

async function facebookPageAccessToken() {
  const config = getMetaConfig();
  const configuredToken = config.pageAccessToken || config.accessToken;
  if (!config.pageId || !configuredToken) {
    throw new Error("Facebook Page connection is incomplete");
  }

  const page = await graphGet(config.pageId, configuredToken, "access_token");
  const resolvedToken = String(page?.access_token || "").trim();
  if (!resolvedToken) {
    throw new Error("Facebook did not return a Page access token");
  }
  return resolvedToken;
}

async function facebookInbox(): Promise<InboxItem[]> {
  const config = getMetaConfig();
  const token = await facebookPageAccessToken();
  const body = await graphGet(
    `${config.pageId}/published_posts`,
    token,
    "id,message,permalink_url,created_time,comments.limit(25){id,message,created_time,from,permalink_url,comments.limit(10){id,from}}"
  );
  return ((body.data || []) as FacebookPost[]).flatMap((post) =>
    (post.comments?.data || []).map((comment) => ({
      id: String(comment.id),
      platform: "facebook" as const,
      author: String(comment.from?.name || "Facebook user"),
      text: String(comment.message || ""),
      createdAt: String(comment.created_time || post.created_time || ""),
      contentTitle: String(post.message || "Facebook post").slice(0, 120),
      contentUrl: String(comment.permalink_url || post.permalink_url || "https://www.facebook.com/"),
      replied: (comment.comments?.data || []).some((reply) => String(reply.from?.id || "") === config.pageId),
      replyCount: Number(comment.comments?.data?.length || 0),
    }))
  );
}

async function instagramInbox(): Promise<InboxItem[]> {
  const config = getMetaConfig();
  if (!config.igUserId || !config.accessToken) throw new Error("Instagram connection is incomplete");
  const body = await graphGet(
    `${config.igUserId}/media`,
    config.accessToken,
    "id,caption,permalink,timestamp,comments.limit(25){id,text,timestamp,username,replies.limit(10){id,username}}"
  );
  return ((body.data || []) as InstagramMedia[]).flatMap((media) =>
    (media.comments?.data || []).map((comment) => ({
      id: String(comment.id),
      platform: "instagram" as const,
      author: comment.username ? `@${comment.username}` : "Instagram user",
      text: String(comment.text || ""),
      createdAt: String(comment.timestamp || media.timestamp || ""),
      contentTitle: String(media.caption || "Instagram post").slice(0, 120),
      contentUrl: String(media.permalink || "https://www.instagram.com/veganmasalaonline/"),
      replied: (comment.replies?.data || []).some((reply) => String(reply.username || "").toLowerCase() === "veganmasalaonline"),
      replyCount: Number(comment.replies?.data?.length || 0),
    }))
  );
}

async function youtubeClient() {
  const refreshToken = await youtubeRefreshToken();
  if (!refreshToken) throw new Error("YouTube is not connected");
  const auth = youtubeOauthClient();
  auth.setCredentials({ refresh_token: refreshToken });
  return google.youtube({ version: "v3", auth });
}

type DirectMessage = { id: string; message?: string; created_time: string; from?: { id: string; name?: string; username?: string } };
type Conversation = { id: string; messages?: { data?: DirectMessage[] }; participants?: { data?: { id: string; name?: string; username?: string }[] } };

async function directConversations(platform: "facebook" | "instagram") {
  const config = getMetaConfig();
  const token = await facebookPageAccessToken();
  const body = await graphGet(`${config.pageId}/conversations`, token,
    "id,participants,messages.limit(25){id,message,created_time,from}",
    { platform: platform === "facebook" ? "messenger" : "instagram" });
  return { conversations: (body.data || []) as Conversation[], token, config };
}

function conversationDetails(conversation: Conversation, pageId: string, igUserId: string) {
  const ownIds = new Set([pageId, igUserId]);
  const messages = [...(conversation.messages?.data || [])].sort((a, b) => Date.parse(a.created_time) - Date.parse(b.created_time));
  const incoming = messages.filter(message => message.from?.id && !ownIds.has(message.from.id));
  const lastIncoming = incoming.at(-1);
  const latest = messages.at(-1);
  const age = Date.now() - Date.parse(lastIncoming?.created_time || "");
  return { messages, lastIncoming, latest, canReply: Boolean(lastIncoming && age >= 0 && age < 24 * 60 * 60 * 1000) };
}

async function messagesInbox(platform: "facebook" | "instagram"): Promise<InboxItem[]> {
  const { conversations, config } = await directConversations(platform);
  return conversations.map(conversation => {
    const detail = conversationDetails(conversation, config.pageId, config.igUserId);
    return {
      id: conversation.id, platform, kind: "message", canReply: detail.canReply,
      author: detail.lastIncoming?.from?.name || detail.lastIncoming?.from?.username || "Customer",
      text: detail.messages.map(message => `${[config.pageId, config.igUserId].includes(message.from?.id || "") ? "Vegan Masala" : message.from?.name || message.from?.username || "Customer"}: ${message.message || "[Attachment — open in Meta Business Suite]"}`).join("\n\n"),
      createdAt: detail.latest?.created_time || "",
      contentTitle: detail.canReply ? "Private conversation · recent 25 messages" : "Private conversation · reply window closed; open in Meta Business Suite",
      contentUrl: "https://business.facebook.com/latest/inbox/all",
      replied: Boolean(detail.latest && [config.pageId, config.igUserId].includes(detail.latest.from?.id || "")),
      replyCount: 0,
    };
  });
}

async function youtubeInbox(): Promise<InboxItem[]> {
  const youtube = await youtubeClient();
  const channel = await youtube.channels.list({ part: ["id"], mine: true });
  const channelId = channel.data.items?.[0]?.id;
  if (!channelId) throw new Error("YouTube channel could not be resolved");
  const response = await youtube.commentThreads.list({
    part: ["snippet", "replies"],
    allThreadsRelatedToChannelId: channelId,
    maxResults: 50,
    order: "time",
    textFormat: "plainText",
  });
  return (response.data.items || []).map((thread) => {
    const comment = thread.snippet?.topLevelComment;
    const snippet = comment?.snippet;
    return {
      id: String(comment?.id || thread.id || ""),
      platform: "youtube" as const,
      author: String(snippet?.authorDisplayName || "YouTube user"),
      text: String(snippet?.textDisplay || ""),
      createdAt: String(snippet?.publishedAt || ""),
      contentTitle: "YouTube comment",
      contentUrl: snippet?.videoId ? `https://www.youtube.com/watch?v=${snippet.videoId}&lc=${comment?.id}` : "https://www.youtube.com/",
      replied: (thread.replies?.comments || []).some((reply) => reply.snippet?.authorChannelId?.value === channelId),
      replyCount: Number(thread.snippet?.totalReplyCount || 0),
    };
  });
}

export async function GET(request: Request) {
  const blocked = guardAdmin(request);
  if (blocked) return blocked;
  const [settled, dismissed] = await Promise.all([
    Promise.allSettled([facebookInbox(), instagramInbox(), youtubeInbox(), messagesInbox("facebook"), messagesInbox("instagram")]),
    dismissedInboxItems(),
  ]);
  const names: Platform[] = ["facebook", "instagram", "youtube", "facebook", "instagram"];
  const items: InboxItem[] = [];
  const connections = settled.map((result, index) => {
    if (result.status === "fulfilled") {
      const pending = result.value.filter((item) => !item.replied && !dismissed.has(inboxItemKey(item)));
      items.push(...pending);
      return { platform: names[index], kind: index >= 3 ? "messages" : "comments", ok: true, count: pending.length };
    }
    return { platform: names[index], kind: index >= 3 ? "messages" : "comments", ok: false, count: 0, error: result.reason instanceof Error ? result.reason.message : "Connection failed" };
  });
  items.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return NextResponse.json({ ok: true, items, connections, unsupported: ["tiktok", "pinterest"], refreshedAt: new Date().toISOString() });
}

export async function POST(request: Request) {
  const blocked = guardAdmin(request);
  if (blocked) return blocked;
  try {
    const body = await request.json();
    const platform = String(body.platform || "") as Platform;
    const commentId = String(body.commentId || "").trim();
    const message = String(body.message || "").trim();
    const kind = body.kind === "message" ? "message" : "comment";
    if (!commentId || !["facebook", "instagram", "youtube"].includes(platform)) {
      return NextResponse.json({ ok: false, error: "Platform and inbox item are required" }, { status: 400 });
    }
    if (body.action === "dismiss") {
      const redis = redisClient();
      if (!redis) return NextResponse.json({ ok: false, error: "Inbox dismissal storage is unavailable" }, { status: 503 });
      await redis.sadd(DISMISSED_INBOX_KEY, inboxItemKey({ id: commentId, kind, platform }));
      return NextResponse.json({ ok: true, dismissed: true });
    }
    if (!message) {
      return NextResponse.json({ ok: false, error: "Reply text is required" }, { status: 400 });
    }
    if (message.length > 1000) return NextResponse.json({ ok: false, error: "Reply is too long" }, { status: 400 });
    if (body.kind === "message") {
      if (platform === "youtube") return NextResponse.json({ ok: false, error: "Private messages are available for Facebook and Instagram only" }, { status: 400 });
      // Resolve the recipient from the connected account, never from client input.
      const { conversations, token, config } = await directConversations(platform);
      const conversation = conversations.find(entry => entry.id === commentId);
      if (!conversation) return NextResponse.json({ ok: false, error: "Conversation not found; refresh the inbox" }, { status: 404 });
      const detail = conversationDetails(conversation, config.pageId, config.igUserId);
      if (!detail.canReply) return NextResponse.json({ ok: false, error: "The standard 24-hour reply window has closed. Open this conversation in Meta Business Suite." }, { status: 400 });
      const response = await fetch(`${GRAPH}/${config.pageId}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipient: { id: detail.lastIncoming!.from!.id }, message: { text: message }, messaging_type: "RESPONSE" }),
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "Message could not be sent");
      return NextResponse.json({ ok: true, replyId: result.message_id });
    }
    if (platform === "youtube") {
      const youtube = await youtubeClient();
      const result = await youtube.comments.insert({ part: ["snippet"], requestBody: { snippet: { parentId: commentId, textOriginal: message } } });
      return NextResponse.json({ ok: true, replyId: result.data.id || null });
    }
    const config = getMetaConfig();
    const token = platform === "facebook" ? await facebookPageAccessToken() : config.accessToken;
    if (!token) throw new Error(`${platform} access token is unavailable`);
    const path = platform === "instagram" ? `${commentId}/replies` : `${commentId}/comments`;
    const result = await graphPost(path, token, message);
    return NextResponse.json({ ok: true, replyId: result.id || null });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Reply failed" }, { status: 500 });
  }
}
