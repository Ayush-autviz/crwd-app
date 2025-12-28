import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { HandHeart, UserPlus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { followUserById, unfollowUserById, getUserProfileById } from '../../services/api/social';
import { useAuthStore } from '../../store/store';
import { useToast } from '../../contexts/ToastContext';

interface CommunityUpdate {
  id: string | number;
  user: {
    id?: string | number;
    name: string;
    firstName?: string;
    lastName?: string;
    username: string;
    avatar?: string;
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
}

interface CommunityUpdatesProps {
  updates?: CommunityUpdate[];
  showHeading?: boolean;
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


  const handleJoinClick = () => {
    if (update.collective?.id) {
      // Navigate to collective screen
      (navigation as any).navigate('GroupCRWD', { id: update.collective.id });
    } else if (update.collective?.name) {
      // If no ID, navigate to search
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

  const displayName =
    update.user.firstName && update.user.lastName
      ? `${update.user.firstName} ${update.user.lastName}`
      : update.user.name || update.user.username;

  return (
    <View style={styles.notificationCard}>
      {/* Top Section: Profile and Action Button */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {/* Avatar */}
          <Avatar size={40} style={styles.avatar}>
            <AvatarImage src={update.user.avatar} />
            <AvatarFallback
              style={{ backgroundColor: '#1600ff' }}
              textStyle={{ color: '#FFFFFF', fontSize: 12 }}
            >
              {displayName
                .split(' ')
                .map((n) => n.charAt(0))
                .join('')
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* User Info */}
          <View style={styles.userDetails}>
            <TouchableOpacity
              onPress={() =>
                (navigation as any).navigate('UserProfile', { userId: update.user.id })
              }
              activeOpacity={0.7}
            >
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{displayName}</Text>
                <Text style={styles.username}>@{update.user.username}</Text>
              </View>
            </TouchableOpacity>
            {update.collective && (
              <Text style={styles.collectiveName}>{update.collective.name}</Text>
            )}
          </View>
        </View>

        {/* Action Button - Join for join notifications, Follow for donation notifications */}
        {isJoinNotification && update.collective && (
          <TouchableOpacity
            onPress={handleJoinClick}
            style={styles.joinButton}
            activeOpacity={0.7}
          >
            <Text style={styles.joinButtonText}>Join</Text>
          </TouchableOpacity>
        )}
        {isDonationNotification && update.user.id && currentUser?.id !== update.user.id && (
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
      <View
        style={[
          styles.contentBox,
          // isJoinNotification ? styles.joinBox : styles.donationBox,
        ]}
      >
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            isJoinNotification ? styles.joinIcon : styles.donationIcon,
          ]}
        >
          {isJoinNotification ? (
            <UserPlus size={18} color="#FFFFFF" />
          ) : (
            <HandHeart size={18} color="#FFFFFF" />
          )}
        </View>
        {/* Action Text */}
        <Text style={styles.actionText}>{actionText}</Text>
      </View>
    </View>
  );
}

export default function CommunityUpdates({
  updates = [],
  showHeading = true,
}: CommunityUpdatesProps) {
  if (!updates || updates.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {showHeading && (
        <View style={styles.heading}>
          <Text style={styles.title}>Community Updates</Text>
          <Text style={styles.subtitle}>
            Activity, updates, and discoveries from your community
          </Text>
        </View>
      )}

      <View style={styles.updatesList}>
        {updates.map((update) => (
          <NotificationSummary key={update.id} update={update} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    marginVertical: 24,
  },
  heading: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: '#4B5563',
  },
  updatesList: {
    gap: 12,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  header: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  username: {
    fontSize: 12,
    color: '#6B7280',
  },
  collectiveName: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  contentBox: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F3F4F6',
  },
  joinBox: {
    backgroundColor: '#DBEAFE',
  },
  donationBox: {
    backgroundColor: '#D1FAE5',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  joinIcon: {
    backgroundColor: '#3B82F6',
  },
  donationIcon: {
    backgroundColor: '#10B981',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  joinButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1600ff',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1600ff',
  },
  followButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1600ff',
    paddingHorizontal: 16,
    paddingVertical: 6,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#1600ff',
  },
  followingButtonText: {
    color: '#FFFFFF',
  },
});

