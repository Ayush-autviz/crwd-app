import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Package, ChevronRight } from 'lucide-react-native';
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

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Donation' as never)}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Package size={24} color="#FFFFFF" />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>My Donation Box</Text>
          <Text style={styles.description}>
            You are currently donating{' '}
            <Text style={styles.bold}>${monthlyAmount} per month</Text> to{' '}
            <Text style={styles.bold}>{causeCount} causes</Text>.
          </Text>
          <TouchableOpacity
            style={styles.linkContainer}
            onPress={() => navigation.navigate('Donation' as never)}
          >
            <Text style={styles.linkText}>Manage box</Text>
            <ChevronRight size={16} color="#1600ff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
    color: '#111827',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1600ff',
  },
});

