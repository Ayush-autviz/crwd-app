import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/store';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { HandHeart, Users } from 'lucide-react-native';
import { getUserProfileById, followUser, unfollowUser } from '../../services/api/social';

interface ActivityCardProps {
  activity: any;
}

// Helper function to get consistent color for avatar
const getConsistentColor = (id: string | number, colors: string[]): string => {
  const hash = id.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const avatarColors = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e'
];

// Format date to match PopularPosts style
const formatTimeAgo = (dateString: string): string => {
  if (!dateString) return '';

  // Check if it's already a relative time string (like "1h ago", "2d ago")
  if (dateString.includes('ago') || dateString.includes('just now')) {
    return dateString;
  }

  let date: Date;
  // Handle DD/MM/YYYY format
  const ddmmyyyyMatch = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
  } else {
    date = new Date(dateString);
  }

  if (isNaN(date.getTime())) {
    return dateString;
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInSeconds / 3600);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  } else {
    const currentYear = now.getFullYear();
    const postYear = date.getFullYear();
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
    };
    if (postYear !== currentYear) {
      options.year = 'numeric';
    }
    return date.toLocaleDateString('en-US', options);
  }
};

// Helper to extract name from body text
const extractNameFromBody = (body: string): string | null => {
  if (!body) return null;
  // Common activity patterns
  const actions = [' donated', ' joined', ' created', ' posted', ' commented', ' started', ' updated'];
  for (const action of actions) {
    const index = body.indexOf(action);
    if (index > 0) {
      return body.substring(0, index);
    }
  }
  return null;
};

// Get user initials
const getInitials = (name: string): string => {
  if (!name) return 'U';
  return name.charAt(0).toUpperCase();
};

export default function ActivityCard({ activity }: ActivityCardProps) {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { user: currentUser, token } = useAuthStore();

  // Extract username from activity body (e.g., "@jake_long" -> "jake_long")
  const usernameMatch = activity.body?.match(/@(\w+)/);
  const username = usernameMatch ? usernameMatch[1] : null;

  // Try to get user ID from various possible fields in activity.data
  const userId =
    activity.data?.new_member_id ||
    activity.data?.user_id ||
    activity.data?.donor_id ||
    activity.data?.member_id ||
    activity.data?.creator_id ||
    null;

  // Get user name from activity body or data
  const nameFromBody = extractNameFromBody(activity.body);
  const userName = activity.data?.first_name && activity.data?.last_name
    ? `${activity.data.first_name} ${activity.data.last_name}`
    : activity.data?.username || username || nameFromBody || 'Unknown User';

  // Get profile picture
  const profilePicture = activity.data?.profile_picture || '';

  // Get avatar background color
  const avatarId = userId || username || userName;
  const avatarBgColor = activity.data?.user_color || getConsistentColor(avatarId, avatarColors);
  const initials = getInitials(userName);

  // Format timestamp - use created_at for proper date parsing (timestamp is already formatted like "2d")
  const formattedTime = activity.created_at
    ? formatTimeAgo(activity.created_at)
    : activity.timestamp || '';

  // Determine activity type
  const isDonation = activity.title === 'New Donation' || activity.body?.toLowerCase().includes('donated');
  const isJoin = activity.title === 'New Member' || activity.body?.toLowerCase().includes('joined');

  // Format activity body (remove username and amount if it's already in the header)
  const formatActivityBody = (bodyText: string) => {
    if (!bodyText) return '';

    if (isDonation) {
      // Input: "Conrad McMurray donated $5 to Atlanta Mission and 12 others"
      // Regex: /^(.*?) (donated) (\$[\d,.]+) (to) (.*)$/i
      const donationMatch = bodyText.match(/^(.*?) (donated) (\$[\d,.]+) (to) (.*)$/i);
      if (donationMatch) {
        return `${donationMatch[2].charAt(0).toUpperCase() + donationMatch[2].slice(1)} ${donationMatch[4]} ${donationMatch[5]}`;
      }
    }

    if (isJoin) {
      // Input: "Chad F. joined Everything Everywhere All At Once"
      const joinMatch = bodyText.match(/^(.*?) (joined) (.*)$/i);
      if (joinMatch) {
        return `${joinMatch[2].charAt(0).toUpperCase() + joinMatch[2].slice(1)} ${joinMatch[3]}`;
      }
    }

    return bodyText;
  };

  const activityDescription = formatActivityBody(activity.body || activity.title || '');

  // Fetch user profile to check follow status (only for donations and if it's not the current user)
  const shouldFetchProfile = !!userId && !!token?.access_token && isDonation && String(currentUser?.id) !== String(userId);

  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => getUserProfileById(userId?.toString() || ''),
    enabled: shouldFetchProfile,
  });

  const isFollowing = userProfile?.is_following || false;

  // Follow/Unfollow mutations
  const followMutation = useMutation({
    mutationFn: (id: string) => followUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: (id: string) => unfollowUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
    },
  });

  const handleFollowPress = () => {
    if (!userId) return;
    if (isFollowing) {
      unfollowMutation.mutate(userId.toString());
    } else {
      followMutation.mutate(userId.toString());
    }
  };

  // Handle profile navigation
  const handleProfilePress = () => {
    if (userId) {
      (navigation as any).navigate('UserProfile', { userId: userId.toString() });
    } else if (username) {
      (navigation as any).navigate('UserProfile', { username });
    }
  };

  const hasProfileLink = !!userId || !!username;

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        {/* Top Section: Profile info */}
        <View style={styles.topSection}>
          <TouchableOpacity
            onPress={handleProfilePress}
            activeOpacity={0.7}
            style={styles.profileInfo}
          >
            <Avatar size={36}>
              <AvatarImage src={profilePicture} />
              <AvatarFallback
                style={{ backgroundColor: avatarBgColor }}
                textStyle={{ color: '#FFFFFF', fontSize: 14, fontFamily: 'Outfit-Bold' }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <View style={styles.nameContainer}>
              <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
              {/* <Text style={styles.timestamp}>{formattedTime}</Text> */}
            </View>
          </TouchableOpacity>

          {/* Follow Button */}
          {/* {shouldFetchProfile && !isFollowing && (
            <TouchableOpacity
              style={styles.followButton}
              onPress={handleFollowPress}
              disabled={followMutation.isPending || unfollowMutation.isPending || isLoadingProfile}
              activeOpacity={0.8}
            >
              <Text style={styles.followButtonText}>
                {followMutation.isPending ? '...' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )} */}
        </View>

        {/* Content Box */}
        <View style={[
          styles.descriptionBox,
          { backgroundColor: isDonation ? '#F0FDF4' : isJoin ? '#EEF2FF' : '#F9FAFB' }
        ]}>
          {/* <View style={styles.iconContainer}>
            {isDonation ? (
              <HandHeart size={16} color={isDonation ? '#16A34A' : '#4B5563'} />
            ) : (
              <Users size={16} color={isJoin ? '#3B82F6' : '#4B5563'} />
            )}
          </View> */}
          <Text style={styles.descriptionText} numberOfLines={2}>
            {activityDescription}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    // borderWidth: 1,
    // borderColor: '#F3F4F6',
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardContent: {
    // padding: 12,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  nameContainer: {
    flex: 1,
    paddingRight: 8,
  },
  userName: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    fontWeight: '700',
    color: '#111827',
  },
  followButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1600ff',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  followButtonText: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    fontWeight: '700',
    color: '#1600ff',
  },
  timestamp: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
    marginTop: 1,
  },
  descriptionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    color: '#374151',
    flex: 1,
  },
});

