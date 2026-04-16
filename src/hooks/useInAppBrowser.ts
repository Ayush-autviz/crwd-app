import { Linking } from 'react-native';
import { InAppBrowser } from 'react-native-inappbrowser-reborn';
import { PrimaryBlue, PrimaryGrey } from '../Constants/Colors';

export const useInAppBrowser = () => {
  const openInAppBrowser = async (url: string) => {
    try {
      if (await InAppBrowser.isAvailable()) {
        await InAppBrowser.open(url, {
          // iOS Properties
          dismissButtonStyle: 'close',
          preferredBarTintColor: '#ffffff',
          preferredControlTintColor: PrimaryBlue,
          readerMode: false,
          animated: true,
          modalPresentationStyle: 'pageSheet',
          modalTransitionStyle: 'coverVertical',
          modalEnabled: true,
          enableBarCollapsing: true,
          // Android Properties
          showTitle: true,
          toolbarColor: '#ffffff',
          secondaryToolbarColor: PrimaryGrey,
          navigationBarColor: '#000000',
          navigationBarDividerColor: '#ffffff',
          enableUrlBarHiding: true,
          enableDefaultShare: true,
          forceCloseOnRedirection: false,
        });
      } else {
        Linking.openURL(url);
      }
    } catch (error) {
      console.error('InAppBrowser error:', error);
      Linking.openURL(url);
    }
  };

  return { openInAppBrowser };
};
