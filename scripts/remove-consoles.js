/**
 * Removes console.log/warn/error/debug/info/trace calls from source files.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIRS = ['app', 'components', 'context', 'hooks', 'utils', 'services', 'constants'];
const EXT = new Set(['.ts', '.tsx', '.js', '.jsx']);
const CONSOLE_RE = /^(?:if\s*\(\s*__DEV__\s*\)\s*)?console\.(?:log|warn|error|debug|info|trace)\s*\(/;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      if (name !== 'node_modules') walk(full, out);
    } else if (EXT.has(path.extname(name))) {
      out.push(full);
    }
  }
  return out;
}

function skipCall(code, openParenIndex) {
  let i = openParenIndex + 1;
  let depth = 1;
  let inStr = null;
  let escape = false;
  while (i < code.length && depth > 0) {
    const ch = code[i];
    if (escape) {
      escape = false;
      i++;
      continue;
    }
    if (inStr) {
      if (ch === '\\') escape = true;
      else if (ch === inStr) inStr = null;
      i++;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inStr = ch;
      i++;
      continue;
    }
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    i++;
  }
  while (i < code.length && /[ \t]/.test(code[i])) i++;
  if (code[i] === ';') i++;
  if (code[i] === '\r') i++;
  if (code[i] === '\n') i++;
  return i;
}

function removeConsoleCalls(code) {
  let result = '';
  let i = 0;
  while (i < code.length) {
    const rest = code.slice(i);
    const m = rest.match(CONSOLE_RE);
    if (!m) {
      result += code[i];
      i++;
      continue;
    }
    const openParen = i + m[0].length - 1;
    i = skipCall(code, openParen);
  }
  return result.replace(/(\r?\n){3,}/g, '\n\n');
}

let total = 0;
let files = 0;
for (const dir of DIRS) {
  for (const file of walk(path.join(ROOT, dir))) {
    const before = fs.readFileSync(file, 'utf8');
    if (!/console\.(log|warn|error|debug|info|trace)/.test(before)) continue;
    const after = removeConsoleCalls(before);
    if (after !== before) {
      fs.writeFileSync(file, after, 'utf8');
      const n = (before.match(/console\.(log|warn|error|debug|info|trace)/g) || []).length;
      total += n;
      files++;
    }
  }
}
process.stdout.write(`Done: ${total} console calls removed from ${files} files.\n`);
