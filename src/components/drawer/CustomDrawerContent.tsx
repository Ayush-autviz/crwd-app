import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { DrawerContentScrollView, DrawerContentComponentProps } from '@react-navigation/drawer';
import { navigationGroups } from '../../Constants/navigationItems';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryGrey } from '../../Constants/Colors';
import { Bell } from 'lucide-react-native';

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
        <TouchableOpacity
          onPress={() => navigation.navigate('Activity')}
          activeOpacity={0.8}
          style={{ padding: 6, position: 'relative', marginRight: 15 }}
        >
          <Bell size={22} color="#111827" />
          <View
            style={{
              position: 'absolute',
              top: -2,
              right: -4,
              backgroundColor: 'red',
              borderRadius: 8,
              minWidth: 16,
              height: 16,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 3,
            }}
          >
            <Text style={{ color: 'white', fontSize: 10, fontWeight: '700' }}>5</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Navigation Items */}
      <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
        {/* Giving Section */}
        <Text style={styles.sectionHeading}>Giving</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Circles')}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemContent}>
            <Text style={styles.plusIcon}>+</Text>
            <Text style={styles.menuLabel}>CRWD Collectives</Text>
          </View>
        </TouchableOpacity>
        
        {navigationGroups.map((group) => (
          <View key={group.heading || 'no-heading'}>
            {group.heading && (
              <Text style={styles.sectionHeading}>{group.heading}</Text>
            )}
            {group.items.map((item) => {
              const IconComponent = item.icon;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={() => item.handleNavigation?.(navigation as any)}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemContent}>
                    <IconComponent size={20} color="#2563eb" style={styles.menuIcon} />
                    <Text style={styles.menuLabel}>{item.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
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
        <Text style={{fontSize: 12, color: PrimaryGrey, textAlign: 'center', marginTop: 8}}>CRWD ©2025</Text>

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
    justifyContent: 'space-between',
    padding: 16,
    width: '95%',
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
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  footerLink: {
    fontSize: 12,
    color: '#2563eb',
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginTop: 8,
  },
  plusIcon: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2563eb',
    marginRight: 16,
    width: 20,
    textAlign: 'center',
  },
});
