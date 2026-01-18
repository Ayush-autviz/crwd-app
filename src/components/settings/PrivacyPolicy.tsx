import { View, Text, SafeAreaView, ScrollView, StyleSheet } from 'react-native'
import React from 'react'
import MainHeaderNav from '../MainHeaderNav'
import { PrimaryBlue, PrimaryGrey, SecondaryGrey } from '../../Constants/Colors'

export default function PrivacyPolicy() {
  return (
    <SafeAreaView style={styles.container}>
      <MainHeaderNav show={true} title={'Privacy Policy'} menu={false} />
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Privacy Policy</Text>

        <Text style={styles.lastUpdated}>Effective Date: January 15, 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.paragraph}>
            At CRWD, we are committed to protecting your privacy. CRWD operates through CRWD Foundation Inc. (a 501(c)(3) nonprofit) and CRWD Collective Giving LLC. This Privacy Policy outlines how we collect, use, and safeguard your data.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Information We Collect</Text>

          <Text style={styles.subSectionTitle}>2.1 Personal Information</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Name and contact info</Text>
            <Text style={styles.bulletItem}>• Account credentials</Text>
            <Text style={styles.bulletItem}>• Payment information (securely processed)</Text>
            <Text style={styles.bulletItem}>• Transaction history</Text>
          </View>

          <Text style={styles.subSectionTitle}>2.2 Usage Information</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Device information</Text>
            <Text style={styles.bulletItem}>• IP address and location data</Text>
            <Text style={styles.bulletItem}>• App usage statistics</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• To facilitate account creation</Text>
            <Text style={styles.bulletItem}>• To process donations and disbursements</Text>
            <Text style={styles.bulletItem}>• To send giving summaries and tax receipts</Text>
            <Text style={styles.bulletItem}>• To protect our services and legal rights</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Sharing Your Information</Text>
          <Text style={styles.paragraph}>
            We may share info with:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Service providers (e.g., payment processors)</Text>
            <Text style={styles.bulletItem}>• Legal authorities when required</Text>
          </View>
          <Text style={styles.paragraph}>
            Note: We generally do not share personal contact info with nonprofits unless you opt-in. We may share aggregated, anonymous data.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Data Security</Text>
          <Text style={styles.paragraph}>
            We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Your Rights</Text>
          <Text style={styles.paragraph}>
            You have the right to access, correct, or delete your data. You may review your account settings at any time or contact us to delete your account.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Contact Us</Text>
          <Text style={styles.paragraph}>
            Email: info@crwdfund.org
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
  },
  scrollView: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    // color: PrimaryBlue,
  },
  subSectionTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 5,
    color: PrimaryGrey,
  },
  paragraph: {
    fontSize: 14,
    color: PrimaryGrey,
    marginBottom: 10,
    lineHeight: 20,
  },
  bulletList: {
    marginLeft: 10,
    marginTop: 5,
    marginBottom: 15,
  },
  bulletItem: {
    fontSize: 14,
    color: PrimaryGrey,
    marginBottom: 5,
    lineHeight: 20,
  },
  lastUpdated: {
    fontSize: 12,
    color: PrimaryGrey,
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 40,
  }
});