import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueries } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/store';
import { getCollectives, getCauses } from '../services/api/crwd';
import { getDonationBox } from '../services/api/donation';
import { getNotifications } from '../services/api/notification';
import { getUserProfileById } from '../services/api/social';
import HomeHeader from '../components/HomeHeader';
import HelloGreeting from '../components/newHome/HelloGreeting';
import MyDonationBoxCard from '../components/newHome/MyDonationBoxCard';
import DonationBoxPrompt from '../components/newHome/DonationBoxPrompt';
import CollectiveCarouselCard from '../components/newHome/CollectiveCarouselCard';
import NewSuggestedCollectives from '../components/newHome/NewSuggestedCollectives';
import NewFeaturedNonprofits from '../components/newHome/NewFeaturedNonprofits';
import CommunityUpdates from '../components/newHome/CommunityUpdates';
import ExploreCards from '../components/newHome/ExploreCards';
import Footer from '../components/Footer';

export default function NewHome() {
  const { user, token } = useAuthStore();
  const navigation = useNavigation();

  // Fetch collectives data using React Query
  const { data: collectivesData, isLoading: collectivesLoading } = useQuery({
    queryKey: ['collectives'],
    queryFn: getCollectives,
    enabled: true,
  });

  // Fetch nonprofits/causes data using React Query
  const { data: nonprofitsData, isLoading: nonprofitsLoading } = useQuery({
    queryKey: ['nonprofitts'],
    queryFn: getCauses,
    enabled: true,
  });

  // Fetch donation box data
  const { data: donationBoxData, isLoading: donationBoxLoading } = useQuery({
    queryKey: ['donationBox', user?.id],
    queryFn: getDonationBox,
    enabled: !!user?.id && !!token?.access_token,
  });

  // Fetch community updates (notifications)
  const { data: notificationsData, isLoading: notificationsLoading } = useQuery({
    queryKey: ['notifications', 'community'],
    queryFn: getNotifications,
    enabled: !!token?.access_token,
  });

  // Extract unique user IDs from community notifications
  const uniqueUserIds = useMemo(() => {
    const communityNotifications =
      notificationsData?.results?.filter((n: any) => n.type === 'community') || [];
    return Array.from(
      new Set(
        communityNotifications
          .slice(0, 5)
          .map((notification: any) => {
            const usernameMatch = notification.body?.match(/@(\w+)/);
            if (usernameMatch) {
              return (
                notification.data?.donor_id ||
                notification.data?.follower_id ||
                notification.data?.creator_id ||
                notification.data?.new_member_id ||
                null
              );
            }
            return (
              notification.data?.donor_id ||
              notification.data?.follower_id ||
              notification.data?.creator_id ||
              notification.data?.new_member_id ||
              null
            );
          })
          .filter((id: any) => id !== null)
      )
    ) as (string | number)[];
  }, [notificationsData]);

  // Fetch user profiles for all unique user IDs
  const userProfileQueries = useQueries({
    queries: uniqueUserIds.map((userId: string | number) => ({
      queryKey: ['userProfile', userId],
      queryFn: () => getUserProfileById(userId.toString()),
      enabled: !!token?.access_token && !!userId,
    })),
  });

  // Create a map of user ID to user profile (reactive to query results)
  const userProfilesMap = useMemo(() => {
    const map = new Map();
    userProfileQueries.forEach((query, index) => {
      if (query.data && uniqueUserIds[index]) {
        map.set(uniqueUserIds[index].toString(), query.data);
      }
    });
    return map;
  }, [userProfileQueries, uniqueUserIds]);

  // Transform API data to match component's expected format
  const transformedCollectives =
    collectivesData?.results?.map((collective: any) => {
      const founderName = collective.created_by
        ? `${collective.created_by.first_name || ''} ${collective.created_by.last_name || ''}`.trim()
        : 'Unknown';

      return {
        id: collective.id,
        name: collective.name || 'Unknown Collective',
        iconColor: collective.color, // Use color from API if available
        icon: collective.logo || undefined, // Use logo from API if available
        founder: {
          name: founderName,
          profile_picture: collective.created_by?.profile_picture || '',
        },
        nonprofit_count:
          collective.causes_count ||
          collective.supported_causes_count ||
          collective.cause_count ||
          0,
        description: collective.description || 'No description available',
      };
    }) || [];

  // Transform nonprofits data to match component's expected format
  const transformedNonprofits =
    nonprofitsData?.results?.map((nonprofit: any) => ({
      id: nonprofit.id,
      name: nonprofit.name || 'Unknown Nonprofit',
      image: nonprofit.image || '',
      description: nonprofit.mission || nonprofit.description || '',
      mission: nonprofit.mission || '',
    })) || [];

  // Check if donation box exists
  // API returns {"status_code":200,"message":"Donation box not found"} when not set up
  const isDonationBoxNotFound = donationBoxData?.message === 'Donation box not found';
  const isDonationBoxActive = donationBoxData?.is_active === true;

  // Transform donation box data
  const donationBoxInfo =
    donationBoxData && !isDonationBoxNotFound && isDonationBoxActive
      ? {
          monthlyAmount: donationBoxData.monthly_amount || donationBoxData.amount || 10,
          causeCount:
            (donationBoxData.manual_causes?.length || 0) +
            (donationBoxData.attributing_collectives?.length || 0),
        }
      : null;

  // Get cause count for inactive donation box - count unique causes from box_causes
  const inactiveBoxCauseCount =
    donationBoxData && !isDonationBoxNotFound && !isDonationBoxActive
      ? (() => {
          const boxCauses = donationBoxData.box_causes || [];
          const uniqueCauseIds = new Set(
            boxCauses.map((bc: any) => bc.cause?.id).filter(Boolean)
          );
          return uniqueCauseIds.size || 0;
        })()
      : 0;

  // Transform attributing collectives from donation box for carousel (priority)
  const transformedAttributingCollectives = useMemo(() => {
    if (
      donationBoxData &&
      !isDonationBoxNotFound &&
      donationBoxData.attributing_collectives
    ) {
      return donationBoxData.attributing_collectives.map((collective: any) => {
        // Calculate cause count from box_causes that have this collective in attributed_collectives
        const attributedCauseCount =
          donationBoxData.box_causes?.filter(
            (boxCause: any) =>
              boxCause.attributed_collectives?.includes(collective.id) ||
              boxCause.attributed_collectives?.includes(collective.id.toString())
          ).length || 0;

        // Check if current user is the creator
        const isAdmin = collective.creator?.id === user?.id;

        return {
          id: collective.id,
          name: collective.name || 'Unknown Collective',
          memberCount: collective.member_count || 0,
          yearlyAmount: parseFloat(collective.total_donated || '0') * 12, // Convert monthly to yearly estimate
          causeCount: attributedCauseCount || 0,
          role: isAdmin ? 'Admin' : 'Member',
          image: collective.logo || collective.creator?.profile_picture || '',
        };
      });
    }
    return [];
  }, [donationBoxData, isDonationBoxNotFound, user?.id]);

  // Transform notifications data for community updates
  // Only show type "community" (not "community_post")
  // Use useMemo to make it reactive to userProfilesMap changes
  const transformedCommunityUpdates = useMemo(() => {
    return (
      notificationsData?.results
        ?.filter((notification: any) => notification.type === 'community')
        .map((notification: any) => {
          // Extract username from body if it contains @username pattern
          let username = '';
          const usernameMatch = notification.body?.match(/@(\w+)/);
          if (usernameMatch) {
            username = usernameMatch[1];
          } else {
            // Fallback to data fields
            username =
              notification.data?.follower_username ||
              notification.data?.donor_id ||
              notification.data?.creator_id ||
              notification.data?.new_member_id ||
              'unknown';
          }

          let collectiveName = '';
          if (notification.body) {
            // Try pattern: "to [collective name]" (for donations)
            const toMatch = notification.body.match(/to (.+)$/);
            if (toMatch) {
              collectiveName = toMatch[1].trim();
            } else {
              // Try pattern: "in [collective name]"
              const inMatch = notification.body.match(/in (.+)$/);
              if (inMatch) {
                collectiveName = inMatch[1].trim();
              } else if (notification.body.includes('joined')) {
                // Try pattern: "joined [collective name]"
                const joinMatch = notification.body.match(/joined (.+)$/);
                if (joinMatch) {
                  collectiveName = joinMatch[1].trim();
                }
              }
            }
          }

          // If not found in body, try extracting from title
          if (!collectiveName && notification.title) {
            const titleMatch = notification.title.match(/in (.+)$/);
            if (titleMatch) {
              collectiveName = titleMatch[1].trim();
            }
          }

          // Extract user ID from notification data
          const userId =
            notification.data?.donor_id ||
            notification.data?.follower_id ||
            notification.data?.creator_id ||
            notification.data?.new_member_id ||
            username;

          // Get user profile from the fetched profiles map
          const userProfile = userId ? userProfilesMap.get(userId.toString()) : null;

          // Use first_name and last_name from profile, fallback to username
          // Handle both flat structure and nested "user" structure
          const profileUser = userProfile?.user || userProfile;
          let firstName = profileUser?.first_name || '';
          let lastName = profileUser?.last_name || '';
          let fullName = '';

          if (firstName && lastName) {
            fullName = `${firstName} ${lastName}`;
          } else if (profileUser?.full_name) {
            fullName = profileUser.full_name;
          } else {
            fullName = username || 'Unknown User';
          }

          // Get avatar from profile if available
          const avatar = profileUser?.profile_picture || '';

          // Extract cleaner action text (remove @username from body)
          let actionText = notification.body || notification.message || '';
          if (actionText && username) {
            // Remove @username from the beginning
            actionText = actionText.replace(`@${username} `, '').trim();
            // Capitalize first letter
            actionText = actionText.charAt(0).toUpperCase() + actionText.slice(1);
          }

          // Check if this is a join notification
          const isJoinNotification =
            notification.body?.toLowerCase().includes('joined') ||
            notification.data?.new_member_id !== undefined ||
            notification.title?.toLowerCase().includes('new member');

          return {
            id: notification.id,
            user: {
              id: userId,
              name: fullName,
              firstName: firstName,
              lastName: lastName,
              username: username,
              avatar: avatar,
            },
            collective: collectiveName
              ? {
                  name: collectiveName,
                }
              : undefined,
            content: actionText,
            timestamp: notification.created_at || notification.timestamp,
            likesCount: 0, // Not available in notification API
            commentsCount: 0, // Not available in notification API
            postId: notification.data?.post_id || null, // Extract post_id if available
            isJoinNotification: isJoinNotification, // Flag for join notifications
          };
        }) || []
    );
  }, [notificationsData, userProfilesMap]);

  // Split community updates into three sections
  const firstTwoUpdates = transformedCommunityUpdates.slice(0, 2);
  const nextTwoUpdates = transformedCommunityUpdates.slice(2, 4);
  const remainingUpdates = transformedCommunityUpdates.slice(4);

  if (!user?.id) {
    // TODO: Show guest home or redirect
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <HomeHeader />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Personalized Greeting */}

          {/* My Donation Box Card or Prompt */}
          {token?.access_token && (
            <>
              {donationBoxLoading ? (
                <View style={styles.loadingCard}>
                  <ActivityIndicator size="large" color="#1600ff" />
                </View>
              ) : donationBoxInfo ? (
                <>
                  <HelloGreeting />
                  <MyDonationBoxCard
                    monthlyAmount={donationBoxInfo.monthlyAmount}
                    causeCount={donationBoxInfo.causeCount}
                  />
                </>
              ) : donationBoxData &&
                !isDonationBoxNotFound &&
                !isDonationBoxActive &&
                inactiveBoxCauseCount > 0 ? (
                // Donation box exists but is not active - show prompt with cause count
                <DonationBoxPrompt causeCount={inactiveBoxCauseCount} />
              ) : (
                <DonationBoxPrompt />
              )}
            </>
          )}

          {/* Collective Carousel Card - Only show when donation box is active */}
          {token?.access_token && isDonationBoxActive && (
            <>
              {donationBoxLoading ? (
                <View style={styles.loadingCard}>
                  <ActivityIndicator size="large" color="#1600ff" />
                </View>
              ) : transformedAttributingCollectives.length > 0 ? (
                <CollectiveCarouselCard collectives={transformedAttributingCollectives} />
              ) : null}
            </>
          )}

          {/* First 2 Community Updates - Above Featured Nonprofits */}
          {token?.access_token && (
            <>
              {notificationsLoading ? (
                <View style={styles.loadingCard}>
                  <ActivityIndicator size="large" color="#1600ff" />
                </View>
              ) : firstTwoUpdates.length > 0 ? (
                <CommunityUpdates updates={firstTwoUpdates} showHeading={true} />
              ) : null}
            </>
          )}

          {/* Featured Nonprofits Section */}
          {nonprofitsLoading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#1600ff" />
            </View>
          ) : (
            <NewFeaturedNonprofits
              nonprofits={transformedNonprofits}
              seeAllLink="/search"
            />
          )}

          {/* Next 2 Community Updates - Above Suggested Collectives */}
          {token?.access_token && (
            <>
              {notificationsLoading ? null : nextTwoUpdates.length > 0 ? (
                <CommunityUpdates updates={nextTwoUpdates} showHeading={false} />
              ) : null}
            </>
          )}

          {/* Suggested Collectives Section */}
          {collectivesLoading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#1600ff" />
            </View>
          ) : (
            <NewSuggestedCollectives
              collectives={transformedCollectives}
              seeAllLink="/search"
            />
          )}

          {/* Remaining Community Updates - Below Suggested Collectives */}
          {token?.access_token && (
            <>
              {notificationsLoading ? null : remainingUpdates.length > 0 ? (
                <CommunityUpdates updates={remainingUpdates} showHeading={false} />
              ) : null}
            </>
          )}

          {/* Explore Cards */}
          <ExploreCards />

          {/* Footer */}
          <Footer />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  mainContent: {
    backgroundColor: '#F0F9FF', // Gradient equivalent: from-blue-50 via-purple-50 to-pink-50
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  loadingCard: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

