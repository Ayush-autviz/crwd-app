import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle } from 'lucide-react-native';

interface VerifiedNonprofitInfoProps {
  causeData: any;
}

export default function VerifiedNonprofitInfo({ causeData }: VerifiedNonprofitInfoProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CheckCircle size={20} color="#2563EB" />
        <Text style={styles.verifiedText}>Verified U.S. Nonprofit Organization</Text>
      </View>
      <Text style={styles.taxId}>Tax ID: {causeData?.tax_id_number || 'N/A'}</Text>
      {/* {causeData?.street && (
        <Text style={styles.address}>
          {causeData.street}
          {causeData.city && `, ${causeData.city}`}
          {causeData.state && `, ${causeData.state}`}
        </Text>
      )} */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  verifiedText: {
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold',
    color: '#2563EB',
  },
  taxId: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
    fontFamily: 'Outfit-Regular',
  },
  address: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Outfit-Regular',
  },
});

