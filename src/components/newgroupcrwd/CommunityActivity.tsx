import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/store';
import { MessageCircle, Calendar, Heart } from 'lucide-react-native';
import PopularPosts from '../PopularPosts';
import ActivityCard from './ActivityCard';

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
  const { user } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);
  const isFounder = user?.id === collectiveData?.user?.id || user?.id === collectiveData?.created_by?.id;

  // Get recent activities from collective data
  const recentActivities = collectiveData?.recent_activities || [];

  return (
    <View style={styles.container}>
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
          <View style={styles.joinButton}>
            <Text style={styles.joinButtonText}>Join to post updates</Text>
          </View>
        ) : (
          <View>
            <TouchableOpacity
              onPress={() => isFounder ? setModalVisible(true) : navigation.navigate('Post' as never, { collectiveData } as never)}
              style={styles.postButton}
              activeOpacity={0.7}
            >
              <Text style={styles.postButtonText}>{isFounder ? '+ Create' : 'Create Post'}</Text>
            </TouchableOpacity>

            <Modal
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}
              animationType="fade"
            >
              <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
                <View style={styles.dropdownMenu}>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setModalVisible(false);
                      navigation.navigate('Post' as never, { collectiveData } as never);
                    }}
                  >
                    <MessageCircle size={20} color="#4B5563" />
                    <Text style={styles.dropdownText}>Create Post</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setModalVisible(false);
                      navigation.navigate('CreateEvent' as never, { collectiveData } as never);
                    }}
                  >
                    <Calendar size={20} color="#4B5563" />
                    <Text style={styles.dropdownText}>Create Event</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setModalVisible(false);
                      navigation.navigate('CreateFundraiser' as never, { collectiveData } as never);
                    }}
                  >
                    <Heart size={20} color="#4B5563" />
                    <Text style={styles.dropdownText}>Create Fundraiser</Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Modal>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading activity...</Text>
        </View>
      ) : (
        <>
          {/* Posts Section */}
          {posts && posts.length > 0 ? (
            <PopularPosts posts={posts} title="no title" hasMore={false} onCommentPress={onCommentPress} showSimplifiedHeader={true} />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No community activity yet. Be the first to post!
              </Text>
            </View>
          )}

          {/* Recent Activities Section */}
          {recentActivities.length > 0 && (
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
    paddingTop: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  activitiesContainer: {
    marginTop: 16,
  },
  activitiesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
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
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
});

