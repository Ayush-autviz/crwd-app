import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { ArrowLeft, Star, MoreHorizontal, Share2, Link2, Flag, CreditCard } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { favoriteCause, unfavoriteCause } from '../../services/api/social';
import { useAuthStore } from '../../store/store';
import { Clipboard } from 'react-native';
import { useToast } from '../../contexts/ToastContext';

interface CauseHeaderProps {
  title: string;
  causeId?: string;
  isFavorite?: boolean;
  onShare?: () => void;
  onOneTimeDonation?: () => void;
}

export default function CauseHeader({
  title,
  causeId,
  isFavorite: initialIsFavorite = false,
  onShare,
  onOneTimeDonation,
}: CauseHeaderProps) {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const { showToast } = useToast();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    setIsFavorite(initialIsFavorite);
  }, [initialIsFavorite]);

  const favoriteMutation = useMutation({
    mutationFn: (id: string) => favoriteCause(id),
    onSuccess: () => {
      setIsFavorite(true);
      queryClient.invalidateQueries({ queryKey: ['cause', causeId] });
      queryClient.invalidateQueries({ queryKey: ['favoriteCauses'] });
      showToast('Added to favorites!', 2000);
    },
    onError: (error: any) => {
      console.error('Favorite error:', error);
      if (error.response?.status === 403) {
        navigation.navigate('SplashScreen' as never);
      }
      showToast('Failed to add to favorites.', 2000);
    },
  });

  const unfavoriteMutation = useMutation({
    mutationFn: (id: string) => unfavoriteCause(id),
    onSuccess: () => {
      setIsFavorite(false);
      queryClient.invalidateQueries({ queryKey: ['cause', causeId] });
      queryClient.invalidateQueries({ queryKey: ['favoriteCauses'] });
      showToast('Removed from favorites!', 2000);
    },
    onError: (error: any) => {
      console.error('Unfavorite error:', error);
      if (error.response?.status === 403) {
        navigation.navigate('SplashScreen' as never);
      }
      showToast('Failed to remove from favorites.', 2000);
    },
  });

  const handleFavoriteClick = () => {
    if (!currentUser?.id) {
      navigation.navigate('SplashScreen' as never);
      return;
    }
    if (causeId) {
      if (isFavorite) {
        unfavoriteMutation.mutate(causeId);
      } else {
        favoriteMutation.mutate(causeId);
      }
    }
  };

  const handleFavoriteFromDropdown = () => {
    setShowDropdown(false);
    handleFavoriteClick();
  };

  const handleShareClick = () => {
    setShowDropdown(false);
    onShare?.();
  };

  const handleCopyLink = async () => {
    setShowDropdown(false);
    if (causeId) {
      const url = `https://crwd.app/cause/${causeId}`;
      try {
        Clipboard.setString(url);
        showToast('Link copied to clipboard!', 2000);
      } catch (err) {
        console.error('Failed to copy link:', err);
        showToast('Failed to copy link.', 2000);
      }
    }
  };

  const handleReport = () => {
    setShowDropdown(false);
    showToast('Report functionality coming soon!', 2000);
  };

  const isLoading = favoriteMutation.isPending || unfavoriteMutation.isPending;

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <View style={styles.rightSection}>
        <TouchableOpacity
          onPress={handleFavoriteClick}
          style={styles.actionButton}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Star
            size={20}
            color={isFavorite ? '#F59E0B' : '#374151'}
            fill={isFavorite ? '#F59E0B' : 'none'}
          />
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
                  onPress={handleFavoriteFromDropdown}
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
                <TouchableOpacity
                  onPress={() => {
                    setShowDropdown(false);
                    onOneTimeDonation?.();
                  }}
                  disabled={!onOneTimeDonation}
                  style={[styles.dropdownItem, !onOneTimeDonation && styles.disabled]}
                  activeOpacity={0.7}
                >
                  <CreditCard size={16} color="#111827" strokeWidth={2.5} />
                  <Text style={styles.dropdownText}>One Time Donation</Text>
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
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
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
    fontFamily: 'Outfit-Medium',
    color: '#111827',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
});

