import React, { useState, useRef } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Modal, StyleSheet, Dimensions } from 'react-native';
import MainHeaderNav from '../components/MainHeaderNav';
import GroupCRWDHeader from '../components/groupcrwd/GroupCRWDHeader';
import GroupCRWDSuggested from '../components/groupcrwd/GroupCRWDSuggested';
import GroupCRWDUpdates from '../components/groupcrwd/GroupCRWDUpdates';
import GroupCRWDEvent from '../components/groupcrwd/GroupCRWDEvent';
import GroupCRWDBottomBar from '../components/groupcrwd/GroupCRWDBottomBar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Share2, X } from 'lucide-react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Share } from 'react-native';
import { LightGrey, PrimaryBlue, PrimaryGrey, SecondaryGrey } from '../Constants/Colors';

const { width, height } = Dimensions.get('window');

export default function GroupCRWD() {
  const [hasJoined, setHasJoined] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const confettiRef = useRef<ConfettiCannon>(null);

  const handleCloseModal = () => {
    setShowJoinModal(false);
  };

  const handleJoinConfirm = () => {
    setHasJoined(true);
    setShowJoinModal(false);
    setShowSuccessModal(true);
    
    // Fire confetti after modal appears
    setTimeout(() => {
      confettiRef.current?.start();
    }, 300);
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
    setHasJoined(false);
    setShowToast(true);
    setShowConfirmDialog(false);
    
    // Hide toast after 3 seconds
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Join us in supporting families experiencing food insecurity in the greater Atlanta area.',
        title: 'Feed the hungry - CRWD',
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  return (
    <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }}>
      <MainHeaderNav show menu={false} post={false} />
      
      {/* Action Buttons Header */}
      <View style={styles.actionHeader}>
        <View style={styles.crwdBadge}>
          <Text style={styles.crwdBadgeText}>CRWD</Text>
        </View>
        <View style={styles.actionButtons}>
          {hasJoined && (
            <TouchableOpacity style={styles.donateButton}>
              <Text style={styles.donateButtonText}>Donate</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            {/* <Share2 size={20} color={PrimaryGrey} /> */}
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
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
              <Text style={styles.joinButtonText}>Join CRWD</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <GroupCRWDHeader />
        <GroupCRWDSuggested />
        <GroupCRWDUpdates />
        {/* <GroupCRWDEvent /> */}
        <View style={{ height: 100 }} />
      </ScrollView>
      {/* <GroupCRWDBottomBar /> */}

      {/* Toast Notification */}
      {showToast && (
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseModal}
            >
              <X size={24} color="#9ca3af" />
            </TouchableOpacity>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalTitle}>
                Join "Save the Trees Atlanta"?
              </Text>
              <Text style={styles.modalDescription}>
                This CRWD includes 3 nonprofits.
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
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseSuccessModal}
      >
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
          
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseSuccessModal}
            >
              <X size={24} color="#9ca3af" />
            </TouchableOpacity>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalTitle}>
                You've joined Save the Trees Atlanta!
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
                  <View style={styles.communityIcon}>
                    <Text style={styles.communityIconText}>🌳</Text>
                  </View>
                  <View style={styles.communityDetails}>
                    <Text style={styles.communityName}>
                      Save the Trees Atlanta
                    </Text>
                    <View style={styles.memberInfo}>
                      <View style={styles.avatarGroup}>
                        <View style={styles.avatar} />
                        <View style={styles.avatar} />
                      </View>
                      <Text style={styles.memberCount}>44 members</Text>
                    </View>
                  </View>
                </View>
              </View>
              
              <Text style={styles.modalDescription}>
                We've added 3 nonprofits from Save the Trees Atlanta to your
                donation box. You can edit or remove them any time.
              </Text>
              
              <View style={styles.successActions}>
                <TouchableOpacity style={styles.goToCrwdButton} onPress={handleCloseSuccessModal}>
                  <Text style={styles.goToCrwdButtonText}>GO TO CRWD</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.manageDonationsButton} onPress={handleCloseSuccessModal}>
                  <Text style={styles.manageDonationsButtonText}>MANAGE DONATIONS</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirm Unjoin Dialog */}
      <Modal
        visible={showConfirmDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmDialog(false)}
      >
        <View style={styles.modalOverlay}>
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
        </View>
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
    paddingHorizontal: 8,
    paddingVertical: 4,
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
    backgroundColor: '#16a34a',
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
  communityIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#14b8a6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityIconText: {
    fontSize: 20,
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
