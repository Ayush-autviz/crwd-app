/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import notifee, { EventType } from '@notifee/react-native';

// Handle background events for Notifee
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    console.log('User pressed notification in background', detail.notification);
    // Navigation will be handled when the app opens via the linking config or messaging() listeners in App.tsx
  }
});

AppRegistry.registerComponent(appName, () => App);
