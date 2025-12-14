import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';

interface Collective {
  id: string | number;
  name: string;
  icon?: string; // Optional logo URL, if not provided will use first letter
  iconColor?: string; // Optional color for the icon background (from API color field)
  founder: {
    name: string;
    profile_picture?: string;
  };
  nonprofit_count: number;
  description: string;
}

interface NewSuggestedCollectivesProps {
  collectives?: Collective[];
  seeAllLink?: string;
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

export default function NewSuggestedCollectives({
  collectives = [],
  seeAllLink = '/search',
}: NewSuggestedCollectivesProps) {
  const navigation = useNavigation();

  if (!collectives || collectives.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Suggested Collectives</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Search' as never)}
          activeOpacity={0.7}
        >
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {collectives.map((collective, index) => {
          // Priority: 1. Use color (with white text), 2. Use logo (image), 3. Fallback to generated color with letter
          const hasColor = collective.iconColor;
          const hasLogo =
            collective.icon &&
            (collective.icon.startsWith('http') ||
              collective.icon.startsWith('/') ||
              collective.icon.startsWith('data:'));
          const iconColor = hasColor || (!hasLogo ? getIconColor(index) : undefined);
          const iconLetter = getIconLetter(collective.name);

          return (
            <TouchableOpacity
              key={collective.id}
              style={styles.card}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate('GroupCRWD' as never, { id: collective.id } as never)
              }
            >
              {/* Icon */}
              <View
                style={[
                  styles.iconContainer,
                  iconColor ? { backgroundColor: iconColor } : {},
                ]}
              >
                {hasLogo ? (
                  <Image
                    source={{ uri: collective.icon }}
                    style={styles.iconImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.iconLetter}>{iconLetter}</Text>
                )}
              </View>

              {/* Title */}
              <Text style={styles.cardTitle}>{collective.name}</Text>

              {/* Founder */}
              <View style={styles.founderRow}>
                <Avatar size={20}>
                  <AvatarImage src={collective.founder.profile_picture} />
                  <AvatarFallback
                    style={{ backgroundColor: '#1600ff' }}
                    textStyle={{ color: '#FFFFFF', fontSize: 10 }}
                  >
                    {collective.founder.name
                      .split(' ')
                      .map((n) => n.charAt(0))
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Text style={styles.founderText}>
                  Founded by {collective.founder.name}
                </Text>
              </View>

              {/* Nonprofits count */}
              <Text style={styles.nonprofitCount}>
                Supporting {collective.nonprofit_count} nonprofit
                {collective.nonprofit_count !== 1 ? 's' : ''}
              </Text>

              {/* Description */}
              <Text style={styles.description} numberOfLines={2}>
                {collective.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1600ff',
  },
  scrollContent: {
    paddingRight: 16,
  },
  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    minWidth: 240,
    maxWidth: 280,
    marginRight: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
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
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  founderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  founderText: {
    fontSize: 12,
    color: '#6B7280',
  },
  nonprofitCount: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  description: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
});

