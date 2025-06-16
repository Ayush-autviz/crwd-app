import { View, Text, ScrollView, SafeAreaView } from 'react-native'
import React from 'react'
import MainHeaderNav from '../components/MainHeaderNav';
import { PrimaryBlue, PrimaryGrey, SecondaryGrey } from '../Constants/Colors';

export default function TransactionHistory() {

    const transactions = [
        { date: 'May 7th', description: '1-time Donation to Habitat for Humanity', amount: '$5' },
        { date: 'May 1st', description: 'Donation Box', amount: '$25' },
        { date: 'April 1st', description: 'Donation Box', amount: '$25' },
        { date: 'March 1st', description: 'Donation Box', amount: '$25' },
      ];

  return (
    <SafeAreaView style={{backgroundColor: 'white', flex: 1}}>
        <MainHeaderNav show={true} menu={false} post={false} />
        <ScrollView style={{ paddingHorizontal: 20 , marginTop: 20}}>
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

    </SafeAreaView>
  )
}