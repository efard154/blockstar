/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'BlockstarWidget',
  displayName: 'Blockstar',
  icon: '../../assets/icon.png',
  // containerBackground / Gauge styles used by the widgets need iOS 17+.
  deploymentTarget: '17.0',
  colors: {
    $widgetBackground: { light: '#FFFFFF', dark: '#161618' },
    $accent: '#7F6EE0',
  },
  // Same App Group as the app, so the widget can read the snapshot the app writes.
  entitlements: {
    'com.apple.security.application-groups': config.ios.entitlements['com.apple.security.application-groups'],
  },
});
