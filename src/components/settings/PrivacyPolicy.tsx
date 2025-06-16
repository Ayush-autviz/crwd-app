import { View, Text, SafeAreaView, ScrollView, StyleSheet } from 'react-native'
import React from 'react'
import MainHeaderNav from '../MainHeaderNav'
import { PrimaryBlue, PrimaryGrey, SecondaryGrey } from '../../Constants/Colors'

export default function PrivacyPolicy() {
  return (
    <SafeAreaView style={styles.container}>
      <MainHeaderNav show={true} post={false} menu={false} />
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Privacy Policy</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.paragraph}>
            At CRWD, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Information We Collect</Text>
          
          <Text style={styles.subSectionTitle}>2.1 Personal Information</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Name and contact information</Text>
            <Text style={styles.bulletItem}>• Email address</Text>
            <Text style={styles.bulletItem}>• Payment information</Text>
            <Text style={styles.bulletItem}>• Profile information</Text>
            <Text style={styles.bulletItem}>• Communication preferences</Text>
          </View>
          
          <Text style={styles.subSectionTitle}>2.2 Usage Information</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Device information</Text>
            <Text style={styles.bulletItem}>• IP address</Text>
            <Text style={styles.bulletItem}>• Browser type</Text>
            <Text style={styles.bulletItem}>• Pages visited</Text>
            <Text style={styles.bulletItem}>• Time spent on pages</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            We use the information we collect to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Provide and maintain our services</Text>
            <Text style={styles.bulletItem}>• Process your transactions</Text>
            <Text style={styles.bulletItem}>• Send you important updates</Text>
            <Text style={styles.bulletItem}>• Improve our platform</Text>
            <Text style={styles.bulletItem}>• Protect against fraud</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Information Sharing</Text>
          <Text style={styles.paragraph}>
            We may share your information with:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Service providers</Text>
            <Text style={styles.bulletItem}>• Payment processors</Text>
            <Text style={styles.bulletItem}>• Legal authorities when required</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Your Rights</Text>
          <Text style={styles.paragraph}>
            You have the right to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Access your personal information</Text>
            <Text style={styles.bulletItem}>• Correct inaccurate data</Text>
            <Text style={styles.bulletItem}>• Request deletion of your data</Text>
            <Text style={styles.bulletItem}>• Opt-out of marketing communications</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Security</Text>
          <Text style={styles.paragraph}>
            We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Changes to This Policy</Text>
          <Text style={styles.paragraph}>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have any questions about this Privacy Policy, please contact us at:
          </Text>
          <Text style={styles.paragraph}>
            Email: privacy@crwd.com{'\n'}
            Address: 123 Privacy Street, Security City, SC 12345
          </Text>
        </View>
        
        <Text style={styles.lastUpdated}>Last updated: March 15, 2024</Text>
        
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