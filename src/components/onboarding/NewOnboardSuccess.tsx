import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Share2, ChevronRight, Check } from 'lucide-react-native';
import { useAuthStore } from '../../store/store';
import { useMutation } from '@tanstack/react-query';
import axiosClient from '../../lib/react-query/axiosClient';
import SharePost from '../../components/SharePost';
import { useRef } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { WEB_BASE_URL } from '../../Constants/url';
import { createDonationBox } from '../../services/api/donation';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';

const { width } = Dimensions.get('window');

export default function NewOnboardSuccess() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const params = route.params as any;

  const addedNonprofits = params?.addedNonprofits || [];
  const amount = params?.amount || 0;
  const userName = user?.full_name || params?.userName || "User";
  const initials = userName.split(' ').map((n: any) => n[0]).join('').toUpperCase().slice(0, 1);
  const shareSheetRef = useRef<any>(null);

  const createDonationMutation = useMutation({
    mutationFn: createDonationBox,
    onSuccess: (response: any) => {
      // In Vite this is handled in handleFinalAction
    },
    onError: (error: any) => {
      console.error('Donation box creation error:', error.response);
      showToast('Failed to create donation box.');
    }
  });

  const handleFinish = async (target: 'Donation' | 'Home') => {
    const hasValidData = addedNonprofits.length > 0 && amount >= 5;

    if (hasValidData) {
      try {
        const response = await createDonationMutation.mutateAsync({
          causes: addedNonprofits.map((n: any) => ({ cause_id: n.id })),
          monthly_amount: amount.toString(),
        });

        if (target === 'Donation') {
          navigation.reset({
            index: 0,
            routes: [{
              name: 'DrawerNav' as never,
              params: {
                screen: 'MainTabs',
                params: {
                  screen: 'Donate',
                  params: { boxId: response.id }
                }
              }
            }],
          });
          return;
        }
      } catch (e) {
        // Error already handled by mutation's onError
        return;
      }
    }

    // Default navigation for 'Home' or if creation was skipped because of invalid data
    navigation.reset({
      index: 0,
      routes: [{ name: 'DrawerNav' as never }],
    });
  };

  const handleShare = () => {
    shareSheetRef.current?.present();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Progress Indicator - Step 5 of 5 */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressStep, styles.progressActive]} />
            <View style={[styles.progressStep, styles.progressActive]} />
            <View style={[styles.progressStep, styles.progressActive]} />
            <View style={[styles.progressStep, styles.progressActive]} />
            <View style={[styles.progressStep, styles.progressActive]} />
          </View>

          {/* Profile Summary Card */}
          <View style={styles.summaryCard}>
            <Avatar size={80} >
              <AvatarImage src={user?.profile_picture || undefined} />
              <AvatarFallback style={{ backgroundColor: user?.color || '#DBEAFE' }} textStyle={styles.avatarText}>{initials}</AvatarFallback>
            </Avatar>
            <Text style={styles.userName}>{userName}</Text>

            <View style={styles.divider} />

            <View style={styles.donationBoxSection}>
              <Text style={styles.boxLabel}>YOUR DONATION BOX</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ngoList}>
                {addedNonprofits.map((ngo: any, index: number) => (
                  <View key={index} style={styles.ngoItem}>
                    <Avatar size={60} style={{ borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' }}>
                      <AvatarImage src={ngo.image} />
                      <AvatarFallback textStyle={styles.ngoInitial}>
                        {ngo.name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <Text style={styles.ngoName} numberOfLines={2}>{ngo.name}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Success Message */}
          <View style={styles.messageSection}>
            <Text style={styles.title}>Giving is better with people you know.</Text>
            <Text style={styles.subtitle}>Share your page. Invite someone to build theirs.</Text>
          </View>

          {/* Share Button Link */}
          <TouchableOpacity style={styles.shareLink} onPress={handleShare} activeOpacity={0.7}>
            <View style={styles.shareIconBox}>
              <Share2 size={22} color="#FFFFFF" />
            </View>
            <View style={styles.shareTextContent}>
              <Text style={styles.shareTitle}>Share your invite link</Text>
              <Text style={styles.shareSub}>Text, email, DM — whatever works</Text>
            </View>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <Text style={styles.footerNote}>You can always invite people later from your profile.</Text>
        </View>
      </ScrollView>

      {/* Sticky Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.finishButton, createDonationMutation.isPending && styles.buttonDisabled]}
          onPress={() => handleFinish('Donation')}
          disabled={createDonationMutation.isPending}
        >
          {createDonationMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.finishButtonText}>Go to my Donation Box</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipLink}
          onPress={() => handleFinish('Home')}
          disabled={createDonationMutation.isPending}
        >
          <Text style={styles.skipLinkText}>Skip for now</Text>
        </TouchableOpacity>
      </View>

      <SharePost
        ref={shareSheetRef}
        url={`${WEB_BASE_URL}/u/${user?.username || ''}`}
        title={'Join my Donation Box'}
        message={`I just built my Donation Box on CRWD supporting ${addedNonprofits.length} nonprofits. Join me!`}
        onClose={() => { }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  progressStep: {
    height: 4,
    width: (width - 48 - 32) / 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressActive: {
    backgroundColor: '#1600ff',
  },
  summaryCard: {
    backgroundColor: '#F9F9F5',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F3F4F1',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginVertical: 10,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 20,
  },
  donationBoxSection: {
    width: '100%',
  },
  boxLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9CA3AF',
    // letterSpacing: 1,
    marginBottom: 16,
  },
  ngoList: {
    gap: 16,
    paddingBottom: 4,
  },
  ngoItem: {
    alignItems: 'center',
    width: 60,
  },
  ngoAvatar: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  ngoImage: {
    width: '100%',
    height: '100%',
  },
  ngoInitial: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1600ff',
  },
  ngoName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 14,
  },
  messageSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  shareLink: {
    backgroundColor: '#F9F9F5',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  shareIconBox: {
    width: 36,
    height: 36,
    backgroundColor: '#1600ff',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  shareTextContent: {
    flex: 1,
  },
  shareTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  shareSub: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  footerNote: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 40,
  },
  footer: {
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    // borderTopWidth: 1,
    // borderTopColor: '#F3F4F6',
  },
  finishButton: {
    backgroundColor: '#1600ff',
    height: 45,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  skipLink: {
    alignItems: 'center',
  },
  skipLinkText: {
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '700',
  },
});
