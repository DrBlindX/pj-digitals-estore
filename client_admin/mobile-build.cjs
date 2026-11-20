const shared = require('../shared/android-build.cjs');
const { withGradleProperties, withDangerousMod } = require('expo/config-plugins');
module.exports = config => shared(config, { withGradleProperties, withDangerousMod });
