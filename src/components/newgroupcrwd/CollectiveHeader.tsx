import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { ArrowLeft, Star, Share2, MoreHorizontal, Edit2, Link, Flag, Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { favoriteCollective, unfavoriteCollective } from '../../services/api/social';
import { useAuthStore } from '../../store/store';
import { Clipboard } from 'react-native';
import { useToast } from '../../contexts/ToastContext';

interface CollectiveHeaderProps {
  title: string;
  collectiveId?: string;
  isFavorite?: boolean;
  isAdmin?: boolean;
  onShare?: () => void;
  onManageCollective?: () => void;
  onCreateFundraiser?: () => void;
  onBack?: () => void;
}

export default function CollectiveHeader({
  title,
  collectiveId,
  isFavorite: initialIsFavorite = false,
  isAdmin = false,
  onShare,
  onManageCollective,
  onCreateFundraiser,
  onBack,
}: CollectiveHeaderProps) {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const { showToast } = useToast();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [showDropdown, setShowDropdown] = useState(false);

  // Update favorite state when prop changes
  useEffect(() => {
    setIsFavorite(initialIsFavorite);
  }, [initialIsFavorite]);

  // Favorite mutation
  const favoriteMutation = useMutation({
    mutationFn: (id: string) => favoriteCollective(id),
    onSuccess: () => {
      setIsFavorite(true);
      queryClient.invalidateQueries({ queryKey: ['crwd', collectiveId] });
      queryClient.invalidateQueries({ queryKey: ['favoriteCollectives'] });
      showToast('Added to favorites!', 2000);
    },
    onError: (error: any) => {
      console.error('Favorite error:', error);
      showToast('Failed to add to favorites.', 2000);
    },
  });

  // Unfavorite mutation
  const unfavoriteMutation = useMutation({
    mutationFn: (id: string) => unfavoriteCollective(id),
    onSuccess: () => {
      setIsFavorite(false);
      queryClient.invalidateQueries({ queryKey: ['crwd', collectiveId] });
      queryClient.invalidateQueries({ queryKey: ['favoriteCollectives'] });
      showToast('Removed from favorites!', 2000);
    },
    onError: (error: any) => {
      console.error('Unfavorite error:', error);
      showToast('Failed to remove from favorites.', 2000);
    },
  });

  const handleFavoriteClick = () => {
    if (!currentUser) {
      navigation.navigate('SplashScreen' as never);
      return;
    }

    if (!collectiveId) return;

    if (isFavorite) {
      unfavoriteMutation.mutate(collectiveId);
    } else {
      favoriteMutation.mutate(collectiveId);
    }
  };

  const handleCopyLink = async () => {
    try {
      // TODO: Get actual URL
      const url = `https://crwd.app/groupcrwd/${collectiveId}`;
      Clipboard.setString(url);
      setShowDropdown(false);
      showToast('Link copied to clipboard!', 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleManageCollective = () => {
    if (onManageCollective) {
      onManageCollective();
    } else if (collectiveId) {
      navigation.navigate('ManageCRWD' as never, { collectiveId } as never);
    }
    setShowDropdown(false);
  };

  const handleCreateFundraiser = () => {
    if (onCreateFundraiser) {
      onCreateFundraiser();
    } else if (collectiveId) {
      (navigation as any).navigate('CreateFundraiser', { collectiveId });
    }
    setShowDropdown(false);
  };

  const handleShareClick = () => {
    if (onShare) {
      onShare();
    }
    setShowDropdown(false);
  };

  const handleReport = () => {
    // TODO: Implement report functionality
    console.log('Report clicked');
    setShowDropdown(false);
  };

  const isLoading = favoriteMutation.isPending || unfavoriteMutation.isPending;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => {
          if (onBack) {
            onBack();
          } else {
            navigation.navigate('DrawerNav' as never, { screen: 'Home' } as never);
          }
        }}
        style={styles.backButton}
        activeOpacity={0.7}
      >
        <ArrowLeft size={20} color="#374151" />
      </TouchableOpacity>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={handleFavoriteClick}
          disabled={isLoading || !currentUser}
          style={[styles.actionButton, (isLoading || !currentUser) && styles.disabled]}
          activeOpacity={0.7}
        >
          <Star
            size={20}
            color={isFavorite ? '#F59E0B' : '#374151'}
            fill={isFavorite ? '#F59E0B' : 'none'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onShare}
          style={styles.actionButton}
          activeOpacity={0.7}
        >
          <Share2 size={20} color="#374151" />
        </TouchableOpacity>
        <View>
          <TouchableOpacity
            onPress={() => setShowDropdown(true)}
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <MoreHorizontal size={20} color="#374151" />
          </TouchableOpacity>

          {/* Dropdown Modal */}
          <Modal
            visible={showDropdown}
            transparent
            animationType="fade"
            onRequestClose={() => setShowDropdown(false)}
          >
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setShowDropdown(false)}
            >
              <View style={styles.dropdown}>
                {isAdmin && (
                  <>
                    <TouchableOpacity
                      onPress={handleManageCollective}
                      style={styles.dropdownItem}
                      activeOpacity={0.7}
                    >
                      <Edit size={16} color="#111827" strokeWidth={2.5} />
                      <Text style={styles.dropdownText}>Manage collective</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleCreateFundraiser}
                      style={styles.dropdownItem}
                      activeOpacity={0.7}
                    >
                      <Plus size={16} color="#111827" strokeWidth={2.5} />
                      <Text style={styles.dropdownText}>Create fundraiser</Text>
                    </TouchableOpacity>
                    <View style={styles.separator} />
                  </>
                )}
                <TouchableOpacity
                  onPress={handleShareClick}
                  style={styles.dropdownItem}
                  activeOpacity={0.7}
                >
                  <Share2 size={16} color="#111827" strokeWidth={2.5} />
                  <Text style={styles.dropdownText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCopyLink}
                  style={styles.dropdownItem}
                  activeOpacity={0.7}
                >
                  <Link2 size={16} color="#111827" strokeWidth={2.5} />
                  <Text style={styles.dropdownText}>Copy link</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleFavoriteClick}
                  disabled={isLoading || !currentUser}
                  style={[styles.dropdownItem, (isLoading || !currentUser) && styles.disabled]}
                  activeOpacity={0.7}
                >
                  <Star
                    size={16}
                    color={isFavorite ? '#F59E0B' : '#111827'}
                    fill={isFavorite ? '#F59E0B' : 'none'}
                    strokeWidth={2.5}
                  />
                  <Text style={styles.dropdownText}>
                    {isFavorite ? 'Remove favorite' : 'Add to favorites'}
                  </Text>
                </TouchableOpacity>
                <View style={styles.separator} />
                <TouchableOpacity
                  onPress={handleReport}
                  style={styles.dropdownItem}
                  activeOpacity={0.7}
                >
                  <Flag size={16} color="#111827" strokeWidth={2.5} />
                  <Text style={styles.dropdownText}>Report</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Modal>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginHorizontal: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
  },
  disabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 4,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
});

