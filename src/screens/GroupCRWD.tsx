import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Modal, StyleSheet, Dimensions, TouchableWithoutFeedback, ActivityIndicator, Clipboard } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MainHeaderNav from '../components/MainHeaderNav';
import GroupCRWDHeader from '../components/groupcrwd/GroupCRWDHeader';
import GroupCRWDSuggested from '../components/groupcrwd/GroupCRWDSuggested';
import GroupCRWDUpdates from '../components/groupcrwd/GroupCRWDUpdates';
import GroupCRWDEvent from '../components/groupcrwd/GroupCRWDEvent';
import GroupCRWDBottomBar from '../components/groupcrwd/GroupCRWDBottomBar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Share2 } from 'lucide-react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Share } from 'react-native';
import { LightGrey, PrimaryBlue, PrimaryGreen, PrimaryGrey, SecondaryGrey } from '../Constants/Colors';
import { getCollectiveById, joinCollective, leaveCollective } from '../services/api/crwd';
import { getPosts } from '../services/api/social';
import { useToast } from '../contexts/ToastContext';
import { useAuthStore } from '../store/store';
import { getDonationBox, addCollectiveToDonation } from '../services/api/donation';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';

const WEB_BASE_URL = 'https://crwd-vite-1.onrender.com';

const { width, height } = Dimensions.get('window');

export default function GroupCRWD() {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user: currentUser } = useAuthStore();
  
  // Get collective ID from route params
  const collectiveId = (route.params as any)?.collectiveId || "1";
  
  const [hasJoined, setHasJoined] = useState(false);
  const [showToastState, setShowToastState] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const confettiRef = useRef<ConfettiCannon>(null);

  // Fetch collective data
  const { data: collectiveData, isLoading: isLoadingCollective } = useQuery({
    queryKey: ['collective', collectiveId],
    queryFn: () => getCollectiveById(collectiveId),
    enabled: !!collectiveId,
  });

  // Fetch posts for this collective
  const { data: posts, isLoading: isLoadingPosts } = useQuery({
    queryKey: ['posts', collectiveId],
    queryFn: () => getPosts('', collectiveId),
    enabled: !!collectiveId,
  });


  // Update hasJoined state when collectiveData changes
  useEffect(() => {
    if (collectiveData?.is_joined !== undefined) {
      setHasJoined(collectiveData.is_joined);
    }
  }, [collectiveData?.is_joined]);

  const handleCloseModal = () => {
    setShowJoinModal(false);
  };

  const handleJoinConfirm = () => {
    joinCollectiveMutation.mutate(collectiveId);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
  };

  const handleJoin = () => {
    if (hasJoined) {
      // If already joined, show confirmation dialog before unjoining
      setShowConfirmDialog(true);
    } else {
      // If not joined, join directly
      setShowJoinModal(true);
    }
  };

  const handleConfirmUnjoin = () => {
    leaveCollectiveMutation.mutate(collectiveId);
  };

  // Join collective mutation
  const joinCollectiveMutation = useMutation({
    mutationFn: joinCollective,
    onSuccess: async (response) => {
      console.log('Join collective successful:', response);
      setHasJoined(true);
      setShowJoinModal(false);
      showToast('Successfully joined the collective!', 3000);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['collective', collectiveId] });
      queryClient.invalidateQueries({ queryKey: ['joined-collectives'] });
      queryClient.invalidateQueries({ queryKey: ['joined-collectives', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['donationBox', currentUser?.id] });
      
      // Check if donation box exists
      try {
        const donationBoxData = await getDonationBox();
        
        // If donation box doesn't exist or has no ID, redirect to setup
        if (!donationBoxData || !donationBoxData.id) {
          // Navigate to donation screen with setup tab and collective preselected
          // Navigate through MainTabs -> My Giving to show bottom tabs
          (navigation as any).navigate('DrawerNav', {
            screen: 'MainTabs',
            params: {
              screen: 'My Giving',
              params: {
                initialTab: 'setup',
                preselectedItem: {
                  id: collectiveId,
                  type: 'collective' as const,
                  data: collectiveData
                },
                activeTab: 'collectives'
              }
            }
          });
        } else {
          // Donation box exists, add collective to donation box
          try {
            if (!collectiveId) {
              throw new Error('Collective ID is missing');
            }
            await addCollectiveToDonation(collectiveId);
            console.log('Collective added to donation box successfully');
            
            // Invalidate and refetch donation box query to refresh data
            // Note: Mobile app uses ['donationBox'] without user ID
            await queryClient.invalidateQueries({ queryKey: ['donationBox'] });
            await queryClient.invalidateQueries({ queryKey: ['donationBox', currentUser?.id] });
            await queryClient.refetchQueries({ queryKey: ['donationBox'] });
            await queryClient.refetchQueries({ queryKey: ['donationBox', currentUser?.id] });
            
            // Navigate to donation screen with setup tab and collective preselected
            // Navigate through MainTabs -> My Giving to show bottom tabs
            (navigation as any).navigate('DrawerNav', {
              screen: 'MainTabs',
              params: {
                screen: 'My Giving',
                params: {
                  initialTab: 'setup',
                  preselectedItem: {
                    id: collectiveId,
                    type: 'collective' as const,
                    data: collectiveData
                  },
                  activeTab: 'collectives'
                }
              }
            });
          } catch (addError) {
            console.error('Error adding collective to donation box:', addError);
            // On error, still navigate to setup tab
            // Navigate through MainTabs -> My Giving to show bottom tabs
            (navigation as any).navigate('DrawerNav', {
              screen: 'MainTabs',
              params: {
                screen: 'My Giving',
                params: {
                  initialTab: 'setup',
                  preselectedItem: {
                    id: collectiveId,
                    type: 'collective' as const,
                    data: collectiveData
                  },
                  activeTab: 'collectives'
                }
              }
            });
          }
        }
      } catch (error) {
        console.error('Error checking donation box:', error);
        // On error, navigate to setup tab
        // Navigate through MainTabs -> My Giving to show bottom tabs
        (navigation as any).navigate('DrawerNav', {
          screen: 'MainTabs',
          params: {
            screen: 'My Giving',
            params: {
              initialTab: 'setup',
              preselectedItem: {
                id: collectiveId,
                type: 'collective' as const,
                data: collectiveData
              },
              activeTab: 'collectives'
            }
          }
        });
      }
    },
    onError: (error: any) => {
      console.error('Join collective error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to join collective';
      showToast(errorMessage, 3000);
    },
  });

  // Leave collective mutation
  const leaveCollectiveMutation = useMutation({
    mutationFn: leaveCollective,
    onSuccess: async (response) => {
      console.log('Leave collective successful:', response);
      setHasJoined(false);
      setShowConfirmDialog(false);
      showToast('Successfully left the collective', 3000);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['collective', collectiveId] });
      queryClient.invalidateQueries({ queryKey: ['joined-collectives'] });
      queryClient.invalidateQueries({ queryKey: ['joined-collectives', currentUser?.id] });
      // Invalidate and refetch donation box as leaving collective updates it
      // Note: Mobile app uses ['donationBox'] without user ID
      await queryClient.invalidateQueries({ queryKey: ['donationBox'] });
      await queryClient.invalidateQueries({ queryKey: ['donationBox', currentUser?.id] });
      await queryClient.refetchQueries({ queryKey: ['donationBox'] });
      await queryClient.refetchQueries({ queryKey: ['donationBox', currentUser?.id] });
    },
    onError: (error: any) => {
      console.error('Leave collective error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to leave collective';
      showToast(errorMessage, 3000);
    },
  });

  const handleShare = async () => {
    try {
      const webUrl = `${WEB_BASE_URL}/groupcrwd/${collectiveId}`;
      const shareMessage = `Check out this CRWD Collective: ${collectiveData?.name || 'Collective'}\n${webUrl}`;
      
      const result = await Share.share({
        message: shareMessage,
        title: `${collectiveData?.name || 'Feed the hungry'} - CRWD`,
        url: webUrl, // iOS only
      });
      
      // Copy link to clipboard when sharing
      if (result.action === Share.sharedAction) {
        try {
          await Clipboard.setString(webUrl);
          showToast('Link copied to clipboard!');
        } catch (clipboardError) {
          console.log('Error copying to clipboard:', clipboardError);
        }
      }
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };


  // Show loading state
  if (isLoadingCollective) {
    return (
      <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }}>
        <MainHeaderNav show menu={false} title={'Collective'}/>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={PrimaryBlue} />
          <Text style={{ marginTop: 16, color: PrimaryGrey }}>Loading collective...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }}>
      <MainHeaderNav show menu={false} title={'Collective'}/>
      
      {/* Action Buttons Header */}
      <View style={styles.actionHeader}>
        <View style={styles.crwdBadge}>
          <Text style={styles.crwdBadgeText}>Collective</Text>
        </View>
        <View style={styles.actionButtons}>
          {hasJoined && (
            <TouchableOpacity style={styles.donateButton} onPress={() => {
              (navigation as any).navigate('DrawerNav', {
                screen: 'Donation',
                params: { 
                  initialTab: 'onetime',
                  preselectedItem: collectiveData ? {
                    id: collectiveData.id.toString(),
                    type: 'collective' as const,
                    data: collectiveData
                  } : undefined,
                  activeTab: 'collectives'
                }
              });
            }}>
              <Text style={styles.donateButtonText}>Donate</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            {/* <Share2 size={20} color={PrimaryGrey} /> */}
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
          {(currentUser?.id && collectiveData?.created_by?.id !== currentUser?.id) && (
          <TouchableOpacity
            style={[
              styles.joinButton,
              hasJoined && styles.joinedButton
            ]}
            onPress={handleJoin}
          >
            {hasJoined ? (
              <>
                <Check size={16} color="#6b7280" />
                <Text style={styles.joinedButtonText}>Joined</Text>
              </>
            ) : (
              <Text style={styles.joinButtonText}>Join This Collective</Text>
            )}
          </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <GroupCRWDHeader 
          hasJoined={hasJoined} 
          onJoin={handleJoin} 
          id={collectiveId} 
          crwdData={collectiveData} 
        />
        <GroupCRWDUpdates 
          joined={hasJoined} 
          collectiveData={collectiveData}
          posts={posts?.results || []}
          isLoading={isLoadingPosts}
          recentActivities={collectiveData?.recent_activities || []}
        />
        <GroupCRWDSuggested collectiveId={collectiveId} />

        {/* <GroupCRWDEvent /> */}
        <View style={{ height: 10 }} />
      </ScrollView>
      {/* <GroupCRWDBottomBar /> */}

      {/* Toast Notification */}
      {showToastState && (
        <View style={styles.toastContainer}>
          <View style={styles.toast}>
            <Text style={styles.toastText}>
              {hasJoined ? "You have joined the group" : "You have left the group"}
            </Text>
          </View>
        </View>
      )}

      {/* Join Modal */}
      <Modal
        visible={showJoinModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <TouchableWithoutFeedback onPress={handleCloseModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleCloseModal}
                >
                  <Text style={{fontSize: 24, color: '#9ca3af', lineHeight: 24}}>×</Text>
                </TouchableOpacity>
                
                <View style={styles.modalBody}>
                  <Text style={styles.modalTitle}>
                    Join {collectiveData?.name}?
                  </Text>
                  <Text style={styles.modalDescription}>
                    This Collective includes {collectiveData?.causes?.length || 0} nonprofits.
                  </Text>
                  
                  <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.learnMoreButton} onPress={handleCloseModal}>
                      <Text style={styles.learnMoreButtonText}>Learn More</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.joinConfirmButton} onPress={handleJoinConfirm}>
                      <Text style={styles.joinConfirmButtonText}>Join</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseSuccessModal}
      >
        <TouchableWithoutFeedback onPress={handleCloseSuccessModal}>
          <View style={styles.modalOverlay}>
            {/* Confetti */}
            <View style={styles.confettiContainer}>
              <ConfettiCannon
                ref={confettiRef}
                count={200}
                origin={{ x: width / 2, y: 0 }}
                autoStart={false}
                colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']}
                fadeOut
              />
            </View>
            
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleCloseSuccessModal}
                >
                  <Text style={{fontSize: 24, color: '#9ca3af', lineHeight: 24}}>×</Text>
                </TouchableOpacity>
                
                <View style={styles.modalBody}>
                  <Text style={styles.modalTitle}>
                    You've joined {collectiveData?.name}!
                  </Text>
                  <Text style={styles.modalDescription}>
                    Welcome to the community.
                  </Text>
                  <Text style={styles.modalDescription}>
                    Here's what's inside your CRWD:
                  </Text>
                  
                  {/* Community Info Card */}
                  <View style={styles.communityCard}>
                    <View style={styles.communityInfo}>
                      <Avatar size={48}>
                        <AvatarImage src={collectiveData?.cover_image || collectiveData?.image || collectiveData?.avatar || collectiveData?.created_by?.profile_picture} />
                        <AvatarFallback style={{ backgroundColor: '#14b8a6' }} textStyle={{ color: 'white', fontWeight: '600', fontSize: 20 }}>
                          {collectiveData?.name?.charAt(0)?.toUpperCase() || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      <View style={styles.communityDetails}>
                        <Text style={styles.communityName}>
                          {collectiveData?.name}
                        </Text>
                        <View style={styles.memberInfo}>
                          <View style={styles.avatarGroup}>
                            <View style={styles.avatar} />
                            <View style={styles.avatar} />
                          </View>
                          <Text style={styles.memberCount}>{collectiveData?.member_count || 0} members</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.successActions}>
                    <TouchableOpacity 
                      style={styles.manageDonationsButton} 
                      onPress={() => {
                        handleCloseSuccessModal();
                        (navigation as any).navigate('DrawerNav', {
                          screen: 'Donation',
                          params: { 
                            initialTab: 'onetime',
                            preselectedItem: collectiveData ? {
                              id: collectiveData.id.toString(),
                              type: 'collective' as const,
                              data: collectiveData
                            } : undefined,
                            activeTab: 'collectives'
                          }
                        });
                      }}
                    >
                      <Text style={styles.manageDonationsButtonText}>MANAGE DONATIONS</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Confirm Unjoin Dialog */}
      <Modal
        visible={showConfirmDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmDialog(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowConfirmDialog(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <View style={styles.modalBody}>
                  <Text style={styles.modalTitle}>Leave Group</Text>
                  <Text style={styles.modalDescription}>
                    Are you sure you want to leave this group? You can always join
                    back later.
                  </Text>
                  
                  <View style={styles.dialogActions}>
                    <TouchableOpacity 
                      style={styles.cancelButton} 
                      onPress={() => setShowConfirmDialog(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.leaveButton} 
                      onPress={handleConfirmUnjoin}
                    >
                      <Text style={styles.leaveButtonText}>Leave Group</Text>
                    </TouchableOpacity>
                  </View>
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
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 24,
    paddingBottom: 8,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    zIndex: 10,
  },
  crwdBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 6,
  },
  crwdBadgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#15803d',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  donateButton: {
    backgroundColor: PrimaryBlue,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  donateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: SecondaryGrey,
  },
  shareButtonText: {
    color: 'black',
    fontSize: 14,
    fontWeight: '500',
  },
  joinButton: {
    backgroundColor: PrimaryGreen,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  joinedButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  joinedButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  toast: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#9ca3af',
    fontWeight: 'bold',
  },
  modalBody: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  learnMoreButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'white',
  },
  learnMoreButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  joinConfirmButton: {
    backgroundColor: PrimaryBlue,
    paddingHorizontal: 40,
    paddingVertical: 8,
    borderRadius: 6,
  },
  joinConfirmButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    pointerEvents: 'none',
  },
  communityCard: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  communityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  communityDetails: {
    flex: 1,
  },
  communityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarGroup: {
    flexDirection: 'row',
  },
  avatar: {
    width: 24,
    height: 24,
    backgroundColor: '#d1d5db',
    borderRadius: 12,
    marginLeft: -8,
    borderWidth: 2,
    borderColor: 'white',
  },
  memberCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  successActions: {
    width: '100%',
    gap: 12,
  },
  goToCrwdButton: {
    backgroundColor: PrimaryBlue,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  goToCrwdButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  manageDonationsButton: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    width: '100%',
  },
  manageDonationsButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'white',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  leaveButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  leaveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});
