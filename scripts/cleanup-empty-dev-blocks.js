const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIRS = ['app', 'components', 'context', 'hooks', 'utils', 'services', 'constants'];
const EXT = new Set(['.ts', '.tsx', '.js', '.jsx']);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      if (name !== 'node_modules') walk(full, out);
    } else if (EXT.has(path.extname(name))) out.push(full);
  }
  return out;
}

let n = 0;
for (const dir of DIRS) {
  for (const file of walk(path.join(ROOT, dir))) {
    let code = fs.readFileSync(file, 'utf8');
    const next = code
      .replace(/\s*if\s*\(\s*__DEV__\s*\)\s*\{\s*\}/g, '')
      .replace(/(\r?\n){3,}/g, '\n\n');
    if (next !== code) {
      fs.writeFileSync(file, next, 'utf8');
      n++;
    }
  }
}
process.stdout.write(`Cleaned empty __DEV__ blocks in ${n} files.\n`);
