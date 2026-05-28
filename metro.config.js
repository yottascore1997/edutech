// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Windows: avoid "Error: spawn UNKNOWN" from jest-worker child processes
if (process.platform === 'win32') {
  config.maxWorkers = 1;
}

// Support for @ path alias
config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')];

// Windows: keep Metro from watching build/export junk (slows FallbackWatcher → watch timeout)
const extraBlockList = [
  /\.expo-tmp-check[\\/].*/,
  /android[\\/]\.gradle[\\/].*/,
  /android[\\/]build[\\/].*/,
  /android[\\/]app[\\/]build[\\/].*/,
  /ios[\\/]Pods[\\/].*/,
  /ios[\\/]build[\\/].*/,
];
const baseBlockList = config.resolver.blockList;
config.resolver.blockList = Array.isArray(baseBlockList)
  ? [...baseBlockList, ...extraBlockList]
  : [baseBlockList, ...extraBlockList];

module.exports = config;
