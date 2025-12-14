import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Share2, Loader2 } from 'lucide-react-native';
import {
  getCollectiveById,
  getCollectiveCauses,
  getCollectiveStats,
  joinCollective,
  leaveCollective,
} from '../services/api/crwd';
import { getPosts } from '../services/api/social';
import { getDonationBox, addCausesToBox } from '../services/api/donation';
import { useAuthStore } from '../store/store';
import { useToast } from '../contexts/ToastContext';
import CollectiveHeader from '../components/newgroupcrwd/CollectiveHeader';
import CollectiveProfile from '../components/newgroupcrwd/CollectiveProfile';
import CollectiveStats from '../components/newgroupcrwd/CollectiveStats';
import DonationInfoBox from '../components/newgroupcrwd/DonationInfoBox';
import SupportedNonprofits from '../components/newgroupcrwd/SupportedNonprofits';
import CommunityActivity from '../components/newgroupcrwd/CommunityActivity';
import Footer from '../components/Footer';
import { Share } from 'react-native';

export default function NewGroupCrwdPage() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user: currentUser, token } = useAuthStore();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showStatisticsModal, setShowStatisticsModal] = useState(false);
  const [statisticsTab, setStatisticsTab] = useState<'Nonprofits' | 'Members' | 'Donations'>(
    'Nonprofits'
  );
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Get collective ID from route params
  const crwdId = (route.params as any)?.id || (route.params as any)?.collectiveId || '';

  // Fetch collective data
  const {
    data: crwdData,
    isLoading: isLoadingCrwd,
    error: crwdError,
  } = useQuery({
    queryKey: ['crwd', crwdId],
    queryFn: () => getCollectiveById(crwdId),
    enabled: !!crwdId,
    refetchOnMount: true,
    staleTime: 0,
  });

  // Fetch collective causes (nonprofits)
  const { data: causesData, isLoading: isLoadingCauses } = useQuery({
    queryKey: ['collective-causes', crwdId],
    queryFn: () => getCollectiveCauses(crwdId),
    enabled: !!crwdId,
  });

  // Fetch donation box to check for existing causes and capacity
  const { data: donationBoxData, refetch: refetchDonationBox } = useQuery({
    queryKey: ['donationBox'],
    queryFn: getDonationBox,
    enabled: !!currentUser?.id && !!token?.access_token,
  });

  // Fetch collective stats
  const { data: statsData } = useQuery({
    queryKey: ['collective-stats', crwdId],
    queryFn: () => getCollectiveStats(crwdId),
    enabled: !!crwdId && !!token?.access_token,
  });

  // Fetch posts
  const { data: postsData, isLoading: isLoadingPosts } = useInfiniteQuery({
    queryKey: ['posts', crwdId],
    queryFn: ({ pageParam = 1 }) => getPosts('', crwdId, pageParam),
    getNextPageParam: (lastPage) => {
      if (lastPage.next) {
        const url = new URL(lastPage.next);
        const page = url.searchParams.get('page');
        return page ? parseInt(page) : undefined;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !!crwdId,
  });

  // Flatten posts
  const posts = postsData
    ? {
        results: postsData.pages.flatMap((page) => page.results || []),
        next: postsData.pages[postsData.pages.length - 1]?.next || null,
        count: postsData.pages[0]?.count || 0,
      }
    : undefined;

  // Transform causes data for SupportedNonprofits component
  const nonprofits = causesData?.results || causesData || [];

  // Extract stats
  const nonprofitCount = nonprofits.length || 0;
  const memberCount = crwdData?.member_count || statsData?.member_count || 0;
  const donationCount = statsData?.contributions_count || statsData?.donation_count || 0;

  // Join collective mutation
  const joinCollectiveMutation = useMutation({
    mutationFn: joinCollective,
    onSuccess: async (response) => {
      console.log('Join collective successful:', response);
      queryClient.invalidateQueries({ queryKey: ['crwd', crwdId] });
      queryClient.invalidateQueries({ queryKey: ['joined-collectives'] });
      queryClient.invalidateQueries({ queryKey: ['joined-collectives', currentUser?.id] });
      await refetchDonationBox();
      showToast('Successfully joined the collective!', 3000);
    },
    onError: (error: any) => {
      console.error('Join collective error:', error);
      showToast('Failed to join collective. Please try again.', 3000);
    },
  });

  // Leave collective mutation
  const leaveCollectiveMutation = useMutation({
    mutationFn: leaveCollective,
    onSuccess: async (response) => {
      console.log('Leave collective successful:', response);
      setShowConfirmDialog(false);
      queryClient.invalidateQueries({ queryKey: ['crwd', crwdId] });
      queryClient.invalidateQueries({ queryKey: ['joined-collectives'] });
      queryClient.invalidateQueries({ queryKey: ['joined-collectives', currentUser?.id] });
      await queryClient.invalidateQueries({ queryKey: ['donationBox', currentUser?.id] });
      await queryClient.refetchQueries({ queryKey: ['donationBox', currentUser?.id] });
      showToast('Left the collective', 3000);
    },
    onError: (error: any) => {
      console.error('Leave collective error:', error);
      showToast('Failed to leave collective. Please try again.', 3000);
    },
  });

  // Loading state
  if (isLoadingCrwd) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9CA3AF" />
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (crwdError || !crwdData) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Collective not found</Text>
          <Text style={styles.errorText}>
            The collective you're looking for doesn't exist or has been removed.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.errorButton}
            activeOpacity={0.7}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleJoinCollective = () => {
    if (!currentUser || !token?.access_token) {
      navigation.navigate('SplashScreen' as never);
      return;
    }

    // Don't show join/unjoin if user is the creator/admin
    if (currentUser.id === crwdData.created_by?.id) {
      return;
    }

    if (crwdData.is_joined) {
      // If already joined, show unjoin confirmation
      setShowConfirmDialog(true);
    } else {
      // Join immediately
      joinCollectiveMutation.mutate(crwdId);
    }
  };

  // Check if current user is the admin/creator
  const isAdmin = currentUser?.id === crwdData?.created_by?.id;

  const handleOneTimeDonation = () => {
    if (!currentUser || !token?.access_token) {
      navigation.navigate('SplashScreen' as never);
      return;
    }

    // Get causes from the collective
    const collectiveCauses = nonprofits.map((np: any) => {
      const cause = np.cause || np;
      return {
        id: cause.id || np.id,
        name: cause.name || np.name || 'Unknown Nonprofit',
        description: cause.mission || cause.description || np.mission || np.description || '',
        mission: cause.mission || np.mission || '',
        logo: cause.image || cause.logo || np.image || np.logo || '',
      };
    });

    const causeIds = collectiveCauses.map((cause: any) => cause.id);

    // Navigate to one-time donation tab with preselected causes
    navigation.navigate('DonationScreen' as never, {
      activeTab: 'onetime',
      preselectedCauses: causeIds,
      preselectedCausesData: collectiveCauses,
      preselectedCollectiveId: parseInt(crwdId || '0'),
    } as never);
  };

  const handleShare = async () => {
    try {
      const url = `https://crwd.app/groupcrwd/${crwdId}`;
      await Share.share({
        message: `Check out ${crwdData.name || 'this collective'}: ${url}`,
        title: crwdData.name || 'Collective',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleManageCollective = () => {
    if (crwdId) {
      navigation.navigate('ManageCRWD' as never, { collectiveId: crwdId } as never);
    }
  };

  const handleConfirmUnjoin = () => {
    if (!leaveCollectiveMutation.isPending && crwdId) {
      leaveCollectiveMutation.mutate(crwdId);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <CollectiveHeader
        title={crwdData.name || 'Collective'}
        collectiveId={crwdId}
        isFavorite={crwdData.is_favorite}
        isAdmin={isAdmin}
        onShare={handleShare}
        onManageCollective={handleManageCollective}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <CollectiveProfile
            name={crwdData.name || 'Collective'}
            image={crwdData.avatar || crwdData.image}
            logo={crwdData.logo}
            color={crwdData.color}
            founder={crwdData.created_by}
            description={crwdData.description}
            isJoined={crwdData.is_joined}
          />

          <CollectiveStats
            nonprofitCount={nonprofitCount}
            memberCount={memberCount}
            donationCount={donationCount}
            onStatClick={(tab) => {
              if (!currentUser || !token?.access_token) {
                navigation.navigate('SplashScreen' as never);
                return;
              }
              setStatisticsTab(tab);
              setShowStatisticsModal(true);
              // TODO: Show statistics modal
            }}
          />

          <DonationInfoBox nonprofitCount={nonprofitCount} />

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {isAdmin ? (
              <>
                {/* Joined Button - Non-clickable for admin */}
                <TouchableOpacity
                  style={[styles.button, styles.joinedButton]}
                  disabled
                  activeOpacity={1}
                >
                  <Check size={16} color="#10B981" />
                  <Text style={styles.joinedButtonText}>Joined</Text>
                </TouchableOpacity>
                {/* Share Button */}
                <TouchableOpacity
                  onPress={handleShare}
                  style={[styles.button, styles.shareButton]}
                  activeOpacity={0.7}
                >
                  <Share2 size={16} color="#FFFFFF" />
                  <Text style={styles.shareButtonText}>Share</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  onPress={handleJoinCollective}
                  disabled={joinCollectiveMutation.isPending || leaveCollectiveMutation.isPending}
                  style={[
                    styles.button,
                    crwdData.is_joined ? styles.joinedButton : styles.joinButton,
                    (joinCollectiveMutation.isPending || leaveCollectiveMutation.isPending) &&
                      styles.disabled,
                  ]}
                  activeOpacity={0.7}
                >
                  {joinCollectiveMutation.isPending ? (
                    <>
                      <Loader2 size={16} color="#FFFFFF" />
                      <Text style={styles.joinButtonText}>Joining...</Text>
                    </>
                  ) : leaveCollectiveMutation.isPending ? (
                    <>
                      <Loader2 size={16} color="#FFFFFF" />
                      <Text style={styles.joinButtonText}>Leaving...</Text>
                    </>
                  ) : crwdData.is_joined ? (
                    <>
                      <Check size={16} color="#6B7280" />
                      <Text style={styles.joinedButtonText}>Joined</Text>
                    </>
                  ) : (
                    <Text style={styles.joinButtonText}>Join Collective</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleOneTimeDonation}
                  style={[styles.button, styles.donationButton]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.donationButtonText}>Make a One-Time Donation</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <SupportedNonprofits nonprofits={nonprofits} isLoading={isLoadingCauses} />

          <CommunityActivity
            posts={posts?.results || []}
            isLoading={isLoadingPosts}
            collectiveId={crwdId}
            isJoined={crwdData.is_joined}
            collectiveData={crwdData}
          />

          {/* Legal Disclaimer */}
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              All donations are made to CRWD Foundation Inc. (EIN: XX-XXXXXXX), a 501(c)(3)
              nonprofit organization. CRWD Foundation grants funds to qualified 501(c)(3)
              organizations selected by donors.
            </Text>
          </View>
        </View>

        <Footer />
      </ScrollView>

      {/* Unjoin Confirmation Dialog */}
      <Modal
        visible={showConfirmDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Leave Collective</Text>
            <Text style={styles.dialogDescription}>
              Are you sure you want to leave this collective? You can always join back later.
            </Text>
            <View style={styles.dialogButtons}>
              <TouchableOpacity
                onPress={() => setShowConfirmDialog(false)}
                style={[styles.dialogButton, styles.cancelButton]}
                activeOpacity={0.7}
                disabled={leaveCollectiveMutation.isPending}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmUnjoin}
                style={[styles.dialogButton, styles.leaveButton]}
                activeOpacity={0.7}
                disabled={leaveCollectiveMutation.isPending}
              >
                {leaveCollectiveMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.leaveButtonText}>Leave Collective</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  errorButtonText: {
    fontSize: 14,
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  content: {
    maxWidth: '100%',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    borderRadius: 12,
    fontWeight: '700',
  },
  joinButton: {
    backgroundColor: '#1600ff',
  },
  joinedButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  shareButton: {
    backgroundColor: '#1600ff',
  },
  donationButton: {
    borderWidth: 1,
    borderColor: '#1600ff',
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  joinedButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  donationButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1600ff',
  },
  disclaimer: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 24,
  },
  disclaimerText: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  dialogDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 20,
    lineHeight: 20,
  },
  dialogButtons: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  dialogButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  leaveButton: {
    backgroundColor: '#EF4444',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  leaveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

