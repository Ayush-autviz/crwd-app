import React from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView } from 'react-native';
import MainHeaderNav from '../MainHeaderNav';


export default function TermsOfUse() {
  return (
    <SafeAreaView style={styles.container}>
      <MainHeaderNav show={true} title={'Terms of Use'} menu={false} />
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Terms of Service</Text>

        <Text style={styles.lastUpdated}>Effective Date: January 15, 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Welcome to CRWD</Text>
          <Text style={styles.paragraph}>
            Thank you for using CRWD! These Terms of Service govern your use of the CRWD platform and services. By creating an account or making a donation through CRWD, you agree to these Terms and our Privacy Policy.
          </Text>
          <Text style={styles.paragraph}>
            CRWD is a collective giving platform that makes it easy to support multiple causes you care about with a single monthly donation. Our mission is to transform how people give by removing barriers and creating communities of changemakers who show up consistently for the causes that matter.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About CRWD</Text>
          <Text style={styles.paragraph}>
            CRWD operates through two entities:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• CRWD Foundation Inc., a 501(c)(3) nonprofit organization (EIN: 41-2423690) that receives and distributes donations to qualified nonprofits</Text>
            <Text style={styles.bulletItem}>• CRWD Collective Giving LLC, which provides the technology platform and services</Text>
          </View>
          <Text style={styles.paragraph}>
            When you make a donation through CRWD, you are making a tax-deductible contribution to CRWD Foundation Inc., which then grants funds to the nonprofits you've selected.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How Donations Work</Text>

          <Text style={styles.subSectionTitle}>Fee Structure</Text>
          <Text style={styles.paragraph}>
            For every donation you make through CRWD:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• At least 90% goes directly to the nonprofits you've chosen to support</Text>
            <Text style={styles.bulletItem}>• No more than 10% supports CRWD's operations, including platform maintenance, nonprofit verification, payment processing, marketing to reach more donors and nonprofits, and our team</Text>
          </View>
          <Text style={styles.paragraph}>
            This fee structure is transparent and applied consistently to all donations. Payment processing fees (charged by third-party processors like Stripe) are included in CRWD's operational fee.
          </Text>

          <Text style={styles.subSectionTitle}>Disbursement Timeline</Text>
          <Text style={styles.paragraph}>
            CRWD Foundation Inc. disburses donations to nonprofits within 60 days of receipt. Most disbursements occur within 45 days, but the 60-day window accounts for payment processing, verification, and operational requirements.
          </Text>

          <Text style={styles.subSectionTitle}>Nonprofit Selection</Text>
          <Text style={styles.paragraph}>
            The nonprofits listed on CRWD are verified 501(c)(3) organizations selected by CRWD based on public IRS records and our verification process. Nonprofits listed on CRWD:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Do not have a partnership or endorsement relationship with CRWD</Text>
            <Text style={styles.bulletItem}>• Have not signed agreements with CRWD</Text>
            <Text style={styles.bulletItem}>• Are beneficiaries of donations made through the platform</Text>
            <Text style={styles.bulletItem}>• May not know they are listed on CRWD until they receive a donation</Text>
          </View>
          <Text style={styles.paragraph}>
            CRWD is not responsible for how nonprofits use donated funds after disbursement. If a nonprofit loses its 501(c)(3) status, closes, or becomes inactive after you've selected it, CRWD Foundation will reallocate your designated funds to similar qualified nonprofits.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Account and Responsibilities</Text>

          <Text style={styles.subSectionTitle}>Eligibility</Text>
          <Text style={styles.paragraph}>
            You must be at least 13 years old to use CRWD. If you are under 18, you must have permission from a parent or legal guardian.
          </Text>

          <Text style={styles.subSectionTitle}>Account Information</Text>
          <Text style={styles.paragraph}>
            You agree to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Provide accurate and current information when creating your account</Text>
            <Text style={styles.bulletItem}>• Maintain the security of your account credentials</Text>
            <Text style={styles.bulletItem}>• Update your information promptly if it changes</Text>
            <Text style={styles.bulletItem}>• Notify us immediately of any unauthorized access to your account</Text>
          </View>

          <Text style={styles.subSectionTitle}>Acceptable Use</Text>
          <Text style={styles.paragraph}>
            You agree to use CRWD lawfully and ethically. You will not:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Post, upload, or transmit harmful, illegal, defamatory, harassing, or misleading content</Text>
            <Text style={styles.bulletItem}>• Use automated tools, bots, or scripts to access the platform</Text>
            <Text style={styles.bulletItem}>• Attempt to gain unauthorized access to CRWD's systems or other users' accounts</Text>
            <Text style={styles.bulletItem}>• Engage in fraudulent activity or misrepresent yourself</Text>
            <Text style={styles.bulletItem}>• Use the platform in any way that could harm CRWD, its users, or its reputation</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Intellectual Property</Text>
          <Text style={styles.paragraph}>
            All content on CRWD—including designs, logos, text, software, databases, and trademarks—is owned by CRWD or its licensors and protected by intellectual property laws. You may use CRWD's content for personal, non-commercial purposes only. Any unauthorized reproduction, modification, or distribution is prohibited.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User-Generated Content</Text>
          <Text style={styles.subSectionTitle}>Your Submissions</Text>
          <Text style={styles.paragraph}>
            If you submit content to CRWD (such as comments, reviews, feedback, or ideas), you grant CRWD a worldwide, non-exclusive, royalty-free license to use, modify, reproduce, and distribute your submissions for operational or promotional purposes.
          </Text>
          <Text style={styles.paragraph}>
            You confirm that:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Your submissions are original or you have the rights to share them</Text>
            <Text style={styles.bulletItem}>• Your content does not violate others' rights or contain unlawful material</Text>
            <Text style={styles.bulletItem}>• You give CRWD permission to use your content as described above</Text>
          </View>
          <Text style={styles.paragraph}>
            CRWD reserves the right to edit, remove, or report content that violates these Terms without prior notice.
          </Text>

          <Text style={styles.subSectionTitle}>Copyright Claims</Text>
          <Text style={styles.paragraph}>
            If you believe content on CRWD infringes your intellectual property rights, contact us at info@crwdfund.org with:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• A description of the copyrighted material</Text>
            <Text style={styles.bulletItem}>• The location of the infringing content on our platform</Text>
            <Text style={styles.bulletItem}>• A statement that your claim is made in good faith</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disclaimers and Limitations of Liability</Text>
          <Text style={styles.subSectionTitle}>"As Is" Service</Text>
          <Text style={styles.paragraph}>
            CRWD is provided "as is" without warranties of any kind, express or implied. While we work to provide a reliable and secure platform, we do not guarantee:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Uninterrupted or error-free access</Text>
            <Text style={styles.bulletItem}>• That the platform will meet all your requirements</Text>
            <Text style={styles.bulletItem}>• The accuracy or reliability of nonprofit information</Text>
            <Text style={styles.bulletItem}>• The tax-deductibility of your specific donation (consult your tax advisor)</Text>
          </View>

          <Text style={styles.subSectionTitle}>Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            To the fullest extent permitted by law, CRWD, its affiliates, and team members shall not be liable for:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Indirect, incidental, consequential, or punitive damages</Text>
            <Text style={styles.bulletItem}>• Loss of data, profits, or revenue</Text>
            <Text style={styles.bulletItem}>• Service interruptions or errors</Text>
            <Text style={styles.bulletItem}>• Actions or inactions of nonprofits receiving donations</Text>
            <Text style={styles.bulletItem}>• Delays in donation disbursement due to circumstances beyond our control</Text>
          </View>
          <Text style={styles.paragraph}>
            CRWD's total liability to you shall not exceed the total amount of donations you have made through the platform in the preceding 12 months.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Indemnification</Text>
          <Text style={styles.paragraph}>
            You agree to indemnify and hold harmless CRWD, CRWD Foundation Inc., CRWD Collective Giving LLC, and their affiliates, officers, directors, employees, and agents from any claims, liabilities, damages, or expenses (including legal fees) arising from:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Your use of the platform</Text>
            <Text style={styles.bulletItem}>• Your content submissions</Text>
            <Text style={styles.bulletItem}>• Your breach of these Terms</Text>
            <Text style={styles.bulletItem}>• Your violation of any law or third-party rights</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Changes to Terms</Text>
          <Text style={styles.paragraph}>
            CRWD may update these Terms at any time. We will notify you of material changes through the platform or via email. Continued use of CRWD after changes are posted constitutes acceptance of the updated Terms.
          </Text>
          <Text style={styles.paragraph}>
            If you do not agree to the changes, you must stop using the platform.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Termination</Text>
          <Text style={styles.paragraph}>
            CRWD may suspend or terminate your account if you:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Breach these Terms</Text>
            <Text style={styles.bulletItem}>• Engage in unlawful or harmful behavior</Text>
            <Text style={styles.bulletItem}>• Provide false or misleading information</Text>
          </View>
          <Text style={styles.paragraph}>
            Upon termination, your access to CRWD will cease immediately. Provisions that by their nature should survive termination (including intellectual property rights, indemnification, and limitation of liability) will remain in effect.
          </Text>
          <Text style={styles.paragraph}>
            You may close your account at any time by contacting us at info@crwdfund.org.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Governing Law and Disputes</Text>
          <Text style={styles.paragraph}>
            These Terms are governed by the laws of the State of Georgia and the United States, without regard to conflict of law principles.
          </Text>
          <Text style={styles.paragraph}>
            Any disputes arising from these Terms or your use of CRWD will be subject to the exclusive jurisdiction of the courts located in Georgia.
          </Text>
          <Text style={styles.paragraph}>
            If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.paragraph}>
            For questions about these Terms of Service, contact us at: Email: info@crwdfund.org
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  scrollView: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  lastUpdated: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
    color: '#444',
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
    marginBottom: 12,
  },
  bulletList: {
    marginLeft: 8,
    marginBottom: 12,
  },
  bulletItem: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
    marginBottom: 6,
  },
  bottomPadding: {
    height: 40,
  }
});
