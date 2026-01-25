import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, CommonActions } from '@react-navigation/native';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Share2, Loader2, X } from 'lucide-react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import {
  getCollectiveById,
  getCollectiveCauses,
  getCollectiveStats,
  getCollectiveMembers,
  getCollectiveDonationHistory,
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
import SupportedNonprofits from '../components/newgroupcrwd/SupportedNonprofits';
import CommunityActivity from '../components/newgroupcrwd/CommunityActivity';
import DiscoverMoreCollectives from '../components/newgroupcrwd/DiscoverMoreCollectives';
import { Share } from 'react-native';
import CommentsBottomSheet from '../components/post/CommentsBottomSheet';
import JoinCollectiveBottomSheet from '../components/newgroupcrwd/JoinCollectiveBottomSheet';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';

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
  const [showCommentsSheet, setShowCommentsSheet] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const handleBack = () => {
    const params = route.params as any;
    const fromScreen = params?.from || params?.fromScreen;
    const specialFlows = ['NewNonprofitInterests', 'NewCompleteDonation', 'Login'];

    if (fromScreen && specialFlows.includes(fromScreen)) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'DrawerNav', state: { routes: [{ name: 'MainTabs', state: { routes: [{ name: 'Home' }] } }] } }],
        })
      );
    } else {
      navigation.goBack();
    }
  };

  // Bottom sheet ref for statistics
  const statisticsBottomSheetRef = useRef<BottomSheet>(null);
  const statisticsSnapPoints = useMemo(() => ['75%'], []);

  // Bottom sheet backdrop for statistics
  const renderStatisticsBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  // Update bottom sheet when modal state changes
  useEffect(() => {
    if (showStatisticsModal) {
      statisticsBottomSheetRef.current?.snapToIndex(0);
    } else {
      statisticsBottomSheetRef.current?.close();
    }
  }, [showStatisticsModal]);

  // Get collective ID from route params
  const crwdId = String((route.params as any)?.id || (route.params as any)?.collectiveId || (route.params as any)?.crwdId || '');

  // Debug: Log params to troubleshoot
  useEffect(() => {
    console.log('NewGroupCrwd - Route params:', JSON.stringify(route.params, null, 2));
    console.log('NewGroupCrwd - Extracted crwdId:', crwdId);
    console.log('NewGroupCrwd - crwdId type:', typeof crwdId);
    console.log('NewGroupCrwd - crwdId isEmpty:', !crwdId || crwdId === '');
  }, [route.params, crwdId]);

  // Fetch collective data
  const {
    data: crwdData,
    isLoading: isLoadingCrwd,
    error: crwdError,
  } = useQuery({
    queryKey: ['crwd', crwdId],
    queryFn: () => {
      console.log('Fetching collective with ID:', crwdId);
      return getCollectiveById(crwdId);
    },
    enabled: !!crwdId && crwdId !== '',
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

  // Fetch members for statistics modal
  const { data: membersData, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['members', crwdId],
    queryFn: () => getCollectiveMembers(crwdId),
    enabled: !!crwdId && showStatisticsModal && statisticsTab === 'Members',
  });

  // Fetch donation history for statistics modal
  const { data: donationHistoryData, isLoading: isLoadingDonations } = useQuery({
    queryKey: ['donationHistory', crwdId],
    queryFn: () => getCollectiveDonationHistory(crwdId),
    enabled: !!crwdId && showStatisticsModal && statisticsTab === 'Donations',
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

  // Transform inactive causes data for PreviouslySupported component
  const inactiveCauses = crwdData?.inactive_causes || [];

  // Extract stats
  const nonprofitCount = nonprofits.length || 0;
  const memberCount = crwdData?.member_count || statsData?.member_count || 0;
  const donationCount = statsData?.contributions_count || statsData?.donation_count || 0;

  // Join collective mutation
  const joinCollectiveMutation = useMutation({
    mutationFn: joinCollective,
    onSuccess: async (response) => {
      console.log('Join collective successful:', response);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['crwd', crwdId] });
      queryClient.invalidateQueries({ queryKey: ['joined-collectives'] });
      queryClient.invalidateQueries({ queryKey: ['joined-collectives', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['joined-collectives-manage'] });
      queryClient.invalidateQueries({ queryKey: ['joinedCollectives'] });

      // Refetch donation box to get latest data including capacity
      await refetchDonationBox();

      // Show success toast
      showToast("You've joined the collective!", 3000);

      // Always show the drawer sheet after joining
      setShowJoinModal(true);
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

  // Check if crwdId is empty before loading
  if (!crwdId || crwdId === '') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Collective ID missing</Text>
          <Text style={styles.errorText}>
            No collective ID provided. Please try navigating to the collective again.
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
    console.log('NewGroupCrwd - Error fetching collective:', crwdError);
    console.log('NewGroupCrwd - crwdId used:', crwdId);
    console.log('NewGroupCrwd - route params:', route.params);
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
      // Navigate to onboarding with redirectTo (React Navigation pattern)
      // Ensure crwdId is a string and pass both id and collectiveId for compatibility
      if (!crwdId || crwdId === '') {
        console.error('Cannot navigate to onboarding: crwdId is empty');
        showToast('Error: Collective ID is missing', 3000);
        return;
      }
      console.log('Navigating to OnBoard with redirectTo: GroupCRWD, id:', crwdId);
      (navigation as any).navigate('OnBoard', {
        redirectTo: 'GroupCRWD',
        redirectParams: { id: String(crwdId), collectiveId: String(crwdId) }
      });
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

  const handleJoinConfirm = async (selectedNonprofits: any[], collectiveId: string, shouldSetupDonationBox: boolean) => {
    if (!crwdId) return;

    // If no donation box and user wants to set it up
    if (shouldSetupDonationBox && (!donationBoxData || !donationBoxData.id)) {
      const preselectedCauses = selectedNonprofits.map((np) => {
        const cause = np.cause || np;
        return {
          id: cause.id || np.id,
          name: cause.name || np.name || 'Unknown Nonprofit',
          description: cause.mission || cause.description || np.mission || np.description || '',
          mission: cause.mission || np.mission || '',
          logo: cause.image || cause.logo || np.image || np.logo || '',
          image: cause.image || cause.logo || np.image || np.logo || '',
        };
      });

      const preselectedCauseIds = preselectedCauses.map((cause) => cause.id);

      // Close the drawer
      setShowJoinModal(false);

      // Navigate to donation setup with preselected causes
      (navigation as any).reset({
        index: 0,
        routes: [
          {
            name: 'DrawerNav' as never,
            state: {
              routes: [
                {
                  name: 'MainTabs' as never,
                  state: {
                    routes: [
                      { name: 'Home' as never },
                      { name: 'Search' as never },
                      {
                        name: 'Donate' as never,
                        params: {
                          initialTab: 'setup',
                          preselectedCauses: preselectedCauseIds,
                          preselectedCausesData: preselectedCauses,
                          preselectedCollectiveId: parseInt(collectiveId),
                          collectiveName: crwdData.name,
                        },
                      },
                      { name: 'Collectives' as never },
                      { name: 'Profile' as never },
                    ],
                    index: 2, // Donate tab index
                  },
                },
              ],
              index: 0,
            },
          },
        ],
      });
      return;
    }

    // If donation box exists and causes are selected, add them
    if (donationBoxData && donationBoxData.id && selectedNonprofits.length > 0) {
      const causes = selectedNonprofits.map((np) => {
        const cause = np.cause || np;
        const causeId = cause.id || np.id;
        const causeEntry: { cause_id: number; attributed_collective?: number } = {
          cause_id: causeId,
          attributed_collective: parseInt(collectiveId),
        };
        return causeEntry;
      });

      try {
        await addCausesToBox({ causes });
        queryClient.invalidateQueries({ queryKey: ['donationBox'] });
        await refetchDonationBox();
        showToast('Nonprofits added to your donation box!', 3000);
      } catch (error) {
        console.error('Error adding causes to donation box:', error);
        showToast('Failed to add nonprofits to donation box. Please try again.', 3000);
      }
    }

    // Close the drawer
    setShowJoinModal(false);
  };

  const handleCloseJoinModal = () => {
    setShowJoinModal(false);
  };

  // Check if current user is the admin/creator
  const isAdmin = currentUser?.id === crwdData?.created_by?.id;

  const handleOneTimeDonation = () => {
    if (!currentUser || !token?.access_token) {
      // Navigate to onboarding with redirectTo (React Navigation pattern)
      // Ensure crwdId is a string and pass both id and collectiveId for compatibility
      if (!crwdId || crwdId === '') {
        console.error('Cannot navigate to onboarding: crwdId is empty');
        showToast('Error: Collective ID is missing', 3000);
        return;
      }
      console.log('Navigating to OnBoard with redirectTo: GroupCRWD, id:', crwdId);
      (navigation as any).navigate('OnBoard', {
        redirectTo: 'GroupCRWD',
        redirectParams: { id: String(crwdId), collectiveId: String(crwdId) }
      });
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
        image: cause.image || cause.logo || np.image || np.logo || '',
      };
    });

    const causeIds = collectiveCauses.map((cause: any) => cause.id);

    // Navigate to one-time donation screen with preselected causes
    (navigation as any).navigate('OneTimeDonationScreen', {
      preselectedItem: {
        id: crwdId,
        type: 'collective',
        data: crwdData,
      },
      activeTab: 'onetime',
      preselectedCauses: causeIds,
      preselectedCausesData: collectiveCauses,
      preselectedCollectiveId: parseInt(crwdId || '0'),
    });
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
      (navigation as any).navigate('ManageCRWD', { collectiveId: crwdId });
    }
  };

  const handleCreateFundraiser = () => {
    if (crwdId) {
      (navigation as any).navigate('CreateFundraiser', { collectiveId: crwdId });
    }
  };

  const handleConfirmUnjoin = () => {
    if (!leaveCollectiveMutation.isPending && crwdId) {
      leaveCollectiveMutation.mutate(crwdId);
    }
  };

  // Render statistics content
  const renderStatisticsContent = () => {
    const nonprofits = causesData?.results || causesData || [];
    const members = membersData?.results || membersData || [];
    const donations = donationHistoryData?.results || donationHistoryData || [];

    // Avatar colors for consistent coloring
    const avatarColors = [
      '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', '#84CC16', '#EC4899',
      '#F59E0B', '#06B6D4', '#F97316', '#A855F7', '#14B8A6', '#F43F5E',
      '#6366F1', '#22C55E', '#EAB308',
    ];

    const getConsistentColor = (id: number | string, colors: string[]) => {
      const hash = typeof id === 'number' ? id : id.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      return colors[hash % colors.length];
    };

    if (statisticsTab === 'Nonprofits') {
      if (isLoadingCauses) {
        return (
          <View style={styles.statsLoadingContainer}>
            <ActivityIndicator size="large" color="#9CA3AF" />
            <Text style={styles.statsLoadingText}>Loading nonprofits...</Text>
          </View>
        );
      }
      // Get inactive causes for previously supported section
      const inactiveCauses = crwdData?.inactive_causes || [];

      return (
        <View>
          {/* Currently Active Section */}
          <Text style={styles.statsSectionTitle}>Currently Active</Text>
          {nonprofits.length > 0 ? (
            nonprofits.map((nonprofit: any) => {
              const cause = nonprofit.cause || nonprofit;
              const name = cause.name || nonprofit.name || 'Unknown Nonprofit';
              const image = cause.image || nonprofit.image || '';
              const causeId = cause.id || nonprofit.id;
              const avatarBgColor = getConsistentColor(causeId, avatarColors);

              return (
                <TouchableOpacity
                  key={nonprofit.id || cause.id}
                  style={styles.statsItem}
                  onPress={() => {
                    statisticsBottomSheetRef.current?.close();
                    (navigation as any).navigate('CauseScreen', { id: causeId });
                  }}
                >
                  <Avatar size={48} style={{ borderRadius: 8 }}>
                    <AvatarImage src={image} />
                    <AvatarFallback
                      style={{ backgroundColor: avatarBgColor }}
                      textStyle={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}
                    >
                      {name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <View style={styles.statsItemContent}>
                    <Text style={styles.statsItemName}>{name}</Text>
                    <Text style={styles.statsItemDescription} numberOfLines={2}>
                      {cause.mission || 'No description available'}
                    </Text>
                  </View>
                  {/* <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => {
                      statisticsBottomSheetRef.current?.close();
                      (navigation as any).navigate('CauseScreen', { id: causeId });
                    }}
                  >
                    <Text style={styles.viewButtonText}>View</Text>
                  </TouchableOpacity> */}
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.statsEmptyContainer}>
              <Text style={styles.statsEmptyText}>No nonprofits found</Text>
            </View>
          )}

          {/* Previously Supported Section */}
          {inactiveCauses.length > 0 && (
            <>
              <Text style={[styles.statsSectionTitle, { marginTop: 32 }]}>Previously Supported</Text>
              {inactiveCauses.map((nonprofit: any) => {
                const cause = nonprofit.cause || nonprofit;
                const name = cause.name || nonprofit.name || 'Unknown Nonprofit';
                const image = cause.image || nonprofit.image || '';
                const causeId = cause.id || nonprofit.id;
                const avatarBgColor = getConsistentColor(causeId, avatarColors);

                return (
                  <TouchableOpacity
                    key={nonprofit.id || cause.id}
                    style={styles.statsItem}
                    onPress={() => {
                      statisticsBottomSheetRef.current?.close();
                      (navigation as any).navigate('CauseScreen', { id: causeId });
                    }}
                  >
                    <Avatar size={48} style={{ borderRadius: 8 }}>
                      <AvatarImage src={image} />
                      <AvatarFallback
                        style={{ backgroundColor: avatarBgColor }}
                        textStyle={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}
                      >
                        {name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <View style={styles.statsItemContent}>
                      <Text style={styles.statsItemName}>{name}</Text>
                      <Text style={styles.statsItemDescription} numberOfLines={2}>
                        {cause.mission || 'No description available'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() => {
                        statisticsBottomSheetRef.current?.close();
                        (navigation as any).navigate('CauseScreen', { id: causeId });
                      }}
                    >
                      <Text style={styles.viewButtonText}>View</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </View>
      );
    }

    if (statisticsTab === 'Members') {
      if (isLoadingMembers) {
        return (
          <View style={styles.statsLoadingContainer}>
            <ActivityIndicator size="large" color="#9CA3AF" />
            <Text style={styles.statsLoadingText}>Loading members...</Text>
          </View>
        );
      }
      return (
        <View>
          {members.length > 0 ? (
            members.map((member: any) => {
              const user = member.user || member;
              const firstName = user.first_name || '';
              const lastName = user.last_name || '';
              const username = user.username || '';
              const name = `${firstName} ${lastName}`.trim() || username;
              const avatar = user.profile_picture || '';
              const role = member.role || '';
              const isFounder = role?.toLowerCase() === 'founder' || role?.toLowerCase() === 'admin' || member.is_founder;
              const userId = user.id || member.id || username;
              const avatarBgColor = user.color || getConsistentColor(userId, avatarColors);
              const initial = name.charAt(0).toUpperCase() || username.charAt(0).toUpperCase() || 'U';

              return (
                <TouchableOpacity
                  key={member.id || user.id}
                  style={styles.memberItem}
                  onPress={() => {
                    if (user.id) {
                      statisticsBottomSheetRef.current?.close();
                      (navigation as any).navigate('UserProfile', { userId: user.id.toString() });
                    }
                  }}
                >
                  <Avatar size={48}>
                    <AvatarImage src={avatar} />
                    <AvatarFallback
                      style={{ backgroundColor: avatarBgColor }}
                      textStyle={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}
                    >
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <View style={styles.memberDetails}>
                    <View style={styles.memberNameRow}>
                      <Text style={styles.memberName}>
                        @{username || name.toLowerCase().replace(/\s+/g, '_')}
                      </Text>
                      {isFounder && (
                        <View style={styles.founderBadge}>
                          <Text style={styles.founderBadgeText}>Organizer</Text>
                        </View>
                      )}
                    </View>
                    {user.bio || user.location && (
                      <Text style={styles.memberRole}>{user.bio || user.location}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.statsEmptyContainer}>
              <Text style={styles.statsEmptyText}>No members found</Text>
            </View>
          )}
        </View>
      );
    }

    if (statisticsTab === 'Donations') {
      if (isLoadingDonations) {
        return (
          <View style={styles.statsLoadingContainer}>
            <ActivityIndicator size="large" color="#9CA3AF" />
            <Text style={styles.statsLoadingText}>Loading donations...</Text>
          </View>
        );
      }
      return (
        <View>
          {/* Summary Box */}
          <View style={styles.donationSummaryBox}>
            <Text style={styles.donationSummaryTitle}>Collective Donations</Text>
            <Text style={styles.donationSummaryAmount}>
              ${donationHistoryData?.total_donated_to_collective?.toFixed(2) || '0.00'}
            </Text>
            <Text style={styles.donationSummaryText}>
              {donations.filter((d: any) => d.amount_attributed_to_collective > 0).length} donation{donations.filter((d: any) => d.amount_attributed_to_collective > 0).length !== 1 ? 's' : ''} credited to this collective
            </Text>
          </View>

          {/* Donations List */}
          {donations.length > 0 ? (
            donations.map((donation: any, index: number) => {
              const user = donation.user || {};
              const firstName = user.first_name || '';
              const lastName = user.last_name || '';
              const fullName = `${firstName} ${lastName}`.trim() || user.username || 'Unknown User';
              const initials = firstName && lastName
                ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
                : fullName.charAt(0).toUpperCase();
              const avatar = user.profile_picture || '';
              const isCollectiveDonation = donation.amount_attributed_to_collective > 0;
              const userId = user.id || index;
              const avatarBgColor = getConsistentColor(userId, avatarColors);

              // Format time ago
              const formatTimeAgo = (dateString: string) => {
                const date = new Date(dateString);
                const now = new Date();
                const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

                if (diffInSeconds < 60) return 'Just now';
                if (diffInSeconds < 3600) {
                  const minutes = Math.floor(diffInSeconds / 60);
                  return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
                }
                if (diffInSeconds < 86400) {
                  const hours = Math.floor(diffInSeconds / 3600);
                  return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
                }
                if (diffInSeconds < 604800) {
                  const days = Math.floor(diffInSeconds / 86400);
                  return `${days} day${days !== 1 ? 's' : ''} ago`;
                }
                if (diffInSeconds < 2592000) {
                  const weeks = Math.floor(diffInSeconds / 604800);
                  return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
                }
                const months = Math.floor(diffInSeconds / 2592000);
                return `${months} month${months !== 1 ? 's' : ''} ago`;
              };

              return (
                <View key={donation.id || index} style={styles.donationItem}>
                  <Avatar size={48}>
                    <AvatarImage src={avatar} />
                    <AvatarFallback
                      style={{ backgroundColor: avatarBgColor }}
                      textStyle={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <View style={styles.donationInfo}>
                    <View style={styles.donationNameRow}>
                      <Text style={styles.donationName}>{fullName}</Text>
                      {isCollectiveDonation && (
                        <View style={styles.collectiveBadge}>
                          <Text style={styles.collectiveBadgeText}>Collective</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.donationTime}>
                      {donation.charged_at ? formatTimeAgo(donation.charged_at) : 'Recently'}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.statsEmptyContainer}>
              <Text style={styles.statsEmptyText}>No donations found</Text>
            </View>
          )}
        </View>
      );
    }

    return null;
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
        onBack={handleBack}
        onCreateFundraiser={handleCreateFundraiser}
        onDonate={() => {
          if (!currentUser || !token?.access_token) {
            (navigation as any).navigate('OnBoard', {
              redirectTo: 'GroupCRWD',
              redirectParams: { id: String(crwdId), collectiveId: String(crwdId) }
            });
            return;
          }
          setShowJoinModal(true);
        }}
        isJoined={crwdData.is_joined}
        onLeave={() => setShowConfirmDialog(true)}
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
                // Navigate to onboarding with redirectTo (React Navigation pattern)
                // Ensure crwdId is a string and pass both id and collectiveId for compatibility
                (navigation as any).navigate('OnBoard', {
                  redirectTo: 'GroupCRWD',
                  redirectParams: { id: String(crwdId), collectiveId: String(crwdId) }
                });
                return;
              }
              setStatisticsTab(tab);
              setShowStatisticsModal(true);
            }}
          />

          {/* <DonationInfoBox nonprofitCount={nonprofitCount} /> */}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {isAdmin ? (
              <>
                {/* Joined Button - Non-clickable for admin */}
                <TouchableOpacity
                  style={[styles.button, styles.joinedButton, styles.disabledButton]}
                  disabled
                  activeOpacity={1}
                >
                  <Check size={14} color="#16a34a" />
                  <Text style={styles.joinedButtonText}>Joined</Text>
                </TouchableOpacity>
                {/* Share Button */}
                <TouchableOpacity
                  onPress={handleShare}
                  style={[styles.button, styles.shareButton]}
                  activeOpacity={0.8}
                >
                  <Share2 size={14} color="#FFFFFF" />
                  <Text style={styles.shareButtonText}>Share</Text>
                </TouchableOpacity>
              </>
            ) : crwdData.is_joined ? (
              <>
                {/* Joined Button - Clickable for non-admin, prompts to unjoin */}
                <TouchableOpacity
                  onPress={handleJoinCollective}
                  disabled={leaveCollectiveMutation.isPending}
                  style={[
                    styles.button,
                    styles.joinedButton,
                    leaveCollectiveMutation.isPending && styles.disabled,
                  ]}
                  activeOpacity={0.8}
                >
                  {leaveCollectiveMutation.isPending ? (
                    <>
                      <Loader2 size={14} color="#10B981" />
                      <Text style={styles.joinedButtonText}>Leaving...</Text>
                    </>
                  ) : (
                    <>
                      <Check size={14} color="#10B981" />
                      <Text style={styles.joinedButtonText}>Joined</Text>
                    </>
                  )}
                </TouchableOpacity>
                {/* Share Button */}
                <TouchableOpacity
                  onPress={handleShare}
                  style={[styles.button, styles.shareButton]}
                  activeOpacity={0.8}
                >
                  <Share2 size={14} color="#FFFFFF" />
                  <Text style={styles.shareButtonText}>Share</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  onPress={handleJoinCollective}
                  disabled={joinCollectiveMutation.isPending}
                  style={[
                    styles.button,
                    styles.joinButton,
                    joinCollectiveMutation.isPending && styles.disabled,
                  ]}
                  activeOpacity={0.8}
                >
                  {joinCollectiveMutation.isPending ? (
                    <>
                      <Loader2 size={14} color="#FFFFFF" />
                      <Text style={styles.joinButtonText}>Joining...</Text>
                    </>
                  ) : (
                    <Text style={styles.joinButtonText}>Join Collective</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleOneTimeDonation}
                  style={[styles.button, styles.donationButton]}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#1600ff', textAlign: 'center' }}>One-Time Donation</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <SupportedNonprofits
            nonprofits={nonprofits}
            isLoading={isLoadingCauses}
            onSeeAllClick={() => {
              if (!currentUser || !token?.access_token) {
                (navigation as any).navigate('OnBoard', {
                  redirectTo: 'GroupCRWD',
                  redirectParams: { id: String(crwdId), collectiveId: String(crwdId) }
                });
                return;
              }
              setStatisticsTab('Nonprofits');
              setShowStatisticsModal(true);
            }}
          />


          <CommunityActivity
            posts={posts?.results ? posts.results.map((post: any) => ({
              id: post.id?.toString() || '',
              userId: post.user?.id?.toString(),
              username: post.user?.username || post.user?.full_name || post.user?.first_name && post.user?.last_name
                ? `${post.user.first_name} ${post.user.last_name}`
                : 'Unknown User',
              avatarUrl: post.user?.profile_picture || '',
              color: post.user?.color || undefined, // Add color field for fallback avatar
              firstName: post.user?.first_name || undefined,
              lastName: post.user?.last_name || undefined,
              time: post.created_at || new Date().toISOString(), // Pass raw timestamp for proper relative time calculation
              created_at: post.created_at, // Also include created_at for ProfileActivityCard to use
              timestamp: post.created_at, // Include timestamp as well
              org: post.collective?.name || 'Unknown Collective',
              orgUrl: post.collective?.id,
              text: post.content || '',
              imageUrl: post.media || undefined,
              previewDetails: post.preview_details || null,
              likes: post.likes_count || 0,
              comments: post.comments_count || 0,
              shares: 0,
              isLiked: post.is_liked || false,
              fundraiser: post.fundraiser ? {
                id: post.fundraiser.id,
                name: post.fundraiser.name,
                description: post.fundraiser.description,
                image: post.fundraiser.image,
                color: post.fundraiser.color,
                target_amount: post.fundraiser.target_amount,
                current_amount: post.fundraiser.current_amount,
                progress_percentage: post.fundraiser.progress_percentage || 0,
                is_active: post.fundraiser.is_active,
                total_donors: post.fundraiser.total_donors,
                end_date: post.fundraiser.end_date,
              } : undefined,
            })) : []}
            isLoading={isLoadingPosts}
            collectiveId={crwdId}
            isJoined={crwdData.is_joined}
            collectiveData={crwdData}
            onCommentPress={(post) => {
              console.log('onCommentPress called with post:', post);
              // Find the original post data to get firstName and lastName
              const originalPost = posts?.results?.find((p: any) => p.id?.toString() === post.id);
              console.log('Original post found:', originalPost);
              const postData = {
                id: parseInt(post.id),
                username: post.username,
                text: post.text,
                avatarUrl: post.avatarUrl,
                firstName: originalPost?.user?.first_name || post.username?.split(' ')[0],
                lastName: originalPost?.user?.last_name || post.username?.split(' ').slice(1).join(' ') || '',
              };
              console.log('Setting selectedPost:', postData);
              setSelectedPost(postData);
              console.log('Setting showCommentsSheet to true');
              setShowCommentsSheet(true);
            }}
          />

          {/* Discover More Collectives */}
          <DiscoverMoreCollectives collectiveId={crwdId} />

          {/* Legal Disclaimer */}
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              All donations are made to CRWD Foundation Inc. (EIN: 41-2423690), a 501(c)(3)
              nonprofit organization. CRWD Foundation grants funds to qualified 501(c)(3)
              organizations selected by donors.
            </Text>
          </View>
        </View>

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

      {/* Comments Bottom Sheet - Always render to ensure ref is available */}
      {
        selectedPost && (
          <CommentsBottomSheet
            key={selectedPost.id} // Force remount when post changes
            isOpen={showCommentsSheet}
            onClose={() => {
              console.log('CommentsBottomSheet onClose called');
              setShowCommentsSheet(false);
              setSelectedPost(null);
            }}
            post={selectedPost}
          />
        )
      }

      {/* Join Collective Bottom Sheet */}
      <JoinCollectiveBottomSheet
        isOpen={showJoinModal}
        onClose={handleCloseJoinModal}
        collectiveName={crwdData.name || 'Collective'}
        nonprofits={nonprofits}
        collectiveId={crwdId || ''}
        onJoin={handleJoinConfirm}
        isJoining={false}
        donationBox={donationBoxData}
      />

      {/* Statistics Bottom Sheet */}
      <BottomSheet
        ref={statisticsBottomSheetRef}
        index={showStatisticsModal ? 0 : -1}
        snapPoints={statisticsSnapPoints}
        enablePanDownToClose
        backdropComponent={renderStatisticsBackdrop}
        onChange={(index) => setShowStatisticsModal(index >= 0)}
        enableDynamicSizing={false}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          {/* Header */}
          <View style={styles.bottomSheetHeader}>
            <View style={styles.bottomSheetHeaderTop}>
              <Text style={styles.bottomSheetTitle}>Collective Statistics</Text>
              <TouchableOpacity
                onPress={() => setShowStatisticsModal(false)}
                style={styles.closeButton}
              >
                <X size={20} color="#374151" />
              </TouchableOpacity>
            </View>
            <Text style={styles.bottomSheetSubtitle}>
              View detailed information about nonprofits, members, and donations
            </Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            {(['Nonprofits', 'Members', 'Donations'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setStatisticsTab(tab)}
                style={[styles.tab, statisticsTab === tab && styles.activeTab]}
              >
                <Text style={[styles.tabText, statisticsTab === tab && styles.activeTabText]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Content */}
          <BottomSheetScrollView style={styles.bottomSheetScrollView} showsVerticalScrollIndicator={false}>
            {renderStatisticsContent()}
          </BottomSheetScrollView>
        </BottomSheetView>
      </BottomSheet>
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
    paddingVertical: 10,
    borderRadius: 8,
    fontWeight: '600',
  },
  joinButton: {
    backgroundColor: '#1600ff',
  },
  joinedButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  shareButton: {
    backgroundColor: '#1600ff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  donationButton: {
    borderWidth: 1.5,
    borderColor: '#1600ff',
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.6,
  },
  disabledButton: {
    opacity: 0.75,
    backgroundColor: '#FFFFFF',
    borderColor: '#16a34a',
    borderWidth: 1,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  joinedButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  donationButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  bottomSheetHeader: {
    marginBottom: 16,
  },
  bottomSheetHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  bottomSheetSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#f3f4f6',
    padding: 4,
    borderRadius: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#111827',
    fontWeight: '700',
  },
  // tabIndicator removed
  bottomSheetScrollView: {
    flex: 1,
  },
  statsLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  statsLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6B7280',
  },
  statsEmptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  statsEmptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  statsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statsItemContent: {
    flex: 1,
    minWidth: 0,
  },
  statsItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  statsItemDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  viewButton: {
    backgroundColor: '#1600ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  memberDetails: {
    flex: 1,
    minWidth: 0,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  founderBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  founderBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  memberRole: {
    fontSize: 12,
    color: '#6B7280',
  },
  donationSummaryBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  donationSummaryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  donationSummaryAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 4,
  },
  donationSummaryText: {
    fontSize: 12,
    color: '#6B7280',
  },
  donationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  donationInfo: {
    flex: 1,
    minWidth: 0,
  },
  donationNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  donationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  collectiveBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  collectiveBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563EB',
  },
  donationTime: {
    fontSize: 12,
    color: '#6B7280',
  },
});

