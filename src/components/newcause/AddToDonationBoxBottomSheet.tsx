import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { BottomSheetView, BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet';
import { X, ChevronRight, Heart, ShoppingBag } from 'lucide-react-native';

interface AddToDonationBoxBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onOneTimeDonation: () => void;
  isPending?: boolean;
}

export default function AddToDonationBoxBottomSheet({
  isOpen,
  onClose,
  onConfirm,
  onOneTimeDonation,
  isPending = false,
}: AddToDonationBoxBottomSheetProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  // Use slightly larger snap point for the new content
  const snapPoints = useMemo(() => ['42%'], []);

  useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [isOpen]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
      />
    ),
    []
  );

  const handleOneTimeClick = () => {
    onClose();
    onOneTimeDonation();
  };

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      handleIndicatorStyle={styles.indicator}
      backgroundStyle={styles.background}
      enableDynamicSizing={false}
    >
      <BottomSheetView style={styles.container}>
        {/* Close Button */}
        <TouchableOpacity
          onPress={() => bottomSheetRef.current?.dismiss()}
          style={styles.closeButton}
          activeOpacity={0.7}
        >
          <X size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Support this cause</Text>
            <Text style={styles.subtitle}>Choose how you want to make an impact</Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {/* Create a Donation Box Option */}
            <TouchableOpacity
              onPress={onConfirm}
              disabled={isPending}
              style={styles.optionCardPrimary}
              activeOpacity={0.9}
            >
              <View style={styles.optionLeft}>
                <View style={styles.iconContainerPrimary}>
                  {isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <ShoppingBag size={24} color="#FFFFFF" strokeWidth={2.5} />
                  )}
                </View>
                <View>
                  <Text style={styles.optionTitlePrimary}>Create a Donation Box</Text>
                  <Text style={styles.optionSubtitlePrimary}>Support multiple causes monthly</Text>
                </View>
              </View>
              <View style={styles.arrowContainerPrimary}>
                <ChevronRight size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            {/* One-time Donation Option */}
            <TouchableOpacity
              onPress={handleOneTimeClick}
              disabled={isPending}
              style={styles.optionCardSecondary}
              activeOpacity={0.9}
            >
              <View style={styles.optionLeft}>
                <View style={styles.iconContainerSecondary}>
                  <Heart size={24} color="#9CA3AF" strokeWidth={2.5} />
                </View>
                <View>
                  <Text style={styles.optionTitleSecondary}>One-time Donation</Text>
                  <Text style={styles.optionSubtitleSecondary}>Make a single contribution</Text>
                </View>
              </View>
              <View style={styles.arrowContainerSecondary}>
                <ChevronRight size={20} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  background: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  indicator: {
    backgroundColor: '#F3F4F6',
    width: 48,
    height: 6,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 0,
    zIndex: 10,
    padding: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  content: {
    marginTop: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Outfit-Medium',
    color: '#6B7280',
  },
  optionsContainer: {
    gap: 12,
  },
  optionCardPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1600ff',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#1600ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  optionCardSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderStyle: 'solid',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainerPrimary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitlePrimary: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  optionSubtitlePrimary: {
    fontSize: 14,
    fontFamily: 'Outfit-Medium',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  optionTitleSecondary: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
    marginBottom: 2,
  },
  optionSubtitleSecondary: {
    fontSize: 14,
    fontFamily: 'Outfit-Medium',
    color: '#6B7280',
  },
  arrowContainerPrimary: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowContainerSecondary: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

