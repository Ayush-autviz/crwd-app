import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { X, Minus, Plus } from 'lucide-react-native';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDonationBox } from '../../services/api/donation';
import { useToast } from '../../contexts/ToastContext';
import { PrimaryBlue } from '../../Constants/Colors';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet';

interface EditDonationSplitBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  causes: any[];
  monthlyAmount: number;
  boxCauses?: any[];
}

const avatarColors = [
  '#3B82F6', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4',
  '#F97316', '#84CC16', '#A855F7', '#14B8A6', '#F43F5E', '#6366F1', '#22C55E', '#EAB308',
];

const getConsistentColor = (id: number | string, colors: string[]) => {
  const hash = typeof id === 'number' ? id : id.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const getInitials = (name: string) => {
  const words = name.split(' ');
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Memoized Cause Card Component for performance
interface CauseCardProps {
  cause: any;
  index: number;
  percentage: number;
  displayPercentage: number;
  inputValue: string;
  draggingValue: number | undefined;
  netAmount: number;
  minPercentage: number;
  onDecrease: (id: number) => void;
  onIncrease: (id: number) => void;
  onInputChange: (id: number, value: string) => void;
  onInputBlur: (id: number) => void;
  onSliderChange: (id: number, value: number) => void;
  onSliderComplete: (id: number, value: number) => void;
  isLast?: boolean;
}

const CauseCard = React.memo(({
  cause,
  index,
  percentage,
  displayPercentage,
  inputValue,
  draggingValue,
  netAmount,
  minPercentage,
  onDecrease,
  onIncrease,
  onInputChange,
  onInputBlur,
  onSliderChange,
  onSliderComplete,
  isLast,
}: CauseCardProps) => {
  const amount = (netAmount * displayPercentage) / 100;
  const avatarBgColor = getConsistentColor(cause.id, avatarColors);
  const initials = getInitials(cause.name || 'N');

  return (
    <View style={[styles.causeListItem, isLast && styles.causeListItemLast]}>
      <View style={styles.causeItemTop}>
        {/* Identity Section */}
        <View style={styles.causeIdentity}>
          <Avatar size={40}>
            <AvatarImage src={cause.image || cause.logo} />
            <AvatarFallback
              style={{ backgroundColor: avatarBgColor }}
              textStyle={{ color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <View style={styles.causeInfo}>
            <Text style={styles.causeName} numberOfLines={1}>{cause.name}</Text>
            <Text style={styles.causeAmount}>${amount.toFixed(2)}/mo</Text>
          </View>
        </View>

        {/* Controls/Amount Section */}
        <View style={styles.causeRight}>
          <Text style={styles.causePercentageText}>
            {parseInt(inputValue).toString() || '0'}%
          </Text>
        </View>
      </View>

      {/* Slider Section */}
      <View
        style={styles.sliderContainer}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <Slider
          style={styles.slider}
          minimumValue={minPercentage}
          maximumValue={100}
          step={0.5}
          value={draggingValue ?? percentage}
          onValueChange={(value) => onSliderChange(cause.id, value)}
          onSlidingComplete={(value) => onSliderComplete(cause.id, value)}
          minimumTrackTintColor="#D1D5DB"
          maximumTrackTintColor="#F3F4F6"
          thumbTintColor="#FFFFFF"
        />
      </View>
    </View>
  );
});

export default function EditDonationSplitBottomSheet({
  isOpen,
  onClose,
  causes,
  monthlyAmount,
  boxCauses = [],
}: EditDonationSplitBottomSheetProps) {
  const [percentages, setPercentages] = useState<Record<number, number>>({});
  const [inputValues, setInputValues] = useState<Record<number, string>>({});
  const [draggingValues, setDraggingValues] = useState<Record<number, number>>({});
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['85%'], []);

  // Debug: Log props
  useEffect(() => {
    if (isOpen) {
      console.log('=== EditDonationSplitBottomSheet Opened ===');
      console.log('causes:', causes?.length);
      console.log('monthlyAmount:', monthlyAmount);
    }
  }, [isOpen, causes, monthlyAmount]);

  // Handle Sheet Visibility
  useEffect(() => {
    if (isOpen) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [isOpen]);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  // Calculate minimum percentage based on $0.20 minimum donation
  const calculateMinPercentage = useCallback(() => {
    const netAmount = monthlyAmount * 0.9;
    const MIN_DONATION = 0.20;
    return (MIN_DONATION / netAmount) * 100;
  }, [monthlyAmount]);

  // --- THE MATH FIXER ---
  // This ensures the sum is EXACTLY 100.00%
  const forceSumTo100 = useCallback((currentPercentages: Record<number, number>) => {
    const ids = Object.keys(currentPercentages).map(Number);
    if (ids.length === 0) return currentPercentages;

    // 1. Find the ID with the largest percentage to absorb the remainder/rounding error
    let largestId = ids[0];
    let largestValue = currentPercentages[ids[0]];

    ids.forEach(id => {
      if (currentPercentages[id] > largestValue) {
        largestValue = currentPercentages[id];
        largestId = id;
      }
    });

    // 2. Sum everyone ELSE
    let sumOfOthers = 0;
    const fixedPercentages = { ...currentPercentages };

    ids.forEach(id => {
      if (id !== largestId) {
        // Ensure others are rounded to 2 decimals nicely
        const val = parseFloat(fixedPercentages[id].toFixed(2));
        fixedPercentages[id] = val;
        sumOfOthers += val;
      }
    });

    // 3. Force the largest one to fill the gap exactly
    const remaining = 100 - sumOfOthers;

    // Safety check: ensure we don't accidentally make it negative 
    if (remaining >= 0) {
      fixedPercentages[largestId] = parseFloat(remaining.toFixed(2));
    }

    return fixedPercentages;
  }, []);

  // Initialize percentages
  useEffect(() => {
    if (!isOpen) {
      setPercentages({});
      setInputValues({});
      setDraggingValues({});
      return;
    }

    if (causes && Array.isArray(causes) && causes.length > 0 && isOpen) {
      const minPercentage = calculateMinPercentage();
      let initialPercentages: Record<number, number> = {};

      const hasExistingPercentages = boxCauses.some((bc: any) => bc.percentage != null);

      if (hasExistingPercentages) {
        causes.forEach((cause: any) => {
          const boxCause = boxCauses.find((bc: any) => bc.cause?.id === cause.id);
          const existingPercentage = boxCause?.percentage || (100 / causes.length);
          initialPercentages[cause.id] = Math.max(minPercentage, existingPercentage);
        });
      } else {
        const equalPercentage = 100 / causes.length;
        const targetPercentage = equalPercentage < minPercentage ? minPercentage : equalPercentage;
        causes.forEach((cause: any) => {
          initialPercentages[cause.id] = targetPercentage;
        });
      }

      // Force sum to 100
      initialPercentages = forceSumTo100(initialPercentages);

      const initialInputs: Record<number, string> = {};
      causes.forEach((cause: any) => {
        initialInputs[cause.id] = (initialPercentages[cause.id] || 0).toFixed(2);
      });

      setPercentages(initialPercentages);
      setInputValues(initialInputs);
    }
  }, [causes, isOpen, boxCauses, monthlyAmount, calculateMinPercentage, forceSumTo100]);

  // Sync Input Values from Percentages
  // Note: We don't have focusedInput state here like the web, so we update purely on percentage change
  // If this causes typing issues, we might need a focus state like in Vite, but React Native inputs handle focus differently. 
  // For now, let's keep it simple: input values update if not editing.
  // Actually, let's rely on handleInputChange for active typing and only sync on drastic external changes or blur.

  const adjustPercentages = (changedId: number, newPercentage: number) => {
    const otherCauses = causes.filter((c: any) => c.id !== changedId);
    const otherCount = otherCauses.length;
    const minPercentage = calculateMinPercentage();

    if (otherCount === 0) return;

    const newPercentages: Record<number, number> = { ...percentages };

    // 1. Clamp the changed value
    let clampedNewPercentage = Math.max(minPercentage, Math.min(100, newPercentage));

    // Ensure this value leaves enough room for everyone else to have the minimum
    const maxAllowed = 100 - (otherCount * minPercentage);
    if (clampedNewPercentage > maxAllowed) {
      clampedNewPercentage = maxAllowed;
    }

    newPercentages[changedId] = clampedNewPercentage;

    const remainingPercentage = 100 - clampedNewPercentage;
    const currentTotalOthers = otherCauses.reduce((sum, cause) => sum + (percentages[cause.id] || 0), 0);

    // 2. Distribute remaining among others
    if (currentTotalOthers <= 0.01) {
      const perOther = remainingPercentage / otherCount;
      otherCauses.forEach((cause: any) => { newPercentages[cause.id] = perOther; });
    } else {
      const scaleFactor = remainingPercentage / currentTotalOthers;
      otherCauses.forEach((cause: any) => {
        const scaled = (percentages[cause.id] || 0) * scaleFactor;
        newPercentages[cause.id] = Math.max(minPercentage, scaled);
      });
    }

    // 3. Force exact sum
    const finalPercentages = forceSumTo100(newPercentages);

    setPercentages(finalPercentages);

    // Update inputs to match
    const newInputValues: Record<number, string> = {};
    Object.keys(finalPercentages).forEach(key => {
      newInputValues[Number(key)] = finalPercentages[Number(key)].toFixed(2);
    });
    setInputValues(newInputValues);
  };

  const handlePercentageChange = (causeId: number, value: number) => {
    adjustPercentages(causeId, value);
  };

  const handleInputChange = (causeId: number, value: string) => {
    setInputValues({ ...inputValues, [causeId]: value });
  };

  const handleInputBlur = (causeId: number) => {
    const minPercentage = calculateMinPercentage();
    const numValue = parseFloat(inputValues[causeId] || '0') || 0;
    const clampedValue = Math.max(minPercentage, Math.min(100, numValue));

    setInputValues(prev => ({ ...prev, [causeId]: clampedValue.toFixed(2) }));
    adjustPercentages(causeId, clampedValue);
  };

  const handleDecrease = (causeId: number) => {
    const minPercentage = calculateMinPercentage();
    const current = percentages[causeId] || 0;
    if (current > minPercentage) {
      adjustPercentages(causeId, Math.max(minPercentage, current - 1));
    }
  };

  const handleIncrease = (causeId: number) => {
    const current = percentages[causeId] || 0;
    if (current < 100) {
      adjustPercentages(causeId, Math.min(100, current + 1));
    }
  };

  const handleReset = () => {
    const minPercentage = calculateMinPercentage();
    const equalPercentage = 100 / causes.length;
    let newPercentages: Record<number, number> = {};

    const target = equalPercentage < minPercentage ? minPercentage : equalPercentage;

    causes.forEach((cause: any) => {
      newPercentages[cause.id] = target;
    });

    // Force exact sum
    newPercentages = forceSumTo100(newPercentages);

    const inputs: Record<number, string> = {};
    Object.keys(newPercentages).forEach(key => {
      inputs[Number(key)] = newPercentages[Number(key)].toFixed(2);
    });

    setPercentages(newPercentages);
    setInputValues(inputs);
  };

  // Mutation for updating donation box
  const updateDonationBoxMutation = useMutation({
    mutationFn: (data: any) => updateDonationBox(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donationBox'] });
      showToast('Donation split updated successfully', 3000);
      onClose();
    },
    onError: (error: any) => {
      console.error('Update donation box error:', error);
      showToast(error?.response?.data?.message || 'Failed to update donation split', 3000);
    },
  });

  const handleSave = () => {
    const hasChanges = causes.some((cause: any) => {
      const currentPercentage = percentages[cause.id] || 0;
      const boxCause = boxCauses?.find((bc: any) => bc.cause?.id === cause.id);
      const initialPercentage = boxCause?.percentage || (100 / causes.length);
      return Math.abs(currentPercentage - initialPercentage) > 0.1;
    });

    if (!hasChanges) {
      showToast('No changes to save', 3000);
      return;
    }

    const causesData = causes.map((cause: any) => {
      const percentage = percentages[cause.id] || 0;
      const boxCause = boxCauses?.find((bc: any) => bc.cause?.id === cause.id);
      let attributedCollective = null;
      if (boxCause?.attributed_collectives && Array.isArray(boxCause.attributed_collectives) && boxCause.attributed_collectives.length > 0) {
        attributedCollective = typeof boxCause.attributed_collectives[0] === 'object'
          ? boxCause.attributed_collectives[0]?.id || boxCause.attributed_collectives[0]
          : boxCause.attributed_collectives[0];
      } else if (boxCause?.attributed_collective) {
        attributedCollective = typeof boxCause.attributed_collective === 'object'
          ? boxCause.attributed_collective?.id || boxCause.attributed_collective
          : boxCause.attributed_collective;
      }

      const causeData: any = {
        cause_id: cause.id,
        percentage: parseFloat(percentage.toFixed(2)),
      };

      if (attributedCollective !== null &&
        attributedCollective !== undefined &&
        attributedCollective !== 'manual' &&
        attributedCollective !== 'Manual') {
        causeData.attributed_collective = attributedCollective;
      }

      return causeData;
    });

    const requestData = {
      monthly_amount: monthlyAmount.toString(),
      causes: causesData,
    };

    updateDonationBoxMutation.mutate(requestData);
  };

  const netAmount = monthlyAmount * 0.9;

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      enablePanDownToClose={true}
      enableDynamicSizing={false}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.bottomSheetBackground}
    >
      <View style={styles.sheetContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Edit Donation Split</Text>
            <Text style={styles.headerSubtitle}>
              Adjust how your ${monthlyAmount}/month is split across nonprofits.
            </Text>
          </View>
          <TouchableOpacity onPress={() => { bottomSheetModalRef.current?.dismiss(); }} style={styles.closeButton}>
            <X size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <BottomSheetScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {(() => {
            if (!causes || !Array.isArray(causes) || causes.length === 0) {
              return (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No causes found</Text>
                </View>
              );
            }

            return (
              <View style={styles.causesListContainer}>
                {causes.map((cause: any, index: number) => {
                  const percentage = percentages[cause.id] || 0;
                  const displayPercentage = draggingValues[cause.id] ?? percentage;

                  return (
                    <CauseCard
                      key={cause.id}
                      cause={cause}
                      index={index}
                      percentage={percentage}
                      displayPercentage={displayPercentage}
                      inputValue={inputValues[cause.id] || '0'}
                      draggingValue={draggingValues[cause.id]}
                      netAmount={netAmount}
                      minPercentage={calculateMinPercentage()}
                      onDecrease={handleDecrease}
                      onIncrease={handleIncrease}
                      onInputChange={handleInputChange}
                      onInputBlur={handleInputBlur}
                      onSliderChange={(id, value) => {
                        setDraggingValues(prev => ({
                          ...prev,
                          [id]: value,
                        }));
                      }}
                      onSliderComplete={(id, value) => {
                        setDraggingValues(prev => {
                          const copy = { ...prev };
                          delete copy[id];
                          return copy;
                        });
                        handlePercentageChange(id, value);
                      }}
                      isLast={index === causes.length - 1}
                    />
                  );
                })}
              </View>
            );
          })()}
        </BottomSheetScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
            <Text style={styles.resetButtonText}>Reset to equal split</Text>
          </TouchableOpacity>
          <View style={styles.footerButtons}>
            <TouchableOpacity onPress={() => bottomSheetModalRef.current?.dismiss()} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={updateDonationBoxMutation.isPending}
              style={[styles.saveButton, updateDonationBoxMutation.isPending && styles.saveButtonDisabled]}
            >
              {updateDonationBoxMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Split</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
  },
  bottomSheetBackground: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },
  handleIndicator: {
    backgroundColor: '#D1D5DB',
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
    fontFamily: 'Outfit-Bold',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
  },
  contentContainer: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  causesListContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  causeListItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  causeListItemLast: {
    borderBottomWidth: 0,
  },
  causeItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  causeIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
    marginRight: 12,
  },
  causeInfo: {
    flex: 1,
    minWidth: 0,
  },
  causeName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
    fontFamily: 'Outfit-Bold',
  },
  causeAmount: {
    fontSize: 13,
    color: '#111827',
    fontFamily: 'Outfit-Medium',
    fontWeight: '500',
  },
  causeRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  causePercentageText: {
    fontSize: 17,
    color: '#1600ff',
    fontFamily: 'Outfit-SemiBold',
  },
  sliderContainer: {
    marginTop: 4,
    height: 32, // More space for the thumb to be tappable
    justifyContent: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  footer: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 16, // Extra safe area buffer might be needed if not handled by Sheet
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  resetButton: {
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 10,
  },
  resetButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    fontFamily: 'Outfit-Medium',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: PrimaryBlue,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Outfit-SemiBold',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
});
