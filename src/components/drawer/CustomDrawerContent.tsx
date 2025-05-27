import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  SafeAreaView,
} from 'react-native';
import { DrawerContentScrollView, DrawerContentComponentProps } from '@react-navigation/drawer';
import { navigationItems } from '../../Constants/navigationItems';

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { navigation } = props;

  const handleNavigation = (item: any) => {
    if (item.route) {
      navigation.navigate(item.route);
    } else if (item.onPress) {
      item.onPress();
    }
    navigation.closeDrawer();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <Image
          source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }}
          style={styles.profileImage}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>My Name is Mya</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.profileLink}>Go to your profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Items */}
      <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
        {navigationItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              // onPress={() => handleNavigation(item)}
              onPress={() => item.handleNavigation?.(navigation)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemContent}>
                <IconComponent size={20} color="#2563eb" style={styles.menuIcon} />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={() => console.log('Privacy Policy')}>
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => console.log('Terms of Service')}>
            <Text style={styles.footerLink}>Terms of Service</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  profileLink: {
    fontSize: 12,
    color: '#6b7280',
  },
  menuContainer: {
    flex: 1,
    paddingVertical: 8,
  },
  menuItem: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 16,
    width: 20,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
    paddingBottom: 16,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  footerLink: {
    fontSize: 12,
    color: '#2563eb',
  },
});
