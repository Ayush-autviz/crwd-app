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
  Shuffle,
  Info,
  HelpCircle,
  Settings
} from 'lucide-react-native';
import { NavigationProp } from '@react-navigation/native';

export interface NavigationItem {
  id: string;
  icon: any;
  label: string;
  route?: string;
  onPress?: () => void;
  handleNavigation?: (navigation: NavigationProp<any>) => void;
}

// Tab screens inside BottomTabs
const tabScreens = ['Home', 'Search', 'Post', 'Activity', 'Profile'];

export const navigationItems: NavigationItem[] = [
  {
    id: 'create-crwd',
    icon: Plus,
    label: 'Create a CRWD',
    route: 'CreateCRWD',
    handleNavigation: (navigation) => navigation.navigate('CreateCRWD')
  },
  {
    id: 'your-crwds',
    icon: Users,
    label: 'Your CRWDs',
    route: 'YourCRWDs',
    handleNavigation: (navigation) => navigation.navigate('YourCRWDs')
  },
  {
    id: 'saved',
    icon: Bookmark,
    label: 'Saved',
    route: 'Saved',
    handleNavigation: (navigation) => navigation.navigate('Saved')
  },
  {
    id: 'explore',
    icon: Search,
    label: 'Explore',
    route: 'Search',
    handleNavigation: (navigation) => navigation.navigate('MainTabs', { screen: 'Search' })
  },
  {
    id: 'donation-box',
    icon: Archive,
    label: 'Donation box',
    route: 'Donation',
    handleNavigation: (navigation) => navigation.navigate('Donation')
  },
  {
    id: 'notifications',
    icon: Bell,
    label: 'Notifications',
    route: 'Notifications',
    handleNavigation: (navigation) => navigation.navigate('MainTabs', {screen: 'Activity'})
  },
  {
    id: 'transaction-history',
    icon: Shuffle,
    label: 'Transaction history',
    route: 'TransactionHistory',
    handleNavigation: (navigation) => navigation.navigate('TransactionHistory')
  },
  {
    id: 'about',
    icon: Info,
    label: 'About',
    onPress: () => console.log('About pressed'),
    handleNavigation: () => console.log('About pressed')
  },
  {
    id: 'help',
    icon: HelpCircle,
    label: 'Help',
    onPress: () => console.log('Help pressed'),
    handleNavigation: () => console.log('Help pressed')
  },
  {
    id: 'settings',
    icon: Settings,
    label: 'Settings',
    route: 'Settings',
    handleNavigation: (navigation) => navigation.navigate('Settings')
  }
];
