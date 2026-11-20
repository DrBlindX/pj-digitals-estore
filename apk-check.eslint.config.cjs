const path = require('node:path');
const { createRequire } = require('node:module');
const appRequire = createRequire(path.join(__dirname, 'client_shop', 'package.json'));
const { defineConfig } = appRequire('eslint/config');
const expoConfig = appRequire('eslint-config-expo/flat');
module.exports = defineConfig([expoConfig, { ignores: ['**/android/**', '**/node_modules/**', '**/.expo/**', '**/dist/**'] }]);
