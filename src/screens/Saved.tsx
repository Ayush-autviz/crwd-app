import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Modal, TouchableOpacity, Pressable, TouchableWithoutFeedback, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import MainHeaderNav from '../components/MainHeaderNav';
import { Bookmark, Heart, Loader2 } from 'lucide-react-native';
import { PrimaryGrey, SecondaryGrey, PrimaryBlue, LightGrey } from '../Constants/Colors';
import { useToast } from '../contexts/ToastContext';
import FilledBookmark from '../components/FilledBookmark';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFavoriteCauses, getFavoriteCollectives, unfavoriteCause, unfavoriteCollective } from '../services/api/social';
import { useAuthStore } from '../store/store';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';

interface SavedData {
  id: string;
  avatar: string;
  title: string;
  subtitle: string;
  type: 'nonprofit' | 'collective';
  causeId?: number;
  collectiveId?: number;
  createdAt?: string;
  isJoined?: boolean;
}

export default function Saved() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<'nonprofits' | 'collectives'>('nonprofits');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SavedData | null>(null);
  const [nonprofits, setNonprofits] = useState<SavedData[]>([]);
  const [collectives, setCollectives] = useState<SavedData[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch favorite causes
  const { data: favoriteCauses, isLoading: isLoadingCauses, error: causesError, refetch: refetchCauses } = useQuery({
    queryKey: ['favoriteCauses'],
    queryFn: () => getFavoriteCauses(),
    enabled: !!user?.id,
  });

  // Fetch favorite collectives
  const { data: favoriteCollectives, isLoading: isLoadingCollectives, error: collectivesError, refetch: refetchCollectives } = useQuery({
    queryKey: ['favoriteCollectives'],
    queryFn: () => getFavoriteCollectives(),
    enabled: !!user?.id,
  });

  // Unfavorite cause mutation
  const unfavoriteCauseMutation = useMutation({
    mutationFn: unfavoriteCause,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoriteCauses'] });
      showToast('Cause removed from favorites');
    },
    onError: (error) => {
      console.error('Error unfavoriting cause:', error);
      showToast('Failed to remove cause from favorites');
    },
  });

  // Unfavorite collective mutation
  const unfavoriteCollectiveMutation = useMutation({
    mutationFn: unfavoriteCollective,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoriteCollectives'] });
      showToast('Collective removed from favorites');
    },
    onError: (error) => {
      console.error('Error unfavoriting collective:', error);
      showToast('Failed to remove collective from favorites');
    },
  });

  // Transform API data
  useEffect(() => {
    if (favoriteCauses?.results) {
      const mappedCauses = favoriteCauses.results.map((item: any) => ({
        id: item.id?.toString() || '',
        avatar: item.cause?.profile_picture ,
        title: item.cause?.name || 'Unknown Cause',
        subtitle: item.cause?.mission || 'No description available',
        type: 'nonprofit' as const,
        causeId: item.cause?.id,
        createdAt: item.created_at
      }));
      setNonprofits(mappedCauses);
    }
  }, [favoriteCauses]);

  useEffect(() => {
    if (favoriteCollectives?.results) {
      const mappedCollectives = favoriteCollectives.results.map((item: any) => ({
        id: item.id?.toString() || '',
        avatar: item.collective?.created_by?.profile_picture ,
        title: item.collective?.name || 'Unknown Collective',
        subtitle: item.collective?.description || 'No description available',
        type: 'collective' as const,
        collectiveId: item.collective?.id,
        createdAt: item.created_at,
        isJoined: item.collective?.is_joined || false
      }));
      setCollectives(mappedCollectives);
    }
  }, [favoriteCollectives]);

  const handleUnsave = (item: SavedData) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const confirmUnsave = () => {
    if (selectedItem) {
      if (activeTab === 'nonprofits') {
        unfavoriteCauseMutation.mutate(selectedItem.causeId?.toString() || '');
      } else {
        unfavoriteCollectiveMutation.mutate(selectedItem.collectiveId?.toString() || '');
      }
    }
  };

  const handleItemPress = (item: SavedData) => {
    if (item.type === 'collective') {
      navigation.navigate('GroupCRWD' as never, { crwdId: item.collectiveId || item.id } as never);
    } else {
      navigation.navigate('Cause' as never, { causeId: item.causeId || item.id } as never);
    }
  };

  const currentItems = activeTab === 'nonprofits' ? nonprofits : collectives;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchCauses(),
        refetchCollectives(),
      ]);
    } catch (error) {
      console.error('Error refreshing saved items:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={{ marginBottom: 16 }}>
        <Heart size={48} color={PrimaryGrey} />
      </View>
      <Text style={styles.emptyTitle}>
        No {activeTab === 'nonprofits' ? 'Nonprofits' : 'Collectives'} Saved
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'nonprofits' 
          ? "You haven't saved any nonprofits yet. Browse causes to save your favorites!"
          : "You haven't saved any collectives yet. Explore collectives to join and save them!"
        }
      </Text>
    </View>
  );

  // Show login prompt for unauthenticated users
  if (!user?.id) {
    return (
      <SafeAreaView style={styles.container}>
        <MainHeaderNav show={true} menu={false} title={'Favorites'}/>
        <View style={styles.loginPrompt}>
          <View style={styles.loginIconContainer}>
            <Heart size={40} color={PrimaryBlue} />
          </View>
          <Text style={styles.loginTitle}>Sign in to view your favorites</Text>
          <Text style={styles.loginSubtitle}>
            Sign in to view your saved nonprofits and collectives, and connect with your community.
          </Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login' as never)}
          >
            <Text style={styles.loginButtonText}>Sign In to Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading state
  if (isLoadingCauses || isLoadingCollectives) {
    return (
      <SafeAreaView style={styles.container}>
        <MainHeaderNav show={true} menu={false} title={'Favorites'}/>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PrimaryBlue} />
          <Text style={styles.loadingText}>Loading favorites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <MainHeaderNav show={true} menu={false} title={'Favorites'}/>
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'nonprofits' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('nonprofits')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'nonprofits' && styles.activeTabText
          ]}>
            Nonprofits
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'collectives' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('collectives')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'collectives' && styles.activeTabText
          ]}>
            Collectives
          </Text>
        </TouchableOpacity>
      </View>
      
      <FlatList 
        data={currentItems}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={{ flexGrow: 1}}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PrimaryBlue}
            colors={[PrimaryBlue]}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.itemContainer}
            onPress={() => handleItemPress(item)}
          >
            <View style={styles.itemContent}>
              <Avatar size={40}>
                <AvatarImage src={item.avatar} />
                <AvatarFallback 
                  style={{ 
                    backgroundColor: item.type === 'collective' ? '#dcfce7' : '#dbeafe' 
                  }} 
                  textStyle={{ 
                    color: item.type === 'collective' ? '#16a34a' : '#2563eb', 
                    fontWeight: '600' 
                  }}
                >
                  {item.title?.charAt(0).toUpperCase() || 'N'}
                </AvatarFallback>
              </Avatar>
              <View style={styles.itemTextContainer}>
                <Text style={styles.itemName}>{item.title}</Text>
                <Text style={styles.itemDescription}>{item.subtitle}</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => handleUnsave(item)}
              style={styles.bookmarkButton}
            >
              <Heart size={20} fill={'red'} stroke={'red'} />
            </TouchableOpacity>
          </TouchableOpacity>
        )} 
      />

      {/* Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Unsave Item</Text>
                <Text style={styles.modalText}>
                  Are you sure you want to unsave "{selectedItem?.title}"? This will remove it from your favorites.
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]} 
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.unsaveButton]} 
                    onPress={confirmUnsave}
                  >
                    <Text style={styles.unsaveButtonText}>Unsave</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 5,
  },
  itemContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    // gap: 5,
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemDescription: {
    fontSize: 12,
    color: PrimaryGrey,
    maxWidth: '90%',
  },
  bookmarkButton: {
    // padding: 8,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: PrimaryGrey,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: LightGrey,
  },
  unsaveButton: {
    backgroundColor: '#ef4444',
  },
  cancelButtonText: {
    color: PrimaryGrey,
    fontWeight: '500',
  },
  unsaveButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PrimaryGrey,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: SecondaryGrey,
    textAlign: 'center',
  },
  // Tab Navigation Styles
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: PrimaryBlue,
    backgroundColor: '#f0f9ff',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: PrimaryBlue,
    fontWeight: '600',
  },
  // Login Prompt Styles
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  loginIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: PrimaryBlue,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  // Item Text Container
  itemTextContainer: {
    flex: 1,
    marginLeft: 12,
    // flexShrink: 1,
  },
});
