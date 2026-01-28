import React, { useRef, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'
import BottomSheet from '@gorhom/bottom-sheet'
import MainHeaderNav from '../components/MainHeaderNav'
import Account from '../components/account/Account'
import ChangePasswordSheet from '../components/newsettings/ChangePasswordSheet'
import ChangeEmailSheet from '../components/newsettings/ChangeEmailSheet'
import RequestNonprofitModal from '../components/newsearch/RequestNonprofitModal'
import PaymentMethodsBottomSheet from '../components/donation/PaymentMethodsBottomSheet'
import { CircleHelp, CreditCard, FileText, Info, Lock, Mail, MessageSquare, Shield, Trash2, Eye, Bookmark, Heart, ChevronDown, UserPlus, DoorOpenIcon } from 'lucide-react-native'
import { LightGrey, PrimaryBlue, PrimaryGrey, SecondaryGrey } from '../Constants/Colors'
import { useNavigation } from '@react-navigation/native'
import { useAuthStore } from '../store/store'
import { useMutation } from '@tanstack/react-query'
import { deactivateAccount } from '../services/api/auth'
import { useToast } from '../contexts/ToastContext'

export default function NewSettings() {
  const navigation = useNavigation()
  const { user: currentUser, setUser, setToken, logout } = useAuthStore()
  const { showToast } = useToast()

  // Bottom sheet refs
  const passwordBottomSheetRef = useRef<BottomSheet>(null)
  const emailBottomSheetRef = useRef<BottomSheet>(null)

  // State
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showPaymentMethodsSheet, setShowPaymentMethodsSheet] = useState(false)

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index)
  }

  const faqData = [
    {
      question: "How does the donation box capacity work?",
      answer: "The donation box capacity determines how many causes can be supported with your current donation amount. As you increase your donation, more causes can be supported simultaneously."
    },
    {
      question: "What are crwd's fees?",
      answer: "CRWD charges a small processing fee on donations to cover payment processing and platform maintenance. The exact fee percentage is displayed before you confirm your donation."
    },
    {
      question: "How are donations split?",
      answer: "Donations are split equally among all the causes you've selected in your donation box. You can adjust the distribution or remove causes at any time."
    },
    {
      question: "What is a Collective?",
      answer: "A Collective is a group of users who come together to support specific causes or nonprofits. You can join existing Collectives or create your own to amplify your impact."
    },
    {
      question: "Are donations tax-deductible?",
      answer: "Yes, donations made through CRWD to verified 501(c)(3) nonprofit organizations are tax-deductible. You'll receive a receipt for your records."
    },
    {
      question: "Can I cancel a recurring donation?",
      answer: "Yes, you can cancel or modify your recurring donations at any time from the Payment & Receipts section in your settings."
    }
  ]

  // Deactivate account mutation
  const deactivateAccountMutation = useMutation({
    mutationFn: deactivateAccount,
    onSuccess: () => {
      setUser({})
      setToken({ access_token: '', refresh_token: '' })
      showToast('Account deactivated successfully', 3000)
      navigation.reset({
        index: 0,
        routes: [{ name: 'SplashScreen' as never }],
      })
    },
    onError: (error: any) => {
      console.error('Error deactivating account:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to deactivate account'
      showToast(errorMessage, 3000)
    },
  })

  // ... (handleDeleteAccount, openPasswordSheet, openEmailSheet stay the same) ...
  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            logout()
            showToast('Logged out successfully', 3000)
            navigation.reset({
              index: 0,
              routes: [{ name: 'SplashScreen' as never }],
            })
          },
        },
      ],
      { cancelable: true }
    )
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'This is your last chance. Your account will be permanently deleted. Are you absolutely sure?',
              [
                { text: 'No, Keep My Account', style: 'cancel' },
                {
                  text: 'Yes, Delete Forever',
                  style: 'destructive',
                  onPress: () => deactivateAccountMutation.mutate(),
                },
              ],
              { cancelable: true }
            )
          },
        },
      ],
      { cancelable: true }
    )
  }

  const openPasswordSheet = () => {
    passwordBottomSheetRef.current?.expand()
  }

  const openEmailSheet = () => {
    emailBottomSheetRef.current?.expand()
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <MainHeaderNav show={true} menu={false} title={'Settings'} />

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Account Component */}
          <Account />

          {/* Security Section */}
          {currentUser?.id && currentUser?.auth_method === 'email' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Lock size={20} color={PrimaryBlue} />
                <Text style={styles.sectionTitle}>Security</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.passwordContainer}>
                <Text style={styles.passwordLabel}>Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value="••••••••••"
                    editable={false}
                    secureTextEntry
                  />
                  <Eye size={20} color={PrimaryGrey} />
                </View>
                <TouchableOpacity style={styles.changePasswordButton} onPress={openPasswordSheet}>
                  <Text style={styles.changePasswordButtonText}>Change Password</Text>
                </TouchableOpacity>
              </View>
              {/* <View style={styles.divider} /> */}
              <Text style={[styles.passwordLabel, { marginTop: 10 }]}>Email</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={currentUser?.email}
                  editable={false}
                />
                <Mail size={20} color={PrimaryGrey} />
              </View>
              <TouchableOpacity
                onPress={openEmailSheet}
                style={styles.changePasswordButton}
              >
                <Text style={styles.changePasswordButtonText}>Change Email</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Payment & Receipts Section */}
          {currentUser?.id && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <CreditCard size={20} color={PrimaryBlue} />
                <Text style={styles.sectionTitle}>Payment & Receipts</Text>
              </View>
              <View style={styles.divider} />
              <TouchableOpacity
                onPress={() => setShowPaymentMethodsSheet(true)}
                style={styles.menuButton}
              >
                <CreditCard size={20} color={PrimaryGrey} />
                <Text style={styles.menuButtonText}>Manage Payment Methods</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  // @ts-ignore
                  navigation.navigate('DrawerNav', { screen: 'TransactionHistory' })
                }}
                style={styles.menuButton}
              >
                <FileText size={20} color={PrimaryGrey} />
                <Text style={styles.menuButtonText}>View Financial Records</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Saved Content Section */}
          {currentUser?.id && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.helpIconContainer}>
                  <Heart size={20} color={PrimaryBlue} />
                </View>
                <Text style={styles.sectionTitle}>Saved Content</Text>
              </View>
              <View style={styles.divider} />
              <TouchableOpacity
                onPress={() => {
                  // @ts-ignore
                  navigation.navigate('DrawerNav', { screen: 'Saved' })
                }}
                style={styles.menuButton}
              >
                <Heart size={20} color={PrimaryGrey} />
                <Text style={styles.menuButtonText}>Favorites</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Help & Support Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.helpIconContainer}>
                <CircleHelp size={20} color={PrimaryBlue} />
              </View>
              <Text style={styles.sectionTitle}>Help & Support</Text>
            </View>

            {/* FAQ Section */}
            <View style={styles.faqSection}>
              {faqData.map((faq, index) => (
                <View key={index}>
                  {index > 0 && <View style={styles.faqDivider} />}
                  <TouchableOpacity
                    style={styles.faqItem}
                    onPress={() => toggleFAQ(index)}
                  >
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <ChevronDown
                      size={20}
                      color={PrimaryGrey}
                      style={[styles.faqChevron, expandedFAQ === index && styles.faqChevronRotated]}
                    />
                  </TouchableOpacity>
                  {expandedFAQ === index && (
                    <View style={styles.faqAnswer}>
                      <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* Support Links Section */}
            <View style={styles.supportLinksSection}>
              <TouchableOpacity
                onPress={() => navigation.navigate('ReportIssue' as never)}
                style={styles.supportLink}
              >
                <Text style={styles.supportLinkText}>Contact Support</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowRequestModal(true)}
                style={styles.supportLink}
              >
                <Text style={styles.supportLinkText}>Suggest a Nonprofit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('TermsOfUse' as never)}
                style={styles.supportLink}
              >
                <Text style={styles.supportLinkText}>Terms of Service</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('PrivacyPolicy' as never)}
                style={styles.supportLink}
              >
                <Text style={styles.supportLinkText}>Privacy Policy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('About' as never)}
                style={styles.supportLink}
              >
                <Text style={styles.supportLinkText}>About CRWD</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Delete Account Section */}
          {currentUser?.id && (
            <>
              <View style={styles.section}>
                <TouchableOpacity
                  onPress={handleDeleteAccount}
                  disabled={deactivateAccountMutation.isPending}
                  style={[
                    styles.menuItem,
                    styles.deleteButton,
                    deactivateAccountMutation.isPending && styles.disabledButton
                  ]}
                >
                  <Trash2 size={20} color="#ef4444" />
                  <Text style={styles.deleteButtonText}>
                    {deactivateAccountMutation.isPending ? 'Deactivating...' : 'Delete Account'}
                  </Text>
                </TouchableOpacity>

              </View>

              <View style={styles.section}>

                <TouchableOpacity
                  onPress={handleLogout}
                  style={[
                    styles.menuItem,
                    styles.deleteButton,
                  ]}
                >
                  <DoorOpenIcon size={20} color="#ef4444" />
                  <Text style={styles.deleteButtonText}>
                    Log Out
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Change Password Bottom Sheet */}
        <ChangePasswordSheet bottomSheetRef={passwordBottomSheetRef} />

        {/* Change Email Bottom Sheet */}
        <ChangeEmailSheet bottomSheetRef={emailBottomSheetRef} />

        {/* Suggest Nonprofit Modal */}
        <RequestNonprofitModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
        />

        {/* Payment Methods Bottom Sheet */}
        <PaymentMethodsBottomSheet
          isOpen={showPaymentMethodsSheet}
          onClose={() => setShowPaymentMethodsSheet(false)}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 12,
  },
  section: {
    marginTop: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    fontWeight: '700',
    color: '#111827',
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: LightGrey,
    marginHorizontal: -20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 10,
  },
  menuItemText: {
    fontSize: 15,
    color: '#111827',
    fontFamily: 'Outfit-SemiBold',
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: SecondaryGrey,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  menuButtonText: {
    fontSize: 15,
    color: '#111827',
    fontFamily: 'Outfit-SemiBold',
  },
  passwordContainer: {
    marginVertical: 10,
  },
  passwordLabel: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: LightGrey,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Outfit-Regular',
    color: '#111827',
  },
  changePasswordButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: SecondaryGrey,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  changePasswordButtonText: {
    fontSize: 15,
    fontFamily: 'Outfit-Bold',
    fontWeight: '700',
    color: '#111827',
  },
  deleteButton: {
    marginVertical: 10,
  },
  deleteButtonText: {
    fontSize: 15,
    color: '#ef4444',
    fontFamily: 'Outfit-SemiBold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  bottomSpacing: {
    height: 32,
  },
  helpIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqSection: {
    marginTop: 16,
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 0,
  },
  faqQuestion: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  faqChevron: {
    transform: [{ rotate: '0deg' }],
  },
  faqChevronRotated: {
    transform: [{ rotate: '180deg' }],
  },
  faqDivider: {
    borderTopWidth: 1,
    borderTopColor: LightGrey,
    marginVertical: 0,
  },
  faqAnswer: {
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 0,
  },
  faqAnswerText: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    color: PrimaryGrey,
    lineHeight: 20,
  },
  supportLinksSection: {
    marginTop: 32,
    gap: 0,
  },
  supportLink: {
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  supportLinkText: {
    fontSize: 15,
    color: '#111827',
    fontFamily: 'Outfit-SemiBold',
  },
})
