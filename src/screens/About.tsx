import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  Heart,
  Target,
  DollarSign,
  Users,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react-native'
import { PrimaryGrey, PrimaryBlue } from '../Constants/Colors'
import MainHeaderNav from '../components/MainHeaderNav'

export default function About() {
  return (
    <SafeAreaView style={styles.container}>
      <MainHeaderNav show menu={false} title={'About'} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>CRWD About Page</Text>
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <View style={styles.quickLinksGrid}>
            <View style={styles.quickLinkCard}>
              <View style={styles.quickLinkIcon}>
                <Heart size={20} color={PrimaryBlue} />
              </View>
              <Text style={styles.quickLinkTitle}>About CRWD</Text>
            </View>
            <View style={styles.quickLinkCard}>
              <View style={styles.quickLinkIcon}>
                <Target size={20} color={PrimaryBlue} />
              </View>
              <Text style={styles.quickLinkTitle}>How CRWD Works</Text>
            </View>
            <View style={styles.quickLinkCard}>
              <View style={styles.quickLinkIcon}>
                <DollarSign size={20} color={PrimaryBlue} />
              </View>
              <Text style={styles.quickLinkTitle}>About Tax Deductibility</Text>
            </View>
            <View style={styles.quickLinkCard}>
              <View style={styles.quickLinkIcon}>
                <Users size={20} color={PrimaryBlue} />
              </View>
              <Text style={styles.quickLinkTitle}>What Are CRWD Collectives?</Text>
            </View>
            <View style={styles.quickLinkCard}>
              <View style={styles.quickLinkIcon}>
                <TrendingUp size={20} color={PrimaryBlue} />
              </View>
              <Text style={styles.quickLinkTitle}>Why CRWD</Text>
            </View>
          </View>
        </View>

        {/* About CRWD Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About CRWD</Text>
          <Text style={styles.paragraphText}>
            CRWD is a collective giving platform that makes it easy to support multiple causes you care about with a single monthly donation. Our mission is to transform how people give by removing barriers and creating communities of changemakers who show up consistently for the causes that matter.
          </Text>
          <Text style={styles.paragraphText}>
            CRWD operates through two entities:
          </Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>
                <Text style={{ fontWeight: 'bold' }}>CRWD Foundation Inc.</Text>, a 501(c)(3) nonprofit organization (EIN: 41-2423690) that receives and distributes donations to qualified nonprofits.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>
                <Text style={{ fontWeight: 'bold' }}>CRWD Collective Giving LLC</Text>, which provides the technology platform and services.
              </Text>
            </View>
          </View>
          <Text style={[styles.paragraphText, styles.boldText, { marginTop: 16 }]}>
            We're here to simplify generosity.
          </Text>
        </View>

        {/* How CRWD Works Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How CRWD Works</Text>
          <View style={styles.stepsContainer}>
            <View style={styles.stepItem}>
              <View style={styles.stepBorder} />
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Build your donation box.</Text>
                <Text style={styles.stepDescription}>
                  Search or browse for verified nonprofits and add the ones you want to support. You can update your box at any time.
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepBorder} />
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Donate once or monthly.</Text>
                <Text style={styles.stepDescription}>
                  Your donation is split evenly across all nonprofits in your box. CRWD processes the payment and distributes funds on your behalf.
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepBorder} />
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Transparent fee structure.</Text>
                <Text style={styles.stepDescription}>
                  At least 90% of your donation goes directly to the nonprofits you've chosen. No more than 10% supports CRWD's operations (including payment processing, verification, and platform maintenance).
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepBorder} />
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>We send the funds.</Text>
                <Text style={styles.stepDescription}>
                  CRWD Foundation Inc. disburses donations to nonprofits within 60 days of receipt. This window allows for payment processing, verification, and operational requirements.
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepBorder} />
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Track your giving.</Text>
                <Text style={styles.stepDescription}>
                  You'll have access to a clear record of your donation history, the nonprofits you've supported, and when distributions were made.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* About Tax Deductibility Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Tax Deductibility</Text>
          <Text style={styles.paragraphText}>
            Because CRWD uses a collective giving model, where donations are pooled and distributed on your behalf, most donations are not currently tax deductible, even if they support 501(c)(3) organizations.
          </Text>

          <Text style={styles.subsectionTitle}>That's changing.</Text>
          <Text style={styles.paragraphText}>
            Some nonprofits on CRWD have already enrolled to receive direct payments, which makes donations to them tax deductible and helps reduce processing time and costs. These nonprofits are clearly labeled across the platform, and you'll receive a tax receipt when you give to them.
          </Text>
          <Text style={styles.paragraphText}>
            We're working daily to expand this option—so more nonprofits can accept direct donations, and more of your giving can qualify for tax benefits.
          </Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>In the meantime:</Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>
                  Nonprofits receive at least 90% of your donation
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>
                  You'll receive a giving summary from CRWD for your records
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* What Are CRWDs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What Are CRWD Collectives?</Text>
          <Text style={styles.paragraphText}>
            CRWDs are curated collections of nonprofits tied to a shared cause or identity.
          </Text>
          <Text style={styles.paragraphText}>
            You can join a CRWD, create one, or share it with others.
          </Text>

          <View style={styles.featuresCard}>
            <Text style={styles.featuresCardTitle}>Each CRWD includes:</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <View style={styles.featureBullet} />
                <Text style={styles.featureText}>
                  A set of nonprofits selected around a theme or issue
                </Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureBullet} />
                <Text style={styles.featureText}>
                  A name, description, and cover image
                </Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureBullet} />
                <Text style={styles.featureText}>
                  A discussion feed where members can post articles, ideas, and updates
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.paragraphText}>
            Joining a CRWD adds its nonprofits to your donation box. You can keep them all, or remove any you don't want to support.
          </Text>
        </View>

        {/* Why CRWD Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why CRWD</Text>
          <Text style={styles.paragraphText}>
            Giving to multiple nonprofits shouldn't require multiple accounts, receipts, or payment forms.
          </Text>
          <Text style={styles.paragraphText}>
            CRWD simplifies the process—so you can focus on giving, not managing it.
          </Text>

          <View style={styles.whyFeaturesList}>
            <View style={styles.whyFeatureCard}>
              <Text style={styles.whyFeatureTitle}>One place to organize your giving</Text>
              <Text style={styles.whyFeatureDescription}>
                Keep all your favorite nonprofits in one convenient donation box.
              </Text>
            </View>
            <View style={styles.whyFeatureCard}>
              <Text style={styles.whyFeatureTitle}>One donation, split automatically</Text>
              <Text style={styles.whyFeatureDescription}>
                Make a single payment that gets distributed to all your chosen causes.
              </Text>
            </View>
            <View style={styles.whyFeatureCard}>
              <Text style={styles.whyFeatureTitle}>One platform built for everyday generosity</Text>
              <Text style={styles.whyFeatureDescription}>
                Designed to make regular giving simple, transparent, and impactful.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  heroSection: {
    paddingVertical: 32,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  quickLinksGrid: {
    gap: 12,
  },
  quickLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickLinkIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quickLinkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  paragraphText: {
    fontSize: 16,
    color: PrimaryGrey,
    lineHeight: 24,
    marginBottom: 16,
  },
  boldText: {
    fontWeight: '600',
    color: '#111827',
  },
  subsectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: PrimaryBlue,
    marginBottom: 12,
    marginTop: 8,
  },
  stepsContainer: {
    gap: 24,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepBorder: {
    width: 4,
    backgroundColor: PrimaryBlue,
    marginRight: 16,
    minHeight: 60,
  },
  stepContent: {
    flex: 1,
    paddingLeft: 4,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 15,
    color: PrimaryGrey,
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 12,
  },
  bulletList: {
    gap: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    width: 6,
    height: 6,
    backgroundColor: '#1e40af',
    borderRadius: 3,
    marginRight: 12,
    marginTop: 8,
  },
  bulletText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
    flex: 1,
  },
  featuresCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  featuresCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureBullet: {
    width: 6,
    height: 6,
    backgroundColor: PrimaryBlue,
    borderRadius: 3,
    marginRight: 12,
    marginTop: 8,
  },
  featureText: {
    fontSize: 15,
    color: PrimaryGrey,
    lineHeight: 22,
    flex: 1,
  },
  whyFeaturesList: {
    gap: 16,
  },
  whyFeatureCard: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  whyFeatureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PrimaryBlue,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  whyFeatureDescription: {
    fontSize: 15,
    color: PrimaryGrey,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomPadding: {
    height: 40,
  },
})
