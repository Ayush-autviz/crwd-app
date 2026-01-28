import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useQuery, useQueries, useMutation } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/store';
import { getCollectives, getCauses, getJoinCollective } from '../services/api/crwd';
import { getDonationBox } from '../services/api/donation';
import { getNotifications, registerNotificationToken } from '../services/api/notification';
import { getUserProfileById } from '../services/api/social';
import messaging from '@react-native-firebase/messaging';
import HomeHeader from '../components/HomeHeader';
import HelloGreeting from '../components/newHome/HelloGreeting';
import MyDonationBoxCard from '../components/newHome/MyDonationBoxCard';
import DonationBoxPrompt from '../components/newHome/DonationBoxPrompt';
import CollectiveCarouselCard from '../components/newHome/CollectiveCarouselCard';
import CreateCollectiveCard from '../components/newHome/CreateCollectiveCard';
import NewSuggestedCollectives from '../components/newHome/NewSuggestedCollectives';
import NewFeaturedNonprofits from '../components/newHome/NewFeaturedNonprofits';
import CommunityUpdates from '../components/newHome/CommunityUpdates';
import CommunityPosts from '../components/newHome/CommunityPosts';
import ExploreCards from '../components/newHome/ExploreCards';
import CommentsBottomSheet from '../components/post/CommentsBottomSheet';

import GuestHome from '../components/GuestHome';

export default function NewHome() {
  const { user, token } = useAuthStore();
  const navigation = useNavigation();
  const [showCommentsSheet, setShowCommentsSheet] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  // FCM token send to backend
  const sendFcmTokenToBackend = useMutation({
    mutationFn: registerNotificationToken,
    onSuccess: (data) => {
      console.log('FCM token sent to backend successfully:', data);
    },
    onError: (error: any) => {
      console.error('Error sending FCM token to backend:', error);
    },
  });

  const requestNotificationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Notification permission granted');
        return true;
      } else {
        console.log('Notification permission denied');
        return false;
      }
    }
    return true; // iOS doesn't need explicit permission request here
  };

  const getFcmTokenAndSendToBackend = async () => {
    try {
      // Only proceed if user is logged in
      if (!user?.id || !token?.access_token) {
        console.log('User not logged in, skipping FCM token registration');
        return;
      }

      // Request permission first
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        console.log('Cannot get FCM token: permission denied');
        return;
      }

      // Get FCM token from Firebase
      await messaging().registerDeviceForRemoteMessages();
      const fcmToken = await messaging().getToken();
      console.log('FCM TOKEN in NewHome:', fcmToken);

      // Only send to backend if token exists and is not empty
      if (fcmToken && fcmToken.trim().length > 0) {
        sendFcmTokenToBackend.mutate({ token: fcmToken, device_type: Platform.OS === 'ios' ? 'ios' : 'android' });
      } else {
        console.log('FCM token is empty, skipping API call');
      }
    } catch (error) {
      console.error('❌ Error getting FCM token:', error);
    }
  };

  useEffect(() => {
    getFcmTokenAndSendToBackend();
  }, [user?.id, token?.access_token]);

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

  // Fetch joined collectives
  const { data: joinedCollectivesData, isLoading: joinedCollectivesLoading } = useQuery({
    queryKey: ['joinedCollectives', user?.id],
    queryFn: () => {
      if (!user?.id) {
        throw new Error('User ID is required');
      }
      return getJoinCollective(user.id.toString());
    },
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
    try {
      const communityNotifications =
        Array.isArray(notificationsData?.results)
          ? notificationsData.results.filter((n: any) => n?.type === 'community')
          : [];
      return Array.from(
        new Set(
          communityNotifications
            .slice(0, 5)
            .map((notification: any) => {
              if (!notification) return null;
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
            .filter((id: any) => id !== null && id !== undefined)
        )
      ) as (string | number)[];
    } catch (error) {
      console.error('Error extracting unique user IDs:', error);
      return [];
    }
  }, [notificationsData]);

  // Fetch user profiles for all unique user IDs
  const userProfileQueries = useQueries({
    queries: Array.isArray(uniqueUserIds) && uniqueUserIds.length > 0
      ? uniqueUserIds
        .filter((userId) => userId !== null && userId !== undefined)
        .map((userId: string | number) => ({
          queryKey: ['userProfile', userId],
          queryFn: () => {
            try {
              return getUserProfileById(userId.toString());
            } catch (error) {
              console.error(`Error fetching user profile for ${userId}:`, error);
              throw error;
            }
          },
          enabled: !!token?.access_token && !!userId,
          retry: 1,
        }))
      : [],
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
  const transformedCollectives = useMemo(() => {
    try {
      if (!Array.isArray(collectivesData?.results)) {
        return [];
      }
      return collectivesData.results
        .filter((collective: any) => collective && collective.id)
        .map((collective: any) => {
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
              color: collective.created_by?.color || '',
            },
            nonprofit_count:
              collective.causes_count ||
              collective.supported_causes_count ||
              collective.cause_count ||
              0,
            description: collective.description || 'No description available',
          };
        });
    } catch (error) {
      console.error('Error transforming collectives:', error);
      return [];
    }
  }, [collectivesData]);

  // Transform nonprofits data to match component's expected format
  const transformedNonprofits = useMemo(() => {
    try {
      if (!Array.isArray(nonprofitsData?.results)) {
        return [];
      }
      return nonprofitsData.results
        .filter((nonprofit: any) => nonprofit && nonprofit.id)
        .map((nonprofit: any) => ({
          id: nonprofit.id,
          name: nonprofit.name || 'Unknown Nonprofit',
          image: nonprofit.image || '',
          description: nonprofit.mission || nonprofit.description || '',
          mission: nonprofit.mission || '',
        }));
    } catch (error) {
      console.error('Error transforming nonprofits:', error);
      return [];
    }
  }, [nonprofitsData]);

  // Get list of joined collective IDs to filter them out from suggested collectives
  const joinedCollectiveIds = useMemo(() => {
    try {
      if (Array.isArray(joinedCollectivesData?.data)) {
        return new Set(
          joinedCollectivesData.data
            .filter((item: any) => item && item.collective && item.collective.id)
            .map((item: any) => item.collective.id)
        );
      }
      return new Set();
    } catch (error) {
      console.error('Error extracting joined collective IDs:', error);
      return new Set();
    }
  }, [joinedCollectivesData]);

  // Filter out collectives that user has already joined
  const filteredSuggestedCollectives = useMemo(() => {
    return transformedCollectives.filter((collective: any) => !joinedCollectiveIds.has(collective.id));
  }, [transformedCollectives, joinedCollectiveIds]);

  // Check if donation box exists
  // API returns {"status_code":200,"message":"Donation box not found"} when not set up
  const isDonationBoxNotFound = donationBoxData?.message === 'Donation box not found';
  const isDonationBoxActive = donationBoxData?.is_active === true;

  // Get list of cause IDs from donation box to filter them out from featured nonprofits
  const donationBoxCauseIds = useMemo(() => {
    try {
      if (donationBoxData && !isDonationBoxNotFound && Array.isArray(donationBoxData.box_causes)) {
        return new Set(
          donationBoxData.box_causes
            .filter((boxCause: any) => boxCause && boxCause.cause)
            .map((boxCause: any) => boxCause.cause?.id)
            .filter((id: any) => id != null && id !== undefined)
        );
      }
      return new Set();
    } catch (error) {
      console.error('Error extracting donation box cause IDs:', error);
      return new Set();
    }
  }, [donationBoxData, isDonationBoxNotFound]);

  // Filter out nonprofits that are already in the donation box
  const filteredFeaturedNonprofits = useMemo(() => {
    return transformedNonprofits.filter((nonprofit: any) => !donationBoxCauseIds.has(nonprofit.id));
  }, [transformedNonprofits, donationBoxCauseIds]);

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
  const inactiveBoxCauseCount = useMemo(() => {
    try {
      if (donationBoxData && !isDonationBoxNotFound && !isDonationBoxActive) {
        const boxCauses = Array.isArray(donationBoxData.box_causes)
          ? donationBoxData.box_causes
          : [];
        const uniqueCauseIds = new Set(
          boxCauses
            .filter((bc: any) => bc && bc.cause && bc.cause.id)
            .map((bc: any) => bc.cause.id)
        );
        return uniqueCauseIds.size || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error calculating inactive box cause count:', error);
      return 0;
    }
  }, [donationBoxData, isDonationBoxNotFound, isDonationBoxActive]);

  // Transform joined collectives for carousel
  const transformedAttributingCollectives = useMemo(() => {
    if (joinedCollectivesData?.data && Array.isArray(joinedCollectivesData.data)) {
      return joinedCollectivesData.data
        .filter((item: any) => item && item.collective) // Filter out invalid items
        .map((item: any) => {
          const collective = item.collective;
          // Check if user is admin (role is "admin" from API)
          const isAdmin = item.role === 'admin';

          return {
            id: collective?.id || '',
            name: collective?.name || 'Unknown Collective',
            memberCount: collective?.member_count || 0,
            yearlyAmount: parseFloat(collective?.total_donated || '0') * 12, // Convert monthly to yearly estimate
            causeCount: collective?.causes_count || 0,
            role: isAdmin ? 'Admin' : 'Member',
            image: collective?.logo || collective?.created_by?.profile_picture || '',
            logo: collective?.logo || undefined,
            color: collective?.color || undefined,
          };
        });
    }
    return [];
  }, [joinedCollectivesData]);

  // Transform notifications data for community updates
  // Only show type "community" (not "community_post")
  // Filter out items with postId (post type items)
  // Use useMemo to make it reactive to userProfilesMap changes
  const transformedCommunityUpdates = useMemo(() => {
    try {
      if (!Array.isArray(notificationsData?.results)) {
        return [];
      }
      return notificationsData.results
        .filter((notification: any) =>
          notification &&
          notification.type === 'community' &&
          !notification.data?.post_id // Filter out post type items
        )
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

          // Extract collective ID from notification data if available
          const collectiveId = notification.data?.collective_id ||
            notification.data?.collectiveId ||
            notification.data?.crwd_id ||
            null;

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
                id: collectiveId,
              }
              : undefined,
            content: actionText,
            timestamp: notification.created_at || notification.timestamp,
            likesCount: 0, // Not available in notification API
            commentsCount: 0, // Not available in notification API
            postId: notification.data?.post_id || null, // Extract post_id if available
            isJoinNotification: isJoinNotification, // Flag for join notifications
            data: {
              profile_picture: notification.data?.user_profile_picture,
              color: notification.data?.user_color,
            }
          };
        });
    } catch (error) {
      console.error('Error transforming community updates:', error);
      return [];
    }
  }, [notificationsData, userProfilesMap]);

  // All community updates (no splitting needed - show all below suggested collectives)
  const allCommunityUpdates = transformedCommunityUpdates;

  if (!user?.id) {
    return <GuestHome />;
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
          <LinearGradient
            colors={['#EFF6FF', '#FAF5FF', '#FDF2F8']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradientContainer}
          >
            <View style={styles.gradientContent}>
              {token?.access_token ? (
                <>
                  {donationBoxLoading ? (
                    <View style={styles.loadingCard}>
                      <ActivityIndicator size="large" color="#1600ff" />
                    </View>
                  ) : donationBoxInfo ? (
                    <>
                      <HelloGreeting />
                      <MyDonationBoxCard
                        monthlyAmount={donationBoxInfo.monthlyAmount || 10}
                        causeCount={donationBoxInfo.causeCount || 0}
                      />
                    </>
                  ) : donationBoxData &&
                    !isDonationBoxNotFound &&
                    !isDonationBoxActive &&
                    inactiveBoxCauseCount > 0 ? (
                    // Donation box exists but is not active - show prompt with cause count
                    <DonationBoxPrompt
                      causeCount={inactiveBoxCauseCount}
                      hasJoinedCollectives={(transformedAttributingCollectives?.length || 0) > 0}
                    />
                  ) : (
                    <DonationBoxPrompt
                      hasJoinedCollectives={(transformedAttributingCollectives?.length || 0) > 0}
                    />
                  )}

                  {/* Collective Carousel Card - Show joined collectives or Create Collective Card */}
                  <View style={{ width: '100%' }} collapsable={false}>
                    {/* Loading */}
                    <View
                      style={[
                        { width: '100%' },
                        !joinedCollectivesLoading && { display: 'none' },
                      ]}
                    >
                      <View style={styles.loadingCard}>
                        <ActivityIndicator size="large" color="#1600ff" />
                      </View>
                    </View>

                    {/* Carousel */}
                    <View
                      style={[
                        { width: '100%' },
                        (joinedCollectivesLoading ||
                          !transformedAttributingCollectives ||
                          transformedAttributingCollectives.length === 0) &&
                        { display: 'none' },
                      ]}
                    >
                      <CollectiveCarouselCard
                        collectives={transformedAttributingCollectives ?? []}
                      />
                    </View>

                    {/* Create */}
                    <View
                      style={[
                        { width: '100%' },
                        (joinedCollectivesLoading ||
                          (transformedAttributingCollectives &&
                            transformedAttributingCollectives.length > 0)) &&
                        { display: 'none' },
                      ]}
                    >
                      <CreateCollectiveCard />
                    </View>
                  </View>


                </>
              ) : null}
            </View>
          </LinearGradient>



          {/* 2 Posts - Above Featured Nonprofits */}
          {token?.access_token && (
            <CommunityPosts
              limit={2}
              startIndex={0}
              showHeading={true}
              onCommentPress={(post) => {
                // Find the original post data to get firstName and lastName
                setSelectedPost({
                  id: typeof post.id === 'string' ? parseInt(post.id) : post.id,
                  username: post.user?.username || post.username || 'Unknown User',
                  text: post.content || post.text || '',
                  avatarUrl: post.user?.avatar || post.user?.profile_picture || post.avatarUrl || '',
                  firstName: post.user?.first_name || post.user?.firstName || post.firstName,
                  lastName: post.user?.last_name || post.user?.lastName || post.lastName,
                });
                setShowCommentsSheet(true);
              }}
            />
          )}

          {/* Featured Nonprofits Section */}
          {nonprofitsLoading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#1600ff" />
            </View>
          ) : (
            <NewFeaturedNonprofits
              nonprofits={filteredFeaturedNonprofits}
              seeAllLink="/search"
            />
          )}

          {/* 1 Post - After Featured Nonprofits */}
          {token?.access_token && (
            <CommunityPosts
              limit={1}
              startIndex={2}
              showHeading={false}
              onCommentPress={(post) => {
                // Find the original post data to get firstName and lastName
                setSelectedPost({
                  id: typeof post.id === 'string' ? parseInt(post.id) : post.id,
                  username: post.user?.username || post.username || 'Unknown User',
                  text: post.content || post.text || '',
                  avatarUrl: post.user?.avatar || post.user?.profile_picture || post.avatarUrl || '',
                  firstName: post.user?.first_name || post.user?.firstName || post.firstName,
                  lastName: post.user?.last_name || post.user?.lastName || post.lastName,
                });
                setShowCommentsSheet(true);
              }}
            />
          )}

          {/* Suggested Collectives Section */}
          {collectivesLoading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#1600ff" />
            </View>
          ) : (
            <NewSuggestedCollectives
              collectives={filteredSuggestedCollectives}
              seeAllLink="/search"
            />
          )}

          {/* All Community Updates - Below Suggested Collectives */}
          {token?.access_token && (
            <>
              {notificationsLoading ? null : allCommunityUpdates.length > 0 ? (
                <CommunityUpdates updates={allCommunityUpdates} showHeading={false} />
              ) : null}
            </>
          )}

          {/* Explore Cards */}
          <ExploreCards />

          {/* Footer */}

          <View />

        </View>
      </ScrollView>

      {/* Comments Bottom Sheet */}
      {selectedPost && (
        <CommentsBottomSheet
          isOpen={showCommentsSheet}
          onClose={() => {
            setShowCommentsSheet(false);
            setSelectedPost(null);
          }}
          post={selectedPost}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradientContainer: {
    flex: 1,
  },
  gradientContent: {
    paddingHorizontal: 16,
    paddingBottom: 12
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  mainContent: {
    // paddingHorizontal: 16,
    paddingBottom: 16,
  },
  loadingCard: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

