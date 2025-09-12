// import { 
//   Plus, 
//   Users, 
//   Bookmark, 
//   Search, 
//   Archive, 
//   Bell, 
//   Shuffle, 
//   Info, 
//   HelpCircle, 
//   Settings 
// } from 'lucide-react-native';

// export interface NavigationItem {
//   id: string;
//   icon: any;
//   label: string;
//   route?: string;
//   onPress?: () => void;
// }

// export const navigationItems: NavigationItem[] = [
//   {
//     id: 'create-crwd',
//     icon: Plus,
//     label: 'Create a CRWD',
//     route: 'CreateCRWD',
//   },
//   {
//     id: 'your-crwds',
//     icon: Users,
//     label: 'Your CRWDs',
//     route: 'YourCRWDs'
//   },
//   {
//     id: 'saved',
//     icon: Bookmark,
//     label: 'Saved',
//     route: 'Saved'
//   },
//   {
//     id: 'explore',
//     icon: Search,
//     label: 'Explore',
//     route: 'Search'
//   },
//   {
//     id: 'donation-box',
//     icon: Archive,
//     label: 'Donation box',
//     route: 'Donation'
//   },
//   {
//     id: 'notifications',
//     icon: Bell,
//     label: 'Notifications',
//     route: 'Notifications'
//   },
//   {
//     id: 'transaction-history',
//     icon: Shuffle,
//     label: 'Transaction history',
//     route: 'TransactionHistory'
//   },
//   {
//     id: 'about',
//     icon: Info,
//     label: 'About',
//     onPress: () => console.log('About pressed')
//   },
//   {
//     id: 'help',
//     icon: HelpCircle,
//     label: 'Help',
//     onPress: () => console.log('Help pressed')
//   },
//   {
//     id: 'settings',
//     icon: Settings,
//     label: 'Settings',
//     route: 'Settings'
//   }
// ];




import {
  Plus,
  Users,
  Bookmark,
  Search,
  Archive,
  Bell,
  Heart,
} from 'lucide-react-native';
import { NavigationProp } from '@react-navigation/native';
import { setDiscoverMode } from '../utils/discoverMode';

export interface NavigationItem {
  id: string;
  icon: any;
  label: string;
  route?: string;
  onPress?: () => void;
  handleNavigation?: (navigation: NavigationProp<any>) => void;
}

export interface NavigationGroup {
  heading?: string;
  items: NavigationItem[];
}

export const navigationGroups: NavigationGroup[] = [
  {
    items: [
      {
        id: 'your-crwds',
        icon: Users,
        label: 'Your Giving Circles',
        route: 'YourCRWDs',
        handleNavigation: (navigation) => navigation.navigate('YourCRWDs')
      },
      {
        id: 'donation-box',
        icon: Archive,
        label: 'Donation box',
        route: 'Donation',
        handleNavigation: (navigation) => navigation.navigate('Donation')
      }
    ]
  },
  {
    heading: 'Discover',
    items: [
      {
        id: 'explore',
        icon: Search,
        label: 'Explore',
        route: 'Search',
        handleNavigation: (navigation) => {
          setDiscoverMode(true);
          navigation.navigate('MainTabs', { screen: 'Search' });
        }
      },
      {
        id: 'saved',
        icon: Heart,
        label: 'Favorites',
        route: 'Saved',
        handleNavigation: (navigation) => navigation.navigate('Saved')
      }
    ]
  },
  {
    heading: 'Activity',
    items: [
      {
        id: 'notifications',
        icon: Bell,
        label: 'Notifications',
        route: 'Notifications',
        handleNavigation: (navigation) => navigation.navigate('MainTabs', {screen: 'Activity'})
      },
      {
        id: 'transaction-history',
        icon: Archive,
        label: 'Transaction history',
        route: 'TransactionHistory',
        handleNavigation: (navigation) => navigation.navigate('TransactionHistory')
      }
    ]
  },
  {
    heading: 'Support',
    items: [
      {
        id: 'about',
        icon: Search,
        label: 'About',
        route: 'About',
        handleNavigation: (navigation) => navigation.navigate('About')
      },
      {
        id: 'articles',
        icon: Bookmark,
        label: 'Articles',
        route: '#',
        handleNavigation: (navigation) => navigation.navigate('PrivacyPolicy')
      },
      {
        id: 'help',
        icon: Bell,
        label: 'Help',
        route: 'HelpCenter',
        handleNavigation: (navigation) => navigation.navigate('HelpCenter')
      },
      {
        id: 'settings',
        icon: Archive,
        label: 'Settings',
        route: 'Settings',
        handleNavigation: (navigation) => navigation.navigate('Settings')
      }
    ]
  }
];
