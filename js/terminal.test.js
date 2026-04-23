
const { test } = require('node:test');
const assert = require('node:assert');
const { parseTerminalCommand } = require('./terminal.js');

test('parseTerminalCommand', async (t) => {
  await t.test('basic command', () => {
    const input = 'help';
    const result = parseTerminalCommand(input);
    assert.deepStrictEqual(result, { cmd: 'help', args: [] });
  });

  await t.test('command with one argument', () => {
    const input = 'ray --journey';
    const result = parseTerminalCommand(input);
    assert.deepStrictEqual(result, { cmd: 'ray', args: ['--journey'] });
  });

  await t.test('command with quoted argument', () => {
    const input = 'echo "hello world"';
    const result = parseTerminalCommand(input);
    assert.deepStrictEqual(result, { cmd: 'echo', args: ['hello world'] });
  });

  await t.test('command with multiple arguments including quotes', () => {
    const input = 'echo "hello" world "foo bar"';
    const result = parseTerminalCommand(input);
    assert.deepStrictEqual(result, { cmd: 'echo', args: ['hello', 'world', 'foo bar'] });
  });

  await t.test('mixed quotes and text', () => {
    // Current implementation: "prefix\"quoted\"" -> matches as one token, then " are removed.
    // 'prefix"quoted"' matches as 'prefix"quoted"', then replace(/"/g, '') -> 'prefixquoted'
    const input = 'echo prefix"quoted"';
    const result = parseTerminalCommand(input);
    assert.deepStrictEqual(result, { cmd: 'echo', args: ['prefixquoted'] });
  });

  await t.test('empty input', () => {
    const input = '';
    const result = parseTerminalCommand(input);
    assert.deepStrictEqual(result, { cmd: undefined, args: [] });
  });

  await t.test('multiple spaces', () => {
    const input = '  echo   test  ';
    const result = parseTerminalCommand(input);
    assert.deepStrictEqual(result, { cmd: 'echo', args: ['test'] });
  });

  await t.test('case insensitivity for command', () => {
    const input = 'EcHo test';
    const result = parseTerminalCommand(input);
    assert.strictEqual(result.cmd, 'echo');
    assert.deepStrictEqual(result.args, ['test']);
  });

  await t.test('unclosed quote (matches until end of string)', () => {
    // Current regex `(?:[^\s"]+|"[^"]*")+`
    // If quote is unclosed, `"[^"]*` might not match or match until end?
    // Let's verify behavior. Based on previous exploration:
    // 'echo "hello' -> ['echo', 'hello'] because regex might fail to match the quote part as a quote block
    // but [^\s"]+ matches 'echo'.
    // Wait, `"[^"]*` requires closing quote.
    // So 'echo "hello'
    // 'echo' matches `[^\s"]+`
    // '"hello' : `"` matches, `[^"]*` matches `hello`, but missing closing `"`
    // So `"[^"]*` fails.
    // `[^\s"]+` matches `hello`? No, `"` is excluded.
    // Actually `(?:[^\s"]+|"[^"]*")+`
    // In 'echo "hello', 'echo' matches.
    // space skipped by `g` flag? No, `match` with `g` finds all non-overlapping matches.
    // The regex doesn't match spaces.
    // So for '"hello', it doesn't match `"[^"]*`.
    // It doesn't match `[^\s"]+` at start because of `"`.
    // So it might just skip it?
    // Previous exploration showed: `[ 'echo', 'hello' ]` for `echo "hello` was INCORRECT in my memory maybe?
    // Let's re-verify with the tool if needed, but I recall `debug_regex_unclosed.js` output `[ 'echo', 'hello' ]`?
    // Wait, `debug_regex_unclosed.js` output was `[ 'echo', 'hello' ]`... HOW?
    // Ah, `[^\s"]+` excludes `"`.
    // If input is `"hello`, `"` is not matched by `[^\s"]+`.
    // `"[^"]*` requires closing quote.
    // So `"hello` should NOT match anything?
    // Maybe `hello` matches `[^\s"]+`?
    // But `"` is at the start.
    // Let's check `debug_regex_unclosed.js` output again.
    // Output was `[ 'echo', 'hello' ]`.
    // Ah, maybe the browser/node regex engine creates a match for `hello` skipping the `"`?
    // No, `match(/.../g)` returns array of matches.
    // If `"` is not matched, it is skipped. `hello` is matched by `[^\s"]+`.
    // So `echo "hello` -> match `echo`, skip `"`, match `hello`.
    // Result: `echo`, `hello`.
    // Test case:
    const input = 'echo "hello';
    const result = parseTerminalCommand(input);
    assert.deepStrictEqual(result, { cmd: 'echo', args: ['hello'] });
  });

  await t.test('single quotes (treated as normal chars)', () => {
     // Regex only treats double quotes special.
     const input = "echo 'hello world'";
     // match 1: echo
     // match 2: 'hello
     // match 3: world'
     const result = parseTerminalCommand(input);
     assert.deepStrictEqual(result, { cmd: 'echo', args: ["'hello", "world'"] });
  });
});
