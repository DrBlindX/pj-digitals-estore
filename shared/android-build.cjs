const fs = require('node:fs');
const path = require('node:path');
module.exports = (config, { withGradleProperties, withDangerousMod }) => {
config = withGradleProperties(config, mod => {
  const values = { 'android.enableMinifyInReleaseBuilds': 'true', 'android.enableShrinkResourcesInReleaseBuilds': 'true', 'expo.useLegacyPackaging': 'true' };
  for (const [key,value] of Object.entries(values)) {
    mod.modResults = mod.modResults.filter(item => item.key !== key);
    mod.modResults.push({type:'property',key,value});
  }
  return mod;
});
return withDangerousMod(config, ['android', async mod => {
  const res = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/res');
  fs.mkdirSync(path.join(res, 'drawable'), { recursive: true });
  fs.writeFileSync(path.join(res, 'drawable/nearby_launcher_inset.xml'), '<?xml version="1.0" encoding="utf-8"?><inset xmlns:android="http://schemas.android.com/apk/res/android" android:drawable="@mipmap/ic_launcher_foreground" android:inset="20%" />');
  for (const name of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
    const file = path.join(res, 'mipmap-anydpi-v26', name);
    if (fs.existsSync(file)) fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('@mipmap/ic_launcher_foreground', '@drawable/nearby_launcher_inset'));
  }
  return mod;
}]);
};
