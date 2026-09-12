/** Simulated low-voltage greenhouse fan controller. No hardware connection. */

export const CHALLENGE_ID = 'greenhouse-fan';
export const CHALLENGE_VERSION = '2026.09.10';

export const MAX_SAMPLES = 32;
export const TEMP_MIN = -10;
export const TEMP_MAX = 55;
export const MIN_HYSTERESIS = 2;

/** Fixed plant conditions for required preview checks. */
export const PLANT = {
  hot: 32,
  hold: 26,
  cool: 18,
  noise: [26.6, 27.3, 26.8, 27.2, 26.9, 27.1],
};

export function defaultActivityState() {
  return {
    sequenceText: '22, 25, 28, 31, 30, 27, 24, 18',
    onThreshold: 28,
    offThreshold: 27,
    offWhenStale: false,
    offWhenFault: false,
    stopOverrides: false,
    staleText: '',
    faultText: '',
    stopText: '',
    prediction: 'on',
    lastRun: null,
    lastEvaluation: null,
    reflection: '',
  };
}

export function parseNumberList(text, { min, max, maxLength, labelZh, labelEn }) {
  if (typeof text !== 'string' || !text.trim()) {
    return { ok: true, values: [] };
  }
  const parts = text.split(/[,，\s]+/).filter(Boolean);
  if (parts.length > maxLength) {
    return {
      ok: false,
      values: [],
      error: {
        code: 'too-long',
        zh: `${labelZh}最多 ${maxLength} 项。`,
        en: `${labelEn} accepts at most ${maxLength} items.`,
      },
    };
  }
  const values = [];
  for (const part of parts) {
    const n = Number(part);
    if (!Number.isFinite(n)) {
      const shown = part.slice(0, 24);
      return {
        ok: false,
        values: [],
        error: {
          code: 'not-number',
          zh: `无法把“${shown}”读成数字。`,
          en: `Cannot parse “${shown}” as a number.`,
        },
      };
    }
    if (n < min || n > max) {
      return {
        ok: false,
        values: [],
        error: {
          code: 'range',
          zh: `${labelZh}须在 ${min} 到 ${max} 之间。`,
          en: `${labelEn} must be between ${min} and ${max}.`,
        },
      };
    }
    values.push(n);
  }
  return { ok: true, values };
}

export function parseTemps(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return {
      ok: false,
      temps: [],
      error: {
        code: 'empty',
        zh: '请输入温度序列。',
        en: 'Enter a temperature sequence.',
      },
    };
  }
  const parsed = parseNumberList(text, {
    min: TEMP_MIN,
    max: TEMP_MAX,
    maxLength: MAX_SAMPLES,
    labelZh: '温度',
    labelEn: 'Temperature',
  });
  if (!parsed.ok) return { ok: false, temps: [], error: parsed.error };
  if (parsed.values.length === 0) {
    return {
      ok: false,
      temps: [],
      error: {
        code: 'empty',
        zh: '请输入温度序列。',
        en: 'Enter a temperature sequence.',
      },
    };
  }
  return { ok: true, temps: parsed.values };
}

/** 1-based indexes in the UI, 0-based in simulation. */
export function parseIndexes(text, length) {
  if (typeof text !== 'string' || !text.trim()) {
    return { ok: true, indexes: [] };
  }
  const parsed = parseNumberList(text, {
    min: 1,
    max: Math.max(1, length),
    maxLength: MAX_SAMPLES,
    labelZh: '序号',
    labelEn: 'Index',
  });
  if (!parsed.ok) return { ok: false, indexes: [], error: parsed.error };
  const indexes = [];
  const seen = new Set();
  for (const value of parsed.values) {
    if (!Number.isInteger(value)) {
      return {
        ok: false,
        indexes: [],
        error: {
          code: 'not-integer',
          zh: '序号必须是整数，从 1 开始。',
          en: 'Indexes must be integers starting at 1.',
        },
      };
    }
    if (value < 1 || value > length) {
      return {
        ok: false,
        indexes: [],
        error: {
          code: 'index-range',
          zh: `序号须在 1 到 ${length} 之间。`,
          en: `Indexes must be between 1 and ${length}.`,
        },
      };
    }
    const zero = value - 1;
    if (!seen.has(zero)) {
      seen.add(zero);
      indexes.push(zero);
    }
  }
  return { ok: true, indexes };
}

export function validateThresholds(onThreshold, offThreshold) {
  const errors = [];
  const numeric = value => (typeof value === 'number' || (typeof value === 'string' && value.trim())) ? Number(value) : NaN;
  const on = numeric(onThreshold);
  const off = numeric(offThreshold);
  if (!Number.isFinite(on) || !Number.isFinite(off)) {
    errors.push({
      code: 'not-finite',
      zh: '开启和关闭阈值必须是数字。',
      en: 'On and off thresholds must be numbers.',
    });
    return { ok: false, on: NaN, off: NaN, errors };
  }
  if (on < TEMP_MIN || on > TEMP_MAX || off < TEMP_MIN || off > TEMP_MAX) {
    errors.push({
      code: 'threshold-range',
      zh: `阈值须在 ${TEMP_MIN} 到 ${TEMP_MAX} ℃。`,
      en: `Thresholds must be between ${TEMP_MIN} and ${TEMP_MAX} °C.`,
    });
  }
  if (off >= on) {
    errors.push({
      code: 'impossible-hysteresis',
      zh: '关闭阈值必须低于开启阈值，否则风扇会在边界上抖动或无法定义。',
      en: 'The off threshold must be below the on threshold, or the fan chatters or is undefined at the boundary.',
    });
  }
  return { ok: errors.length === 0, on, off, errors };
}

export function countTransitions(trace) {
  let n = 0;
  for (let i = 1; i < trace.length; i += 1) {
    if (trace[i].fanOn !== trace[i - 1].fanOn) n += 1;
  }
  return n;
}

export function simulate({
  temps,
  onThreshold,
  offThreshold,
  staleAt = [],
  faultAt = [],
  stopAt = [],
  offWhenStale = true,
  offWhenFault = true,
  stopOverrides = true,
} = {}) {
  const numeric = value => (typeof value === 'number' || (typeof value === 'string' && value.trim())) ? Number(value) : NaN;
  const on = numeric(onThreshold);
  const off = numeric(offThreshold);
  const stale = new Set(staleAt);
  const fault = new Set(faultAt);
  const stop = new Set(stopAt);
  const list = Array.isArray(temps) ? temps : [];

  const trace = [];
  let fanOn = false;

  for (let i = 0; i < list.length; i += 1) {
    const temp = Number(list[i]);
    const isStop = stop.has(i);
    const isFault = fault.has(i);
    const isStale = stale.has(i);
    const prevFanOn = fanOn;
    let reason = 'hold';

    if (isStop && stopOverrides) {
      fanOn = false;
      reason = 'stop';
    } else if (isFault && offWhenFault) {
      fanOn = false;
      reason = 'fault';
    } else if (isStale && offWhenStale) {
      fanOn = false;
      reason = 'stale';
    } else if (Number.isFinite(temp) && temp >= on) {
      fanOn = true;
      reason = 'hot-on';
    } else if (Number.isFinite(temp) && temp <= off) {
      fanOn = false;
      reason = 'cool-off';
    } else {
      reason = 'hold';
    }

    trace.push({
      i,
      temp,
      fanOn,
      prevFanOn,
      reason,
      stale: isStale,
      fault: isFault,
      stop: isStop,
    });
  }

  return {
    trace,
    transitions: countTransitions(trace),
    finalOn: trace.length ? trace[trace.length - 1].fanOn : false,
  };
}

export const REASON_COPY = {
  stop: { zh: '急停关断', en: 'Emergency stop off' },
  fault: { zh: '传感器故障关断', en: 'Sensor fault off' },
  stale: { zh: '读数过期关断', en: 'Stale reading off' },
  'hot-on': { zh: '达到开启阈值', en: 'On threshold reached' },
  'cool-off': { zh: '达到关闭阈值', en: 'Off threshold reached' },
  hold: { zh: '回差保持', en: 'Hysteresis hold' },
};

export function settingsFromState(state) {
  return {
    onThreshold: Number(state.onThreshold),
    offThreshold: Number(state.offThreshold),
    offWhenStale: state.offWhenStale === true,
    offWhenFault: state.offWhenFault === true,
    stopOverrides: state.stopOverrides === true,
  };
}

function checkRow(id, pass, expected, actual, explainZh, explainEn) {
  return { id, pass, expected, actual, explainZh, explainEn };
}

export function evaluateController(state) {
  const settings = settingsFromState(state);
  const threshold = validateThresholds(settings.onThreshold, settings.offThreshold);
  const results = [];

  if (!threshold.ok) {
    for (const error of threshold.errors) {
      results.push(checkRow(error.code, false, 'valid', error.code, error.zh, error.en));
    }
    return {
      passed: false,
      results,
      firstFailure: results[0] || null,
    };
  }

  const { on, off } = threshold;
  const flags = {
    offWhenStale: settings.offWhenStale,
    offWhenFault: settings.offWhenFault,
    stopOverrides: settings.stopOverrides,
  };

  const run = (id, input, passFn, expected, explainZh, explainEn) => {
    const sim = simulate({
      temps: input.temps,
      onThreshold: on,
      offThreshold: off,
      staleAt: input.staleAt || [],
      faultAt: input.faultAt || [],
      stopAt: input.stopAt || [],
      ...flags,
    });
    const pass = passFn(sim);
    const actual = sim.trace.map((step) => (step.fanOn ? 'on' : 'off')).join(',');
    results.push(checkRow(id, pass, expected, actual, explainZh, explainEn));
  };

  results.push(
    checkRow(
      'hysteresis-gap',
      on - off >= MIN_HYSTERESIS,
      `>= ${MIN_HYSTERESIS}`,
      String(on - off),
      `开启与关闭至少相差 ${MIN_HYSTERESIS} ℃，避免在边界上频繁开关。`,
      `Keep at least ${MIN_HYSTERESIS} °C between on and off to avoid chatter at the boundary.`,
    ),
  );

  run(
    'hot-32-on',
    { temps: [PLANT.hot] },
    (sim) => sim.finalOn === true,
    'on',
    '32 ℃ 视为过热，风扇应开启。',
    '32 °C is hot for this greenhouse; the fan should turn on.',
  );
  run(
    'cool-18-from-cold',
    { temps: [PLANT.cool] },
    (sim) => sim.finalOn === false,
    'off',
    '从关闭状态遇到 18 ℃，风扇应保持关。',
    'From a cold start at 18 °C the fan should stay off.',
  );
  run(
    'hold-26-after-32',
    { temps: [PLANT.hot, PLANT.hold] },
    (sim) => sim.trace.length === 2 && sim.trace[0].fanOn && sim.trace[1].fanOn,
    'on,on',
    '高温开启后，26 ℃ 仍在回差带内，应保持开，避免刚降温就关掉。',
    'After turning on at heat, 26 °C is still in the band; hold on so the fan does not chatter.',
  );
  run(
    'off-18-after-32',
    { temps: [PLANT.hot, PLANT.cool] },
    (sim) => sim.trace[0]?.fanOn === true && sim.trace[1]?.fanOn === false,
    'on,off',
    '高温后再降到 18 ℃，风扇应关闭。',
    'After heat, 18 °C should turn the fan off.',
  );
  run(
    'noise-27-no-chatter',
    { temps: PLANT.noise },
    (sim) => sim.transitions === 0 && sim.finalOn === false,
    'all-off',
    '27 ℃ 附近的小波动不是“过热”。从关闭状态不应被抖开。',
    'Small noise around 27 °C is not “hot”. From off, the fan should not chatter on.',
  );
  run(
    'stale-at-32',
    { temps: [PLANT.hot], staleAt: [0] },
    (sim) => sim.finalOn === false && sim.trace[0]?.reason === 'stale',
    'off-stale',
    '过期读数不是可靠温度。本演示选择安全关断。',
    'A stale reading is not a trustworthy temperature. This demo fails safe to off.',
  );
  run(
    'fault-at-32',
    { temps: [PLANT.hot], faultAt: [0] },
    (sim) => sim.finalOn === false && sim.trace[0]?.reason === 'fault',
    'off-fault',
    '传感器故障时不要按高温去开风扇。本演示关断。',
    'A faulting sensor must not be treated as heat. This demo turns the fan off.',
  );
  run(
    'stop-overrides-heat',
    { temps: [PLANT.hot], stopAt: [0] },
    (sim) => sim.finalOn === false && sim.trace[0]?.reason === 'stop',
    'off-stop',
    '急停优先于温度请求。',
    'Emergency stop overrides a temperature request.',
  );
  run(
    'recover-hot-after-stop',
    { temps: [PLANT.hot, PLANT.hot], stopAt: [0] },
    (sim) => sim.trace[0]?.fanOn === false && sim.trace[1]?.fanOn === true,
    'off,on',
    '急停解除且读数仍热时，可以再次开启。',
    'After stop is released and the reading is still hot, the fan may turn on again.',
  );
  run(
    'recover-band-stays-off',
    { temps: [PLANT.hot, PLANT.hold], stopAt: [0] },
    (sim) => sim.trace[0]?.fanOn === false && sim.trace[1]?.fanOn === false,
    'off,off',
    '急停后状态视为关闭。26 ℃ 低于开启阈值时应保持关，不要恢复急停前的“开”。',
    'After stop, treat the fan as off. At 26 °C, below the on threshold, stay off; do not restore the previous on state.',
  );

  return {
    passed: results.every((row) => row.pass),
    results,
    firstFailure: results.find((row) => !row.pass) || null,
  };
}

export function controllerConfigSnapshot(state) {
  const settings = settingsFromState(state);
  return {
    ...settings,
    sequenceText: String(state.sequenceText ?? ''),
    staleText: String(state.staleText ?? ''),
    faultText: String(state.faultText ?? ''),
    stopText: String(state.stopText ?? ''),
  };
}
