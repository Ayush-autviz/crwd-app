import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Pressable } from 'react-native';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { X, Check } from 'lucide-react-native';
import { PrimaryBlue } from '../../Constants/Colors';

// Nonprofit Item Component
function NonprofitItem({
  nonprofitId,
  nonprofitName,
  nonprofitImage,
  avatarBgColor,
  initials,
  isSelected,
  isDisabled,
  isAtCapacity,
  onPress,
}: {
  nonprofitId: number;
  nonprofitName: string;
  nonprofitImage?: string;
  avatarBgColor: string;
  initials: string;
  isSelected: boolean;
  isDisabled: boolean;
  isAtCapacity: boolean;
  onPress: () => void;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled || isAtCapacity}
      style={[
        styles.nonprofitItem,
        (isDisabled || isAtCapacity) && styles.nonprofitItemDisabled
      ]}
      activeOpacity={0.7}
    >
      {/* Checkbox */}
      <View style={[
        styles.checkbox,
        (isDisabled || isAtCapacity) && styles.checkboxDisabled,
        isSelected && !isDisabled && !isAtCapacity && styles.checkboxSelected
      ]}>
        {(isDisabled || isAtCapacity) ? (
          <Check size={14} color="#9CA3AF" />
        ) : isSelected ? (
          <Check size={14} color="#FFFFFF" />
        ) : null}
      </View>

      {/* Nonprofit Icon/Avatar */}
      {nonprofitImage && !imageError ? (
        <Image
          source={{ uri: nonprofitImage }}
          style={styles.nonprofitImage}
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={[styles.nonprofitAvatar, { backgroundColor: avatarBgColor }]}>
          <Text style={styles.nonprofitAvatarText}>
            {initials}
          </Text>
        </View>
      )}

      {/* Nonprofit Name */}
      <View style={styles.nonprofitInfo}>
        <Text style={styles.nonprofitName} numberOfLines={1}>
          {nonprofitName}
        </Text>
        {isDisabled && !isAtCapacity && (
          <Text style={styles.nonprofitSubtext}>Already in your donation box</Text>
        )}
        {isAtCapacity && (
          <Text style={styles.nonprofitSubtextRed}>At capacity</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

interface Nonprofit {
  id: number;
  name?: string;
  logo?: string;
  image?: string;
  description?: string;
  mission?: string;
  cause?: {
    id: number;
    name: string;
    image?: string;
    logo?: string;
    mission?: string;
    description?: string;
  };
}

interface JoinCollectiveBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  collectiveName: string;
  nonprofits: Nonprofit[];
  collectiveId: string;
  onJoin: (selectedNonprofits: Nonprofit[], collectiveId: string, shouldSetupDonationBox: boolean) => void;
  isJoining?: boolean;
  donationBox?: any;
}

export default function JoinCollectiveBottomSheet({
  isOpen,
  onClose,
  collectiveName,
  nonprofits,
  collectiveId,
  onJoin,
  isJoining = false,
  donationBox,
}: JoinCollectiveBottomSheetProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [selectedNonprofitIds, setSelectedNonprofitIds] = useState<Set<number>>(new Set());
  const [hasInitialized, setHasInitialized] = useState(false);

  const snapPoints = useMemo(() => ['75%'], []);

  // Get existing cause IDs from donation box - memoized to prevent unnecessary re-renders
  const existingCauseIds = useMemo(() => {
    const ids = new Set<number>();
    if (donationBox?.box_causes && Array.isArray(donationBox.box_causes)) {
      donationBox.box_causes.forEach((boxCause: any) => {
        if (boxCause.cause?.id) {
          ids.add(boxCause.cause.id);
        }
      });
    }
    return ids;
  }, [donationBox?.box_causes]);

  // Check if donation box exists
  const hasDonationBox = donationBox && donationBox.id;

  // Check capacity: compare box_causes.length with capacity
  const currentCapacity = donationBox?.box_causes?.length || 0;
  const maxCapacity = donationBox?.capacity || 0;
  const isAtCapacity = hasDonationBox && currentCapacity >= maxCapacity;

  // Get available nonprofits (excluding those already in donation box)
  const availableNonprofits = nonprofits.filter((np) => {
    const cause = np.cause || np;
    const causeId = cause.id || np.id;
    return !existingCauseIds.has(causeId);
  });

  // Initialize all nonprofits as selected when modal first opens (excluding those already in donation box)
  // Only if not at capacity - only run once when modal opens
  useEffect(() => {
    if (isOpen && !hasInitialized) {
      if (nonprofits.length > 0 && !isAtCapacity) {
        const availableIds = nonprofits
          .map((np) => {
            const causeId = np.cause?.id || np.id;
            return existingCauseIds.has(causeId) ? null : causeId;
          })
          .filter((id): id is number => id !== null);

        setSelectedNonprofitIds(new Set(availableIds));
      } else if (isAtCapacity) {
        // Clear selection if at capacity
        setSelectedNonprofitIds(new Set());
      }
      setHasInitialized(true);
    } else if (!isOpen && hasInitialized) {
      // Reset initialization flag and selection when modal closes
      setHasInitialized(false);
      setSelectedNonprofitIds(new Set());
    }
  }, [isOpen, hasInitialized, nonprofits, existingCauseIds, isAtCapacity]);

  // Handle opening/closing the bottom sheet
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        bottomSheetRef.current?.present();
      }, 100);
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    bottomSheetRef.current?.dismiss();
    onClose();
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.5}
        onPress={handleClose}
      />
    ),
    [handleClose]
  );

  const handleToggleNonprofit = (id: number) => {
    // Don't allow toggling if at capacity or cause is already in donation box
    if (isAtCapacity || existingCauseIds.has(id)) {
      return;
    }

    setSelectedNonprofitIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleDeselectAll = () => {
    // Don't allow if at capacity
    if (isAtCapacity) {
      return;
    }

    if (selectedNonprofitIds.size === availableNonprofits.length) {
      // If all available selected, deselect all
      setSelectedNonprofitIds(new Set());
    } else {
      // If some/none selected, select all available
      setSelectedNonprofitIds(new Set(availableNonprofits.map((np) => {
        const cause = np.cause || np;
        return cause.id || np.id;
      })));
    }
  };

  const handleJoin = (shouldSetupDonationBox: boolean = false) => {
    // Get full nonprofit objects for selected IDs
    const selectedNonprofits = nonprofits.filter((np) => {
      const cause = np.cause || np;
      const nonprofitId = cause.id || np.id;
      return selectedNonprofitIds.has(nonprofitId);
    });
    onJoin(selectedNonprofits, collectiveId, shouldSetupDonationBox);
  };

  const selectedCount = selectedNonprofitIds.size;
  const allSelected = selectedCount === availableNonprofits.length && availableNonprofits.length > 0;

  // Avatar colors for consistent coloring
  const avatarColors = [
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#F97316', // Orange
    '#10B981', // Green
    '#3B82F6', // Blue
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

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      onDismiss={handleClose}
    >
      <BottomSheetView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>You've joined {collectiveName}!</Text>
            <Text style={styles.headerDescription}>
              {isAtCapacity
                ? "Your donation box is at capacity. Increase your donation to add more nonprofits."
                : hasDonationBox
                  ? "Optionally add these nonprofits to your donation box. You can manage them anytime from your profile."
                  : "Would you like to set up your donation box to support these nonprofits?"
              }
            </Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Content - Scrollable */}
        <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
          {/* Capacity Error Message */}
          {isAtCapacity && (
            <View style={styles.capacityError}>
              <Text style={styles.capacityErrorText}>
                Amazing! Your donation box is at capacity. Increase your donation to add more nonprofits.
              </Text>
            </View>
          )}

          {/* Deselect All / Select All - Only show if not at capacity */}
          {!isAtCapacity && (
            <TouchableOpacity
              onPress={handleDeselectAll}
              style={styles.selectAllButton}
              activeOpacity={0.7}
            >
              <View style={styles.selectAllContent}>
                <View style={[styles.checkbox, allSelected && styles.checkboxSelected]}>
                  {allSelected && <Check size={14} color="#FFFFFF" />}
                </View>
                <Text style={styles.selectAllText}>
                  {allSelected ? 'Deselect All' : 'Select All'}
                </Text>
              </View>
              <Text style={styles.selectAllCount}>
                {selectedCount} of {availableNonprofits.length} selected
              </Text>
            </TouchableOpacity>
          )}

          {/* Nonprofits List */}
          <View style={styles.nonprofitsList}>
            {nonprofits.map((nonprofit) => {
              const cause = nonprofit.cause || nonprofit;
              const nonprofitId = cause.id || nonprofit.id;
              const nonprofitName = cause.name || nonprofit.name || 'Unknown Nonprofit';
              const nonprofitImage = cause.image || cause.logo || nonprofit.image || nonprofit.logo;
              const isSelected = selectedNonprofitIds.has(nonprofitId);
              const isDisabled = existingCauseIds.has(nonprofitId);
              const avatarBgColor = getConsistentColor(nonprofitId, avatarColors);
              const initials = getInitials(nonprofitName);

              return (
                <NonprofitItem
                  key={nonprofit.id}
                  nonprofitId={nonprofitId}
                  nonprofitName={nonprofitName}
                  nonprofitImage={nonprofitImage}
                  avatarBgColor={avatarBgColor}
                  initials={initials}
                  isSelected={isSelected}
                  isDisabled={isDisabled}
                  isAtCapacity={isAtCapacity}
                  onPress={() => handleToggleNonprofit(nonprofitId)}
                />
              );
            })}
          </View>

          {/* Info Banner - Only show if not at capacity */}
          {!isAtCapacity && (
            <View style={styles.infoBanner}>
              <Text style={styles.infoBannerText}>
                {hasDonationBox
                  ? "Selected nonprofits will be added to your donation box. You can manage them anytime from your profile."
                  : "Set up your donation box to start supporting these nonprofits with a monthly donation."
                }
              </Text>
            </View>
          )}
        </BottomSheetScrollView>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          {!hasDonationBox ? (
            <>
              {/* No donation box - Show setup button and "Not now" */}
              <TouchableOpacity
                onPress={() => handleJoin(true)}
                disabled={isJoining || selectedCount === 0}
                style={[styles.primaryButton, (isJoining || selectedCount === 0) && styles.buttonDisabled]}
                activeOpacity={0.7}
              >
                {isJoining ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Set Up Donation Box</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.secondaryButton}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryButtonText}>Not Now</Text>
              </TouchableOpacity>
            </>
          ) : isAtCapacity ? (
            <>
              {/* At capacity - Just close button */}
              <TouchableOpacity
                onPress={handleClose}
                style={styles.primaryButton}
                activeOpacity={0.7}
              >
                <Text style={styles.primaryButtonText}>Got It</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Has donation box and not at capacity - Add to box */}
              <TouchableOpacity
                onPress={() => handleJoin(false)}
                disabled={isJoining || selectedCount === 0}
                style={[styles.primaryButton, (isJoining || selectedCount === 0) && styles.buttonDisabled]}
                activeOpacity={0.7}
              >
                {isJoining ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Add to Donation Box</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.secondaryButton}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryButtonText}>Skip</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: '#FFFFFF',
  },
  handleIndicator: {
    backgroundColor: '#D1D5DB',
    width: 40,
    height: 4,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
    paddingRight: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
  },
  headerDescription: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 15,
  },
  closeButton: {
    padding: 6,
    marginLeft: 6,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  capacityError: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  capacityErrorText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#991B1B',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  selectAllContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: PrimaryBlue,
    borderColor: PrimaryBlue,
  },
  checkboxDisabled: {
    backgroundColor: '#E5E7EB',
    borderColor: '#D1D5DB',
  },
  selectAllText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  selectAllCount: {
    fontSize: 13,
    fontWeight: '500',
    color: PrimaryBlue,
  },
  nonprofitsList: {
    gap: 6,
    marginBottom: 12,
  },
  nonprofitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    gap: 10,
  },
  nonprofitItemDisabled: {
    opacity: 0.5,
  },
  nonprofitImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  nonprofitAvatar: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nonprofitAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  nonprofitInfo: {
    flex: 1,
    minWidth: 0,
  },
  nonprofitName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  nonprofitSubtext: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  nonprofitSubtextRed: {
    fontSize: 11,
    color: '#DC2626',
    marginTop: 2,
  },
  infoBanner: {
    backgroundColor: '#FFF3C7',
    borderWidth: 1,
    borderColor: '#FDE047',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  infoBannerText: {
    fontSize: 11,
    color: '#854D0E',
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 10,
  },
  primaryButton: {
    backgroundColor: PrimaryBlue,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
});

