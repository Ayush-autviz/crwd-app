import { View, Text, SafeAreaView, ScrollView, StyleSheet } from 'react-native'
import React from 'react'
import MainHeaderNav from '../MainHeaderNav'
import { PrimaryBlue, PrimaryGrey, SecondaryGrey } from '../../Constants/Colors'

export default function TermsOfUse() {
  return (
    <SafeAreaView style={styles.container}>
      <MainHeaderNav show={true} post={false} menu={false} />
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Terms of Use</Text>
        
        <Text style={styles.lastUpdated}>Last updated: March 15, 2024</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By accessing and using CRWD, you agree to be bound by these Terms of Use and all applicable laws and regulations.
            If you do not agree with any of these terms, you are prohibited from using or accessing this platform.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Use License</Text>
          <Text style={styles.paragraph}>
            Permission is granted to temporarily use CRWD for personal, non-commercial purposes. This is the grant of a license,
            not a transfer of title, and under this license you may not:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Modify or copy the materials</Text>
            <Text style={styles.bulletItem}>• Use the materials for any commercial purpose</Text>
            <Text style={styles.bulletItem}>• Attempt to decompile or reverse engineer any software contained on CRWD</Text>
            <Text style={styles.bulletItem}>• Remove any copyright or other proprietary notations from the materials</Text>
            <Text style={styles.bulletItem}>• Transfer the materials to another person or "mirror" the materials on any other server</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          <Text style={styles.paragraph}>
            To access certain features of CRWD, you must register for an account. You agree to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Provide accurate and complete information</Text>
            <Text style={styles.bulletItem}>• Maintain the security of your account and password</Text>
            <Text style={styles.bulletItem}>• Accept responsibility for all activities that occur under your account</Text>
            <Text style={styles.bulletItem}>• Notify us immediately of any unauthorized use of your account</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. User Conduct</Text>
          <Text style={styles.paragraph}>
            You agree not to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Use CRWD for any illegal purpose</Text>
            <Text style={styles.bulletItem}>• Harass, abuse, or harm another person</Text>
            <Text style={styles.bulletItem}>• Post or transmit unauthorized commercial communications</Text>
            <Text style={styles.bulletItem}>• Collect users' information without their consent</Text>
            <Text style={styles.bulletItem}>• Interfere with the proper functioning of CRWD</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Content and Intellectual Property</Text>
          <Text style={styles.paragraph}>
            All content on CRWD, including text, graphics, logos, and software, is the property of CRWD or its content suppliers
            and is protected by international copyright laws. You may not reproduce, distribute, or create derivative works from
            this content without express permission.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Donations and Payments</Text>
          <Text style={styles.paragraph}>
            When making donations through CRWD:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• You must provide accurate payment information</Text>
            <Text style={styles.bulletItem}>• All donations are final and non-refundable</Text>
            <Text style={styles.bulletItem}>• We reserve the right to refuse or cancel any donation</Text>
            <Text style={styles.bulletItem}>• You are responsible for any applicable taxes</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Disclaimer</Text>
          <Text style={styles.paragraph}>
            CRWD is provided "as is" without any warranties, expressed or implied. We do not warrant that:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• The platform will be uninterrupted or error-free</Text>
            <Text style={styles.bulletItem}>• Defects will be corrected</Text>
            <Text style={styles.bulletItem}>• The platform is free of viruses or other harmful components</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            In no event shall CRWD or its suppliers be liable for any damages arising out of the use or inability to use the
            platform, even if we have been notified of the possibility of such damages.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the
            new Terms of Use on this page. Your continued use of CRWD after such modifications constitutes your acceptance of
            the new terms.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Governing Law</Text>
          <Text style={styles.paragraph}>
            These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which CRWD operates,
            without regard to its conflict of law provisions.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Contact Information</Text>
          <Text style={styles.paragraph}>
            If you have any questions about these Terms of Use, please contact us at:
          </Text>
          <Text style={styles.paragraph}>
            Email: legal@crwd.com{'\n'}
            Address: 123 CRWD Street, City, Country
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
    marginBottom: 10,
    textAlign: 'center',
  },
  lastUpdated: {
    fontSize: 12,
    color: PrimaryGrey,
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
  paragraph: {
    fontSize: 14,
    color: PrimaryGrey,
    marginBottom: 10,
    lineHeight: 20,
  },
  bulletList: {
    marginLeft: 10,
    marginTop: 5,
  },
  bulletItem: {
    fontSize: 14,
    color: PrimaryGrey,
    marginBottom: 5,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 40,
  }
});