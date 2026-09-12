import {
  ACTION_IDS,
  ACTIONS,
  ACTOR_IDS,
  ACTORS,
  CHALLENGE_ID as AUTHZ_ID,
  CHALLENGE_VERSION as AUTHZ_VERSION,
  POLICY_FIELDS,
  RESOURCES,
  evaluatePolicy,
  policyConfigSnapshot,
  runTrial,
} from './logic/authz.mjs';
import {
  CHALLENGE_ID as FAN_ID,
  CHALLENGE_VERSION as FAN_VERSION,
  REASON_COPY,
  controllerConfigSnapshot,
  evaluateController,
  parseIndexes,
  parseTemps,
  settingsFromState,
  simulate,
  validateThresholds,
} from './logic/greenhouse.mjs';
import {
  CHALLENGE_ID as NFT_ID,
  CHALLENGE_VERSION as NFT_VERSION,
  TOKEN_CONTRACT,
  WALLETS,
  evaluateMembership,
  membershipConfigSnapshot,
  mint,
  requestProtected,
  signIn,
  transfer,
} from './logic/membership.mjs';
import {
  ACTIVITY_IDS,
  buildEvidence,
  formatEvidenceText,
  loadProgress,
  resetActivity,
  saveProgress,
} from './logic/progress.mjs';

const SVG_NS = 'http://www.w3.org/2000/svg';
const META = {
  [AUTHZ_ID]: { version: AUTHZ_VERSION, reflectionId: 'authz-reflection' },
  [FAN_ID]: { version: FAN_VERSION, reflectionId: 'fan-reflection' },
  [NFT_ID]: { version: NFT_VERSION, reflectionId: 'nft-reflection' },
};

const $ = (id) => document.getElementById(id);

let persist = 'memory';
let progress = null;

function browserStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function setText(id, text) {
  const el = $(id);
  if (el) el.textContent = text ?? '';
}

function selectedRadio(name) {
  const node = document.querySelector(`input[name="${name}"]:checked`);
  return node ? node.value : '';
}

function setRadio(name, value) {
  const nodes = document.querySelectorAll(`input[name="${name}"]`);
  let matched = false;
  for (const node of nodes) {
    if (node.value === value) {
      node.checked = true;
      matched = true;
    }
  }
  if (!matched && nodes[0]) nodes[0].checked = true;
}

function fillSelect(select, items, current) {
  select.replaceChildren();
  for (const item of items) {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = `${item.zh} / ${item.en}`;
    select.append(option);
  }
  if (current && [...select.options].some((opt) => opt.value === current)) {
    select.value = current;
  }
}

function persistNow() {
  const result = saveProgress(browserStorage(), progress, persist);
  if (persist === 'storage' && !result.saved) {
    persist = 'memory';
    const banner = $('storage-banner');
    banner.hidden = false;
    banner.textContent =
      '无法继续写入浏览器存储。之后的进度只留在内存里。 Could not keep writing browser storage. Further progress stays in memory.';
  }
}

function readAuthz() {
  const state = progress.activities[AUTHZ_ID];
  const policy = {};
  for (const field of POLICY_FIELDS) {
    const box = document.querySelector(`#authz-policy input[data-key="${field.key}"]`);
    policy[field.key] = Boolean(box?.checked);
  }
  state.policy = policy;
  state.actorId = $('authz-actor').value;
  state.actionId = $('authz-action').value;
  state.resourceId = $('authz-resource').value;
  state.prediction = selectedRadio('authz-predict') === 'allow' ? 'allow' : 'deny';
  state.reflection = $('authz-reflection').value;
}

function readFan() {
  const state = progress.activities[FAN_ID];
  state.sequenceText = $('fan-sequence').value;
  state.onThreshold = $('fan-on').value;
  state.offThreshold = $('fan-off').value;
  state.offWhenStale = $('fan-off-stale').checked;
  state.offWhenFault = $('fan-off-fault').checked;
  state.stopOverrides = $('fan-stop-overrides').checked;
  state.staleText = $('fan-stale').value;
  state.faultText = $('fan-fault').value;
  state.stopText = $('fan-stop').value;
  state.prediction = selectedRadio('fan-predict') === 'on' ? 'on' : 'off';
  state.reflection = $('fan-reflection').value;
}

function readNft() {
  const state = progress.activities[NFT_ID];
  const session = selectedRadio('nft-session');
  signIn(state, session === '' ? null : session);
  state.mintTo = $('nft-mint-to').value;
  state.transferTo = $('nft-transfer-to').value;
  state.useCachedOwner = $('nft-cache').checked;
  state.prediction = selectedRadio('nft-predict') === 'allow' ? 'allow' : 'deny';
  state.reflection = $('nft-reflection').value;
}

function readActive() {
  if (progress.activeId === AUTHZ_ID) readAuthz();
  else if (progress.activeId === FAN_ID) readFan();
  else readNft();
}

function syncAuthzResourceOptions() {
  const actionId = $('authz-action').value;
  const action = ACTIONS[actionId] || ACTIONS.viewPublicJob;
  const ids = action.resourceIds;
  const items = ids.map((id) => RESOURCES[id]);
  const wrap = $('authz-resource-wrap');
  wrap.hidden = ids.length < 2;
  fillSelect($('authz-resource'), items, progress.activities[AUTHZ_ID].resourceId);
  if (!ids.includes($('authz-resource').value)) {
    $('authz-resource').value = ids[0];
    progress.activities[AUTHZ_ID].resourceId = ids[0];
  }
}

function renderPolicy() {
  const root = $('authz-policy');
  const state = progress.activities[AUTHZ_ID];
  root.replaceChildren();
  for (const field of POLICY_FIELDS) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.dataset.key = field.key;
    input.checked = state.policy[field.key] === true;
    const text = document.createElement('span');
    text.textContent = `${field.zh} / ${field.en}`;
    label.append(input, text);
    root.append(label);
  }
}

function renderChecks(containerId, evaluation) {
  const root = $(containerId);
  root.replaceChildren();
  if (!evaluation) {
    const p = document.createElement('p');
    p.textContent = '尚未运行必测项。Required checks have not been run.';
    root.append(p);
    return;
  }
  const passed = evaluation.results.filter((row) => row.pass).length;
  const total = evaluation.results.length;
  const summary = document.createElement('p');
  summary.textContent = evaluation.passed
    ? `测试通过 ${passed}/${total} · Checks passed ${passed}/${total}`
    : `必测项 ${passed}/${total} 通过。查看失败用例。 Required preview checks ${passed}/${total} passed. Inspect the failing case.`;
  root.append(summary);
  const ul = document.createElement('ul');
  ul.className = 'check-list';
  for (const row of evaluation.results) {
    const li = document.createElement('li');
    li.className = row.pass ? 'pass' : 'fail';
    li.textContent = `${row.pass ? '通过 PASS' : '未过 FAIL'} · ${row.id} · expected ${row.expected} · got ${row.actual}`;
    ul.append(li);
  }
  root.append(ul);
}

function renderFailure(containerId, evaluation, extra) {
  const root = $(containerId);
  root.replaceChildren();
  const p = document.createElement('p');
  if (!evaluation) {
    p.textContent = extra || '运行必测项后，失败用例会显示在这里。 After you run required checks, a failing case appears here.';
    root.append(p);
    return;
  }
  if (evaluation.passed) {
    p.textContent =
      extra ||
      '隐藏用例目前全部通过。请仍用自己的话记下为什么。 Hidden cases currently pass. Still explain the rule in your own words if you want.';
    root.append(p);
    return;
  }
  const fail = evaluation.firstFailure;
  const lines = [
    `失败用例 / Failing case: ${fail.id}`,
    `期望 / Expected: ${fail.expected}`,
    `实际 / Actual: ${fail.actual}`,
    fail.explainZh || '',
    fail.explainEn || '',
    extra || '',
  ].filter(Boolean);
  p.textContent = lines.join('\n');
  root.append(p);
}

function completionLine(evaluation) {
  if (!evaluation) return '完成条件：通过全部隐藏必测项，而不是按“我完成了”。 Completion: pass every hidden check, not a finished button.';
  if (evaluation.passed) {
    return `测试全部通过。试着解释为什么，也可以继续挑战其他方案。 All checks passed. Explain why it works, or try another approach.`;
  }
  const passed = evaluation.results.filter((row) => row.pass).length;
  return `通过 ${passed}/${evaluation.results.length} 项。看看哪个场景还需要修改。 ${passed}/${evaluation.results.length} checks passed. Inspect the case that needs another change.`;
}

function currentConfig() {
  if (progress.activeId === AUTHZ_ID) return policyConfigSnapshot(progress.activities[AUTHZ_ID].policy);
  if (progress.activeId === FAN_ID) return controllerConfigSnapshot(progress.activities[FAN_ID]);
  return membershipConfigSnapshot(progress.activities[NFT_ID]);
}

function currentEvaluation() {
  return progress.activities[progress.activeId].lastEvaluation;
}

function renderEvidence() {
  const meta = META[progress.activeId];
  const evaluation = currentEvaluation();
  const evidence = buildEvidence({
    challengeId: progress.activeId,
    version: meta.version,
    config: currentConfig(),
    checks: evaluation?.results || [],
    reflection: progress.activities[progress.activeId].reflection || '',
    persist,
  });
  setText('evidence-out', formatEvidenceText(evidence));
  return evidence;
}

function renderAuthz() {
  const state = progress.activities[AUTHZ_ID];
  renderPolicy();
  fillSelect(
    $('authz-actor'),
    ACTOR_IDS.map((id) => ACTORS[id]),
    state.actorId,
  );
  fillSelect(
    $('authz-action'),
    ACTION_IDS.map((id) => ACTIONS[id]),
    state.actionId,
  );
  syncAuthzResourceOptions();
  setRadio('authz-predict', state.prediction);
  $('authz-reflection').value = state.reflection || '';
  const live = $('authz-live');
  live.className = 'result';
  if (state.lastTrial) {
    const trial = state.lastTrial;
    const actor = ACTORS[trial.actorId];
    const action = ACTIONS[trial.actionId];
    const resource = RESOURCES[trial.resourceId];
    live.classList.add(trial.allowed ? 'ok' : 'bad');
    const predict = trial.predictedCorrect
      ? '预测相符 / Prediction matched.'
      : '预测不符 / Prediction did not match.';
    live.textContent = [
      `${actor.zh} / ${actor.en} · ${action.zh} / ${action.en} · ${resource.zh} / ${resource.en}`,
      trial.allowed ? '判定：允许 / Decision: allow' : '判定：拒绝 / Decision: deny',
      trial.zh,
      trial.en,
      predict,
    ].join('\n');
  } else {
    live.textContent = '选择请求者、动作和预测，然后判定。 Choose a requester, action, and prediction, then evaluate.';
  }
  const failExtra = state.lastEvaluation?.firstFailure
    ? `${ACTORS[state.lastEvaluation.firstFailure.actorId]?.zh} ${ACTIONS[state.lastEvaluation.firstFailure.actionId]?.zh} ${RESOURCES[state.lastEvaluation.firstFailure.resourceId]?.zh}`
    : '';
  renderFailure('authz-diagnostics', state.lastEvaluation, failExtra);
  renderChecks('authz-check-list', state.lastEvaluation);
  setText('authz-status', completionLine(state.lastEvaluation));
}

function drawFanChart(trace) {
  const svg = $('fan-chart');
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const width = 640;
  const height = 180;
  const pad = { l: 36, r: 12, t: 16, b: 28 };
  svg.appendChild(elSvg('rect', { x: 0, y: 0, width, height, fill: '#f6f4ee' }));
  if (!trace.length) return;

  const temps = trace.map((step) => step.temp).filter((n) => Number.isFinite(n));
  let lo = Math.min(...temps, 18);
  let hi = Math.max(...temps, 32);
  if (hi === lo) {
    hi += 5;
    lo -= 5;
  }
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const x = (i) => pad.l + (trace.length === 1 ? innerW / 2 : (i / (trace.length - 1)) * innerW);
  const y = (temp) => pad.t + ((hi - temp) / (hi - lo)) * innerH;

  for (const step of trace) {
    if (!step.fanOn) continue;
    const cx = x(step.i);
    svg.appendChild(
      elSvg('rect', {
        x: cx - 6,
        y: pad.t,
        width: 12,
        height: innerH,
        fill: '#dce8df',
      }),
    );
  }

  const points = trace.map((step) => `${x(step.i)},${y(step.temp)}`).join(' ');
  svg.appendChild(
    elSvg('polyline', {
      points,
      fill: 'none',
      stroke: '#233c32',
      'stroke-width': 2,
    }),
  );

  for (const step of trace) {
    svg.appendChild(
      elSvg('circle', {
        cx: x(step.i),
        cy: y(step.temp),
        r: 4,
        fill: step.fanOn ? '#2c5a3f' : '#233c32',
      }),
    );
    if (step.stop || step.fault || step.stale) {
      svg.appendChild(
        elSvg('circle', {
          cx: x(step.i),
          cy: y(step.temp),
          r: 8,
          fill: 'none',
          stroke: '#c36b3b',
          'stroke-width': 2,
        }),
      );
    }
  }
}

function elSvg(name, attrs) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

function renderFanTrace(trace) {
  const list = $('fan-trace');
  list.replaceChildren();
  for (const step of trace) {
    const li = document.createElement('li');
    const reason = REASON_COPY[step.reason] || { zh: step.reason, en: step.reason };
    const flags = [
      step.stale ? '过期 stale' : '',
      step.fault ? '故障 fault' : '',
      step.stop ? '急停 stop' : '',
    ]
      .filter(Boolean)
      .join(', ');
    li.textContent = `#${step.i + 1}  ${step.temp} ℃  风扇 ${step.fanOn ? '开 ON' : '关 OFF'}  ${reason.zh} / ${reason.en}${flags ? `  (${flags})` : ''}`;
    list.append(li);
  }
}

function renderFan() {
  const state = progress.activities[FAN_ID];
  $('fan-sequence').value = state.sequenceText;
  $('fan-on').value = state.onThreshold;
  $('fan-off').value = state.offThreshold;
  $('fan-off-stale').checked = state.offWhenStale === true;
  $('fan-off-fault').checked = state.offWhenFault === true;
  $('fan-stop-overrides').checked = state.stopOverrides === true;
  $('fan-stale').value = state.staleText;
  $('fan-fault').value = state.faultText;
  $('fan-stop').value = state.stopText;
  setRadio('fan-predict', state.prediction);
  $('fan-reflection').value = state.reflection || '';

  const live = $('fan-live');
  live.className = 'result';
  if (state.lastRun?.error) {
    live.classList.add('bad');
    live.textContent = `${state.lastRun.error.zh}\n${state.lastRun.error.en}`;
    drawFanChart([]);
    $('fan-trace').replaceChildren();
  } else if (state.lastRun?.sim) {
    const sim = state.lastRun.sim;
    const last = sim.trace[sim.trace.length - 1];
    const predicted = state.lastRun.prediction === 'on';
    live.classList.add(last.fanOn === predicted ? 'ok' : 'bad');
    live.textContent = [
      `最后风扇 / Final fan: ${last.fanOn ? '开 ON' : '关 OFF'}`,
      `切换次数 / Transitions: ${sim.transitions}`,
      last.fanOn === predicted ? '预测相符 / Prediction matched.' : '预测不符 / Prediction did not match.',
    ].join('\n');
    drawFanChart(sim.trace);
    renderFanTrace(sim.trace);
  } else {
    live.textContent = '输入温度序列并运行，观察回差、过期、故障和急停。 Enter a sequence and run it to watch hysteresis, stale, fault, and stop.';
    drawFanChart([]);
    $('fan-trace').replaceChildren();
  }
  renderFailure('fan-diagnostics', state.lastEvaluation);
  renderChecks('fan-check-list', state.lastEvaluation);
  setText('fan-status', completionLine(state.lastEvaluation));
}

function renderLedger() {
  const state = progress.activities[NFT_ID];
  const root = $('nft-ledger');
  root.replaceChildren();
  const tokens = Object.values(state.ledger);
  if (!tokens.length) {
    const p = document.createElement('p');
    p.textContent = '账本为空。The simulated ledger is empty.';
    root.append(p);
    return;
  }
  const table = document.createElement('table');
  table.className = 'ledger';
  const head = document.createElement('tr');
  for (const title of ['通行证 / Pass', '当前持有人 / Ledger owner', '缓存持有人 / Cached owner']) {
    const th = document.createElement('th');
    th.textContent = title;
    head.append(th);
  }
  const thead = document.createElement('thead');
  thead.append(head);
  table.append(thead);
  const tbody = document.createElement('tbody');
  for (const token of tokens) {
    const tr = document.createElement('tr');
    const cells = [token.tokenId, token.owner, state.cache[token.tokenId] ?? '—'];
    for (const value of cells) {
      const td = document.createElement('td');
      td.textContent = value;
      tr.append(td);
    }
    tbody.append(tr);
  }
  table.append(tbody);
  root.append(table);
}

function renderNft() {
  const state = progress.activities[NFT_ID];
  setRadio('nft-session', state.session ?? '');
  $('nft-mint-to').value = state.mintTo;
  $('nft-transfer-to').value = state.transferTo;
  $('nft-cache').checked = state.useCachedOwner === true;
  setRadio('nft-predict', state.prediction);
  $('nft-reflection').value = state.reflection || '';

  const live = $('nft-live');
  live.className = 'result';
  const parts = [
    `模拟合约 / Simulated contract: ${TOKEN_CONTRACT}`,
    `连接 / Session: ${state.session ? `${WALLETS[state.session].zh} / ${WALLETS[state.session].en}` : '未连接 / disconnected'}`,
    `缓存持有人 / Cached owner: ${state.useCachedOwner ? '开启 on' : '关闭 off'}`,
  ];
  if (state.lastMint) parts.push(state.lastMint.zh, state.lastMint.en);
  if (state.lastTransfer) parts.push(state.lastTransfer.zh, state.lastTransfer.en);
  if (state.lastRequest) {
    const req = state.lastRequest;
    live.classList.add(req.allowed ? 'ok' : 'bad');
    parts.push(req.allowed ? '请求：允许 / Request: allow' : '请求：拒绝 / Request: deny');
    parts.push(req.zh, req.en);
    if (req.prediction != null) {
      parts.push(
        req.predictedCorrect ? '预测相符 / Prediction matched.' : '预测不符 / Prediction did not match.',
      );
    }
    if (req.ledgerOwner && req.effectiveOwner && req.ledgerOwner !== req.effectiveOwner) {
      parts.push(
        `账本持有人是 ${req.ledgerOwner}，缓存仍是 ${req.effectiveOwner}。关闭缓存后会按当前账本检查。 Ledger owner is ${req.ledgerOwner}; cache still says ${req.effectiveOwner}. Disable the cache to recheck current ownership.`,
      );
    }
  }
  live.textContent = parts.join('\n');

  const box = $('nft-protected');
  box.replaceChildren();
  const note = document.createElement('p');
  if (state.lastRequest?.allowed && state.lastRequest.content) {
    note.textContent = `${state.lastRequest.content.zh}\n${state.lastRequest.content.en}`;
  } else {
    note.textContent =
      '未授权时这里应为空。真实系统必须由服务器在核对当前持有之后才返回内容，而不是靠隐藏前端区块。 When denied this stays empty. A real system must return content from the server after a current-holder check, not by hiding a front-end block.';
  }
  box.append(note);

  renderLedger();
  renderFailure('nft-diagnostics', state.lastEvaluation);
  renderChecks('nft-check-list', state.lastEvaluation);
  setText('nft-status', completionLine(state.lastEvaluation));
}

function showActivity(id) {
  for (const activityId of ACTIVITY_IDS) {
    const panel = $(`panel-${activityId}`);
    const tab = $(`tab-${activityId}`);
    const selected = activityId === id;
    panel.hidden = !selected;
    tab.setAttribute('aria-selected', selected ? 'true' : 'false');
    tab.tabIndex = selected ? 0 : -1;
  }
}

function renderAll() {
  $('practice-course').href = '../program.html?project='+({[AUTHZ_ID]:'product',[FAN_ID]:'sensor',[NFT_ID]:'token'}[progress.activeId]);
  showActivity(progress.activeId);
  renderAuthz();
  renderFan();
  renderNft();
  if (progress.activeId === AUTHZ_ID) renderAuthz();
  if (progress.activeId === FAN_ID) renderFan();
  if (progress.activeId === NFT_ID) renderNft();
  renderEvidence();
}

function switchActivity(id) {
  readActive();
  progress.activeId = id;
  const url = new URL(location.href); url.searchParams.set("challenge",id); history.replaceState(null,"",url);
  persistNow();
  renderAll();
  $(`tab-${id}`).focus();
}

function runAuthzTrial() {
  readAuthz();
  const state = progress.activities[AUTHZ_ID];
  state.lastTrial = runTrial({
    actorId: state.actorId,
    actionId: state.actionId,
    resourceId: state.resourceId,
    policy: state.policy,
    prediction: state.prediction,
  });
  persistNow();
  renderAuthz();
  renderEvidence();
}

function runAuthzChecks() {
  readAuthz();
  const state = progress.activities[AUTHZ_ID];
  state.lastEvaluation = evaluatePolicy(state.policy);
  persistNow();
  renderAuthz();
  renderEvidence();
}

function runFanSequence() {
  readFan();
  const state = progress.activities[FAN_ID];
  const temps = parseTemps(state.sequenceText);
  if (!temps.ok) {
    state.lastRun = { error: temps.error };
    persistNow();
    renderFan();
    renderEvidence();
    return;
  }
  const thresholds = validateThresholds(state.onThreshold, state.offThreshold);
  if (!thresholds.ok) {
    state.lastRun = { error: thresholds.errors[0] };
    persistNow();
    renderFan();
    renderEvidence();
    return;
  }
  const stale = parseIndexes(state.staleText, temps.temps.length);
  const fault = parseIndexes(state.faultText, temps.temps.length);
  const stop = parseIndexes(state.stopText, temps.temps.length);
  const firstError = [stale, fault, stop].find((item) => !item.ok);
  if (firstError) {
    state.lastRun = { error: firstError.error };
    persistNow();
    renderFan();
    renderEvidence();
    return;
  }
  const flags = settingsFromState(state);
  const sim = simulate({
    temps: temps.temps,
    onThreshold: thresholds.on,
    offThreshold: thresholds.off,
    staleAt: stale.indexes,
    faultAt: fault.indexes,
    stopAt: stop.indexes,
    offWhenStale: flags.offWhenStale,
    offWhenFault: flags.offWhenFault,
    stopOverrides: flags.stopOverrides,
  });
  state.lastRun = { sim, prediction: state.prediction };
  persistNow();
  renderFan();
  renderEvidence();
}

function runFanChecks() {
  readFan();
  const state = progress.activities[FAN_ID];
  state.lastEvaluation = evaluateController(state);
  persistNow();
  renderFan();
  renderEvidence();
}

function runNftMint() {
  readNft();
  const state = progress.activities[NFT_ID];
  state.lastMint = mint(state, state.mintTo);
  persistNow();
  renderNft();
  renderEvidence();
}

function runNftTransfer() {
  readNft();
  const state = progress.activities[NFT_ID];
  const tokenId = state.lastTokenId;
  state.lastTransfer = tokenId
    ? transfer(state, tokenId, state.transferTo)
    : {
        ok: false,
        zh: '还没有通行证可转让。',
        en: 'There is no pass to transfer yet.',
      };
  persistNow();
  renderNft();
  renderEvidence();
}

function runNftRequest() {
  readNft();
  const state = progress.activities[NFT_ID];
  const tokenId = state.lastTokenId || 'sim-pass-missing';
  const got = requestProtected(state, tokenId);
  const expected = got.allowed ? 'allow' : 'deny';
  state.lastRequest = {
    ...got,
    prediction: state.prediction,
    predictedCorrect: state.prediction === expected,
  };
  persistNow();
  renderNft();
  renderEvidence();
}

function runNftChecks() {
  readNft();
  const state = progress.activities[NFT_ID];
  state.lastEvaluation = evaluateMembership(state.useCachedOwner);
  persistNow();
  renderNft();
  renderEvidence();
}

async function copyEvidence() {
  readActive();
  const text = formatEvidenceText(renderEvidence());
  const status = $('evidence-copy-status');
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const area = document.createElement('textarea');
      area.value = text;
      document.body.append(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    status.textContent = '已复制到剪贴板。 Copied to the clipboard.';
  } catch {
    status.textContent = '无法自动复制，请手动选择文本。 Copy failed; select the text instead.';
  }
}

function downloadEvidence() {
  readActive();
  const evidence = renderEvidence();
  const text = formatEvidenceText(evidence);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `playground-${progress.activeId}.txt`;
  link.rel = 'noopener';
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function resetSelected() {
  const ok = globalThis.confirm(
    '只清除当前练习在这台浏览器中的进度。其他练习不受影响。\nReset only this activity on this device. Other activities stay as they are.',
  );
  if (!ok) return;
  progress = resetActivity(progress, progress.activeId);
  persistNow();
  renderAll();
}

function bind() {
  for (const id of ACTIVITY_IDS) {
    $(`tab-${id}`).addEventListener('click', () => switchActivity(id));
  }
  $('reset-activity').addEventListener('click', resetSelected);
  $('authz-action').addEventListener('change', () => {
    progress.activities[AUTHZ_ID].actionId = $('authz-action').value;
    syncAuthzResourceOptions();
  });
  $('authz-try').addEventListener('click', runAuthzTrial);
  $('authz-checks').addEventListener('click', runAuthzChecks);
  $('fan-run').addEventListener('click', runFanSequence);
  $('fan-checks').addEventListener('click', runFanChecks);
  $('nft-mint').addEventListener('click', runNftMint);
  $('nft-transfer').addEventListener('click', runNftTransfer);
  $('nft-request').addEventListener('click', runNftRequest);
  $('nft-checks').addEventListener('click', runNftChecks);
  $('evidence-copy').addEventListener('click', () => {
    copyEvidence().catch(() => {});
  });
  $('evidence-download').addEventListener('click', downloadEvidence);
  document.addEventListener('change', () => {
    readActive();
    persistNow();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    const tab = event.target.closest('[role="tab"]');
    if (!tab) return;
    event.preventDefault();
    const index = ACTIVITY_IDS.indexOf(tab.id.replace(/^tab-/, ""));
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    const next = ACTIVITY_IDS[(index + delta + ACTIVITY_IDS.length) % ACTIVITY_IDS.length];
    switchActivity(next);
  });
}

function init() {
  const loaded = loadProgress(browserStorage());
  persist = loaded.persist;
  progress = loaded.data;
  const requested = new URLSearchParams(location.search).get("challenge");
  if (ACTIVITY_IDS.includes(requested)) progress.activeId = requested;
  const banner = $('storage-banner');
  if (loaded.warning) {
    banner.hidden = false;
    banner.textContent = `${loaded.warning.zh} ${loaded.warning.en}`;
  }
  bind();
  renderAll();
}

init();
