const { getDefaultConfig } = require('expo/metro-config');
const { withSharedTheme } = require('../shared/metro.cjs');

module.exports = withSharedTheme(getDefaultConfig(__dirname), __dirname);
