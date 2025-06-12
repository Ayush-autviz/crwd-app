import React, { useState } from 'react'
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  Linking,
  Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { 
  ChevronLeft, 
  ChevronDown, 
  ChevronRight, 
  Mail, 
  Phone, 
  MessageCircle,
  Users,
  Heart,
  DollarSign,
  Settings,
  Shield,
  Bell
} from 'lucide-react-native'
import { useNavigation } from '@react-navigation/native'
import { PrimaryGrey, PrimaryBlue, LightGrey } from '../Constants/Colors'

interface FAQItem {
  question: string
  answer: string
}

export default function HelpCenter() {
  const navigation = useNavigation()
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index)
  }

  const faqData: FAQItem[] = [
    {
      question: "What is CRWD and how does it work?",
      answer: "CRWD is a social platform that connects people with causes they care about. You can join or create CRWDs (communities) focused on specific charitable causes, participate in group donations, and track your collective impact."
    },
    {
      question: "How do I join a CRWD?",
      answer: "You can join a CRWD by browsing our community directory, searching for causes you're interested in, or receiving an invitation from a friend. Simply click 'Join' on any CRWD that interests you."
    },
    {
      question: "How do donations work?",
      answer: "CRWD facilitates group donations to verified non-profit organizations. When your CRWD decides to support a cause, members can contribute any amount they're comfortable with. All donations are secure and go directly to the chosen organization."
    },
    {
      question: "Is my personal information safe?",
      answer: "Yes, we take privacy seriously. Your personal information is encrypted and never shared with third parties without your consent. You control what information is visible to other CRWD members."
    },
    {
      question: "How do I create my own CRWD?",
      answer: "To create a CRWD, go to 'Your CRWDs' and click 'Create New CRWD'. Choose a cause, write a description, and invite friends to join your community."
    },
    {
      question: "Can I leave a CRWD?",
      answer: "Yes, you can leave any CRWD at any time by going to the CRWD page and selecting 'Leave CRWD' from the menu."
    },
    {
      question: "How are non-profits verified?",
      answer: "We verify all non-profit organizations through official databases and documentation to ensure they are legitimate 501(c)(3) organizations in good standing."
    },
    {
      question: "What happens if a CRWD becomes inactive?",
      answer: "Inactive CRWDs are archived after 90 days of no activity. Members are notified and can reactivate the CRWD or join similar active communities."
    }
  ]

  const helpTopics = [
    {
      icon: <Users size={24} color={PrimaryBlue} />,
      title: "Getting Started",
      description: "Learn the basics of using CRWD"
    },
    {
      icon: <Heart size={24} color={PrimaryBlue} />,
      title: "Joining Causes",
      description: "How to find and join CRWDs"
    },
    {
      icon: <DollarSign size={24} color={PrimaryBlue} />,
      title: "Donations & Payments",
      description: "Understanding how donations work"
    },
    {
      icon: <Settings size={24} color={PrimaryBlue} />,
      title: "Account Settings",
      description: "Manage your profile and preferences"
    },
    {
      icon: <Shield size={24} color={PrimaryBlue} />,
      title: "Privacy & Security",
      description: "Keep your account safe"
    },
    {
      icon: <Bell size={24} color={PrimaryBlue} />,
      title: "Notifications",
      description: "Customize your notification preferences"
    }
  ]

  const handleEmailPress = async () => {
    const url = 'mailto:support@crwd.app?subject=Help Request'
    const supported = await Linking.canOpenURL(url)
    if (supported) {
      await Linking.openURL(url)
    } else {
      Alert.alert('Error', 'Unable to open email client')
    }
  }

  const handlePhonePress = async () => {
    const url = 'tel:+1-555-0123'
    const supported = await Linking.canOpenURL(url)
    if (supported) {
      await Linking.openURL(url)
    } else {
      Alert.alert('Error', 'Unable to make phone call')
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color="#374151" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>How can we help you?</Text>
          <Text style={styles.welcomeSubtitle}>
            Find answers to common questions or get in touch with our support team.
          </Text>
        </View>

        {/* Quick Help Topics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Help Topics</Text>
          <View style={styles.topicsGrid}>
            {helpTopics.map((topic, index) => (
              <TouchableOpacity key={index} style={styles.topicCard}>
                <View style={styles.topicIcon}>
                  {topic.icon}
                </View>
                <View style={styles.topicContent}>
                  <Text style={styles.topicTitle}>{topic.title}</Text>
                  <Text style={styles.topicDescription}>{topic.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqContainer}>
            {faqData.map((faq, index) => (
              <View key={index} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => toggleFAQ(index)}
                >
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  {expandedFAQ === index ? (
                    <ChevronDown size={20} color={PrimaryGrey} />
                  ) : (
                    <ChevronRight size={20} color={PrimaryGrey} />
                  )}
                </TouchableOpacity>
                {expandedFAQ === index && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Contact Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Still need help?</Text>
          <Text style={styles.contactSubtitle}>
            Can't find what you're looking for? Our support team is here to help.
          </Text>
          
          <View style={styles.contactGrid}>
            <TouchableOpacity style={styles.contactCard} onPress={handleEmailPress}>
              <View style={styles.contactIcon}>
                <Mail size={20} color={PrimaryBlue} />
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactTitle}>Email Support</Text>
                <Text style={styles.contactDescription}>support@crwd.app</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactCard} onPress={handlePhonePress}>
              <View style={styles.contactIcon}>
                <Phone size={20} color={PrimaryBlue} />
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactTitle}>Phone Support</Text>
                <Text style={styles.contactDescription}>Mon-Fri, 9am-6pm EST</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Quick Tip */}
          <View style={styles.tipContainer}>
            <View style={styles.tipIcon}>
              <MessageCircle size={16} color={PrimaryBlue} />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Quick Tip</Text>
              <Text style={styles.tipText}>
                For faster support, include your username and a description of the issue when contacting us.
              </Text>
            </View>
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
  welcomeSection: {
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: PrimaryGrey,
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  topicsGrid: {
    gap: 12,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  topicIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topicContent: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  topicDescription: {
    fontSize: 14,
    color: PrimaryGrey,
  },
  faqContainer: {
    gap: 8,
  },
  faqItem: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  faqAnswerText: {
    fontSize: 14,
    color: PrimaryGrey,
    lineHeight: 20,
    paddingTop: 12,
  },
  contactSubtitle: {
    fontSize: 16,
    color: PrimaryGrey,
    marginBottom: 20,
    lineHeight: 24,
  },
  contactGrid: {
    gap: 12,
    marginBottom: 20,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  contactIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  contactDescription: {
    fontSize: 14,
    color: PrimaryGrey,
  },
  tipContainer: {
    flexDirection: 'row',
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
  },
  tipIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
}) 