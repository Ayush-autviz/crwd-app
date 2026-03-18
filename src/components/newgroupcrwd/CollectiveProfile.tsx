import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { truncateAtFirstPeriod } from '../../utils/truncateFirstPeriod';

interface CollectiveProfileProps {
  name: string;
  image?: string;
  logo?: string | null;
  color?: string | null;
  founder?: {
    id?: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    profile_picture?: string;
  };
  description?: string;
  isJoined?: boolean;
  perks?: string;
}

export default function CollectiveProfile({
  name,
  image,
  logo,
  color,
  founder,
  description,
  isJoined = false,
  perks,
}: CollectiveProfileProps) {
  const navigation = useNavigation();

  const founderName = founder
    ? `${founder.first_name || ''} ${founder.last_name || ''}`.trim() || founder.username
    : 'Unknown';

  const handleFounderClick = () => {
    if (founder?.id) {
      (navigation as any).navigate('UserProfile', { userId: founder.id });
    }
  };

  // Generate color for icon if not provided
  const getIconColor = (name: string): string => {
    const colors = [
      '#1600ff', // Blue
      '#10B981', // Green
      '#EC4899', // Pink
      '#F59E0B', // Amber
      '#8B5CF6', // Purple
      '#EF4444', // Red
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Get first letter of name for icon
  const getIconLetter = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  // Avatar colors for consistent coloring
  const avatarColors = [
    '#EF4444', // Red
    '#10B981', // Green
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#84CC16', // Lime Green
    '#EC4899', // Pink
    '#F59E0B', // Amber
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#A855F7', // Violet
    '#14B8A6', // Teal
    '#F43F5E', // Rose
    '#6366F1', // Indigo
    '#22C55E', // Emerald
    '#EAB308', // Yellow
  ];

  const getConsistentColor = (id: number | string, colors: string[]) => {
    const hash = typeof id === 'number' ? id : id.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Priority: 1. Use color (with white text), 2. Use logo (image), 3. Fallback to generated color with letter
  const hasColor = color;
  const hasLogo = logo && (logo.startsWith('http') || logo.startsWith('/') || logo.startsWith('data:'));
  const iconColor = hasColor || (!hasLogo ? getIconColor(name) : undefined);
  const iconLetter = getIconLetter(name);
  // Fallback to image prop if logo is not available (for backward compatibility)
  const imageUrl = hasLogo ? logo : image || undefined;

  const [isExpanded, setIsExpanded] = React.useState(false);
  const [canExpand, setCanExpand] = React.useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Avatar size={80} style={styles.avatar}>
          {imageUrl ? (
            <AvatarImage src={imageUrl} />
          ) : null}
          <AvatarFallback
            style={iconColor ? { backgroundColor: iconColor } : {}}
            textStyle={{ color: '#FFFFFF', fontSize: 32, fontFamily: 'Outfit-Bold' }}
          >
            {iconLetter}
          </AvatarFallback>
        </Avatar>
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{name}</Text>
            {/* {isJoined && (
              <View style={styles.joinedBadge}>
                <Text style={styles.joinedText}>Joined</Text>
              </View>
            )} */}
          </View>
          {founder && (
            <View style={styles.founderRow}>
              {/* <Avatar size={20}>
                <AvatarImage src={founder?.profile_picture || undefined} />
                <AvatarFallback
                  style={{ backgroundColor: getConsistentColor(founder.id || founderName, avatarColors) }}
                  textStyle={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}
                >
                  {(founderName || 'F').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar> */}
              <Text style={styles.founderText}>
                Founded by{' '}
                <Text style={styles.founderLink} onPress={handleFounderClick}>
                  {founderName}
                </Text>
              </Text>
            </View>
          )}
        </View>
      </View>
      {description && (
        <View>
          {/* Hidden text for measurement */}
          {!canExpand && (
            <Text
              style={[styles.description, { position: 'absolute', opacity: 0 }]}
              onTextLayout={(e) => {
                if (e.nativeEvent.lines.length > 3) {
                  setCanExpand(true);
                }
              }}
            >
              {description}
            </Text>
          )}
          <Text style={styles.description}>
            {isExpanded || !canExpand
              ? description
              : (description.length > 150 ? description.substring(0, 150) : description)}
            {canExpand && (
              <Text
                onPress={() => setIsExpanded(!isExpanded)}
                style={styles.readMoreText}
              >
                {isExpanded ? ' Read Less' : ' ... more'}
              </Text>
            )}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  avatar: {
    borderRadius: 12,
    flexShrink: 0,
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Outfit-ExtraBold',
    fontWeight: '800',
    color: '#111827',
  },
  joinedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  joinedText: {
    fontSize: 10,
    fontFamily: 'Outfit-SemiBold',
    color: '#065F46',
  },
  founderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  founderText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
  founderLink: {
    color: '#1600ff',
    fontFamily: 'Outfit-Medium',
  },
  description: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 22,
    // marginTop: 2,
    fontFamily: 'Outfit-Regular',
  },
  perksContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  perksTitle: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  perksText: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    color: '#374151',
    lineHeight: 20,
  },
  readMoreText: {
    color: '#4B5563',
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
  },
});

