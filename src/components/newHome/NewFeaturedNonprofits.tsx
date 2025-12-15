import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';

interface Nonprofit {
  id: string | number;
  name: string;
  image?: string;
  description?: string;
  mission?: string;
}

interface NewFeaturedNonprofitsProps {
  nonprofits?: Nonprofit[];
  seeAllLink?: string;
}

// Generate color for icon (same as Suggested Collectives)
const getIconColor = (id: number | string): string => {
  const colors = [
    '#1600ff', // Blue
    '#10B981', // Green
    '#EC4899', // Pink
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EF4444', // Red
  ];
  const hash =
    typeof id === 'number'
      ? id
      : id
          .toString()
          .split('')
          .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export default function NewFeaturedNonprofits({
  nonprofits = [],
  seeAllLink = '/search',
}: NewFeaturedNonprofitsProps) {
  const navigation = useNavigation();

  if (!nonprofits || nonprofits.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Featured Nonprofits</Text>
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
        {nonprofits.map((nonprofit) => {
          const iconColor = getIconColor(nonprofit.id);
          const description = nonprofit.description || nonprofit.mission || '';

          return (
            <TouchableOpacity
              key={nonprofit.id}
              style={styles.card}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate('CauseScreen' as never, { id: nonprofit.id } as never)
              }
            >
              {/* Avatar - Rounded square */}
              <Avatar size={48} style={styles.avatar}>
                <AvatarImage src={nonprofit.image} />
                <AvatarFallback
                  style={{ backgroundColor: iconColor }}
                  textStyle={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}
                >
                  {nonprofit.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Content */}
              <View style={styles.content}>
                {/* Title */}
                <Text style={styles.cardTitle}>{nonprofit.name}</Text>

                {/* Description */}
                <Text style={styles.description} numberOfLines={3}>
                  {description}
                </Text>
              </View>
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
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
  },
  scrollContent: {
    paddingRight: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    minWidth: 240,
    maxWidth: 280,
    marginRight: 12,
  },
  avatar: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
  },
});

