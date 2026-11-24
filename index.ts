import { registerRootComponent } from 'expo';

import App from './App';
import { androidWidgetsAvailable } from './src/widgets/native';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// Android home-screen widgets render through a headless JS task. The native part
// only exists in a development/production build, so skip it in Expo Go.
if (androidWidgetsAvailable) {
  require('./src/widgets/android/register').registerAndroidWidgets();
}
