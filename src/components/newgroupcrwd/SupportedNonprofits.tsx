import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';

interface Nonprofit {
  id: number;
  name: string;
  mission?: string;
  image?: string;
  cause?: {
    id: number;
    name: string;
    mission?: string;
    image?: string;
  };
}

interface SupportedNonprofitsProps {
  nonprofits: Nonprofit[];
  isLoading?: boolean;
  onSeeAllClick?: () => void;
}

// Generate color for icon (same as Vite version)
const getIconColor = (id: number | string): string => {
  const colors = [
    "#1600ff", // Blue
    "#10B981", // Green
    "#EC4899", // Pink
    "#F59E0B", // Amber
    "#8B5CF6", // Purple
    "#EF4444", // Red
  ];
  const hash = typeof id === 'number' ? id : id.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export default function SupportedNonprofits({
  nonprofits,
  isLoading = false,
  onSeeAllClick,
}: SupportedNonprofitsProps) {
  const navigation = useNavigation();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Supported Nonprofits</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9CA3AF" />
        </View>
      </View>
    );
  }

  if (!nonprofits || nonprofits.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Supported Nonprofits</Text>
        {onSeeAllClick && (
          <TouchableOpacity onPress={onSeeAllClick} activeOpacity={0.7}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {nonprofits.map((nonprofit) => {
          const cause = nonprofit.cause || nonprofit;
          const name = cause.name || nonprofit.name || 'Unknown Nonprofit';
          const image = cause.image || nonprofit.image || '';
          const description = cause.mission || nonprofit.mission || '';
          const causeId = cause.id || nonprofit.id;
          const iconColor = getIconColor(causeId);

          return (
            <TouchableOpacity
              key={nonprofit.id}
              onPress={() => causeId && (navigation as any).navigate('CauseScreen', { id: causeId })}
              style={styles.card}
              activeOpacity={0.7}
            >
              {/* Avatar - Rounded square */}
              <Avatar size={48} style={styles.avatar}>
                <AvatarImage src={image} />
                <AvatarFallback
                  style={{ backgroundColor: iconColor }}
                  textStyle={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}
                >
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Content */}
              <View style={styles.content}>
                {/* Title */}
                <Text style={styles.name} numberOfLines={2}>
                  {name}
                </Text>

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
    paddingHorizontal: 12,
    paddingVertical: 16,
    marginTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10B981',
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingRight: 12,
  },
  card: {
    width: 240,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    minHeight: 100,
  },
  avatar: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  description: {
    fontSize: 11,
    color: '#4B5563',
    lineHeight: 16,
  },
});

