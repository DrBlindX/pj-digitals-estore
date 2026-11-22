const path = require('node:path');
const fs = require('node:fs');

function withSharedTheme(config, projectRoot) {
  const sharedRoot = fs.realpathSync(path.resolve(projectRoot, '../shared'));
  const dependencyLink = path.join(projectRoot, 'node_modules', '.pnpm');
  const dependencyRoot = fs.existsSync(dependencyLink) ? fs.realpathSync(dependencyLink) : null;
  config.watchFolders = [...new Set([...(config.watchFolders || []), sharedRoot, ...(dependencyRoot ? [dependencyRoot] : [])])];
  config.resolver = config.resolver || {};
  config.resolver.nodeModulesPaths = [...new Set([...(config.resolver.nodeModulesPaths || []), path.join(projectRoot, 'node_modules')])];
  return config;
}
module.exports = { withSharedTheme };
