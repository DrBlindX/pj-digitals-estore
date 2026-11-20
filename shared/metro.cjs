const path = require('node:path');

function withSharedTheme(config, projectRoot) {
  const sharedRoot = path.resolve(projectRoot, '../shared');
  config.watchFolders = [...new Set([...(config.watchFolders || []), sharedRoot])];
  return config;
}
module.exports = { withSharedTheme };
