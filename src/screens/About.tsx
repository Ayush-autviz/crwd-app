import React, { useState } from 'react'
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { 
  ChevronLeft, 
  Users,
  Heart,
  DollarSign,
  Target,
  Gift,
  TrendingUp,
  CheckCircle2,
  ArrowRight
} from 'lucide-react-native'
import { useNavigation } from '@react-navigation/native'
import { PrimaryGrey, PrimaryBlue, LightGrey } from '../Constants/Colors'
import MainHeaderNav from '../components/MainHeaderNav'

interface QuickLinkItem {
  id: string
  title: string
  icon: JSX.Element
}

interface FeatureItem {
  title: string
  description: string
}

export default function About() {
  const navigation = useNavigation()
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const quickLinks: QuickLinkItem[] = [
    {
      id: 'about-crwd',
      title: 'About CRWD',
      icon: <Heart size={20} color={PrimaryBlue} />
    },
    {
      id: 'how-it-works',
      title: 'How CRWD Works',
      icon: <Target size={20} color={PrimaryBlue} />
    },
    {
      id: 'tax-info',
      title: 'Tax Deductibility',
      icon: <DollarSign size={20} color={PrimaryBlue} />
    },
    {
      id: 'what-are-crwds',
      title: 'What Are CRWDs?',
      icon: <Users size={20} color={PrimaryBlue} />
    },
    {
      id: 'why-crwd',
      title: 'Why CRWD',
      icon: <TrendingUp size={20} color={PrimaryBlue} />
    }
  ]

  const howItWorksSteps = [
    {
      title: 'Build your donation box',
      description: 'Search or browse for verified nonprofits and add the ones you want to support. You can update your box at any time.'
    },
    {
      title: 'Donate once or monthly',
      description: 'Your donation is split evenly across all nonprofits in your box. CRWD processes the payment and distributes funds on your behalf.'
    },
    {
      title: 'We send the funds',
      description: 'CRWD distributes donations to nonprofits within 45 days, bundled as a single payment that includes all contributions made to that nonprofit across the platform.'
    },
    {
      title: 'Track your giving',
      description: 'You\'ll have access to a clear record of your donation history, the nonprofits you\'ve supported, and when distributions were made.'
    }
  ]

  const whyCRWDFeatures: FeatureItem[] = [
    {
      title: 'One place to organize your giving',
      description: 'Keep all your favorite nonprofits in one convenient donation box.'
    },
    {
      title: 'One donation, split automatically',
      description: 'Make a single payment that gets distributed to all your chosen causes.'
    },
    {
      title: 'One platform built for everyday generosity',
      description: 'Designed to make regular giving simple, transparent, and impactful.'
    }
  ]

  const crwdFeatures = [
    'A set of nonprofits selected around a theme or issue',
    'A name, description, and cover image',
    'A discussion feed where members can post articles, ideas, and updates'
  ]

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId)
    // In a real implementation, you would scroll to the section
    Alert.alert('Navigation', `Scrolling to ${sectionId} section`)
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color="#374151" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.title}>About CRWD</Text>
        <View style={styles.headerSpacer} />
      </View> */}
      <MainHeaderNav show menu={false} post={false} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>CRWD About Page</Text>
          <Text style={styles.heroSubtitle}>
            Learn how CRWD makes it easy to give to multiple nonprofits in one place.
          </Text>
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <View style={styles.quickLinksGrid}>
            {quickLinks.map((link) => (
              <TouchableOpacity
                key={link.id}
                style={styles.quickLinkCard}
                onPress={() => scrollToSection(link.id)}
              >
                <View style={styles.quickLinkIcon}>
                  {link.icon}
                </View>
                <Text style={styles.quickLinkTitle}>{link.title}</Text>
                <ArrowRight size={16} color={PrimaryGrey} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* About CRWD Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About CRWD</Text>
          <Text style={styles.paragraphText}>
            CRWD makes it easy to give to multiple nonprofits in one place.
          </Text>
          <Text style={styles.paragraphText}>
            You can build a personalized donation box, add nonprofits you care about, and give once or monthly. CRWD handles the rest—including distributing your donation and keeping everything organized.
          </Text>
          <Text style={[styles.paragraphText, styles.boldText]}>
            We're here to simplify generosity.
          </Text>
        </View>

        {/* How CRWD Works Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How CRWD Works</Text>
          <View style={styles.stepsContainer}>
            {howItWorksSteps.map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Tax Deductibility Section */}
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
                  Nonprofits still receive 100% of your donation (minus processing fees)
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
          <Text style={styles.sectionTitle}>What Are CRWDs?</Text>
          <Text style={styles.paragraphText}>
            CRWDs are curated collections of nonprofits tied to a shared cause or identity.
          </Text>
          <Text style={styles.paragraphText}>
            You can join a CRWD, create one, or share it with others.
          </Text>

          <View style={styles.featuresCard}>
            <Text style={styles.featuresCardTitle}>Each CRWD includes:</Text>
            <View style={styles.featuresList}>
              {crwdFeatures.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <CheckCircle2 size={16} color={PrimaryBlue} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
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
            {whyCRWDFeatures.map((feature, index) => (
              <View key={index} style={styles.whyFeatureCard}>
                <Gift size={24} color={PrimaryBlue} />
                <Text style={styles.whyFeatureTitle}>{feature.title}</Text>
                <Text style={styles.whyFeatureDescription}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
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
  heroSubtitle: {
    fontSize: 16,
    color: PrimaryGrey,
    textAlign: 'center',
    lineHeight: 24,
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
    gap: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    backgroundColor: PrimaryBlue,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    marginTop: 4,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  stepContent: {
    flex: 1,
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
  featureText: {
    fontSize: 15,
    color: PrimaryGrey,
    lineHeight: 22,
    marginLeft: 12,
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
}) 