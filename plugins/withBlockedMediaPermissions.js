const { withAndroidManifest, AndroidConfig } = require('expo/config-plugins');

const BLOCKED = [
  'android.permission.READ_MEDIA_IMAGES',
  'android.permission.READ_MEDIA_VIDEO',
  'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
];

/** Strip broad media/storage permissions — Android photo picker needs none of these. */
function withBlockedMediaPermissions(config) {
  config = AndroidConfig.Permissions.withBlockedPermissions(config, BLOCKED);

  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;

    for (const permission of BLOCKED) {
      AndroidConfig.Manifest.ensureToolsAvailable(manifest);
      if (!manifest.manifest.$) {
        manifest.manifest.$ = {};
      }
      if (!manifest.manifest.$['xmlns:tools']) {
        manifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
      }

      const existing = manifest.manifest['uses-permission'] ?? [];
      const list = Array.isArray(existing) ? existing : [existing];
      const already = list.some(
        (item) => item?.$?.['android:name'] === permission && item?.$?.['tools:node'] === 'remove',
      );
      if (!already) {
        list.push({
          $: {
            'android:name': permission,
            'tools:node': 'remove',
          },
        });
      }
      manifest.manifest['uses-permission'] = list;
    }

    return cfg;
  });
}

module.exports = withBlockedMediaPermissions;
