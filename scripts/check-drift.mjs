#!/usr/bin/env node
// Сверка опубликованного описания инструментов с живым MCP-сервером.
//
//   SRZ_API_KEY=srz_live_... node scripts/check-drift.mjs
//
// Сравнивает список tools/list у сервера с src/tools.json. Любое расхождение —
// ненулевой код возврата: описание устарело и его надо перегенерировать.
// Ключ берётся только из окружения и никогда не печатается.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = JSON.parse(readFileSync(join(root, "src/tools.json"), "utf8"));
const url = process.env.SRZ_MCP_URL ?? src.server.mcp_url;
const key = process.env.SRZ_API_KEY;

// Без ключа сверка не имеет смысла: в CI секрет может отсутствовать (форк, локальный прогон).
// Это не ошибка — но и не «дрейфа нет». SRZ_REQUIRE_KEY=1 включает строгий режим.
if (!key && process.env.SRZ_REQUIRE_KEY !== "1") {
  console.log("SRZ_API_KEY не задан — сверка с живым сервером пропущена (не ошибка)");
  console.log("чтобы проверить всерьёз: SRZ_API_KEY=... node scripts/check-drift.mjs");
  process.exit(0);
}

const RPC_ID = 1;
const baseHeaders = {
  "content-type": "application/json",
  accept: "application/json, text/event-stream",
};

const parsePayload = (response, text) => {
  const type = response.headers.get("content-type") ?? "";
  if (type.includes("text/event-stream")) {
    const last = text
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .filter(Boolean)
      .pop();
    return last ? JSON.parse(last) : null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

async function rpc(method, params, sessionId) {
  const headers = { ...baseHeaders };
  if (key) headers.authorization = `Bearer ${key}`;
  if (sessionId) headers["mcp-session-id"] = sessionId;
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", id: RPC_ID, method, params }),
  });
  const text = await response.text();
  return { response, payload: parsePayload(response, text) };
}

const describeError = (payload) =>
  payload?.error ? `${payload.error.code ?? ""} ${payload.error.message ?? ""}`.trim() : "нет ответа";

let sessionId = null;
let result = { payload: null, response: null };

try {
  const init = await rpc("initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "srezai-skill-drift-check", version: src.version },
  });
  sessionId = init.response.headers.get("mcp-session-id") ?? null;
  if (!init.payload?.result) {
    console.warn(`initialize не подтвердился (${describeError(init.payload)}) — пробую tools/list напрямую`);
  } else if (sessionId) {
    await fetch(url, {
      method: "POST",
      headers: { ...baseHeaders, ...(key ? { authorization: `Bearer ${key}` } : {}), "mcp-session-id": sessionId },
      body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
    });
  }

  result = await rpc("tools/list", {}, sessionId);
} catch (error) {
  console.error(`сервер недоступен: ${url} — ${error.message}`);
  process.exit(2);
}

const remote = result.payload?.result?.tools;
if (!Array.isArray(remote)) {
  console.error(`tools/list не вернул список: ${describeError(result.payload)} (HTTP ${result.response?.status})`);
  process.exit(2);
}

const remoteNames = remote.map((tool) => tool.name).sort();
const localNames = src.tools.map((tool) => tool.name).sort();
const missingLocally = remoteNames.filter((name) => !localNames.includes(name));
const staleLocally = localNames.filter((name) => !remoteNames.includes(name));

console.log(`сервер: ${remoteNames.length} инструментов · src/tools.json: ${localNames.length}`);
if (missingLocally.length === 0 && staleLocally.length === 0) {
  console.log("дрейфа нет — описания совпадают с живым сервером");
  process.exit(0);
}

if (missingLocally.length > 0) console.error(`есть на сервере, нет в src/tools.json: ${missingLocally.join(", ")}`);
if (staleLocally.length > 0) console.error(`описано, но сервер не отдаёт: ${staleLocally.join(", ")}`);
console.error("\nописания устарели: поправь src/tools.json и запусти node scripts/generate.mjs");
process.exit(1);
