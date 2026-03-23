import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ImageBackground,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Share2, MoreHorizontal, Users, ArrowRight } from 'lucide-react-native';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { getFundraiserById, getCollectiveById } from '../services/api/crwd';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';
import { PrimaryBlue } from '../Constants/Colors';
import { Share } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import SharePost from '../components/SharePost';
import { WEB_BASE_URL } from '../Constants/url';
import { encodePostId } from '../utils/truncateFirstPeriod';

// Avatar colors for consistent fallback styling
const avatarColors = [
  '#FF6B6B', '#4CAF50', '#FF9800', '#9C27B0', '#2196F3',
  '#FFC107', '#E91E63', '#00BCD4', '#8BC34A', '#FF5722',
  '#673AB7', '#009688', '#FFEB3B', '#795548', '#607D8B',
];

const getConsistentColor = (id: number | string | undefined, fallbackName?: string) => {
  if (id !== undefined && id !== null) {
    const hash = typeof id === 'number' ? id : id.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return avatarColors[hash % avatarColors.length];
  }
  if (fallbackName) {
    const hash = fallbackName.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return avatarColors[hash % avatarColors.length];
  }
  return avatarColors[0];
};

const getInitials = (name: string) => {
  const words = name.split(' ').filter(Boolean);
  if (words.length === 0) return 'N';
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

export default function FundraiserDetail() {
  const route = useRoute();
  const navigation = useNavigation();
  const params = route.params as any;
  // Support both 'id' and 'fundraiserId' param names
  const fundraiserId = String(params?.id || params?.fundraiserId || '');
  const [donationAmount, setDonationAmount] = useState('25');
  const [showDropdown, setShowDropdown] = useState(false);

  const dropdownRef = useRef<View>(null);
  const shareSheetRef = useRef<BottomSheetModal>(null);

  // Fetch fundraiser data
  const { data: fundraiserData, isLoading, error } = useQuery({
    queryKey: ['fundraiser', fundraiserId],
    queryFn: () => getFundraiserById(fundraiserId),
    enabled: !!fundraiserId,
  });

  // Fetch collective data
  const { data: collectiveData } = useQuery({
    queryKey: ['crwd', fundraiserData?.collective],
    queryFn: () => getCollectiveById(fundraiserData?.collective?.toString() || ''),
    enabled: !!fundraiserData?.collective && typeof fundraiserData.collective === 'number',
  });

  // Calculate days left
  const daysLeft = fundraiserData?.end_date
    ? Math.max(0, differenceInDays(new Date(fundraiserData.end_date), new Date()))
    : 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handlePressOutside = () => {
      if (showDropdown) {
        setShowDropdown(false);
      }
    };

    // Add a small delay to allow the dropdown to render
    if (showDropdown) {
      const timer = setTimeout(() => {
        // This will be handled by the ScrollView's onScrollBeginDrag
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showDropdown]);

  const handleDonate = () => {
    if (!fundraiserData?.causes || fundraiserData.causes.length === 0) {
      Alert.alert('Error', 'No nonprofits selected for this fundraiser.');
      return;
    }

    // Navigate to one-time donation page with preselected causes and fundraiser ID
    const preselectedCauseIds = fundraiserData.causes.map((cause: any) => cause.id);
    const preselectedCausesData = fundraiserData.causes;

    (navigation as any).navigate('OneTimeDonationScreen', {
      preselectedCauses: preselectedCauseIds,
      preselectedCausesData: preselectedCausesData,
      fundraiserId: fundraiserData.id,
      donationAmount: donationAmount || '25',
    });
  };

  const handleShare = async () => {
    shareSheetRef.current?.present();
  };

  const handleReport = () => {
    Alert.alert('Report Fundraiser', 'Report functionality coming soon.');
    setShowDropdown(false);
  };

  // Format currency
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PrimaryBlue} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !fundraiserData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Fundraiser not found</Text>
          <Text style={styles.errorText}>
            The fundraiser you're looking for doesn't exist or has been removed.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleBack = () => {
    const fromCreate = params?.fromCreate;
    if (fromCreate && fundraiserData?.collective) {
      const collectiveId = typeof fundraiserData.collective === 'object'
        ? fundraiserData.collective.id
        : fundraiserData.collective;
      (navigation as any).navigate('GroupCRWD', { id: collectiveId, fromCreate: true });
    } else {
      navigation.goBack();
    }
  };

  const bannerImage = fundraiserData?.image || collectiveData?.image;
  const bannerColor = fundraiserData?.color || collectiveData?.color || getConsistentColor(fundraiserData?.id, fundraiserData?.name);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => {
          if (showDropdown) {
            setShowDropdown(false);
          }
        }}
      >
        {/* Header with Banner Background */}
        <View style={styles.headerContainer}>
          {/* Banner Background */}
          {bannerImage ? (
            <ImageBackground
              source={{ uri: bannerImage }}
              style={styles.bannerBackground}
              blurRadius={10}
            >
              <View style={[styles.bannerOverlay, { backgroundColor: bannerColor + '40' }]} />
            </ImageBackground>
          ) : (
            <View style={[styles.bannerBackground, { backgroundColor: bannerColor }]} />
          )}

          {/* Header Content */}
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <TouchableOpacity
                onPress={handleBack}
                style={styles.headerButton}
                activeOpacity={0.7}
              >
                <ArrowLeft size={20} color="#374151" />
              </TouchableOpacity>
              <View style={styles.headerRight}>
                <TouchableOpacity
                  onPress={handleShare}
                  style={styles.headerButton}
                  activeOpacity={0.7}
                >
                  <Share2 size={20} color="#374151" />
                </TouchableOpacity>
                <View style={styles.dropdownContainer} ref={dropdownRef}>
                  <TouchableOpacity
                    onPress={() => setShowDropdown(!showDropdown)}
                    style={styles.headerButton}
                    activeOpacity={0.7}
                  >
                    <MoreHorizontal size={20} color="#374151" />
                  </TouchableOpacity>
                  {showDropdown && (
                    <View style={styles.dropdown}>
                      <TouchableOpacity
                        onPress={handleReport}
                        style={styles.dropdownItem}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.dropdownText}>Report</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Amount and Progress */}
            <View style={styles.progressCard}>
              <View style={styles.amountRow}>
                <Text style={styles.amountRaised}>
                  ${formatCurrency(fundraiserData.current_amount || '0')}
                </Text>
                <Text style={styles.amountGoal}>
                  raised of ${formatCurrency(fundraiserData.target_amount || '0')} goal
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${fundraiserData.progress_percentage || 0}%` },
                  ]}
                />
              </View>
              <View style={styles.progressInfo}>
                <Text style={styles.progressText}>
                  {fundraiserData.progress_percentage?.toFixed(2) || '0.00'}% of goal
                </Text>
                {fundraiserData.is_active && daysLeft > 0 && (
                  <Text style={styles.progressText}>
                    {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                  </Text>
                )}
                {!fundraiserData.is_active && (
                  <Text style={styles.progressText}>
                    Fundraiser Ended
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Campaign Title and Collective Tag */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{fundraiserData.name}</Text>
            {(collectiveData || fundraiserData.collective_name) && (
              <TouchableOpacity
                onPress={() => {
                  const collectiveId = typeof fundraiserData.collective === 'object'
                    ? fundraiserData.collective.id
                    : fundraiserData.collective;
                  (navigation as any).navigate('GroupCRWD', {
                    id: collectiveId,
                  });
                }}
                style={styles.collectiveTag}
                activeOpacity={0.7}
              >
                <Text style={styles.collectiveTagText}>
                  {collectiveData?.name || fundraiserData.collective_name}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Stats Cards */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <Users size={16} color="#6B7280" />
                <Text style={styles.statLabel}>Donors</Text>
              </View>
              <Text style={styles.statValue}>{fundraiserData.total_donors || 0}</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <ArrowRight size={16} color="#6B7280" />
                <Text style={styles.statLabel}>Avg. Donation</Text>
              </View>
              <Text style={styles.statValue}>
                ${formatCurrency(fundraiserData.average_donation || '0')}
              </Text>
            </View>
          </View>

          {/* Campaign Story */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Campaign Story</Text>
            <Text style={styles.storyText}>
              {fundraiserData.description || 'No description available.'}
            </Text>
          </View>

          {/* Organized By */}
          {(collectiveData || fundraiserData.collective_name) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Organized By</Text>
              <TouchableOpacity
                onPress={() => {
                  const collectiveId = typeof fundraiserData.collective === 'object'
                    ? fundraiserData.collective.id
                    : fundraiserData.collective;
                  (navigation as any).navigate('GroupCRWD', {
                    id: collectiveId,
                  });
                }}
                style={styles.organizedByCard}
                activeOpacity={0.7}
              >
                <Avatar size={56}>
                  <AvatarImage src={collectiveData?.image} />
                  <AvatarFallback
                    style={{ backgroundColor: getConsistentColor(collectiveData?.id || fundraiserData.collective, collectiveData?.name || fundraiserData.collective_name) }}
                    textStyle={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}
                  >
                    {getInitials(collectiveData?.name || fundraiserData.collective_name || 'Collective')}
                  </AvatarFallback>
                </Avatar>
                <View style={styles.organizedByInfo}>
                  <Text style={styles.organizedByName}>
                    {collectiveData?.name || fundraiserData.collective_name}
                  </Text>
                  {collectiveData && (
                    <Text style={styles.organizedByMembers}>
                      {collectiveData.members_count || 0} member{(collectiveData.members_count || 0) !== 1 ? 's' : ''}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Supporting Nonprofits */}
          {fundraiserData.causes && fundraiserData.causes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Supporting {fundraiserData.causes.length} Nonprofit{fundraiserData.causes.length !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.sectionSubtitle}>
                Your donation will be split evenly among these organizations:
              </Text>
              <View style={styles.causesList}>
                {fundraiserData.causes.map((cause: any) => {
                  const avatarBgColor = getConsistentColor(cause.id, cause.name);
                  const initials = getInitials(cause.name || 'Nonprofit');
                  return (
                    <TouchableOpacity
                      key={cause.id}
                      onPress={() => {
                        (navigation as any).navigate('CauseScreen', { id: cause.id });
                      }}
                      style={styles.causeCard}
                      activeOpacity={0.7}
                    >
                      <Avatar size={48}>
                        <AvatarImage src={cause.image} />
                        <AvatarFallback
                          style={{ backgroundColor: avatarBgColor }}
                          textStyle={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' }}
                        >
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <View style={styles.causeInfo}>
                        <Text style={styles.causeName}>{cause.name}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Recent Supporters */}
          {fundraiserData.recent_donors && fundraiserData.recent_donors.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Supporters</Text>
              <View style={styles.supportersList}>
                {fundraiserData.recent_donors.slice(0, 5).map((donor: any) => {
                  const displayName = donor.name || 'Anonymous';
                  const avatarBgColor = donor.color || getConsistentColor(donor.id, displayName);
                  const initials = getInitials(displayName);
                  return (
                    <TouchableOpacity
                      key={donor.id}
                      onPress={() => {
                        (navigation as any).navigate('UserProfile', { id: donor.id });
                      }}
                      style={styles.supporterCard}
                      activeOpacity={0.7}
                    >
                      <Avatar size={40}>
                        <AvatarImage src={donor.image} />
                        <AvatarFallback
                          style={{ backgroundColor: avatarBgColor }}
                          textStyle={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}
                        >
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <View style={styles.supporterInfo}>
                        <Text style={styles.supporterName}>{displayName}</Text>
                        {donor.latest_donation_date && (
                          <Text style={styles.supporterDate}>
                            {formatDistanceToNow(new Date(donor.latest_donation_date), { addSuffix: true })}
                          </Text>
                        )}
                      </View>
                      {donor.amount_donated && (
                        <Text style={styles.supporterAmount}>
                          ${formatCurrency(donor.amount_donated)}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Spacer for fixed footer */}
          <View style={styles.footerSpacer} />
        </View>
      </ScrollView>

      {/* Footer - Donation Input */}
      <View style={styles.footer}>
        <View style={styles.donationInputContainer}>
          <View style={styles.donationInputWrapper}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              style={styles.donationInput}
              value={donationAmount}
              onChangeText={(text) => {
                // Only allow numbers
                const numericValue = text.replace(/[^0-9]/g, '');
                setDonationAmount(numericValue);
              }}
              placeholder="25"
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <TouchableOpacity
            onPress={handleDonate}
            disabled={!donationAmount || parseFloat(donationAmount) <= 0}
            style={[
              styles.donateButton,
              (!donationAmount || parseFloat(donationAmount) <= 0) && styles.donateButtonDisabled,
            ]}
            activeOpacity={0.7}
          >
            <Text style={styles.donateButtonText}>Donate to Campaign</Text>
          </TouchableOpacity>
        </View>
      </View>
      <SharePost
        ref={shareSheetRef}
        url={`${WEB_BASE_URL}/fundraiser/${encodePostId(fundraiserId)}`}
        title={''}
        message={''}
      />
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
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    fontFamily: 'Outfit-SemiBold',
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Outfit-Regular',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Outfit-SemiBold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerContainer: {
    position: 'relative',
    minHeight: 200,
  },
  bannerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    width: '100%',
  },
  bannerOverlay: {
    flex: 1,
  },
  headerContent: {
    position: 'relative',
    zIndex: 10,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  dropdownContainer: {
    position: 'relative',
  },
  dropdown: {
    position: 'absolute',
    top: 48,
    right: 0,
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Outfit-Regular',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  amountRaised: {
    fontSize: 28,
    fontWeight: 'bold',
    color: PrimaryBlue,
    fontFamily: 'Outfit-Bold',
  },
  amountGoal: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: PrimaryBlue,
    borderRadius: 4,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'Outfit-Bold',
  },
  collectiveTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  collectiveTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: PrimaryBlue,
    fontFamily: 'Outfit-Medium',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: 'Outfit-Medium',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Outfit-Bold',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    fontFamily: 'Outfit-Bold',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    fontFamily: 'Outfit-Regular',
  },
  storyText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    fontFamily: 'Outfit-Regular',
  },
  organizedByCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
  },
  organizedByInfo: {
    flex: 1,
  },
  organizedByName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Outfit-Bold',
  },
  organizedByMembers: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
  causesList: {
    gap: 12,
  },
  causeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
  },
  causeInfo: {
    flex: 1,
  },
  causeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Outfit-Bold',
  },
  supportersList: {
    gap: 12,
  },
  supporterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
  },
  supporterInfo: {
    flex: 1,
  },
  supporterName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Outfit-Bold',
  },
  supporterDate: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
  supporterAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PrimaryBlue,
    fontFamily: 'Outfit-Bold',
  },
  footerSpacer: {
    height: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  donationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  donationInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  dollarSign: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginRight: 4,
    fontFamily: 'Outfit-Medium',
  },
  donationInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    padding: 0,
    fontFamily: 'Outfit-Regular',
  },
  donateButton: {
    backgroundColor: PrimaryBlue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donateButtonDisabled: {
    backgroundColor: '#D1D5DB',
    opacity: 0.5,
  },
  donateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Outfit-SemiBold',
  },
});

