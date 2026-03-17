import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';

interface Cause {
  id: number;
  name: string;
  image?: string;
  mission?: string;
  sort_name: string;
}

interface PreviouslySupportedItem {
  id: number;
  removed_at: string;
  cause: Cause;
}

interface PreviouslySupportedCausesProps {
  causes: PreviouslySupportedItem[];
  onAdd: (causeId: number) => void;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
}

const avatarColors = [
  '#3B82F6', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4',
  '#F97316', '#84CC16', '#A855F7', '#14B8A6', '#F43F5E', '#6366F1', '#22C55E', '#EAB308',
];

const getConsistentColor = (id: number | string, colors: string[]) => {
  const hash = typeof id === 'number' ? id : id.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const getInitials = (name: string) => {
  if (!name) return 'N';
  const words = name.trim().split(' ');
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
  return name.charAt(0).toUpperCase();
};

export const PreviouslySupportedCauses = ({ 
  causes, 
  onAdd,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage
}: PreviouslySupportedCausesProps) => {
  const navigation = useNavigation();

  if (!causes || !Array.isArray(causes) || causes.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Previously Supported</Text>
        <Text style={styles.subtitle}>Causes you supported in the past</Text>
      </View>

      <View style={styles.list}>
        {causes.map((item) => {
          const cause = (item as any).cause || item;
          if (!cause || !cause.id) return null;

          const avatarBgColor = getConsistentColor(cause.id, avatarColors);
          const initials = getInitials(cause.name || 'N');

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => (navigation as any).navigate('CauseScreen', { id: cause.id })}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                {/* Avatar */}
                <Avatar size={48} style={styles.avatar}>
                  <AvatarImage src={cause.image} />
                  <AvatarFallback
                    style={{ backgroundColor: `${avatarBgColor}20` }}
                    textStyle={{ color: avatarBgColor, fontSize: 18, fontWeight: '700' }}
                  >
                    {initials[0]}
                  </AvatarFallback>
                </Avatar>

                {/* Cause Info */}
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>
                    {cause.name}
                  </Text>
                  <Text style={styles.mission} numberOfLines={1}>
                    {cause.mission || "Providing support where it's needed most"}
                  </Text>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={() => onAdd(cause.id)}
                    style={styles.addButton}
                    activeOpacity={0.7}
                  >
                    <Plus size={20} color="#DB2777" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {hasNextPage && (
          <TouchableOpacity 
            style={styles.loadMoreButton} 
            onPress={fetchNextPage} 
            disabled={isFetchingNextPage}
            activeOpacity={0.7}
          >
            {isFetchingNextPage ? (
              <ActivityIndicator size="small" color="#6B7280" />
            ) : (
              <Text style={styles.loadMoreText}>Load More</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 0,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    borderRadius: 8,
    marginRight: 10,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 1,
  },
  mission: {
    fontSize: 12,
    color: '#6B7280',
  },
  actions: {
    marginLeft: 10,
  },
  addButton: {
    backgroundColor: '#FCE7F3', // pink-100
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
});
