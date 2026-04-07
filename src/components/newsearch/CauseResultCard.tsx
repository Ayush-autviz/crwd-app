import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { truncateAtFirstPeriod } from '../../utils/truncateFirstPeriod';


interface CauseResultCardProps {
  cause: {
    id: number;
    name: string;
    city?: string;
    state?: string;
    mission?: string;
    description?: string;
    image?: string | null;
  };
}

// Get consistent color for avatar
const avatarColors = [
  '#F97316', // Orange
  '#EC4899', // Pink
  '#10B981', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#A855F7', // Violet
];

const getConsistentColor = (id: number | string, colors: string[]) => {
  const hash =
    typeof id === 'number'
      ? id
      : id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};


export default function CauseResultCard({ cause }: CauseResultCardProps) {
  const navigation = useNavigation();
  const avatarBgColor = getConsistentColor(cause.id, avatarColors);
  const initials = cause.name
    ?.split(' ')
    .map((word) => word.charAt(0))
    .slice(0, 1)
    .join('')
    .toUpperCase() || 'N';

  const location = [cause.city, cause.state].filter(Boolean).join(', ');
  const description = cause.mission || cause.description || 'No description available';
  const truncatedDescription = truncateAtFirstPeriod(description);

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('CauseScreen' as never, { id: cause.id } as never)}
      style={styles.card}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Avatar size={48} style={styles.avatar}>
          <AvatarImage src={cause.image || undefined} />
          <AvatarFallback
            style={{ backgroundColor: cause.image ? 'transparent' : avatarBgColor }}
            textStyle={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{cause.name}</Text>
          {location ? <Text style={styles.location}>{location}</Text> : null}
          <Text style={styles.description}>
            {truncatedDescription}
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
    marginBottom: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
  },
  avatar: {
    borderRadius: 12,
    flexShrink: 0,
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
  location: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 6,
    fontFamily: 'Outfit-Regular',
  },
  description: {
    fontSize: 15,
    color: '#374151',
    fontFamily: 'Outfit-Regular',
  },
});

