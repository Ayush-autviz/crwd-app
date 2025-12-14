import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { HandHeart, UserPlus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';

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
  const actionText = update.content || '';
  const isJoinNotification = update.isJoinNotification || false;

  const displayName =
    update.user.firstName && update.user.lastName
      ? `${update.user.firstName} ${update.user.lastName}`
      : update.user.name || update.user.username;

  return (
    <View style={styles.notificationCard}>
      {/* Top Section: Profile */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {/* Avatar */}
          <Avatar size={48} style={styles.avatar}>
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
                navigation.navigate('UserProfile' as never, { userId: update.user.id } as never)
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
      </View>

      {/* Content Box */}
      <View
        style={[
          styles.contentBox,
          isJoinNotification ? styles.joinBox : styles.donationBox,
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
            <UserPlus size={20} color="#FFFFFF" />
          ) : (
            <HandHeart size={20} color="#FFFFFF" />
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
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    borderRadius: 12,
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
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  joinBox: {
    backgroundColor: '#DBEAFE',
  },
  donationBox: {
    backgroundColor: '#D1FAE5',
  },
  iconContainer: {
    width: 40,
    height: 40,
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
});

