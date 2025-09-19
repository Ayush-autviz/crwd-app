import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native'
import React from 'react'
import MainHeaderNav from '../components/MainHeaderNav';
import { PrimaryBlue, PrimaryGrey, SecondaryGrey } from '../Constants/Colors';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TransactionHistory() {
  const insets = useSafeAreaInsets()

    const transactions = [
        { date: 'May 7th', description: '1-time Donation to Habitat for Humanity', amount: '$5' },
        { date: 'May 1st', description: 'Donation Box', amount: '$25' },
        { date: 'April 1st', description: 'Donation Box', amount: '$25' },
        { date: 'March 1st', description: 'Donation Box', amount: '$25' },
      ];

  const total = transactions.reduce((sum, t) => {
    const numeric = Number(t.amount.replace(/[^\d.]/g, ''))
    return sum + (isNaN(numeric) ? 0 : numeric)
  }, 0)

  return (
    <SafeAreaView style={{backgroundColor: 'white', flex: 1}}>
        <MainHeaderNav show={true} menu={false} title={'Transaction History'}/>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20 , paddingTop: 20, paddingBottom: 72 + (insets?.bottom ?? 0) }}>
        {transactions.map((transaction) => (
            <View key={transaction.date} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, paddingHorizontal: 20 }}>
                <View>
                    <Text style={{ fontSize: 12, color: PrimaryGrey }}>{transaction.date}</Text>
                    <Text style={{ fontSize: 14, }}>{transaction.description}</Text>
                </View>
                <Text style={{ fontSize: 14 }}>{transaction.amount}</Text>
            </View>
    ))}
    </ScrollView>
    <View style={[
      styles.footerContainer,
      { paddingBottom: 12 + (insets?.bottom ?? 0) }
    ]}>
      <View style={{ width: 24 }} />
      <Text style={styles.totalText}>Total given: ${total}</Text>
    </View>
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