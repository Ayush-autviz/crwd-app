import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';

interface AddToDonationBoxBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  causeData: {
    id: number;
    name: string;
    mission?: string;
    description?: string;
    image?: string;
    logo?: string;
    category?: string;
  };
  donationBoxCount: number;
  onConfirm: () => void;
  isPending?: boolean;
}

export default function AddToDonationBoxBottomSheet({
  isOpen,
  onClose,
  causeData,
  donationBoxCount,
  onConfirm,
  isPending = false,
}: AddToDonationBoxBottomSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['50%'], []);

  useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isOpen]);

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

  // Get icon color for avatar fallback
  const getIconColor = (id: number | string): string => {
    const colors = [
      '#1600ff', // Blue
      '#10B981', // Green
      '#EC4899', // Pink
      '#F59E0B', // Amber
      '#8B5CF6', // Purple
      '#EF4444', // Red
    ];
    const hash = typeof id === 'number' ? id : id.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const iconColor = getIconColor(causeData.id);
  const iconLetter = causeData.name.charAt(0).toUpperCase();
  const imageUrl = causeData.logo || causeData.image || '';
  const hasImage = imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('/') || imageUrl.startsWith('data:'));

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={isOpen ? 0 : -1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onClose={onClose}
    >
      <BottomSheetView style={styles.container}>


        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>Add to Donation Box</Text>

          {/* Donation Box Count */}
          <Text style={styles.countText}>
            You have {donationBoxCount} nonprofit{donationBoxCount !== 1 ? 's' : ''} in your donation box
          </Text>

          {/* Cause Card */}
          <View style={styles.causeCard}>
            {/* Image */}
            <View style={styles.imageContainer}>
              {hasImage ? (
                <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
              ) : (
                <Avatar size={64} style={styles.avatar}>
                  <AvatarFallback
                    style={{ backgroundColor: iconColor }}
                    textStyle={styles.avatarFallbackText}
                  >
                    {iconLetter}
                  </AvatarFallback>
                </Avatar>
              )}
            </View>

            {/* Content */}
            <View style={styles.causeContent}>
              <Text style={styles.causeName} numberOfLines={2}>
                {causeData.name}
              </Text>
              <Text style={styles.causeDescription} numberOfLines={2}>
                {causeData.mission || causeData.description || ''}
              </Text>
            </View>
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            style={[styles.confirmButton, isPending && styles.confirmButtonDisabled]}
            onPress={onConfirm}
            disabled={isPending}
            activeOpacity={0.8}
          >
            {isPending ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.confirmButtonText}>Adding...</Text>
              </>
            ) : (
              <Text style={styles.confirmButtonText}>Confirm</Text>
            )}
          </TouchableOpacity>

          {/* Cancel Link */}
          <TouchableOpacity
            onPress={onClose}
            style={styles.cancelButton}
            disabled={isPending}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  missionBanner: {
    backgroundColor: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  missionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  countText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    fontFamily: 'Outfit-Regular',
  },
  causeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginBottom: 24,
  },
  imageContainer: {
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: 'hidden',
    flexShrink: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  avatar: {
    borderRadius: 8,
  },
  avatarFallbackText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Outfit-Bold',
  },
  causeContent: {
    flex: 1,
    minWidth: 0,
  },
  causeName: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  causeDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 8,
    fontFamily: 'Outfit-Regular',
  },
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#EC4899',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#84CC16',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Outfit-SemiBold',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelText: {
    color: '#6B7280',
    fontSize: 14,
    fontFamily: 'Outfit-Medium',
  },
});

