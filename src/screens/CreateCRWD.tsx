import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image } from 'react-native';
import MainHeaderNav from '../components/MainHeaderNav';
import { LightGrey, PrimaryBlue, PrimaryGrey, SecondaryBlue, SecondaryGrey } from '../Constants/Colors';
import { Minus, Plus } from 'lucide-react-native';
import { TextInput } from 'react-native-gesture-handler';
import OneTimeDonation from '../components/donation/OneTimeDonation';

export default function CreateCRWD() {

  const [count, setcount] = useState(5)
  const [checkout, setCheckout] = useState(false);
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>([]);

  return (
    <SafeAreaView style={styles.container}>
      <MainHeaderNav menu={false} post={false} show={true} />
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Create a CRWD</Text>
        <Text style={styles.subtitle}>Be the inspiration to your community. Choose a causes, invite friends, discuss and make an impact together</Text>
        <View style={{ flexDirection: 'row', gap: 20, alignItems: 'center', marginVertical: 20 }}>
          <View style={{ borderColor: SecondaryGrey, borderWidth: 1, padding: 15, borderRadius: 10 }}>
            <Plus color={SecondaryGrey} size={20} />
          </View>
          <Text style={{ color: SecondaryGrey }}>Choose a photo</Text>
        </View>

        <Text style={{ color: SecondaryGrey, marginBottom: 10, fontSize: 16 }}>Name your CRWD</Text>
        <TextInput style={{ borderColor: SecondaryGrey, borderWidth: 1, borderRadius: 10, padding: 15, marginBottom: 20 }} placeholder='Choose a name' />

        <Text style={{ color: SecondaryGrey, marginBottom: 10, fontSize: 16 }}>Describe your CRWD</Text>
        <TextInput style={{ borderColor: SecondaryGrey, borderWidth: 1, borderRadius: 10, padding: 15, marginBottom: 20 }} multiline={true} numberOfLines={2} placeholder='Choose a name' />

        <Text style={{ color: SecondaryGrey, marginBottom: 10, fontSize: 16 }}>Enter Suggested Amount</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: LightGrey, padding: 15, borderRadius: 10 }}>
          <Text style={{ color: SecondaryGrey, fontSize: 16 }}>Input amount over $5</Text>
          <View style={{ flexDirection: 'row', gap: 10 , justifyContent: 'space-around', alignContent: 'center', backgroundColor: SecondaryBlue, borderRadius: 10, padding: 15 }}>
            <TouchableOpacity onPress={() => setcount(prev => prev - 1)} disabled={count === 5}>
              <Minus color={PrimaryBlue} size={20} />
            </TouchableOpacity>
            <Text style={{ color: PrimaryBlue, fontSize: 16, fontWeight: 'bold' }}>${count}</Text>
            <TouchableOpacity onPress={() => setcount(prev => prev + 1)} disabled={count === 100}>
              <Plus color={PrimaryBlue} size={20} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={{ color: SecondaryGrey, fontSize: 16 }}>Choose causes</Text>

        <OneTimeDonation
              setCheckout={setCheckout}
              selectedOrganizations={selectedOrganizations}
              setSelectedOrganizations={setSelectedOrganizations}
              show={false}
            />
        

      </ScrollView>

      <TouchableOpacity
            onPress={() => setCheckout(true)}
            style={styles.donateButton}
          >
            <Text style={styles.donateButtonText}>
              Create
            </Text>
          </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    paddingHorizontal: 20,
    marginTop: 10
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: PrimaryGrey,
    // textAlign: 'center',
  },
  amountSection: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  amountTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  amountSelector: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    marginBottom: 8,
  },
  amountButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  amountInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    paddingHorizontal: 16,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#e5e7eb',
  },
  dollarSign: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  amountText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'center',
    width: 80,
  },
  amountHint: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  selectedSection: {
    marginBottom: 24,
  },
  selectedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },

  selectedOrgImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  selectedOrgInfo: {
    flex: 1,
  },
  selectedOrgName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  selectedOrgAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 20,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  orgCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#f3f4f6',
  },
  selectedOrgCard: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  orgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orgImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  orgInfo: {
    flex: 1,
  },
  orgName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  orgDesc: {
    fontSize: 14,
    color: '#6b7280',
  },
  orgActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkedButton: {
    backgroundColor: '#2563eb',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  donateSection: {
    paddingBottom: 40,
  },
  donateButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10
  },
  donateButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});
