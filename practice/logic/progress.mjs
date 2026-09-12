import {evaluatePolicy} from './authz.mjs';
import {evaluateController} from './greenhouse.mjs';
import {evaluateMembership, isWalletId, TOKEN_CONTRACT} from './membership.mjs';
import { CHALLENGE_ID as AUTHZ_ID, defaultActivityState as emptyAuthz } from './authz.mjs';
import {
  CHALLENGE_ID as FAN_ID,
  defaultActivityState as emptyFan,
} from './greenhouse.mjs';
import {
  CHALLENGE_ID as NFT_ID,
  defaultActivityState as emptyNft,
} from './membership.mjs';

export const STORAGE_KEY = 'rayqin.learningPlayground.v1';
export const PROGRESS_VERSION = 1;

export const ACTIVITY_IDS = [AUTHZ_ID, FAN_ID, NFT_ID];

const EMPTY_BY_ID = {
  [AUTHZ_ID]: emptyAuthz,
  [FAN_ID]: emptyFan,
  [NFT_ID]: emptyNft,
};

export function emptyActivity(id) {
  const factory = EMPTY_BY_ID[id];
  return factory ? factory() : {};
}

export function emptyProgress() {
  return {
    version: PROGRESS_VERSION,
    activeId: AUTHZ_ID,
    activities: {
      [AUTHZ_ID]: emptyAuthz(),
      [FAN_ID]: emptyFan(),
      [NFT_ID]: emptyNft(),
    },
  };
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function probeStorage(storage) {
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
    return { available: false, reason: 'missing' };
  }
  try {
    const probeKey = `${STORAGE_KEY}.probe`;
    storage.setItem(probeKey, 'ok');
    storage.removeItem(probeKey);
    return { available: true, reason: 'ok' };
  } catch {
    return { available: false, reason: 'blocked' };
  }
}

function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

export function normalizeProgress(raw) {
  if (!isPlainObject(raw) || raw.version !== PROGRESS_VERSION || !isPlainObject(raw.activities)) {
    return { ok: false, data: emptyProgress() };
  }
  const data = emptyProgress();
  if (ACTIVITY_IDS.includes(raw.activeId)) data.activeId = raw.activeId;
  for (const id of ACTIVITY_IDS) {
    const incoming = raw.activities[id];
    if (!isPlainObject(incoming)) continue;
    const state = emptyActivity(id);
    for (const [key, fallback] of Object.entries(state)) {
      if (!(key in incoming) || key.startsWith('last')) continue;
      const value = incoming[key];
      if (key === 'ledger' || key === 'cache') {
        if (!isPlainObject(value) || Object.keys(value).length > 1000) return {ok:false,data:emptyProgress()};
        for (const [token, entry] of Object.entries(value)) {
          if (!/^sim-pass-[1-9][0-9]*$/.test(token)) return {ok:false,data:emptyProgress()};
          if (key === 'ledger') {
            if (!isPlainObject(entry) || entry.tokenId !== token || entry.contract !== TOKEN_CONTRACT || !isWalletId(entry.owner)) return {ok:false,data:emptyProgress()};
            state.ledger[token] = {tokenId:token,contract:TOKEN_CONTRACT,owner:entry.owner};
          } else {
            if (!isWalletId(entry)) return {ok:false,data:emptyProgress()};
            state.cache[token] = entry;
          }
        }
      } else if (key === 'session') {
        if (value !== null && !isWalletId(value)) return {ok:false,data:emptyProgress()};
        state[key]=value;
      } else if (key === 'policy') {
        if (!isPlainObject(value)) return {ok:false,data:emptyProgress()};
        for (const rule of Object.keys(fallback)) state.policy[rule]=value[rule]===true;
      } else if (key === 'onThreshold' || key === 'offThreshold') {
        if (!['number','string'].includes(typeof value)) return {ok:false,data:emptyProgress()};
        state[key]=value;
      } else if (typeof value !== typeof fallback || (typeof value === 'string' && value.length > 4000)) {
        return {ok:false,data:emptyProgress()};
      } else state[key]=value;
    }
    if (id === NFT_ID) {
      if (!Number.isSafeInteger(state.nextToken) || state.nextToken < 1 || !isWalletId(state.mintTo) || !isWalletId(state.transferTo)) return {ok:false,data:emptyProgress()};
      const maxToken=Math.max(0,...Object.keys(state.ledger).map(k=>Number(k.slice(9))));
      state.nextToken=Math.max(state.nextToken,maxToken+1);
      state.lastTokenId=Object.hasOwn(state.ledger,incoming.lastTokenId) ? incoming.lastTokenId : null;
    }
    // Recompute derived checks from restored configuration; never trust saved PASS flags.
    if (incoming.lastEvaluation != null) state.lastEvaluation = id===AUTHZ_ID ? evaluatePolicy(state.policy) : id===FAN_ID ? evaluateController(state) : evaluateMembership(state.useCachedOwner);
    data.activities[id] = state;
  }
  return { ok: true, data };
}

const WARNINGS = {
  missing: {
    zh: '这个浏览器不能保存进度。本次练习只留在内存里，刷新后会丢失。',
    en: 'This browser cannot save progress. This session stays in memory and is lost on refresh.',
  },
  blocked: {
    zh: '浏览器存储不可用。进度只留在内存里，不会写入本机。',
    en: 'Browser storage is unavailable. Progress stays in memory and is not written to this device.',
  },
  corrupt: {
    zh: '本机进度无法读取，已重新开始。没有读取个人信息。',
    en: 'Saved progress could not be read and was reset. No personal data was read.',
  },
};

export function loadProgress(storage) {
  const probe = probeStorage(storage);
  if (!probe.available) {
    return {
      data: emptyProgress(),
      persist: 'memory',
      warning: WARNINGS[probe.reason] || WARNINGS.missing,
    };
  }
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw == null || raw === '') {
      return { data: emptyProgress(), persist: 'storage', warning: null };
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { data: emptyProgress(), persist: 'storage', warning: WARNINGS.corrupt };
    }
    const normalized = normalizeProgress(parsed);
    if (!normalized.ok) {
      return { data: emptyProgress(), persist: 'storage', warning: WARNINGS.corrupt };
    }
    return { data: normalized.data, persist: 'storage', warning: null };
  } catch {
    return { data: emptyProgress(), persist: 'memory', warning: WARNINGS.blocked };
  }
}

export function saveProgress(storage, data, persist) {
  if (persist !== 'storage') return { saved: false, reason: 'memory' };
  const probe = probeStorage(storage);
  if (!probe.available) return { saved: false, reason: probe.reason };
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return { saved: true, reason: 'ok' };
  } catch {
    return { saved: false, reason: 'blocked' };
  }
}

export function resetActivity(progress, activityId) {
  const next = clone(progress);
  if (!ACTIVITY_IDS.includes(activityId)) return next;
  next.activities[activityId] = emptyActivity(activityId);
  return next;
}

export function buildEvidence({
  challengeId,
  version,
  config,
  checks,
  reflection,
  persist,
}) {
  const list = Array.isArray(checks) ? checks : [];
  const requiredPassed = list.length > 0 && list.every((row) => row.pass);
  return {
    kind: 'self-practice-evidence',
    disclaimerZh: '浏览器内自练记录，不是证书，也不代表付费课程完成。Ray 仍会审阅真实项目作业。',
    disclaimerEn:
      'Browser self-practice evidence only. Not a certificate and not paid-course completion. Ray still reviews real project work.',
    challengeId,
    version,
    generatedAt: new Date().toISOString(),
    persistNote: persist === 'storage' ? 'this-device-browser-storage' : 'memory-only',
    configuration: config ?? {},
    checks: list.map((row) => ({
      id: row.id,
      pass: row.pass === true,
      expected: row.expected,
      actual: row.actual,
      code: row.code,
    })),
    reflection: typeof reflection === 'string' ? reflection : '',
    requiredPassed,
  };
}

export function formatEvidenceText(evidence) {
  const lines = [
    'Ray Qin Studio — interactive project challenges',
    evidence.disclaimerEn,
    evidence.disclaimerZh,
    '',
    `Challenge: ${evidence.challengeId}`,
    `Version: ${evidence.version}`,
    `Generated: ${evidence.generatedAt}`,
    `Persist: ${evidence.persistNote}`,
    `Required checks passed: ${evidence.requiredPassed ? 'yes' : 'no'}`,
    '',
    'Configuration:',
    JSON.stringify(evidence.configuration, null, 2),
    '',
    'Checks:',
  ];
  if (!evidence.checks.length) {
    lines.push('(none run yet)');
  } else {
    for (const row of evidence.checks) {
      const mark = row.pass ? 'PASS' : 'FAIL';
      lines.push(`- ${row.id}: ${mark} expected=${row.expected} actual=${row.actual}`);
    }
  }
  lines.push('', 'Reflection (optional):');
  lines.push(evidence.reflection ? evidence.reflection : '(none)');
  lines.push('');
  return lines.join('\n');
}

export function createMemoryStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(String(key), String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
  };
}
