import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react-native';
import { getCauseById } from '../services/api/crwd';
import { addCausesToBox } from '../services/api/donation';
import { getDonationBox } from '../services/api/donation';
import { getCausesBySearch } from '../services/api/crwd';
import { useAuthStore } from '../store/store';
import { useToast } from '../contexts/ToastContext';
import CauseHeader from '../components/newcause/CauseHeader';
import CauseProfile from '../components/newcause/CauseProfile';
import CauseActionButtons from '../components/newcause/CauseActionButtons';
import VerifiedNonprofitInfo from '../components/newcause/VerifiedNonprofitInfo';
import CauseDetails from '../components/newcause/CauseDetails';
import OrganizationMission from '../components/newcause/OrganizationMission';
import SimilarNonprofits from '../components/newcause/SimilarNonprofits';
import Footer from '../components/Footer';
import { Share } from 'react-native';

export default function NewCausePage() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAddToBoxModal, setShowAddToBoxModal] = useState(false);
  const addToBoxModalRef = useRef<View>(null);

  // Get cause ID from route params
  const causeId = (route.params as any)?.id || '';

  // Fetch cause data
  const {
    data: causeData,
    isLoading: isLoadingCause,
    error: causeError,
  } = useQuery({
    queryKey: ['cause', causeId],
    queryFn: () => getCauseById(causeId),
    enabled: !!causeId,
    refetchOnMount: true,
    staleTime: 0,
  });

  // Fetch similar causes (same category, excluding current cause)
  const { data: similarCausesData, isLoading: isLoadingSimilar } = useQuery({
    queryKey: ['similar-causes', causeData?.category, causeId],
    queryFn: () => getCausesBySearch('', causeData?.category, 1),
    enabled: !!causeData?.category && !!causeId,
  });

  // Filter out current cause and limit to 2 similar causes
  const similarCauses = similarCausesData?.results
    ?.filter((cause: any) => cause.id.toString() !== causeId)
    .slice(0, 2) || [];

  // Add cause to donation box mutation
  const addToDonationBoxMutation = useMutation({
    mutationFn: async () => {
      if (!causeId) throw new Error('Cause ID is missing');
      return addCausesToBox({ cause_ids: [parseInt(causeId)] });
    },
    onSuccess: async () => {
      setShowAddToBoxModal(false);
      queryClient.invalidateQueries({ queryKey: ['donationBox', currentUser?.id] });
      showToast('Cause added to donation box!', 3000);

      // Check if donation box exists and navigate accordingly
      try {
        const donationBoxData = await getDonationBox();
        if (!donationBoxData || !donationBoxData.id) {
          // Navigate to donation box setup
          navigation.navigate('DonationScreen' as never, {
            activeTab: 'nonprofits',
            preselectedItem: {
              id: causeId,
              type: 'cause',
              data: causeData,
            },
          } as never);
        } else {
          // Navigate to donation box with cause preselected
          navigation.navigate('DonationScreen' as never, {
            activeTab: 'nonprofits',
            preselectedItem: {
              id: causeId,
              type: 'cause',
              data: causeData,
            },
          } as never);
        }
      } catch (error) {
        console.error('Error checking donation box:', error);
      }
    },
    onError: (error: any) => {
      console.error('Error adding cause to donation box:', error);
      if (error.response?.status === 403) {
        navigation.navigate('SplashScreen' as never);
      } else {
        showToast('Failed to add cause to donation box.', 3000);
      }
    },
  });

  // Loading state
  if (isLoadingCause) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9CA3AF" />
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (causeError || !causeData) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Nonprofit not found</Text>
          <Text style={styles.errorText}>
            The nonprofit you're looking for doesn't exist or has been removed.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.errorButton}
            activeOpacity={0.7}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleAddToDonationBox = () => {
    if (!currentUser?.id) {
      navigation.navigate('SplashScreen' as never);
      return;
    }
    setShowAddToBoxModal(true);
  };

  const handleConfirmAddToBox = () => {
    addToDonationBoxMutation.mutate();
  };

  const handleDonate = () => {
    if (!currentUser?.id) {
      navigation.navigate('SplashScreen' as never);
      return;
    }
    // Navigate to one-time donation flow
    navigation.navigate('DonationScreen' as never, {
      activeTab: 'nonprofits',
      preselectedItem: {
        id: causeId,
        type: 'cause',
        data: causeData,
      },
    } as never);
  };

  const handleShare = async () => {
    try {
      const url = `https://crwd.app/cause/${causeId}`;
      await Share.share({
        message: `Check out ${causeData.name || 'this nonprofit'}: ${url}`,
        title: causeData.name || 'Nonprofit',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <CauseHeader
        title={causeData.name || 'Nonprofit'}
        causeId={causeId}
        isFavorite={causeData.is_favorite}
        onShare={handleShare}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <CauseProfile causeData={causeData} />

          <CauseActionButtons
            onAddToDonationBox={handleAddToDonationBox}
            onDonate={handleDonate}
          />

          <VerifiedNonprofitInfo causeData={causeData} />

          <OrganizationMission causeData={causeData} />

          <CauseDetails causeData={causeData} />

          <SimilarNonprofits similarCauses={similarCauses} isLoading={isLoadingSimilar} />
        </View>

        <Footer />
      </ScrollView>

      {/* Add to Donation Box Confirmation Modal */}
      <Modal
        visible={showAddToBoxModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddToBoxModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAddToBoxModal(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Add to Donation Box?</Text>
            <Text style={styles.modalDescription}>
              This will add {causeData?.name} to your donation box. You can manage your
              donations anytime.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowAddToBoxModal(false)}
                style={styles.modalCancelButton}
                activeOpacity={0.7}
                disabled={addToDonationBoxMutation.isPending}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmAddToBox}
                style={styles.modalConfirmButton}
                activeOpacity={0.7}
                disabled={addToDonationBoxMutation.isPending}
              >
                {addToDonationBoxMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>Add to Box</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  errorButtonText: {
    fontSize: 14,
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  content: {
    maxWidth: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  modalCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  modalCancelText: {
    fontSize: 14,
    color: '#111827',
  },
  modalConfirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#84CC16',
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

