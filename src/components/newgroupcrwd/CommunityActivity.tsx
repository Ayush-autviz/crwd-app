import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import PopularPosts from '../PopularPosts';

interface CommunityActivityProps {
  posts: any[];
  isLoading?: boolean;
  collectiveId?: string;
  isJoined?: boolean;
  collectiveData?: any;
  onCommentPress?: (post: any) => void;
}

export default function CommunityActivity({
  posts,
  isLoading = false,
  collectiveId,
  isJoined = false,
  collectiveData,
  onCommentPress,
}: CommunityActivityProps) {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Community Activity</Text>
          {posts && posts.length > 0 && (
            <Text style={styles.subtitle}>
              {posts.length} Update{posts.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
        {!isJoined ? (
          <View style={styles.joinButton}>
            <Text style={styles.joinButtonText}>Join to post updates</Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('Post' as never, { collectiveData } as never)
            }
            style={styles.postButton}
            activeOpacity={0.7}
          >
            <Text style={styles.postButtonText}>Create Post</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading activity...</Text>
        </View>
      ) : posts && posts.length > 0 ? (
        <PopularPosts posts={posts} title="no title" hasMore={false} onCommentPress={onCommentPress} />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No community activity yet. Be the first to post!
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  joinButton: {
    backgroundColor: '#1600ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  joinButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  postButton: {
    backgroundColor: '#1600ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});

