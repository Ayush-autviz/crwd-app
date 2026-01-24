import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ShoppingBag, ChevronRight, ArrowRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

interface MyDonationBoxCardProps {
  monthlyAmount?: number;
  causeCount?: number;
}

export default function MyDonationBoxCard({
  monthlyAmount = 10,
  causeCount = 5,
}: MyDonationBoxCardProps) {
  const navigation = useNavigation();

  const handleNavigateToDonation = () => {
    // Navigate to Donate tab with bottom tabs preserved
    (navigation as any).navigate('DrawerNav', {
      screen: 'MainTabs',
      params: {
        screen: 'Donate',
      },
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={handleNavigateToDonation}
      >
        {/* Icon and Title Row */}
        <View style={styles.iconTitleRow}>
          <View style={styles.iconContainer}>
            <ShoppingBag size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>My Donation Box</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.description}>
            You are currently donating{' '}
            <Text style={styles.bold}>${monthlyAmount} per month</Text> to{' '}
            <Text style={styles.bold}>{causeCount} {causeCount === 1 ? 'cause' : 'causes'}</Text>.
          </Text>
          <TouchableOpacity
            style={styles.linkContainer}
            onPress={handleNavigateToDonation}
          >
            <Text style={styles.linkText}>Manage</Text>
            <ArrowRight size={14} color="#1600ff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  iconContainer: {
    width: 32,
    height: 32,
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
    width: '100%',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
    lineHeight: 18,
  },
  bold: {
    fontWeight: '700',
    color: '#000000',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1600ff',
  },
});

