import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { useAuthStore } from '../../store/store';
import { truncateAtFirstPeriod } from '../../utils/truncateFirstPeriod';

interface CollectiveResultCardProps {
  collective: {
    id: number;
    name: string;
    description?: string;
    image?: string;
    avatar?: string;
    logo?: string; // Logo URL from API
    color?: string; // Color from API
    created_by?: {
      id?: number | string;
      first_name?: string;
      last_name?: string;
      username?: string;
      profile_picture?: string;
      color?: string;
    };
    causes_count?: number;
    supported_causes_count?: number;
    nonprofit_count?: number;
  };
}

// Generate color for icon if not provided
const getIconColor = (index: number): string => {
  const colors = [
    '#1600ff', // Blue
    '#10B981', // Green
    '#EC4899', // Pink
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EF4444', // Red
  ];
  return colors[index % colors.length];
};

// Get first letter of name for icon
const getIconLetter = (name: string): string => {
  return name.charAt(0).toUpperCase();
};

// Get initials from name
const getInitials = (name: string): string => {
  if (!name) return 'C';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }
  return name.charAt(0).toUpperCase();
};

// Get consistent color for avatar
const avatarColors = [
  '#3B82F6', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4',
  '#F97316', '#84CC16', '#A855F7', '#14B8A6', '#F43F5E', '#6366F1', '#22C55E', '#EAB308',
];

const getConsistentColor = (id: number | string, colors: string[]) => {
  const hash =
    typeof id === 'number'
      ? id
      : id.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export default function CollectiveResultCard({ collective }: CollectiveResultCardProps) {
  const navigation = useNavigation();
  const { user: currentUser } = useAuthStore();

  // Priority: 1. Use color (with white text), 2. Use logo (image), 3. Fallback to generated color with letter
  const hasColor = collective.color;
  const hasLogo =
    collective.logo &&
    (collective.logo.startsWith('http') ||
      collective.logo.startsWith('/') ||
      collective.logo.startsWith('data:'));
  const imageUrl = collective.logo || collective.image || collective.avatar;
  const iconColor = hasColor || (!hasLogo ? getIconColor(collective.id % 6) : undefined);
  const iconLetter = getIconLetter(collective.name || 'C');

  // Get founder information
  const founder = collective.created_by;
  const founderName = founder
    ? `${founder.first_name || ''} ${founder.last_name || ''}`.trim() || founder.username || 'Unknown'
    : 'Unknown';
  // Get founder initials from first name and last name
  const founderInitials = founder
    ? (founder.first_name && founder.last_name
      ? `${founder.first_name.charAt(0)}`.toUpperCase()
      : founder.first_name
        ? founder.first_name.charAt(0).toUpperCase()
        : getInitials(founderName))
    : 'U';

  // Get nonprofit count
  const nonprofitCount =
    collective.causes_count ||
    collective.supported_causes_count ||
    collective.nonprofit_count ||
    0;

  return (
    <TouchableOpacity
      onPress={() =>
        (navigation as any).navigate('GroupCRWD', { id: collective.id })
      }
      style={styles.card}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Icon with priority: color > logo > generated color with letter */}
        <View
          style={[
            styles.iconContainer,
            iconColor ? { backgroundColor: iconColor } : {},
          ]}
        >
          {hasLogo && imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.iconImage} resizeMode="cover" />
          ) : (
            <Text style={styles.iconLetter}>{iconLetter}</Text>
          )}
        </View>

        <View style={styles.textContainer}>
          {/* Title */}
          <Text style={styles.title}>{collective.name}</Text>

          {/* Description */}
          <Text style={styles.description} >
            {truncateAtFirstPeriod(collective.description || 'No description available')}
          </Text>

          {/* Founder Information */}
          {founder && (
            <View style={styles.founderRow}>
              <Avatar size={20}>
                <AvatarImage src={founder.profile_picture} />
                <AvatarFallback
                  style={{ backgroundColor: founder.color || getConsistentColor(founder.id || founderName, avatarColors) }}
                  textStyle={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}
                >
                  {founderInitials}
                </AvatarFallback>
              </Avatar>

              <Text style={styles.founderText}>
                Founded by{' '}
                {founder.id ? (
                  <Text
                    onPress={() => {
                      // Check if it's the current user's own profile
                      if (currentUser?.id && founder.id && currentUser.id.toString() === founder.id.toString()) {
                        navigation.dispatch(
                          CommonActions.reset({
                            index: 0,
                            routes: [
                              {
                                name: 'DrawerNav' as never,
                                state: {
                                  routes: [
                                    {
                                      name: 'MainTabs' as never,
                                      state: {
                                        routes: [
                                          { name: 'Home' as never },
                                          { name: 'Search' as never },
                                          { name: 'Donate' as never },
                                          { name: 'Collectives' as never },
                                          { name: 'Profile' as never },
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
                        (navigation as any).navigate('UserProfile', { userId: founder.id!.toString() });
                      }
                    }}
                    style={styles.founderNameLink}
                    suppressHighlighting={false} // Optional: adds a default highlight on press
                  >
                    {founderName}
                  </Text>
                ) : (
                  <Text>{founderName}</Text>
                )}
              </Text>
            </View>
          )}

          {/* Supporting nonprofits count */}
          <Text style={styles.nonprofitCount}>
            Supporting {nonprofitCount} nonprofit{nonprofitCount !== 1 ? 's' : ''}
          </Text>
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
    // marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  iconImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  iconLetter: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Outfit-Bold',
  },
  description: {
    fontSize: 15,
    color: '#4B5563',
    marginBottom: 8,
    fontFamily: 'Outfit-Regular',
  },
  founderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  founderText: {
    fontSize: 14,
    color: '#4B5563',
    fontFamily: 'Outfit-Regular',
  },
  founderNameLink: {
    color: '#1600ff',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold',
  },
  nonprofitCount: {
    fontSize: 14,
    color: '#4B5563',
    fontFamily: 'Outfit-Regular',
  },
});

