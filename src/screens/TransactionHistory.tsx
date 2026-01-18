import { View, Text, ScrollView, StyleSheet, Platform, ActivityIndicator, TouchableOpacity, Modal, Pressable, FlatList } from 'react-native'
import React, { useMemo, useState, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react-native';
import MainHeaderNav from '../components/MainHeaderNav';
import { PrimaryBlue, PrimaryGrey, SecondaryGrey } from '../Constants/Colors';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getDonationHistory } from '../services/api/donation';

interface Transaction {
  date: string;
  description: string;
  amount: string;
}

export default function TransactionHistory() {
  const insets = useSafeAreaInsets()

  // Fetch transaction history from API
  const { data: donationHistoryData, isLoading, error, refetch } = useQuery({
    queryKey: ['donationHistory'],
    queryFn: getDonationHistory,
  });

  console.log(donationHistoryData, 'donationHistoryData');

  // Format date helper function
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Return original if invalid date

      // Format as "Month Day" (e.g., "May 7th", "April 1st")
      const options: Intl.DateTimeFormatOptions = {
        month: 'long',
        day: 'numeric'
      };
      const formatted = date.toLocaleDateString('en-US', options);
      // Add ordinal suffix (1st, 2nd, 3rd, etc.)
      const day = date.getDate();
      const suffix = day % 10 === 1 && day % 100 !== 11 ? 'st' :
        day % 10 === 2 && day % 100 !== 12 ? 'nd' :
          day % 10 === 3 && day % 100 !== 13 ? 'rd' : 'th';
      return formatted.replace(/\d+/, `${day}${suffix}`);
    } catch {
      return dateString;
    }
  };

  // Create description from transaction data
  const createDescription = (transaction: any): string => {
    const { donation_type, cause_count, collective_count, causes, collectives } = transaction;

    if (donation_type === 'recurring') {
      // For recurring donations, show the donation box summary with names
      const parts: string[] = [];

      // Add nonprofits info
      if (cause_count > 0) {
        if (causes && causes.length > 0 && causes.length <= 2) {
          // Show names if 1-2 nonprofits
          const names = causes.map((c: any) => c.name).join(', ');
          parts.push(names);
        } else {
          // Show count if more than 2
          parts.push(`${cause_count} nonprofit${cause_count !== 1 ? 's' : ''}`);
        }
      }

      // Add collectives info
      if (collective_count > 0) {
        if (collectives && collectives.length > 0 && collectives.length <= 2) {
          // Show names if 1-2 collectives
          const names = collectives.map((c: any) => c.name).join(', ');
          parts.push(names);
        } else {
          // Show count if more than 2
          parts.push(`${collective_count} collective${collective_count !== 1 ? 's' : ''}`);
        }
      }

      if (parts.length > 0) {
        return `Donation Box - ${parts.join(', ')}`;
      } else {
        return 'Donation Box';
      }
    } else {
      // For one-time donations, list the causes/collectives
      const items: string[] = [];

      if (causes && causes.length > 0) {
        if (causes.length === 1) {
          items.push(causes[0].name);
        } else if (causes.length <= 3) {
          // Show names if 2-3 causes
          items.push(causes.map((c: any) => c.name).join(', '));
        } else {
          // Show count if more than 3
          items.push(`${causes.length} nonprofits`);
        }
      }

      if (collectives && collectives.length > 0) {
        if (collectives.length === 1) {
          items.push(collectives[0].name);
        } else if (collectives.length <= 3) {
          // Show names if 2-3 collectives
          items.push(collectives.map((c: any) => c.name).join(', '));
        } else {
          // Show count if more than 3
          items.push(`${collectives.length} collectives`);
        }
      }

      if (items.length > 0) {
        return `One-time Donation - ${items.join(', ')}`;
      } else {
        return 'One-time Donation';
      }
    }
  };

  // State for year selection
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [showYearPicker, setShowYearPicker] = useState(false);

  // Get available years
  const availableYears = useMemo(() => {
    if (!donationHistoryData?.results) return [];
    const years = new Set<string>();
    donationHistoryData.results.forEach((transaction: any) => {
      if (transaction.charged_at) {
        years.add(new Date(transaction.charged_at).getFullYear().toString());
      }
    });
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [donationHistoryData]);

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  // Transform API response to Transaction format
  const transactions: Transaction[] = useMemo(() => {
    if (!donationHistoryData) return [];

    // Access the results array from the API response
    const historyData = donationHistoryData?.results || [];

    return historyData
      .filter((transaction: any) => {
        if (!transaction.charged_at) return false;
        return new Date(transaction.charged_at).getFullYear().toString() === selectedYear;
      })
      .map((transaction: any) => {
        const formattedDate = formatDate(transaction.charged_at);
        const description = createDescription(transaction);
        const amount = `$${parseFloat(transaction.gross_amount || '0').toFixed(2)}`;

        return {
          date: formattedDate,
          description,
          amount,
        };
      });
  }, [donationHistoryData, selectedYear]);

  const total = useMemo(() => {
    return transactions.reduce((sum, t) => {
      const numeric = Number(t.amount.replace(/[^\d.]/g, ''))
      return sum + (isNaN(numeric) ? 0 : numeric)
    }, 0)
  }, [transactions])

  return (
    <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }}>
      <MainHeaderNav show={true} menu={false} title={'Transaction History'} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 72 + (insets?.bottom ?? 0) }}>
        {/* Year Picker */}
        <View style={{ alignItems: 'flex-start', marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => setShowYearPicker(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 10,
              backgroundColor: '#F3F4F6',
              borderRadius: 8,
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827' }}>
              {selectedYear}
            </Text>
            <ChevronDown size={20} color={PrimaryGrey} />
          </TouchableOpacity>
        </View>

        <Modal
          visible={showYearPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowYearPicker(false)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}
            onPress={() => setShowYearPicker(false)}
          >
            <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, maxHeight: 400, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, textAlign: 'center' }}>Select Year</Text>
              <FlatList
                data={availableYears.length > 0 ? availableYears : [new Date().getFullYear().toString()]}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedYear(item);
                      setShowYearPicker(false);
                    }}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: 14,
                      paddingHorizontal: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: '#F3F4F6'
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: item === selectedYear ? '600' : '400', color: '#111827' }}>{item}</Text>
                    {item === selectedYear && <Check size={20} color={PrimaryBlue} />}
                  </TouchableOpacity>
                )}
              />
            </View>
          </Pressable>
        </Modal>

        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 48 }}>
            <ActivityIndicator size="large" color={PrimaryBlue} />
            <Text style={{ marginTop: 12, fontSize: 14, color: PrimaryGrey }}>Loading transactions...</Text>
          </View>
        ) : error ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 48, paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 14, color: '#dc2626', textAlign: 'center', marginBottom: 16 }}>
              Failed to load transaction history. Please try again.
            </Text>
            <TouchableOpacity
              onPress={() => refetch()}
              style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
            >
              <Text style={{ fontSize: 14, color: PrimaryBlue, textDecorationLine: 'underline' }}>
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        ) : transactions.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 48, paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 14, color: PrimaryGrey }}>No transactions found.</Text>
          </View>
        ) : (
          <>
            {transactions.map((transaction, index) => (
              <View
                key={`${transaction.date}-${index}`}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 20,
                  // paddingHorizontal: 20,
                  borderBottomWidth: index < transactions.length - 1 ? StyleSheet.hairlineWidth : 0,
                  borderBottomColor: '#E5E7EB',
                }}
              >
                <View style={{ flex: 1, marginRight: 16 }}>
                  <Text style={{ fontSize: 12, color: PrimaryGrey, marginBottom: 4 }}>{transaction.date}</Text>
                  <Text style={{ fontSize: 14 }}>{transaction.description}</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '500' }}>{transaction.amount}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
      {!isLoading && !error && transactions.length > 0 && (
        <View style={[
          styles.footerContainer,
          { paddingBottom: 12 + (insets?.bottom ?? 0) }
        ]}>
          <View style={{ width: 24 }} />
          <Text style={styles.totalText}>Total given: ${total.toFixed(2)}</Text>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: 'white',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    zIndex: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  totalText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: Platform.select({ ios: '600', android: '500', default: '600' }) as any,
  },
})