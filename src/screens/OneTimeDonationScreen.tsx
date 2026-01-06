import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, User } from 'lucide-react-native';
import { useAuthStore } from '../store/store';
import OneTimeDonation from '../components/donation/OneTimeDonation';
import { PrimaryBlue } from '../Constants/Colors';

export default function OneTimeDonationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user: currentUser } = useAuthStore();
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>([]);
  const [checkout, setCheckout] = useState(false);

  // Get preselected data from route params
  const preselectedItem = (route.params as any)?.preselectedItem;
  const activeTab = (route.params as any)?.activeTab;
  const preselectedCauses = (route.params as any)?.preselectedCauses;
  const preselectedCausesData = (route.params as any)?.preselectedCausesData;
  const preselectedCollectiveId = (route.params as any)?.preselectedCollectiveId;
  const fundraiserId = (route.params as any)?.fundraiserId;
  const initialDonationAmount = (route.params as any)?.donationAmount;

  // If not logged in, show sign-in prompt
  if (!currentUser?.id) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.signInContainer}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <User size={40} color={PrimaryBlue} />
          </View>
          
          {/* Title */}
          <Text style={styles.title}>Sign in to make a donation</Text>
          
          {/* Description */}
          <Text style={styles.description}>
            Sign in to make a one-time donation and support your favorite causes.
          </Text>
          
          {/* CTA Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate('SplashScreen' as never)}
            style={styles.signInButton}
            activeOpacity={0.7}
          >
            <Text style={styles.signInButtonText}>Sign In to Continue</Text>
          </TouchableOpacity>
          
          {/* Additional Info */}
          <TouchableOpacity
            onPress={() => navigation.navigate('ClaimProfile' as never)}
            activeOpacity={0.7}
          >
            <Text style={styles.additionalInfo}>
              Don't have an account?{' '}
              <Text style={styles.linkText}>Create one here</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>One-Time Donation</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* One-Time Donation Component */}
      <OneTimeDonation
        setCheckout={setCheckout}
        selectedOrganizations={selectedOrganizations}
        setSelectedOrganizations={setSelectedOrganizations}
        preselectedItem={preselectedItem}
        activeTab={activeTab}
        preselectedCauses={preselectedCauses}
        preselectedCausesData={preselectedCausesData}
        preselectedCollectiveId={preselectedCollectiveId}
        fundraiserId={fundraiserId}
        initialDonationAmount={initialDonationAmount}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSpacer: {
    width: 32,
  },
  signInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#dbeafe',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  signInButton: {
    backgroundColor: PrimaryBlue,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  additionalInfo: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 24,
    textAlign: 'center',
  },
  linkText: {
    color: PrimaryBlue,
    fontWeight: '500',
  },
});

