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

// Slider colors for each nonprofit
const sliderColors = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

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
}: CauseCardProps) => {
  const amount = (netAmount * displayPercentage) / 100;
  const avatarBgColor = getConsistentColor(cause.id, avatarColors);
  const initials = getInitials(cause.name || 'N');
  const sliderColor = sliderColors[index % sliderColors.length];

  return (
    <View style={styles.causeCard}>
      {/* Cause Header */}
      <View style={styles.causeHeader}>
        <Avatar size={36}>
          <AvatarImage src={cause.image || cause.logo} />
          <AvatarFallback
            style={{ backgroundColor: avatarBgColor }}
            textStyle={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        <View style={styles.causeInfo}>
          <Text style={styles.causeName} numberOfLines={1}>{cause.name}</Text>
          <Text style={styles.causeAmount}>${amount.toFixed(2)}/mo</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          onPress={() => onDecrease(cause.id)}
          disabled={percentage <= minPercentage}
          style={[styles.controlButton, percentage <= minPercentage && styles.controlButtonDisabled]}
        >
          <Minus size={14} color={percentage <= minPercentage ? "#9CA3AF" : "#374151"} />
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.percentageInput}
            value={inputValue || '0'}
            onChangeText={(value) => onInputChange(cause.id, value)}
            onBlur={() => onInputBlur(cause.id)}
            keyboardType="numeric"
            selectTextOnFocus
          />
        </View>

        <TouchableOpacity
          onPress={() => onIncrease(cause.id)}
          disabled={percentage >= 100}
          style={[styles.controlButton, percentage >= 100 && styles.controlButtonDisabled]}
        >
          <Plus size={14} color={percentage >= 100 ? "#9CA3AF" : "#374151"} />
        </TouchableOpacity>
      </View>

      <Text style={styles.percentLabel}>percent</Text>

      {/* Slider */}
      <View
        style={styles.sliderContainer}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <View style={styles.sliderTrack}>
          <View
            style={[
              styles.sliderFill,
              { width: `${displayPercentage}%`, backgroundColor: sliderColor },
            ]}
          />
        </View>
        <Slider
          style={styles.slider}
          minimumValue={minPercentage}
          maximumValue={100}
          step={0.5}
          value={draggingValue ?? percentage}
          onValueChange={(value) => onSliderChange(cause.id, value)}
          onSlidingComplete={(value) => onSliderComplete(cause.id, value)}
          minimumTrackTintColor="transparent"
          maximumTrackTintColor="transparent"
          thumbTintColor={sliderColor}
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
  const calculateMinPercentage = () => {
    const netAmount = monthlyAmount * 0.9; // 90% after fees
    const MIN_DONATION = 0.20;
    return (MIN_DONATION / netAmount) * 100;
  };

  // Initialize percentages - use existing if available, otherwise equal split
  useEffect(() => {
    // Reset when modal closes
    if (!isOpen) {
      setPercentages({});
      setInputValues({});
      setDraggingValues({});
      return;
    }

    if (causes && Array.isArray(causes) && causes.length > 0 && isOpen) {
      const minPercentage = calculateMinPercentage();
      const initialPercentages: Record<number, number> = {};
      const initialInputs: Record<number, string> = {};

      // Check if we have existing percentages from boxCauses
      const hasExistingPercentages = boxCauses.some((bc: any) => bc.percentage != null && bc.percentage !== undefined);

      if (hasExistingPercentages) {
        // Use existing percentages, but ensure they're at least minimum
        causes.forEach((cause: any) => {
          const boxCause = boxCauses.find((bc: any) => bc.cause?.id === cause.id);
          const existingPercentage = boxCause?.percentage || (100 / causes.length);
          initialPercentages[cause.id] = Math.max(minPercentage, existingPercentage);
          initialInputs[cause.id] = Math.max(minPercentage, existingPercentage).toFixed(2);
        });
      } else {
        // Equal split, but ensure each is at least minimum
        const equalPercentage = 100 / causes.length;
        if (equalPercentage < minPercentage) {
          causes.forEach((cause: any) => {
            initialPercentages[cause.id] = minPercentage;
            initialInputs[cause.id] = minPercentage.toFixed(2);
          });
        } else {
          causes.forEach((cause: any) => {
            initialPercentages[cause.id] = equalPercentage;
            initialInputs[cause.id] = equalPercentage.toFixed(2);
          });
        }
      }

      // Validate total is 100 and adjust if needed
      let total = causes.reduce((sum, cause) => sum + initialPercentages[cause.id], 0);
      if (Math.abs(total - 100) > 0.01) {
        const adjustment = (100 - total) / causes.length;
        causes.forEach((cause: any) => {
          const adjusted = initialPercentages[cause.id] + adjustment;
          initialPercentages[cause.id] = Math.max(minPercentage, adjusted);
          initialInputs[cause.id] = Math.max(minPercentage, adjusted).toFixed(2);
        });
      }

      setPercentages(initialPercentages);
      setInputValues(initialInputs);
    }
  }, [causes, isOpen, boxCauses, monthlyAmount]);

  const adjustPercentages = (changedId: number, newPercentage: number) => {
    const otherCauses = causes.filter((c: any) => c.id !== changedId);
    const otherCount = otherCauses.length;
    const minPercentage = calculateMinPercentage();

    if (otherCount === 0) return;

    const newPercentages: Record<number, number> = { ...percentages };
    const newInputValues: Record<number, string> = { ...inputValues };

    const clampedNewPercentage = Math.max(minPercentage, Math.min(100, newPercentage));
    newPercentages[changedId] = clampedNewPercentage;
    newInputValues[changedId] = clampedNewPercentage.toFixed(2);

    const remainingPercentage = 100 - clampedNewPercentage;
    const currentTotalOthers = otherCauses.reduce((sum, cause) => sum + (percentages[cause.id] || 0), 0);

    if (currentTotalOthers === 0) {
      const perOther = remainingPercentage / otherCount;
      if (perOther < minPercentage) {
        otherCauses.forEach((cause: any) => {
          newPercentages[cause.id] = minPercentage;
          newInputValues[cause.id] = minPercentage.toFixed(2);
        });
        const totalForOthers = minPercentage * otherCount;
        const adjustedPercentage = 100 - totalForOthers;
        newPercentages[changedId] = Math.max(minPercentage, adjustedPercentage);
        newInputValues[changedId] = Math.max(minPercentage, adjustedPercentage).toFixed(2);
      } else {
        otherCauses.forEach((cause: any) => {
          newPercentages[cause.id] = perOther;
          newInputValues[cause.id] = perOther.toFixed(2);
        });
      }
    } else {
      let scaleFactor = remainingPercentage / currentTotalOthers;

      const scaledValues: Record<number, number> = {};
      let needsAdjustment = false;

      otherCauses.forEach((cause: any) => {
        const scaled = (percentages[cause.id] || 0) * scaleFactor;
        scaledValues[cause.id] = scaled;
        if (scaled < minPercentage) {
          needsAdjustment = true;
        }
      });

      if (!needsAdjustment) {
        otherCauses.forEach((cause: any) => {
          newPercentages[cause.id] = scaledValues[cause.id];
          newInputValues[cause.id] = scaledValues[cause.id].toFixed(2);
        });
      } else {
        let remainingAfterMin = remainingPercentage;
        const causesBelowMin: any[] = [];
        const causesAboveMin: any[] = [];

        otherCauses.forEach((cause: any) => {
          if (scaledValues[cause.id] < minPercentage) {
            newPercentages[cause.id] = minPercentage;
            newInputValues[cause.id] = minPercentage.toFixed(2);
            remainingAfterMin -= minPercentage;
            causesBelowMin.push(cause);
          } else {
            causesAboveMin.push({ cause, originalValue: scaledValues[cause.id] });
          }
        });

        if (causesAboveMin.length > 0 && remainingAfterMin > 0) {
          const totalOriginalAboveMin = causesAboveMin.reduce((sum, item) => sum + item.originalValue, 0);
          if (totalOriginalAboveMin > 0) {
            const newScaleFactor = remainingAfterMin / totalOriginalAboveMin;
            causesAboveMin.forEach((item) => {
              const newValue = item.originalValue * newScaleFactor;
              newPercentages[item.cause.id] = Math.max(minPercentage, newValue);
              newInputValues[item.cause.id] = Math.max(minPercentage, newValue).toFixed(2);
            });
          }
        }

        let finalTotal = clampedNewPercentage;
        otherCauses.forEach((cause: any) => {
          finalTotal += newPercentages[cause.id];
        });

        if (Math.abs(finalTotal - 100) > 0.01) {
          const adjustment = 100 - finalTotal;
          const newChangedValue = clampedNewPercentage + adjustment;
          if (newChangedValue >= minPercentage) {
            newPercentages[changedId] = newChangedValue;
            newInputValues[changedId] = newChangedValue.toFixed(2);
          }
        }
      }
    }

    let finalTotal = 0;
    causes.forEach((cause: any) => {
      if (newPercentages[cause.id] < minPercentage) {
        newPercentages[cause.id] = minPercentage;
        newInputValues[cause.id] = minPercentage.toFixed(2);
      }
      finalTotal += newPercentages[cause.id];
    });

    if (finalTotal > 100) {
      const excess = finalTotal - 100;
      const newChangedValue = newPercentages[changedId] - excess;
      if (newChangedValue >= minPercentage) {
        newPercentages[changedId] = newChangedValue;
        newInputValues[changedId] = newChangedValue.toFixed(2);
      }
    }

    setPercentages(newPercentages);
    setInputValues(newInputValues);
  };

  const handlePercentageChange = (causeId: number, value: number) => {
    const minPercentage = calculateMinPercentage();
    const clampedValue = Math.max(minPercentage, Math.min(100, value));
    adjustPercentages(causeId, clampedValue);
  };

  const handleInputChange = (causeId: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    setInputValues({ ...inputValues, [causeId]: value });
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      handlePercentageChange(causeId, numValue);
    }
  };

  const handleInputBlur = (causeId: number) => {
    const minPercentage = calculateMinPercentage();
    const numValue = parseFloat(inputValues[causeId] || '0') || 0;
    const clampedValue = Math.max(minPercentage, Math.min(100, numValue));
    setInputValues({ ...inputValues, [causeId]: clampedValue.toFixed(2) });
    adjustPercentages(causeId, clampedValue);
  };

  const handleDecrease = (causeId: number) => {
    const minPercentage = calculateMinPercentage();
    const current = percentages[causeId] || 0;
    if (current > minPercentage) {
      handlePercentageChange(causeId, Math.max(minPercentage, current - 1));
    }
  };

  const handleIncrease = (causeId: number) => {
    const current = percentages[causeId] || 0;
    if (current < 100) {
      handlePercentageChange(causeId, Math.min(100, current + 1));
    }
  };

  const handleReset = () => {
    const minPercentage = calculateMinPercentage();
    const equalPercentage = 100 / causes.length;
    const newPercentages: Record<number, number> = {};
    const newInputValues: Record<number, string> = {};

    if (equalPercentage < minPercentage) {
      causes.forEach((cause: any) => {
        newPercentages[cause.id] = minPercentage;
        newInputValues[cause.id] = minPercentage.toFixed(2);
      });
    } else {
      causes.forEach((cause: any) => {
        newPercentages[cause.id] = equalPercentage;
        newInputValues[cause.id] = equalPercentage.toFixed(2);
      });
    }

    setPercentages(newPercentages);
    setInputValues(newInputValues);
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
      return Math.abs(currentPercentage - initialPercentage) > 0.01;
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
              <View style={styles.causesList}>
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
    paddingTop: 12,
  },
  contentContainer: {
    paddingBottom: 12,
  },
  causesList: {
    gap: 8,
  },
  causeCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
  },
  causeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  causeInfo: {
    flex: 1,
    minWidth: 0,
  },
  causeName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
    fontFamily: 'Outfit-Bold',
  },
  causeAmount: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  controlButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  inputContainer: {
    flex: 1,
    alignItems: 'center',
  },
  percentageInput: {
    width: '100%',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Outfit-SemiBold',
  },
  percentLabel: {
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 4,
    fontFamily: 'Outfit-Regular',
  },
  sliderContainer: {
    marginTop: 6,
    position: 'relative',
    height: 4,
  },
  sliderTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
    zIndex: 1,
  },
  sliderFill: {
    height: '100%',
    borderRadius: 2,
  },
  slider: {
    width: '100%',
    height: 20,
    zIndex: 2,
    marginTop: -8,
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
    fontSize: 11,
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
