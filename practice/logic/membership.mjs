/** Simulated NFT membership authorization. No chain, wallet, or real signature. */

export const CHALLENGE_ID = 'nft-membership';
export const CHALLENGE_VERSION = '2026.09.10';

export const TOKEN_CONTRACT = 'sim-pass-contract';

export const WALLETS = {
  'sim-wallet-a': {
    id: 'sim-wallet-a',
    zh: '练习钱包 A（模拟）',
    en: 'Practice wallet A (simulated)',
  },
  'sim-wallet-b': {
    id: 'sim-wallet-b',
    zh: '练习钱包 B（模拟）',
    en: 'Practice wallet B (simulated)',
  },
};

export const WALLET_IDS = Object.keys(WALLETS);

export const MEMBER_NOTE = {
  zh: '会员练习说明：本周温室参观由当前通行证持有人预约。这是模拟内容。',
  en: 'Member practice note: this week’s greenhouse visit is booked by the current pass holder. Simulated content.',
};

export function defaultActivityState() {
  return {
    ledger: {},
    cache: {},
    nextToken: 1,
    lastTokenId: null,
    session: null,
    useCachedOwner: true,
    mintTo: 'sim-wallet-a',
    transferTo: 'sim-wallet-b',
    prediction: 'deny',
    lastRequest: null,
    lastMint: null,
    lastTransfer: null,
    lastEvaluation: null,
    reflection: '',
  };
}

export function isWalletId(id) {
  return Object.prototype.hasOwnProperty.call(WALLETS, id);
}

export function createState(overrides = {}) {
  return { ...defaultActivityState(), ...overrides };
}

export function mint(state, toWallet) {
  if (!isWalletId(toWallet)) {
    return {
      ok: false,
      code: 'bad-recipient',
      zh: '请选择一个模拟钱包作为接收方。',
      en: 'Choose a simulated wallet as the recipient.',
    };
  }
  const tokenId = `sim-pass-${state.nextToken}`;
  state.nextToken += 1;
  state.ledger[tokenId] = {
    tokenId,
    contract: TOKEN_CONTRACT,
    owner: toWallet,
  };
  state.cache[tokenId] = toWallet;
  state.lastTokenId = tokenId;
  return {
    ok: true,
    code: 'minted',
    tokenId,
    owner: toWallet,
    zh: `已铸造模拟通行证 ${tokenId}。`,
    en: `Minted simulated pass ${tokenId}.`,
  };
}

export function transfer(state, tokenId, toWallet) {
  if (!state.session) {
    return {
      ok: false,
      code: 'unconnected',
      zh: '未连接钱包，不能转让。',
      en: 'No wallet is connected, so transfer is denied.',
    };
  }
  const token = state.ledger[tokenId];
  if (!token) {
    return {
      ok: false,
      code: 'missing-token',
      zh: '账本上没有这个通行证。',
      en: 'That pass is not on the ledger.',
    };
  }
  if (token.owner !== state.session) {
    return {
      ok: false,
      code: 'not-owner',
      zh: '当前连接的钱包不是持有人，不能转让。',
      en: 'The connected wallet is not the holder, so transfer is denied.',
    };
  }
  if (!isWalletId(toWallet) || toWallet === token.owner) {
    return {
      ok: false,
      code: 'bad-recipient',
      zh: '请转让给另一个模拟钱包。',
      en: 'Transfer to a different simulated wallet.',
    };
  }
  token.owner = toWallet;
  return {
    ok: true,
    code: 'transferred',
    tokenId,
    owner: toWallet,
    zh: `已把 ${tokenId} 转到 ${toWallet}。缓存未自动更新。`,
    en: `Transferred ${tokenId} to ${toWallet}. The owner cache was not updated.`,
  };
}

export function signIn(state, walletId) {
  if (walletId == null || walletId === '') {
    state.session = null;
    return { ok: true, session: null };
  }
  if (!isWalletId(walletId)) {
    return {
      ok: false,
      code: 'bad-wallet',
      zh: '未知的模拟钱包。',
      en: 'Unknown simulated wallet.',
    };
  }
  state.session = walletId;
  return { ok: true, session: walletId };
}

export function effectiveOwner(state, tokenId) {
  const token = state.ledger[tokenId];
  if (!token) return null;
  if (state.useCachedOwner && Object.prototype.hasOwnProperty.call(state.cache, tokenId)) {
    return state.cache[tokenId];
  }
  return token.owner;
}

export function requestProtected(state, tokenId) {
  if (!state.session) {
    return {
      allowed: false,
      code: 'unconnected',
      zh: '未连接钱包：这是认证缺失，还谈不上权益。',
      en: 'No wallet connected: this is missing authentication, not yet an entitlement check.',
      content: null,
      session: null,
      ledgerOwner: state.ledger[tokenId]?.owner ?? null,
      effectiveOwner: effectiveOwner(state, tokenId),
    };
  }
  const token = state.ledger[tokenId];
  if (!token) {
    return {
      allowed: false,
      code: 'missing-token',
      zh: '账本上没有该通行证。已连接不等于拥有会员。',
      en: 'That pass is not on the ledger. Being signed in is not membership.',
      content: null,
      session: state.session,
      ledgerOwner: null,
      effectiveOwner: null,
    };
  }
  const owner = effectiveOwner(state, tokenId);
  if (owner !== state.session) {
    return {
      allowed: false,
      code: 'not-current-owner',
      zh: '当前连接的钱包不是有效持有人。',
      en: 'The connected wallet is not the effective holder.',
      content: null,
      session: state.session,
      ledgerOwner: token.owner,
      effectiveOwner: owner,
    };
  }
  return {
    allowed: true,
    code: 'ok',
    zh: '当前持有检查通过（仍是浏览器模拟）。',
    en: 'Current-holder check passed (still a browser simulation).',
    content: MEMBER_NOTE,
    session: state.session,
    ledgerOwner: token.owner,
    effectiveOwner: owner,
  };
}

function checkRow(id, got, expectAllowed, explainZh, explainEn) {
  return {
    id,
    pass: got.allowed === expectAllowed,
    expected: expectAllowed ? 'allow' : 'deny',
    actual: got.allowed ? 'allow' : 'deny',
    code: got.code,
    explainZh,
    explainEn,
  };
}

export function evaluateMembership(useCachedOwner) {
  const results = [];

  {
    const state = createState({ useCachedOwner: useCachedOwner === true });
    mint(state, 'sim-wallet-a');
    const got = requestProtected(state, state.lastTokenId);
    results.push(
      checkRow(
        'unconnected',
        got,
        false,
        '未连接钱包必须拒绝，不能把内容放在公开页面里。',
        'An unconnected wallet must be denied; do not leave content on a public page.',
      ),
    );
  }

  {
    const state = createState({ useCachedOwner: useCachedOwner === true });
    signIn(state, 'sim-wallet-a');
    const got = requestProtected(state, 'sim-pass-missing');
    results.push(
      checkRow(
        'missing-token',
        got,
        false,
        '已连接但没有通行证，应拒绝。认证不是授权。',
        'Signed in without a pass must be denied. Authentication is not authorization.',
      ),
    );
  }

  {
    const state = createState({ useCachedOwner: useCachedOwner === true });
    mint(state, 'sim-wallet-a');
    signIn(state, 'sim-wallet-a');
    const got = requestProtected(state, state.lastTokenId);
    results.push(
      checkRow(
        'current-owner-after-mint',
        got,
        true,
        '铸造给 A 后，A 作为当前持有人应能通过。',
        'After minting to A, A as the current holder should be allowed.',
      ),
    );
  }

  {
    const state = createState({ useCachedOwner: useCachedOwner === true });
    mint(state, 'sim-wallet-a');
    signIn(state, 'sim-wallet-b');
    const got = requestProtected(state, state.lastTokenId);
    results.push(
      checkRow(
        'auth-without-entitlement',
        got,
        false,
        '钱包 B 已连接，但通行证在 A 名下，应拒绝。',
        'Wallet B is signed in, but the pass belongs to A, so access is denied.',
      ),
    );
  }

  {
    const state = createState({ useCachedOwner: useCachedOwner === true });
    mint(state, 'sim-wallet-a');
    const tokenId = state.lastTokenId;
    signIn(state, 'sim-wallet-a');
    transfer(state, tokenId, 'sim-wallet-b');
    signIn(state, 'sim-wallet-a');
    results.push(
      checkRow(
        'former-holder',
        requestProtected(state, tokenId),
        false,
        '转让后旧持有人必须被拒绝。不要使用过期的持有人缓存。',
        'After transfer, the former holder must be denied. Do not trust a stale owner cache.',
      ),
    );
    signIn(state, 'sim-wallet-b');
    results.push(
      checkRow(
        'new-holder',
        requestProtected(state, tokenId),
        true,
        '新持有人应按当前账本被接受，而不是按铸造时的缓存。',
        'The new holder should be accepted from the current ledger, not from the mint-time cache.',
      ),
    );
  }

  return {
    passed: results.every((row) => row.pass),
    results,
    firstFailure: results.find((row) => !row.pass) || null,
  };
}

export function membershipConfigSnapshot(state) {
  const tokens = Object.values(state.ledger || {}).map((token) => ({
    tokenId: token.tokenId,
    contract: token.contract,
    owner: token.owner,
    cachedOwner: state.cache?.[token.tokenId] ?? null,
  }));
  return {
    useCachedOwner: state.useCachedOwner === true,
    session: state.session,
    tokens,
    contract: TOKEN_CONTRACT,
    simulated: true,
  };
}
