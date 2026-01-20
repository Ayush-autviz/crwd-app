import { View, Text, SafeAreaView, ScrollView, StyleSheet } from 'react-native'
import React from 'react'
import MainHeaderNav from '../MainHeaderNav'
import { PrimaryGrey } from '../../Constants/Colors'

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
            At CRWD, we are committed to protecting your privacy and ensuring the security of your personal information. CRWD operates through CRWD Foundation Inc. (a 501(c)(3) nonprofit) and CRWD Collective Giving LLC. This Privacy Policy outlines how we collect, use, disclose, and safeguard your data when you use the CRWD platform.
          </Text>
          <Text style={styles.paragraph}>
            By using CRWD, you consent to the data practices described in this policy.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Information We Collect</Text>
          <Text style={styles.subSectionTitle}>2.1 Personal Information</Text>
          <Text style={styles.paragraph}>
            We collect information that you voluntarily provide to us when you register on the platform, express an interest in obtaining information about us or our products and services, when you participate in activities on the platform, or otherwise when you contact us.
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Name and contact details (email address, phone number)</Text>
            <Text style={styles.bulletItem}>• Account credentials</Text>
            <Text style={styles.bulletItem}>• Payment information (processed securely by third-party payment processors)</Text>
            <Text style={styles.bulletItem}>• Transaction history and donation preferences</Text>
          </View>

          <Text style={styles.subSectionTitle}>2.2 Usage Data</Text>
          <Text style={styles.paragraph}>
            We automatically collect certain information when you visit, use, or navigate the platform. This information does not reveal your specific identity (like your name or contact information) but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, information about how and when you use our platform, and other technical information.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            We use the information we collect or receive to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Facilitate account creation and logon process</Text>
            <Text style={styles.bulletItem}>• Process your donations and disbursements to nonprofits</Text>
            <Text style={styles.bulletItem}>• Send you administrative information, giving summaries, and tax receipts</Text>
            <Text style={styles.bulletItem}>• Protect our services and legal rights</Text>
            <Text style={styles.bulletItem}>• Respond to legal requests and prevent harm</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Sharing Your Information</Text>
          <Text style={styles.paragraph}>
            We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}><Text style={styles.boldText}>Service Providers:</Text> We may share your information with third-party vendors, service providers, contractors, or agents who perform services for us or on our behalf and require access to such information to do that work (e.g., payment processing, data analysis, email delivery, hosting services).</Text>
            <Text style={styles.bulletItem}><Text style={styles.boldText}>Legal Obligations:</Text> We may disclose your information where we are legally required to do so in order to comply with applicable law, governmental requests, a judicial proceeding, court order, or legal process.</Text>
            <Text style={styles.bulletItem}><Text style={styles.boldText}>Business Transfers:</Text> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</Text>
          </View>
          <Text style={styles.paragraph}>
            <Text style={styles.boldText}>Note on Nonprofits:</Text> We generally do not share your personal contact information with the nonprofits you support unless you explicitly opt-in or it is required to facilitate a specific transaction or benefit. We may share aggregated, anonymous data with nonprofits to help them understand their support base.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Data Security</Text>
          <Text style={styles.paragraph}>
            We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please also remember that we cannot guarantee that the internet itself is 100% secure. Although we will do our best to protect your personal information, transmission of personal information to and from our platform is at your own risk. You should only access the services within a secure environment.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Your Privacy Rights</Text>
          <Text style={styles.paragraph}>
            Depending on your location, you may have certain rights regarding your personal information, such as the right to access, correct, or delete the data we hold about you. You may review and change your account information at any time by logging into your account settings. To request to delete your account, please contact us at info@crwdfund.org.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have questions or comments about this policy, you may email us at info@crwdfund.org.
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
    fontWeight: '500',
  },
  bottomPadding: {
    height: 40,
  },
  boldText: {
    fontWeight: '600',
  }
});
