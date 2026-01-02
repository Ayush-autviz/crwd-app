import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';

interface UserResultCardProps {
  user: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    profile_picture?: string;
    bio?: string;
    color?: string;
  };
  currentUserId?: string;
}

// Get consistent color for avatar
const avatarColors = [
  '#3B82F6',
  '#EC4899',
  '#8B5CF6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#06B6D4',
  '#F97316',
  '#84CC16',
  '#A855F7',
  '#14B8A6',
  '#F43F5E',
  '#6366F1',
  '#22C55E',
  '#EAB308',
];

const getConsistentColor = (id: number | string, colors: string[]) => {
  const hash =
    typeof id === 'number'
      ? id
      : id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export default function UserResultCard({ user, currentUserId }: UserResultCardProps) {
  const navigation = useNavigation();
  const avatarBgColor = user.color || getConsistentColor(user.id, avatarColors);
  const initials =
    user.first_name && user.last_name
      ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
      : user.username?.charAt(0).toUpperCase() || 'U';

  // Get full name
  const fullName =
    user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.first_name || user.username || 'Unknown User';

  // Check if this is the current user's profile
  const isCurrentUser = currentUserId && user.id.toString() === currentUserId;

  const handlePress = () => {
    if (isCurrentUser) {
      // Navigate to Profile tab (index 4 in MainTabs)
      (navigation as any).dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'DrawerNav',
              state: {
                routes: [
                  {
                    name: 'MainTabs',
                    state: {
                      routes: [
                        { name: 'Home' },
                        { name: 'Search' },
                        { name: 'Donate' },
                        { name: 'Collectives' },
                        { name: 'Profile' },
                      ],
                      index: 4, // Profile tab index
                    },
                  },
                ],
                index: 0,
              },
            },
          ],
        })
      );
    } else {
      // Navigate to UserProfile screen
      navigation.navigate('UserProfile' as never, { userId: user.id } as never);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.card}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Avatar size={48} style={styles.avatar}>
          <AvatarImage src={user.profile_picture} />
          <AvatarFallback
            style={{ backgroundColor: avatarBgColor }}
            textStyle={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        <View style={styles.textContainer}>
          <Text style={styles.name}>{fullName}</Text>
          {user.bio ? <Text style={styles.bio} numberOfLines={2}>{user.bio}</Text> : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  avatar: {
    borderRadius: 24,
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  bio: {
    fontSize: 12,
    color: '#4B5563',
  },
});

