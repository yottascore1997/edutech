// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Support for @ path alias
config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')];

// Fix for expo-router entry resolution
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

// Fix react-native resolution
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/react-native/index.js'),
      type: 'sourceFile',
    };
  }
  // Default resolution
  return context.resolveRequest(context, moduleName, platform);
};

// Watch folders
config.watchFolders = [path.resolve(__dirname)];

module.exports = config;
