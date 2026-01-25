import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';

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

// Format date to relative time
const formatTimeAgo = (dateString: string): string => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  } catch {
    return '';
  }
};

// Get user initials
const getInitials = (name: string): string => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.charAt(0).toUpperCase();
};

export default function ActivityCard({ activity }: ActivityCardProps) {
  const navigation = useNavigation();

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
  const userName = activity.data?.first_name && activity.data?.last_name
    ? `${activity.data.first_name} ${activity.data.last_name}`
    : activity.data?.username || username || 'Unknown User';

  // Get profile picture
  const profilePicture = activity.data?.profile_picture || '';

  // Get avatar background color
  const avatarId = userId || username || userName;
  const avatarBgColor = getConsistentColor(avatarId, avatarColors);
  const initials = getInitials(userName);

  // Format timestamp - use created_at for proper date parsing (timestamp is already formatted like "2d")
  const formattedTime = activity.created_at
    ? formatTimeAgo(activity.created_at)
    : activity.timestamp || '';

  // Determine activity description - use body which contains the full description
  const activityDescription = activity.body || activity.title || '';

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
      <View style={styles.content}>
        {/* Profile Avatar */}
        {hasProfileLink ? (
          <TouchableOpacity onPress={handleProfilePress} activeOpacity={0.7}>
            <Avatar size={40}>
              <AvatarImage src={profilePicture} />
              <AvatarFallback
                style={{ backgroundColor: avatarBgColor }}
                textStyle={{ color: '#FFFFFF', fontSize: 12, fontFamily: 'Outfit-Bold' }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
          </TouchableOpacity>
        ) : (
          <Avatar size={40}>
            <AvatarImage src={profilePicture} />
            <AvatarFallback
              style={{ backgroundColor: avatarBgColor }}
              textStyle={{ color: '#FFFFFF', fontSize: 12, fontFamily: 'Outfit-Bold' }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
        )}

        {/* Content */}
        <View style={styles.textContent}>
          {/* Name and Timestamp */}
          <View style={styles.nameRow}>
            {hasProfileLink ? (
              <TouchableOpacity onPress={handleProfilePress} activeOpacity={0.7}>
                <Text style={styles.userName}>{userName}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.userName}>{userName}</Text>
            )}
          </View>
          <Text style={styles.timestamp}>{formattedTime}</Text>

          {/* Activity Description Box */}
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionText}>
              {activityDescription}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  textContent: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
  },
  timestamp: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  descriptionBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 10,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold',
    color: '#111827',
  },
});

