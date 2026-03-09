import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Heart, Search, Users, Check, ArrowRight, ChevronDown, ArrowLeft } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CommonActions } from '@react-navigation/native';
import { getSurpriseMe, getCausesBySearch, getJoinCollective, joinCollective, leaveCollective, getCollectiveById } from '../../services/api/crwd';
import { createDonationBox } from '../../services/api/donation';
import { getCollectivesByCauseCategory } from '../../services/api/social';
import { useToast } from '../../contexts/ToastContext';
import { categories } from '../../Constants/categories';
import { useAuthStore } from '../../store/store';

import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import CategoryBadges from '../newcause/CategoryBadges';


type ViewType = 'initial' | 'surprise' | 'browse' | 'collectives' | 'success';

// Get consistent color for avatar
const avatarColors = [
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F97316', // Orange
  '#10B981', // Green
  '#3B82F6', // Blue
];

const getConsistentColor = (id: number | string, colors: string[]) => {
  const hash = typeof id === 'number' ? id : id.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const getInitials = (name: string) => {
  if (!name) return 'N';
  const words = name.trim().split(' ');
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
  return name.charAt(0).toUpperCase();
};

export default function CompleteOnboard() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const redirectTo = (route.params as any)?.redirectTo || null;
  const redirectParams = (route.params as any)?.redirectParams || {};
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user, token } = useAuthStore();
  const [view, setView] = useState<ViewType>('initial');
  const [previousView, setPreviousView] = useState<ViewType>('initial');
  const [addedNonprofitsCount, setAddedNonprofitsCount] = useState(0);
  const [collectivePreparedCauses, setCollectivePreparedCauses] = useState<any[]>([]);
  const [isProcessingCollectives, setIsProcessingCollectives] = useState(false);
  const [selectedCauses, setSelectedCauses] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [joiningCollectiveId, setJoiningCollectiveId] = useState<number | null>(null);
  const [leavingCollectiveId, setLeavingCollectiveId] = useState<number | null>(null);
  const [expandedCollectiveIds, setExpandedCollectiveIds] = useState<Set<number>>(new Set());
  const [joinedCollectiveIds, setJoinedCollectiveIds] = useState<Set<number>>(new Set());

  // Get selected categories from route params
  const selectedCategoryIds = (route.params as any)?.selectedCategories || [];
  const selectedCategoryObjects = selectedCategoryIds
    .map((id: string) => categories.find((cat) => cat.id === id))
    .filter((cat: any) => cat !== undefined);

  // Fetch surprise me causes
  const { data: surpriseData, isLoading: isLoadingSurprise, refetch: refetchSurprise } = useQuery({
    queryKey: ['surprise-me-onboard', selectedCategoryIds],
    queryFn: () => getSurpriseMe(selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined),
    enabled: view === 'surprise',
  });

  // Fetch causes for browse/search
  const { data: browseData, isLoading: isLoadingBrowse } = useQuery({
    queryKey: ['browse-causes', searchQuery, searchTrigger, selectedCategoryIds],
    queryFn: () => getCausesBySearch(searchQuery || '', selectedCategoryIds.join(','), 1),
    enabled: view === 'browse',
    refetchOnMount: true,
  });

  const { data: collectivesData, isLoading: isLoadingCollectives, refetch: refetchCollectives } = useQuery({
    queryKey: ['collectives-by-cause-category', selectedCategoryIds],
    queryFn: () => getCollectivesByCauseCategory(selectedCategoryIds),
    enabled: view === 'collectives',
    refetchOnMount: true,
  });

  const { data: joinedCollectivesData, refetch: refetchJoinedCollectives } = useQuery({
    queryKey: ['joined-collectives', user?.id],
    queryFn: () => getJoinCollective(user?.id?.toString() || ''),
    enabled: view === 'collectives' && !!user?.id && !!token?.access_token,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (!joinedCollectivesData || view !== 'collectives') return;
    const rows = (joinedCollectivesData as any)?.data;
    if (!Array.isArray(rows)) return;
    const ids = rows
      .map((item: any) => item?.collective?.id)
      .filter((id: any) => typeof id === 'number');
    setJoinedCollectiveIds(new Set(ids));
  }, [joinedCollectivesData, view]);

  const joinCollectiveMutation = useMutation({
    mutationFn: (collectiveId: string) => joinCollective(collectiveId),
    onSuccess: (_response: any, collectiveId: string) => {
      // showToast('Joined collective!');
      setJoinedCollectiveIds((prev) => {
        const next = new Set(prev);
        const idNum = Number(collectiveId);
        if (!Number.isNaN(idNum)) next.add(idNum);
        return next;
      });
      refetchCollectives();
      queryClient.invalidateQueries({ queryKey: ['joined-collectives', user?.id] });
    },
    onError: (error: any) => {
      showToast(error?.response?.data?.message || 'Failed to join collective');
    },
    onSettled: () => {
      setJoiningCollectiveId(null);
    },
  });

  const leaveCollectiveMutation = useMutation({
    mutationFn: (collectiveId: string) => leaveCollective(collectiveId),
    onSuccess: (_response: any, collectiveId: string) => {
      // showToast('Left collective!');
      setJoinedCollectiveIds((prev) => {
        const next = new Set(prev);
        const idNum = Number(collectiveId);
        if (!Number.isNaN(idNum)) next.delete(idNum);
        return next;
      });
      refetchCollectives();
      queryClient.invalidateQueries({ queryKey: ['joined-collectives', user?.id] });
      refetchJoinedCollectives();
    },
    onError: (error: any) => {
      showToast(error?.response?.data?.message || 'Failed to leave collective');
    },
    onSettled: () => {
      setLeavingCollectiveId(null);
    },
  });

  const toggleCollectiveExpanded = (collectiveId: number) => {
    setExpandedCollectiveIds((prev) => {
      const next = new Set(prev);
      if (next.has(collectiveId)) {
        next.delete(collectiveId);
      } else {
        next.add(collectiveId);
      }
      return next;
    });
  };

  const handleContinueWithCollective = async () => {
    if (joinedCollectiveIds.size === 0) return;

    setIsProcessingCollectives(true);
    try {
      const allCauses: any[] = [];
      const selectedIds = Array.from(joinedCollectiveIds);

      // Fetch details for each selected collective to get their causes
      for (const collectiveId of selectedIds) {
        try {
          const collectiveDetails = await getCollectiveById(collectiveId.toString());
          if (collectiveDetails) {
            const causes = getCollectiveCauses(collectiveDetails);
            causes.forEach((cause: any) => {
              const causeId = cause.id;
              if (causeId) {
                // Check if cause is already added to avoid duplicates
                if (!allCauses.some(existing => existing.cause_id === causeId)) {
                  allCauses.push({
                    cause_id: causeId,
                    attributed_collective: collectiveId
                  });
                }
              }
            });
          }
        } catch (err) {
          console.error(`Failed to fetch details for collective ${collectiveId}`, err);
        }
      }

      if (allCauses.length > 0) {
        setAddedNonprofitsCount(allCauses.length);
        setCollectivePreparedCauses(allCauses);
        setIsProcessingCollectives(false);
        setPreviousView(view);
        setView('success');
      } else {
        // showToast("No nonprofits found in selected collectives.");
        setIsProcessingCollectives(false);
      }
    } catch (error) {
      console.error("Error processing collectives", error);
      showToast("Failed to process selected collectives");
      setIsProcessingCollectives(false);
    }
  };

  const getCollectiveCauses = (collective: any) => {
    const raw =
      collective?.causes ||
      collective?.supported_causes ||
      collective?.nonprofits ||
      collective?.supported_nonprofits ||
      collective?.causes_list ||
      [];

    if (!Array.isArray(raw)) return [];
    return raw
      .map((item: any) => item?.cause || item)
      .filter(Boolean);
  };

  const handleRedirect = () => {
    if (redirectTo === 'CreateCRWD') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'DrawerNav' as never }],
      });
      setTimeout(() => {
        (navigation as any).navigate('DrawerNav', {
          screen: 'CreateCRWD',
          params: { ...redirectParams, from: 'NewCompleteDonation' }
        });
      }, 100);
    } else if (redirectTo === 'GroupCRWD') {
      navigation.reset({
        index: 0,
        routes: [{ name: redirectTo as never, params: { ...redirectParams, from: 'NewCompleteDonation' } }],
      });
    } else if (redirectTo) {
      navigation.reset({
        index: 0,
        routes: [{ name: redirectTo as never, params: redirectParams }],
      });
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'DrawerNav' as never }],
      });
    }
  };

  // Create donation box mutation
  const createBoxMutation = useMutation({
    mutationFn: async (data: any) => {
      return await createDonationBox(data);
    },
    onSuccess: () => {
      // showToast('Donation box created!');
      queryClient.invalidateQueries({ queryKey: ['donationBox'] });

      handleRedirect();
    },
    onError: (error: any) => {
      console.error("Mutation Error:", error);
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to create donation box';
      showToast(errorMessage);
    },
  });

  // Handle surprise causes data
  useEffect(() => {
    if (surpriseData && view === 'surprise') {
      let causes: any[] = [];
      if (Array.isArray(surpriseData)) {
        causes = surpriseData;
      } else if (surpriseData.data && Array.isArray(surpriseData.data)) {
        causes = surpriseData.data;
      } else if (surpriseData.results && Array.isArray(surpriseData.results)) {
        causes = surpriseData.results;
      }
      // Auto-select all 5 causes
      setSelectedCauses(causes.slice(0, 5).map((cause: any) => cause.id));
    }
  }, [surpriseData, view]);

  const handleSurpriseMe = () => {
    setView('surprise');
  };

  const handleBrowseSearch = () => {
    setView('browse');
  };

  const handleJoinCollective = () => {
    setView('collectives');
  };

  const handleChangeMethod = () => {
    setView('initial');
    // Use setTimeout to avoid layout race conditions on Android
    setTimeout(() => {
      setSelectedCauses([]);
      setSearchQuery('');
      setSearchTrigger(0);
    }, 0);
  };

  const handlePickDifferent = () => {
    refetchSurprise();
  };

  const handleCauseToggle = (causeId: number) => {
    setSelectedCauses((prev) => {
      if (prev.includes(causeId)) {
        return prev.filter((id) => id !== causeId);
      } else {
        return [...prev, causeId];
      }
    });
  };

  const handleSearch = () => {
    setSearchTrigger((prev) => prev + 1);
  };

  const handleStartWithNonprofits = () => {
    if (selectedCauses.length > 0) {
      setAddedNonprofitsCount(selectedCauses.length);
      setPreviousView(view);
      setView('success');
    } else {
      handleRedirect();
    }
  };

  const handleEditCategories = () => {
    navigation.navigate('NonProfitInterests', { redirectTo });
  };

  const handleSkip = () => {
    setAddedNonprofitsCount(0);
    setPreviousView(view);
    setView('success');
  };

  const handleFinalContinue = () => {
    if (addedNonprofitsCount === 0) {
      handleRedirect();
      return;
    }

    const causesBody = previousView === 'collectives'
      ? collectivePreparedCauses
      : selectedCauses.map(id => ({ cause_id: id }));

    createBoxMutation.mutate({
      monthly_amount: "10",
      causes: causesBody
    });
  };

  const getCategoryInfo = (categoryId: string) => {
    // If categoryId is a combination like "MK", split it and return multiple categories
    if (categoryId && categoryId.length > 1) {
      const categoryIds = categoryId.split('');
      const foundCategories = categoryIds
        .map((id) => categories.find((cat) => cat.id === id))
        .filter((cat) => cat !== undefined);

      // If we found multiple categories, return them as an array
      if (foundCategories.length > 0) {
        return foundCategories;
      }
    }

    // Single category or default - return as array for consistency
    const category = categories.find((cat) => cat.id === categoryId) || categories[0];
    return [category];
  };

  // Get surprise causes
  const surpriseCauses = surpriseData
    ? (Array.isArray(surpriseData)
      ? surpriseData
      : surpriseData.data || surpriseData.results || [])
    : [];

  // Get browse causes
  const browseCauses = browseData?.results || [];

  // Initial view - Two cards
  if (view === 'initial') {
    return (
      <View style={styles.container}>
        {/* <LinearGradient
          colors={['#DBEAFE', '#F3E8FF', '#FCE7F3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        > */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60, paddingBottom: 30, paddingHorizontal: 16 }}>
          <View style={[styles.card, { flex: 0 }]}>
            {/* Progress Indicator - Step 4 */}
            <View style={styles.stepIndicator}>
              <View style={styles.stepBar}>
                <View style={[styles.stepDot, styles.stepDotInactive]} />
                <View style={[styles.stepDot, styles.stepDotInactive]} />
                <View style={[styles.stepDot, styles.stepDotInactive]} />
                <View style={[styles.stepDot, styles.stepDotActive]} />
              </View>
            </View>

            {/* Heart Icon with Gradient */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#A855F7', '#EC4899', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientIconCircle}
              >
                <Heart size={32} color="white" />
              </LinearGradient>
            </View>

            {/* Title */}
            <Text style={styles.title}>
              Start Supporting Causes
            </Text>

            {/* Description */}
            <Text style={styles.description}>
              Choose how you'd like to select nonprofits
            </Text>

            {/* Selected Categories Tags */}
            {selectedCategoryObjects.length > 0 && (
              <View style={styles.categoriesContainer}>
                {selectedCategoryObjects.map((category: any) => (
                  <View
                    key={category.id}
                    style={[
                      styles.categoryTag,
                      { backgroundColor: category.background }
                    ]}
                  >
                    <Text style={styles.categoryTagText}>{category.name}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Option Cards */}
            {/* <View style={{ flex: 1 }}> */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              style={styles.optionsScroll}
              contentContainerStyle={styles.optionsContainer}
            >
              {/* Join a Collective Card */}
              <TouchableOpacity
                onPress={handleJoinCollective}
                style={styles.optionCard}
                activeOpacity={0.8}
              >
                <View style={styles.optionIconContainer}>
                  <View style={styles.joinIconCircle}>
                    <Users size={20} color="white" />
                  </View>
                </View>
                <Text style={styles.optionTitle}>Join a Collective</Text>
                <Text style={styles.optionDescription}>
                  Join crwd giving communities
                </Text>
              </TouchableOpacity>

              {/* Choose My Own Card */}
              <TouchableOpacity
                onPress={handleBrowseSearch}
                style={styles.optionCard}
                activeOpacity={0.8}
              >
                <View style={styles.optionIconContainer}>
                  <View style={styles.browseIconCircle}>
                    <Search size={20} color="white" />
                  </View>
                </View>
                <Text style={styles.optionTitle}>I'll Choose My Own</Text>
                <Text style={styles.optionDescription}>
                  Select nonprofits to add to your box
                </Text>
              </TouchableOpacity>

              {/* Surprise Me Card */}
              <TouchableOpacity
                onPress={handleSurpriseMe}
                style={styles.optionCard}
                activeOpacity={0.8}
              >
                <View style={styles.optionIconContainer}>
                  <View style={styles.surpriseIconCircle}>
                    {/* <Text style={{ fontSize: 24, color: 'white' }}>✨</Text> */}
                    <Heart size={20} color="white" />
                  </View>
                </View>
                <Text style={styles.optionTitle}>Surprise Me</Text>
                <Text style={styles.optionDescription}>
                  We'll pick nonprofits based on your interests
                </Text>
              </TouchableOpacity>


            </ScrollView>
            {/* </View> */}

            <View style={styles.footerContainer}>
              <View style={[styles.footerMainButtons, { marginBottom: 0 }]}>
                <TouchableOpacity
                  onPress={handleEditCategories}
                  style={styles.outlineButton}
                  activeOpacity={0.8}
                >
                  <Text style={styles.outlineButtonText}>Back</Text>
                </TouchableOpacity>
                {/* Skip for now on initial view is usually the skip link, but showing Continue here to keep UI consistent if user wants it */}
                {/* Actually Vite initial has Back and Skip inside the flex row if no continue, but let's stick to the pattern */}
                {/* <TouchableOpacity
                    onPress={handleStartWithNonprofits}
                    style={styles.primaryButton}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.primaryButtonText}>Continue</Text>
                    <ArrowRight size={18} color="white" />
                  </TouchableOpacity> */}
                <TouchableOpacity onPress={handleSkip} style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }} activeOpacity={0.8}>
                  <Text style={styles.skipLinkText}>Skip for now</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </View>
        {/* </LinearGradient> */}
      </View>
    );
  }

  if (view === 'collectives') {
    const collectives = collectivesData
      ? (Array.isArray(collectivesData)
        ? collectivesData
        : collectivesData.results || collectivesData.data || [])
      : [];
    const displayCollectives = collectives.slice(0, 10);

    return (
      <View style={styles.container}>
        {/* <LinearGradient
          colors={['#DBEAFE', '#F3E8FF', '#FCE7F3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        > */}
        {/* <KeyboardAwareScrollView
            contentContainerStyle={styles.scrollContentBrowse}
            showsVerticalScrollIndicator={false}
            enableOnAndroid={true}
            extraScrollHeight={Platform.OS === 'ios' ? 20 : 0}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={false}
          > */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60, paddingBottom: 30, paddingHorizontal: 16 }}>
          <View style={styles.card}>
            <View style={styles.stepIndicator}>
              <View style={styles.stepBar}>
                <View style={[styles.stepDot, styles.stepDotInactive]} />
                <View style={[styles.stepDot, styles.stepDotInactive]} />
                <View style={[styles.stepDot, styles.stepDotInactive]} />
                <View style={[styles.stepDot, styles.stepDotActive]} />
              </View>
            </View>

            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#A855F7', '#EC4899', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientIconCircle}
              >
                <Heart size={32} color="white" />
              </LinearGradient>
            </View>

            <Text style={styles.title}>Start Supporting Causes</Text>
            <Text style={styles.description}>Join a community supporting causes together</Text>

            <View style={{ flex: 1 }}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.collectivesSectionScroll}
                contentContainerStyle={styles.collectivesSectionContent}
              >
                <View style={styles.collectiveInfoCard}>
                  <View style={styles.collectiveInfoIcon}>
                    <Users size={18} color="#fff" />
                  </View>
                  <View style={styles.collectiveInfoText}>
                    <Text style={styles.collectiveInfoTitle}>What's a Collective?</Text>
                    <Text style={styles.collectiveInfoDescription}>
                      A giving community around shared causes where you can discover nonprofits, join discussions, and connect with others. Collectives are free to start or join.
                    </Text>
                  </View>
                </View>

                <View style={styles.collectivesHeader}>
                  <Text style={styles.sectionTitle}>Join a Collective</Text>
                  <TouchableOpacity onPress={handleChangeMethod} style={styles.changeMethodButton} activeOpacity={0.8}>
                    <Text style={styles.changeMethodText}>Change Method</Text>
                  </TouchableOpacity>
                </View>

                {isLoadingCollectives ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#9ca3af" />
                  </View>
                ) : (
                  <View style={styles.collectivesList}>
                    {displayCollectives.length > 0 ? (
                      displayCollectives.slice(0, 10).map((collective: any, index: number) => {
                        const founderName = collective.created_by
                          ? `${collective.created_by.first_name || ''} ${collective.created_by.last_name || ''}`.trim() || collective.created_by.username || 'Unknown'
                          : 'Unknown';

                        const causes = getCollectiveCauses(collective);
                        const nonprofitCount =
                          causes.length ||
                          collective.causes_count ||
                          collective.supported_causes_count ||
                          collective.cause_count ||
                          collective.nonprofit_count ||
                          0;

                        const circleColor = collective.color || getConsistentColor(collective.id || index, avatarColors);
                        const initialLetter = (collective.name || 'C').charAt(0).toUpperCase();
                        const isJoining = joiningCollectiveId === collective.id;
                        const isLeaving = leavingCollectiveId === collective.id;
                        const isExpanded = !!collective.id && expandedCollectiveIds.has(collective.id);
                        const isJoined = !!collective.id && joinedCollectiveIds.has(collective.id);
                        const isPending = (joinCollectiveMutation.isPending && isJoining) || (leaveCollectiveMutation.isPending && isLeaving);

                        return (
                          <View key={collective.id || index} style={styles.collectiveCard}>
                            <View style={styles.collectiveRow}>
                              <Avatar size={44} style={styles.collectiveAvatar}>
                                <AvatarImage src={collective.image || collective.logo} style={{ width: '100%', height: '100%', borderRadius: 10 }} />
                                <AvatarFallback
                                  style={{ backgroundColor: circleColor, borderRadius: 10 }}
                                  textStyle={styles.collectiveAvatarText}
                                >
                                  {initialLetter}
                                </AvatarFallback>
                              </Avatar>

                              <View style={styles.collectiveMain}>
                                <View style={styles.collectiveTopRow}>
                                  <Text style={styles.collectiveName}>{collective.name || 'Unknown Collective'}</Text>
                                  <TouchableOpacity
                                    style={[
                                      styles.joinButton,
                                      isJoined && styles.joinedButton,
                                      isPending && styles.joinButtonDisabled,
                                    ]}
                                    onPress={() => {
                                      if (collective.id) {
                                        if (isJoined) {
                                          setLeavingCollectiveId(collective.id);
                                          leaveCollectiveMutation.mutate(String(collective.id));
                                        } else {
                                          setJoiningCollectiveId(collective.id);
                                          joinCollectiveMutation.mutate(String(collective.id));
                                        }
                                      }
                                    }}
                                    disabled={isPending}
                                    activeOpacity={0.8}
                                  >
                                    {isPending ? (
                                      <Text style={styles.joinButtonText}>{isJoining ? 'Joining...' : 'Leaving...'}</Text>
                                    ) : isJoined ? (
                                      <>
                                        <Check size={14} color="#fff" />
                                        <Text style={styles.joinedButtonText}>Joined</Text>
                                      </>
                                    ) : (
                                      <Text style={styles.joinButtonText}>Join</Text>
                                    )}
                                  </TouchableOpacity>
                                </View>

                                <Text style={styles.collectiveMeta}>Created by {founderName}</Text>
                                {!!collective.description && (
                                  <Text style={styles.collectiveDescription} numberOfLines={2}>
                                    {collective.description}
                                  </Text>
                                )}

                                <TouchableOpacity
                                  style={styles.supportingRow}
                                  activeOpacity={causes.length > 0 ? 0.8 : 1}
                                  onPress={() => {
                                    if (causes.length > 0 && collective.id) {
                                      toggleCollectiveExpanded(collective.id);
                                    }
                                  }}
                                >
                                  <Text style={styles.supportingText}>Supporting {nonprofitCount} nonprofit{nonprofitCount !== 1 ? 's' : ''}</Text>
                                  {causes.length > 0 && (
                                    <ChevronDown
                                      size={16}
                                      color="#1600ff"
                                      style={[styles.supportingChevron, isExpanded && styles.supportingChevronExpanded]}
                                    />
                                  )}
                                </TouchableOpacity>

                              </View>
                            </View>
                            {isExpanded && causes.length > 0 && (
                              <View style={styles.causeList}>
                                {causes.map((cause: any, causeIndex: number) => {
                                  const causeName = cause?.name || cause?.title || 'Nonprofit';
                                  const causeInitial = causeName.charAt(0).toUpperCase();
                                  return (
                                    <View key={cause?.id || `${collective.id}-cause-${causeIndex}`} style={styles.causeItem}>
                                      <Avatar style={styles.collectiveCauseAvatar}>
                                        <AvatarImage src={cause?.image || cause?.logo} />
                                        <AvatarFallback textStyle={styles.collectiveCauseAvatarText}>
                                          {causeInitial}
                                        </AvatarFallback>
                                      </Avatar>
                                      <Text style={styles.collectiveCauseName} numberOfLines={1}>
                                        {causeName}
                                      </Text>
                                    </View>
                                  );
                                })}
                              </View>
                            )}
                          </View>
                        );
                      })
                    ) : (
                      <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconCircle}>
                          <Users size={32} color="#1600ff" />
                        </View>
                        <Text style={styles.emptyTitle}>No collectives found</Text>
                        <Text style={styles.emptyDescription}>
                          There are no collectives available for your selected interests right now. Try searching or picking individual nonprofits.
                        </Text>
                      </View>
                    )}
                  </View>

                )}
              </ScrollView>
            </View>

            <View style={styles.footerContainer}>
              <View style={styles.footerMainButtons}>
                <TouchableOpacity
                  onPress={handleChangeMethod}
                  style={styles.outlineButton}
                  activeOpacity={0.8}
                >
                  <Text style={styles.outlineButtonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleContinueWithCollective}
                  disabled={joinedCollectiveIds.size === 0 || joinCollectiveMutation.isPending}
                  style={[
                    styles.primaryButton,
                    (joinedCollectiveIds.size === 0 || joinCollectiveMutation.isPending) && styles.primaryButtonDisabled
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryButtonText}>
                    {joinCollectiveMutation.isPending ? 'Saving...' : 'Continue'}
                  </Text>
                  {!joinCollectiveMutation.isPending && <ArrowRight size={18} color="white" />}
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={handleSkip} style={styles.skipLink} activeOpacity={0.8}>
                <Text style={styles.skipLinkText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* </KeyboardAwareScrollView> */}
        {/* </LinearGradient > */}
      </View >
    );
  }

  // Surprise Me view
  if (view === 'surprise') {
    return (
      <View style={styles.container}>
        {/* <LinearGradient
          colors={['#DBEAFE', '#F3E8FF', '#FCE7F3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        > */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60, paddingBottom: 30, paddingHorizontal: 16 }}>
          <View style={styles.card}>
            {/* Progress Indicator - Step 4 */}
            <View style={styles.stepIndicator}>
              <View style={styles.stepBar}>
                <View style={[styles.stepDot, styles.stepDotInactive]} />
                <View style={[styles.stepDot, styles.stepDotInactive]} />
                <View style={[styles.stepDot, styles.stepDotInactive]} />
                <View style={[styles.stepDot, styles.stepDotActive]} />
              </View>
            </View>

            {/* Header */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#A855F7', '#EC4899', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientIconCircle}
              >
                <Heart size={32} color="white" />
              </LinearGradient>
            </View>

            <Text style={styles.title}>
              Start Supporting Causes
            </Text>
            <Text style={styles.description}>
              Choose how you'd like to select nonprofits
            </Text>

            <View style={{ flex: 1 }}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.collectivesSectionScroll}
                contentContainerStyle={styles.collectivesSectionContent}
              >
                {/* Your Random Selection Section */}
                <View style={[styles.section, { marginBottom: 0 }]}>
                  {/* Fixed Header Layout: Button inside sectionHeader */}
                  {/* <View style={styles.sectionHeader}> */}
                  <Text style={styles.sectionTitle}>Your Random Selection</Text>
                  <TouchableOpacity
                    onPress={handleChangeMethod}
                    style={[styles.changeMethodButton, { marginTop: 6, width: 140 }]}
                  >
                    <Text style={[styles.changeMethodText, { textAlign: 'center', }]}>Change Method</Text>
                  </TouchableOpacity>
                  {/* </View> */}

                  {/* Removed the awkward standalone button that was here */}

                  {isLoadingSurprise ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#9ca3af" />
                    </View>
                  ) : (
                    <>
                      {surpriseCauses.length > 0 ? (
                        <>
                          <View style={[styles.causesGrid, { marginTop: 8 }]}>
                            {surpriseCauses.slice(0, 6).map((cause: any) => {
                              const isSelected = selectedCauses.includes(cause.id);
                              const avatarBgColor = getConsistentColor(cause.id, avatarColors);
                              const initials = getInitials(cause.name);
                              const categoryInfo = getCategoryInfo(cause.category);

                              return (
                                <TouchableOpacity
                                  key={cause.id}
                                  onPress={() => handleCauseToggle(cause.id)}
                                  style={[
                                    styles.causeCard,
                                    isSelected && styles.causeCardSelected
                                  ]}
                                  activeOpacity={0.8}
                                >
                                  <View style={styles.causeCardContent}>
                                    <Avatar size={48} style={{ ...styles.causeAvatar, borderRadius: 8, overflow: 'hidden' }}>
                                      <AvatarImage src={cause.image || cause.logo} style={{ width: '100%', height: '100%', borderRadius: 8 }} />
                                      <AvatarFallback
                                        style={{ backgroundColor: avatarBgColor, borderRadius: 8 }}
                                        textStyle={{ color: '#FFFFFF', fontSize: 14, fontFamily: 'Outfit-Bold' }}
                                      >
                                        {initials}
                                      </AvatarFallback>
                                    </Avatar>
                                    <View style={styles.causeInfo}>
                                      <Text style={styles.causeName} numberOfLines={2}>
                                        {cause.name}
                                      </Text>
                                      {/* <View style={styles.causeCategoriesContainer}>
                                        {categoryInfo.map((cat: any, index: number) => (
                                          <View
                                            key={index}
                                            style={[
                                              styles.causeCategoryBadge,
                                              { backgroundColor: (cat as any).background }
                                            ]}
                                          >
                                            <Text style={styles.causeCategoryText}>
                                              {cat.name}
                                            </Text>
                                          </View>
                                        ))}
                                      </View> */}
                                      <CategoryBadges
                                        categories={cause.categories}
                                      />
                                    </View>
                                    {isSelected && (
                                      <Check size={20} color="#3b82f6" />
                                    )}
                                  </View>
                                </TouchableOpacity>
                              );
                            })}
                          </View>

                          <View style={styles.pickDifferentContainer}>
                            <TouchableOpacity
                              onPress={handlePickDifferent}
                              style={styles.pickDifferentButton}
                            >
                              {/* <Text style={{ fontSize: 16, marginRight: 6 }}>✨</Text> */}
                              <Text style={styles.pickDifferentText}>Pick Different Nonprofits</Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      ) : (
                        <View style={styles.emptyContainer}>
                          <View style={styles.emptyIconCircle}>
                            <Heart size={32} color="#1600ff" />
                          </View>
                          <Text style={styles.emptyTitle}>No suggestions found</Text>
                          <Text style={styles.emptyDescription}>
                            We couldn't find any nonprofits for your selected interests. Try changing your interests or browsing manually.
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              </ScrollView>
            </View>

            <View style={styles.footerContainer}>
              <View style={styles.footerMainButtons}>
                <TouchableOpacity
                  onPress={handleChangeMethod}
                  style={styles.outlineButton}
                  activeOpacity={0.8}
                >
                  <Text style={styles.outlineButtonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleStartWithNonprofits}
                  disabled={selectedCauses.length === 0 || createBoxMutation.isPending}
                  style={[
                    styles.primaryButton,
                    (selectedCauses.length === 0 || createBoxMutation.isPending) && styles.primaryButtonDisabled
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryButtonText}>
                    {createBoxMutation.isPending ? 'Saving...' : 'Continue'}
                  </Text>
                  {!createBoxMutation.isPending && <ArrowRight size={18} color="white" />}
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={handleSkip} style={styles.skipLink} activeOpacity={0.8}>
                <Text style={styles.skipLinkText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* </LinearGradient> */}
      </View>
    );
  }
  // Success view
  if (view === 'success') {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successContent}>
          <View style={styles.successIconWrapper}>
            <View style={styles.successIconOuter} />
            <View style={styles.successIconCircle}>
              <Check size={40} color="white" />
            </View>
          </View>

          <Text style={styles.successTitle}>
            {`${addedNonprofitsCount} nonprofit${addedNonprofitsCount == 1 ? '' : 's'} ${addedNonprofitsCount == 1 ? 'has' : 'have'} been added to\nyour donation box.`}
          </Text>

          <Text style={styles.successDescription}>
            {addedNonprofitsCount > 0
              ? "When you're ready, choose an amount. We split it evenly across what you support. Add or remove causes anytime without changing your amount."
              : "You haven't selected any nonprofits yet. You can always browse and add causes to your donation box later from your profile."}
          </Text>

          <TouchableOpacity
            onPress={handleFinalContinue}
            disabled={createBoxMutation.isPending}
            style={[
              styles.finalContinueButton,
              createBoxMutation.isPending && styles.primaryButtonDisabled
            ]}
            activeOpacity={0.8}
          >
            {createBoxMutation.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : null}
            <Text style={styles.finalContinueButtonText}>
              {createBoxMutation.isPending ? 'Setting up Box...' : 'Continue to CRWD'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setView(previousView)}
            disabled={createBoxMutation.isPending}
            style={styles.changeSelectionButton}
            activeOpacity={0.8}
          >
            <ArrowLeft size={20} color="#6b7280" />
            <Text style={styles.changeSelectionText}>
              {addedNonprofitsCount > 0 ? "Change My Selection" : "Go Back and Choose"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Browse & Search view
  return (
    <View style={styles.container}>
      {/* <LinearGradient
        colors={['#DBEAFE', '#F3E8FF', '#FCE7F3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      > */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60, paddingBottom: 30, paddingHorizontal: 16 }}>
        <View style={styles.card}>
          {/* Progress Indicator - Step 4 */}
          <View style={styles.stepIndicator}>
            <View style={styles.stepBar}>
              <View style={[styles.stepDot, styles.stepDotInactive]} />
              <View style={[styles.stepDot, styles.stepDotInactive]} />
              <View style={[styles.stepDot, styles.stepDotInactive]} />
              <View style={[styles.stepDot, styles.stepDotActive]} />
            </View>
          </View>

          {/* Header */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['#A855F7', '#EC4899', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientIconCircle}
            >
              <Heart size={32} color="white" />
            </LinearGradient>
          </View>

          <Text style={styles.title}>
            Start Supporting Causes
          </Text>
          <Text style={styles.description}>
            Choose how you'd like to select nonprofits
          </Text>

          <View style={{ flex: 1 }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.collectivesSectionScroll}
              contentContainerStyle={styles.collectivesSectionContent}
            >
              {/* Browse Nonprofits Section */}
              <View style={[styles.section, { marginBottom: 0 }]}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Browse Nonprofits</Text>
                  <TouchableOpacity
                    onPress={handleChangeMethod}
                    style={styles.changeMethodButton}
                  >
                    <Text style={styles.changeMethodText}>Change Method</Text>
                  </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                  <Search size={20} color="#9ca3af" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search for nonprofits..."
                    placeholderTextColor="#9ca3af"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                  />
                </View>

                {/* Select Nonprofits Count */}
                <View style={styles.countContainer}>
                  <Text style={styles.countText}>
                    Select Nonprofits ({selectedCauses.length})
                  </Text>
                </View>

                {/* Causes List */}
                {isLoadingBrowse ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#9ca3af" />
                  </View>
                ) : (
                  <View style={styles.causesListContainer}>
                    {browseCauses.length > 0 ? (
                      browseCauses.map((cause: any) => {
                        const isSelected = selectedCauses.includes(cause.id);
                        const avatarBgColor = getConsistentColor(cause.id, avatarColors);
                        const initials = getInitials(cause.name);
                        const categoryInfo = getCategoryInfo(cause.category);

                        return (
                          <View key={cause.id} style={{ marginBottom: 12 }}>
                            <TouchableOpacity
                              onPress={() => handleCauseToggle(cause.id)}
                              style={[
                                styles.causeCard,
                                isSelected && styles.causeCardSelected
                              ]}
                              activeOpacity={0.8}
                            >
                              <View style={styles.causeCardContent}>
                                <Avatar size={48} style={{ ...styles.causeAvatar, borderRadius: 8, overflow: 'hidden' }}>
                                  <AvatarImage src={cause.image || cause.logo} style={{ width: '100%', height: '100%', borderRadius: 8 }} />
                                  <AvatarFallback
                                    style={{ backgroundColor: avatarBgColor, borderRadius: 8 }}
                                    textStyle={{ color: '#FFFFFF', fontSize: 14, fontFamily: 'Outfit-Bold' }}
                                  >
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                <View style={styles.causeInfo}>
                                  <Text style={styles.causeName}>
                                    {cause.name}
                                  </Text>
                                  {/* <View style={styles.causeCategoriesContainer}>
                                    {categoryInfo.map((cat: any, index: number) => (
                                      <View
                                        key={index}
                                        style={[
                                          styles.causeCategoryBadge,
                                          { backgroundColor: (cat as any).background }
                                        ]}
                                      >
                                        <Text style={styles.causeCategoryText}>
                                          {cat.name}
                                        </Text>
                                      </View>
                                    ))}
                                  </View> */}
                                  <CategoryBadges
                                    categories={cause.categories}
                                  />
                                </View>
                                {isSelected && (
                                  <Check size={20} color="#3b82f6" />
                                )}
                              </View>
                            </TouchableOpacity>
                          </View>
                        );
                      })
                    ) : (
                      <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconCircle}>
                          <Search size={32} color="#1600ff" />
                        </View>
                        <Text style={styles.emptyTitle}>No nonprofits found</Text>
                        <Text style={styles.emptyDescription}>
                          We couldn't find any nonprofits {searchQuery ? `matching "${searchQuery}"` : 'for your selected interests'}. Try different keywords or categories.
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </ScrollView>
          </View>

          {/* Footer Navigation */}
          <View style={styles.footerContainer}>
            <View style={styles.footerMainButtons}>
              <TouchableOpacity
                onPress={handleChangeMethod}
                style={styles.outlineButton}
                activeOpacity={0.8}
              >
                <Text style={styles.outlineButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleStartWithNonprofits}
                disabled={selectedCauses.length === 0 || createBoxMutation.isPending}
                style={[
                  styles.primaryButton,
                  (selectedCauses.length === 0 || createBoxMutation.isPending) && styles.primaryButtonDisabled
                ]}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>
                  {createBoxMutation.isPending ? 'Saving...' : 'Continue'}
                </Text>
                {!createBoxMutation.isPending && <ArrowRight size={18} color="white" />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleSkip} style={styles.skipLink} activeOpacity={0.8}>
              <Text style={styles.skipLinkText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {/* </LinearGradient> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },

  card: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    width: '100%',
    maxWidth: 768,
    alignSelf: 'center',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 8,
    // elevation: 5,
  },
  stepIndicator: {
    alignItems: 'center',
    marginBottom: 10,
  },
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepDot: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  stepDotActive: {
    backgroundColor: '#111827',
  },
  stepDotInactive: {
    backgroundColor: '#d1d5db',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 5,
  },
  gradientIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  description: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
    // lineHeight: 20,
    fontFamily: 'Outfit-Regular',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  categoryTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  categoryTagText: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
    color: 'white',
  },
  optionsContainer: {
    gap: 12,
    // flexGrow: 1,
    justifyContent: 'center',
  },
  optionCard: {
    backgroundColor: 'white',
    // ... same other styles
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 6,
    alignItems: 'center',
    marginBottom: 0,
  },
  optionsScroll: {
    paddingVertical: 10,
  },
  optionIconContainer: {
    marginBottom: 10,
  },
  surpriseIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 32,
    backgroundColor: '#ec4899',
    alignItems: 'center',
    justifyContent: 'center',
  },
  browseIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 32,
    backgroundColor: '#9333ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 32,
    backgroundColor: '#ec4899',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  // optionsScroll: {
  //   flex: 1,
  // },
  optionDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontFamily: 'Outfit-Regular',
  },
  footerContainer: {
    marginTop: 'auto',
    paddingVertical: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginHorizontal: -18,
    paddingHorizontal: 18,
  },
  footerMainButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  primaryButton: {
    flex: 1,
    height: 45,
    borderRadius: 999,
    backgroundColor: '#1600ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#1600ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: 'white',
  },
  outlineButton: {
    flex: 1,
    height: 45,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
  },
  skipLink: {
    alignItems: 'center',
    // paddingVertical: 4,
  },
  skipLinkText: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#6b7280',
    // textDecorationLine: 'underline',
  },
  collectiveInfoCard: {
    backgroundColor: '#f3e8ff',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  collectiveInfoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#da46f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectiveInfoText: {
    flex: 1,
  },
  collectiveInfoTitle: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
    marginBottom: 6,
  },
  collectiveInfoDescription: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    color: '#374151',
    lineHeight: 18,
  },
  collectivesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  collectivesSectionScroll: {
    flex: 1,
    // marginBottom: 24,
  },
  collectivesSectionContent: {
    paddingBottom: 2,
  },
  collectivesList: {
    gap: 14,
    flexGrow: 1,
  },
  collectiveCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'white',
  },
  collectiveRow: {
    flexDirection: 'row',
    gap: 12,
  },
  collectiveAvatar: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectiveAvatarText: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: 'white',
  },
  collectiveMain: {
    flex: 1,
  },
  collectiveTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    // marginBottom: 6,
  },
  collectiveName: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
  },
  collectiveMeta: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    color: '#6b7280',
    marginBottom: 2,
  },
  collectiveDescription: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    color: '#374151',
    marginBottom: 10,
  },
  supportingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  supportingText: {
    fontSize: 14,
    fontFamily: 'Outfit-Medium',
    color: '#1600ff',
  },
  supportingChevron: {
    transform: [{ rotate: '0deg' }],
  },
  supportingChevronExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  causeList: {
    marginTop: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  causeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  collectiveCauseAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectiveCauseAvatarText: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    color: '#6b7280',
  },
  collectiveCauseName: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Outfit-Regular',
    color: '#111827',
  },
  moreCausesText: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    color: '#6b7280',
    marginLeft: 36,
  },
  joinButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#1600ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  joinedButton: {
    backgroundColor: '#22c55e',
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
    color: 'white',
  },
  joinedButtonText: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
    color: 'white',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
  },
  changeMethodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
  },
  changeMethodText: {
    fontSize: 14,
    fontFamily: 'Outfit-Medium',
    color: '#374151',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#f9fafb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Outfit-Regular',
  },
  countContainer: {
    marginBottom: 16,
  },
  countText: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
  },
  causesGrid: {
    marginBottom: 16,
  },
  causesListContainer: {
    marginBottom: 12,
  },
  causeCard: {
    width: '100%',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#dbeafe',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
  },
  causeCardSelected: {
    borderColor: '#3b82f6',
  },
  causeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  causeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  causeAvatarText: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: 'white',
  },
  causeInfo: {
    flex: 1,
  },
  causeName: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
    marginBottom: 4,
    flexShrink: 1,
  },
  causeCategoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  causeCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  causeCategoryText: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
    color: 'white',
  },
  pickDifferentContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pickDifferentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pickDifferentText: {
    fontSize: 16,
    fontFamily: 'Outfit-Medium',
    color: '#9333ea',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Outfit-Regular',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontFamily: 'Outfit-Regular',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  successContainer: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  successContent: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  successIconWrapper: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  successIconOuter: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#D1FAE5',
  },
  successTitle: {
    fontSize: 22,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
    // lineHeight: 32,
  },
  successDescription: {
    fontSize: 16,
    fontFamily: 'Outfit-Regular',
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  finalContinueButton: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    backgroundColor: '#1600ff',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
    shadowColor: '#1600ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  finalContinueButtonText: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    color: 'white',
  },
  changeSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changeSelectionText: {
    fontSize: 16,
    fontFamily: 'Outfit-Medium',
    color: '#6b7280',
  },
});
