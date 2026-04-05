import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/store';
import { MessageCircle, Calendar, Heart, Users } from 'lucide-react-native';
import GivingPost from '../newgivinggroup/GivingPost';
import ActivityCard from './ActivityCard';
import PopularPosts from '../PopularPosts';

interface CommunityActivityProps {
  posts: any[];
  isLoading?: boolean;
  collectiveId?: string;
  isJoined?: boolean;
  collectiveData?: any;
  onCommentPress?: (post: any) => void;
  onJoin?: () => void;
  fromCollective?: boolean;
}

export default function CommunityActivity({
  posts,
  isLoading = false,
  collectiveId,
  isJoined = false,
  collectiveData,
  onCommentPress,
  onJoin,
  fromCollective = false,
}: CommunityActivityProps) {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);
  const isFounder = user?.id === collectiveData?.user?.id || user?.id === collectiveData?.created_by?.id;

  // Get recent activities from collective data
  const recentActivities = collectiveData?.recent_activities || [];

  return (
    <View style={[styles.container, fromCollective && { paddingTop: 0 }]}>
      {!fromCollective && (
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Community Activity</Text>
            {/* {posts && posts.length > 0 && (
            <Text style={styles.subtitle}>
              {posts.length} Update{posts.length !== 1 ? 's' : ''}
            </Text>
          )} */}
          </View>
          {!isJoined ? (
            <TouchableOpacity
              style={styles.joinButton}
              onPress={onJoin}
              activeOpacity={0.7}
            >
              <Text style={styles.joinButtonText}>Join to post updates</Text>
            </TouchableOpacity>
          ) : (
            <View>
              <TouchableOpacity
                onPress={() => isFounder ? setModalVisible(true) : (navigation as any).navigate('Post', { collectiveData })}
                style={styles.postButton}
                activeOpacity={0.7}
              >
                <Text style={styles.postButtonText}>{isFounder ? '+ Create' : 'Create Post'}</Text>
              </TouchableOpacity>

              {modalVisible && (
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                  />
                  <View style={styles.dropdownMenu}>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setModalVisible(false);
                        (navigation as any).navigate('Post', { collectiveData });
                      }}
                    >
                      <MessageCircle size={20} color="#4B5563" />
                      <Text style={styles.dropdownText}>Create Post</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setModalVisible(false);
                        (navigation as any).navigate('CreateFundraiser', { collectiveId: collectiveId });
                      }}
                    >
                      <Heart size={20} color="#4B5563" />
                      <Text style={styles.dropdownText}>Create Fundraiser</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading activity...</Text>
        </View>
      ) : (
        <>
          {/* Posts Section */}
          {posts && posts.length > 0 ? (
            fromCollective ? (
              <GivingPost
                posts={posts}
                title="no title"
                showTitle={!fromCollective}
                hasMore={false}
                onCommentPress={onCommentPress}
                showSimplifiedHeader={true}
              />
            ) : (
              <PopularPosts posts={posts} title="no title" hasMore={false} onCommentPress={onCommentPress} showSimplifiedHeader={true} />
            )
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Users size={32} color="#606060" strokeWidth={2} {...({} as any)} />
              </View>
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptyText}>
                Updates will appear here as you share and interact in your Giving Groups. Join a group to get started!
              </Text>
            </View>
          )}

          {/* Recent Activities Section */}
          {recentActivities.length > 0 && !fromCollective && (
            <View style={styles.activitiesContainer}>
              <Text style={styles.activitiesTitle}>Recent Activities</Text>
              {recentActivities.map((activity: any) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  joinButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  joinButtonText: {
    fontSize: 15,
    fontFamily: 'Outfit-Bold',
    fontWeight: '700',
    color: '#1F2937',
  },
  postButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  postButtonText: {
    fontSize: 15,
    fontFamily: 'Outfit-Bold',
    fontWeight: '700',
    color: '#1F2937',
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    color: '#6B7280',
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F6F5ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Outfit-Regular',
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
  activitiesContainer: {
    marginTop: 16,
  },
  activitiesTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
    marginBottom: 12,
  },
  dropdownContainer: {
    position: 'absolute',
    top: 45,
    right: 0,
    zIndex: 1000,
  },
  overlay: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    // backgroundColor: 'transparent', // clickable but invisible
    zIndex: -1,
  },
  dropdownMenu: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: 200,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    paddingVertical: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  dropdownText: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
    color: '#111827',
  },
});

