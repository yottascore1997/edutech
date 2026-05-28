/**
 * Start Expo with LAN IP (not 127.0.0.1) so physical devices can connect.
 * Fixes Windows issue where "Switching to --go" resets host to localhost.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function readEnvHostname() {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/^REACT_NATIVE_PACKAGER_HOSTNAME=(.+)$/m);
    if (match) return match[1].trim().replace(/^["']|["']$/g, '');
  } catch {
    // no .env
  }
  return null;
}

function getLanIp() {
  const fromEnv = process.env.REACT_NATIVE_PACKAGER_HOSTNAME || readEnvHostname();
  if (fromEnv && fromEnv !== 'localhost' && !fromEnv.startsWith('127.')) {
    return fromEnv;
  }

  const candidates = [];
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const iface of ifaces || []) {
      if (iface.family !== 'IPv4' && iface.family !== 4) continue;
      if (iface.internal) continue;
      const addr = iface.address;
      if (!addr.startsWith('192.168.') && !addr.startsWith('10.') && !addr.startsWith('172.')) {
        continue;
      }
      const priority = addr.startsWith('192.168.') ? 0 : 1;
      candidates.push({ addr, priority });
    }
  }

  candidates.sort((a, b) => a.priority - b.priority);
  return candidates[0]?.addr || null;
}

const lanIp = getLanIp();
if (!lanIp) {
  console.error('Could not detect LAN IP. Set REACT_NATIVE_PACKAGER_HOSTNAME in .env');
  process.exit(1);
}

console.log(`\n📡 Dev server host: ${lanIp} (phone must use this, not 127.0.0.1)\n`);

// --clear wipes Metro cache every run and often triggers "Failed to start watch mode" on Windows
const passThrough = process.argv.slice(2);
const useClear = passThrough.includes('--clear');
const expoArgs = ['expo', 'start', '--lan', '--go', ...passThrough.filter((a) => a !== '--clear')];
if (useClear) {
  expoArgs.splice(3, 0, '--clear');
}
const args = expoArgs;
const child = spawn('npx', args, {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    REACT_NATIVE_PACKAGER_HOSTNAME: lanIp,
    // Skip Expo API version check (crashes with "Body has already been read" on some Node/network setups)
    EXPO_NO_DEPENDENCY_VALIDATION: '1',
  },
});

child.on('exit', (code) => process.exit(code ?? 0));
