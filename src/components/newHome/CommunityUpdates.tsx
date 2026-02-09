import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { HandHeart, Users } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { followUserById, unfollowUserById, getUserProfileById, getPostById } from '../../services/api/social';
import { getJoinCollective } from '../../services/api/crwd';
import { useAuthStore } from '../../store/store';
import { useToast } from '../../contexts/ToastContext';
import PostResultCard from '../newsearch/PostResultCard';

interface CommunityUpdate {
  id: string | number;
  user: {
    id?: string | number;
    name: string;
    firstName?: string;
    lastName?: string;
    username: string;
    avatar?: string;
    color?: string;
  };
  collective?: {
    name: string;
    id?: string | number;
  };
  content: string;
  timestamp?: string;
  likesCount?: number;
  commentsCount?: number;
  postId?: string | number | null;
  isJoinNotification?: boolean;
  data?: {
    profile_picture?: string;
    color?: string;
    new_member_id?: string | number;
    collective_id?: string | number;
    type?: string;
    user_color?: string;
    user_profile_picture?: string | null;
  };
}

interface CommunityUpdatesProps {
  updates?: CommunityUpdate[];
  showHeading?: boolean;
  isFeedItem?: boolean;
}

// Component to display full post when postId exists
function PostWithData({ update }: { update: CommunityUpdate }) {
  const { data: postData, isLoading } = useQuery({
    queryKey: ['post', update.postId],
    queryFn: () => getPostById(update.postId?.toString() || ''),
    enabled: !!update.postId,
  });

  if (isLoading) {
    return (
      <View style={styles.loadingCard}>
        <View style={styles.loadingContent}>
          <View style={styles.loadingAvatar} />
          <View style={styles.loadingTextContainer}>
            <View style={styles.loadingText} />
            <View style={[styles.loadingText, { width: '60%' }]} />
            <View style={styles.loadingImage} />
          </View>
        </View>
      </View>
    );
  }

  if (!postData) {
    // Fallback to notification summary if post not found
    return <NotificationSummary update={update} />;
  }

  // Transform post data to match PostResultCard format
  const post = {
    id: postData.id,
    content: postData.content || '',
    media: postData.media || undefined,
    preview_details: postData.preview_details || null,
    created_at: postData.created_at || update.timestamp || new Date().toISOString(),
    likes_count: postData.likes_count || 0,
    comments_count: postData.comments_count || 0,
    is_liked: postData.is_liked || false,
    user: postData.user ? {
      id: postData.user.id,
      username: postData.user.username || update.user.username,
      first_name: postData.user.first_name || update.user.firstName,
      last_name: postData.user.last_name || update.user.lastName,
      full_name: postData.user.full_name || (update.user.firstName && update.user.lastName ? `${update.user.firstName} ${update.user.lastName}` : undefined),
      profile_picture: postData.user.profile_picture || update.user.avatar || '',
      bio: postData.user.bio,
    } : undefined,
    collective: postData.collective ? {
      id: postData.collective.id,
      name: postData.collective.name,
      description: postData.collective.description,
    } : update.collective ? {
      id: typeof update.collective.id === 'string' ? parseInt(update.collective.id) : (update.collective.id || 0),
      name: update.collective.name,
      description: undefined,
    } : undefined,
  };

  return <PostResultCard post={post} />;
}

// Component to display notification summary
function NotificationSummary({ update }: { update: CommunityUpdate }) {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { user: currentUser, token } = useAuthStore();
  const { showToast } = useToast();
  const actionText = update.content || '';
  const isJoinNotification = update.isJoinNotification || false;
  const isDonationNotification = !isJoinNotification && actionText.toLowerCase().includes('donated');

  // Fetch joined collectives to check if user has already joined
  const { data: joinedCollectivesData } = useQuery({
    queryKey: ['joinedCollectives', currentUser?.id],
    queryFn: () => getJoinCollective(currentUser?.id?.toString() || ''),
    enabled: !!currentUser?.id && !!token?.access_token && !!update.collective?.id,
  });

  // Check if user has already joined this collective
  const hasJoinedCollective = joinedCollectivesData?.data?.some((item: any) =>
    item.collective?.id?.toString() === update.collective?.id?.toString()
  ) || false;

  // Fetch user profile to check follow status
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['userProfile', update.user.id],
    queryFn: () => getUserProfileById(update.user.id?.toString() || ''),
    enabled: !!update.user.id && !!token?.access_token && isDonationNotification && currentUser?.id !== update.user.id,
  });

  // Check if user is being followed
  const isFollowing = userProfile?.is_following || false;

  // Follow user mutation
  const followMutation = useMutation({
    mutationFn: (userId: string) => followUserById(userId),
    onSuccess: () => {
      showToast('Following user');
      queryClient.invalidateQueries({ queryKey: ['userProfile', update.user.id] });
    },
    onError: (error: any) => {
      console.error('Error following user:', error);
      showToast('Failed to follow user. Please try again.');
    },
  });

  // Unfollow user mutation
  const unfollowMutation = useMutation({
    mutationFn: (userId: string) => unfollowUserById(userId),
    onSuccess: () => {
      showToast('Unfollowed user');
      queryClient.invalidateQueries({ queryKey: ['userProfile', update.user.id] });
    },
    onError: (error: any) => {
      console.error('Error unfollowing user:', error);
      showToast('Failed to unfollow user. Please try again.');
    },
  });

  const handleUserNavigation = (userId?: string | number) => {
    if (!userId) return;
    if (currentUser?.id && userId.toString() === currentUser.id.toString()) {
      (navigation as any).navigate('Profile');
    } else {
      (navigation as any).navigate('UserProfile', { userId });
    }
  };

  const handleCollectiveNavigation = (collectiveId?: string | number, collectiveName?: string) => {
    if (collectiveId) {
      (navigation as any).navigate('GroupCRWD', { id: collectiveId });
    } else if (collectiveName) {
      (navigation as any).navigate('Search', {
        searchQuery: collectiveName,
        searchType: 'collective'
      });
    }
  };

  const handleJoinClick = () => {
    if (update.collective?.id) {
      (navigation as any).navigate('GroupCRWD', { id: update.collective.id });
    } else if (update.collective?.name) {
      (navigation as any).navigate('Search', {
        searchQuery: update.collective.name,
        searchType: 'collective'
      });
    }
  };

  const handleFollowClick = () => {
    if (update.user.id && currentUser?.id !== update.user.id) {
      if (isFollowing) {
        unfollowMutation.mutate(update.user.id.toString());
      } else {
        followMutation.mutate(update.user.id.toString());
      }
    }
  };

  // Get user display name
  const userName = update.user.firstName && update.user.lastName
    ? `${update.user.firstName} ${update.user.lastName}`
    : update.user.name || update.user.username;

  // For join notifications, use similar structure to donation but with Users icon
  if (isJoinNotification) {
    // Try to extract nonprofit count from content if available
    // Example patterns: "Supporting 12 nonprofits", "supports 5 causes"
    let nonprofitCount = 0;
    const countMatch = actionText.match(/(\d+)\s*(nonprofit|cause|organization)/i);
    if (countMatch) {
      nonprofitCount = parseInt(countMatch[1], 10);
    }

    // Clean action text - remove the supporting text if it exists
    let cleanActionText = actionText;
    if (countMatch) {
      cleanActionText = actionText.replace(/\s*Supporting\s+\d+\s+nonprofit[s]?/i, '').trim();
    }

    console.log('user in update', update.user);


    return (
      <View style={styles.notificationCard}>
        {/* Top Section: Profile and Action Button */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            {/* Avatar */}
            <Avatar size={44} style={styles.avatar}>
              <AvatarImage src={update.data?.profile_picture} />
              <AvatarFallback
                style={{ backgroundColor: update.data?.color || '#1600ff' }}
                textStyle={{ color: '#FFFFFF', fontSize: 15 }}
              >
                {update.user.name
                  .charAt(0)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* User Info */}
            <View style={styles.userDetails}>
              <View style={styles.nameRow}>
                <TouchableOpacity
                  onPress={() => handleUserNavigation(update.user.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.userName}>{update.user.name}</Text>
                </TouchableOpacity>
                {/* <Text style={styles.username}>@{update.user.username}</Text> */}
              </View>
            </View>
          </View>

          {/* Join Button - Only show if user hasn't joined */}
          {update.collective && !hasJoinedCollective && (
            <TouchableOpacity
              onPress={handleJoinClick}
              style={styles.joinButton}
              activeOpacity={0.7}
            >
              <Text style={styles.joinButtonText}>Join</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Content Box */}
        <View style={styles.contentBox}>
          {/* Icon */}
          <View style={styles.iconContainerJoin}>
            <Users size={20} color="#1600ff" />
          </View>
          <View style={styles.actionTextContainer}>
            {/* Action Text */}
            <Text style={styles.actionText}>
              {isJoinNotification && update.data?.new_member_id && cleanActionText.includes(' joined ') ? (
                <>
                  <Text
                    style={styles.boldText}
                    onPress={() => handleUserNavigation(update.data?.new_member_id)}
                  >
                    {cleanActionText.split(' joined ')[0]}
                  </Text>
                  {' joined '}
                  <Text
                    style={styles.boldText}
                    onPress={() => handleCollectiveNavigation(update.data?.collective_id || update.collective?.id, update.collective?.name)}
                  >
                    {cleanActionText.split(' joined ').slice(1).join(' joined ')}
                  </Text>
                </>
              ) : (
                cleanActionText
              )}
            </Text>
            {/* Supporting X nonprofits - Only on second line if it exists */}
            {nonprofitCount > 0 && (
              <Text style={styles.nonprofitCountText}>
                Supporting {nonprofitCount} nonprofit{nonprofitCount !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  }

  // Default UI for donation and other notifications
  return (
    <View style={styles.notificationCard}>
      {/* Top Section: Profile and Action Button */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {/* Avatar */}
          <Avatar size={44} style={styles.avatar}>
            <AvatarImage src={update.data?.profile_picture} />
            <AvatarFallback
              style={{ backgroundColor: update.data?.color || '#1600ff' }}
              textStyle={{ color: '#FFFFFF', fontSize: 15 }}
            >
              {update.user.name
                .charAt(0)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* User Info */}
          <View style={styles.userDetails}>
            <View style={styles.nameRow}>
              <TouchableOpacity
                onPress={() => handleUserNavigation(update.user.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.userName}>{update.user.name}</Text>
              </TouchableOpacity>
              {/* <Text style={styles.username}>@{update.user.username}</Text> */}
            </View>
            {/* {update.collective && (
              <Text style={styles.collectiveName}>{update.collective.name}</Text>
            )} */}
          </View>
        </View>

        {/* Action Button - Follow for donation notifications */}
        {isDonationNotification && update.user.id && currentUser?.id !== update.user.id && !isFollowing && (
          <TouchableOpacity
            onPress={handleFollowClick}
            disabled={followMutation.isPending || unfollowMutation.isPending || isLoadingProfile}
            style={[
              styles.followButton,
              isFollowing && styles.followingButton,
            ]}
            activeOpacity={0.7}
          >
            {followMutation.isPending || unfollowMutation.isPending || isLoadingProfile ? (
              <ActivityIndicator size="small" color={isFollowing ? "#FFFFFF" : "#1600ff"} />
            ) : (
              <Text style={[
                styles.followButtonText,
                isFollowing && styles.followingButtonText,
              ]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Content Box */}
      <View style={styles.contentBox}>
        {/* Icon */}
        <View style={styles.iconContainerDonation}>
          <HandHeart size={20} color="#FFFFFF" />
        </View>
        {/* Action Text */}
        <Text style={styles.actionTextDonation}>
          {(() => {
            if (isDonationNotification) {
              const match = actionText.match(/^(.*?) (donated) (\$[\d,.]+) (to) (.*)$/i);
              if (match) {
                return (
                  <>
                    <Text
                      style={styles.boldText}
                      onPress={() => handleUserNavigation(update.user.id)}
                    >
                      {match[1]}
                    </Text>
                    <Text> {match[2]} </Text>
                    <Text style={styles.boldText}>{match[3]}</Text>
                    <Text> {match[4]} {match[5]}</Text>
                  </>
                );
              }

              // Fallback for "Name donated to Nonprofit"
              const simpleMatch = actionText.match(/^(.*?) (donated.*?to) (.*)$/i);
              if (simpleMatch) {
                return (
                  <>
                    <Text
                      style={styles.boldText}
                      onPress={() => handleUserNavigation(update.user.id)}
                    >
                      {simpleMatch[1]}
                    </Text>
                    <Text> {simpleMatch[2]} {simpleMatch[3]}</Text>
                  </>
                );
              }
            }
            return actionText;
          })()}
        </Text>
      </View>
    </View>
  );
}

export default function CommunityUpdates({
  updates = [],
  showHeading = true,
  isFeedItem = false,
}: CommunityUpdatesProps) {
  if (!updates || updates.length === 0) {
    return null;
  }

  const content = (
    <View style={isFeedItem ? styles.feedItemContainer : styles.updatesList}>
      {updates.map((update) => {
        // If postId exists, fetch and display the full post
        const PostContent = update.postId ? PostWithData : NotificationSummary;

        return (
          <PostContent key={update.id} update={update} />
        );
      })}
    </View>
  );

  if (isFeedItem) {
    return content;
  }

  return (
    <View style={styles.container}>
      {showHeading && (
        <View style={styles.heading}>
          <Text style={styles.title}>Community Updates</Text>
          <Text style={styles.subtitle}>
            Updates and discoveries from your community
          </Text>
        </View>
      )}

      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  heading: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    fontFamily: 'Outfit-Bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
  updatesList: {
    gap: 10,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  loadingContent: {
    flexDirection: 'row',
    gap: 12,
  },
  loadingAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E7EB',
  },
  loadingTextContainer: {
    flex: 1,
    gap: 8,
  },
  loadingText: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    width: '80%',
  },
  loadingImage: {
    height: 160,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    marginTop: 8,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 4,
  },
  header: {
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    borderRadius: 100,
    flexShrink: 0,
  },
  userDetails: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Outfit-Bold',
  },
  username: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
  collectiveName: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: 'Outfit-Regular',
  },
  contentBox: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
  },
  iconContainerJoin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  iconContainerDonation: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  actionTextContainer: {
    flex: 1,
    gap: 4,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#4B5563',
    flex: 1,
    fontFamily: 'Outfit-Regular',
  },
  actionTextDonation: {
    fontSize: 15,
    fontWeight: '400',
    color: '#4B5563',
    flex: 1,
    fontFamily: 'Outfit-Regular',
  },
  nonprofitCountText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
  joinButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1600ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 8,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1600ff',
    fontFamily: 'Outfit-SemiBold',
  },
  followButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1600ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 8,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followingButton: {
    backgroundColor: '#1600ff',
    borderColor: '#1600ff',
  },
  followButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1600ff',
    fontFamily: 'Outfit-SemiBold',
  },
  followingButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Outfit-SemiBold',
  },
  boldText: {
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Outfit-Bold',
  },
  feedItemContainer: {
    width: '100%',
  },
});

