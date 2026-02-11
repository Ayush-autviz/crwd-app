import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Check, X } from 'lucide-react-native';
import { PrimaryBlue } from '../../Constants/Colors';

interface PlatformFeeInfoBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PlatformFeeInfoBottomSheet({
  isOpen,
  onClose,
}: PlatformFeeInfoBottomSheetProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['70%'], []);

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

  const exampleAmount = 10;
  const examplePlatformFee = exampleAmount < 10 ? 1 : exampleAmount * 0.1;
  const exampleNetToNonprofits = exampleAmount - examplePlatformFee;

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: 'white' }}
      onDismiss={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>About the Platform Fee</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton} activeOpacity={0.7}>
            <X size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <BottomSheetScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.description}>
            The platform fee covers payment processing and keeps CRWD running at no cost to nonprofits.
          </Text>

          <View style={styles.taxCard}>
            <Check size={14} color="#15803d" />
            <Text style={styles.taxCardText}>Your full donation is tax-deductible</Text>
          </View>

          <View style={styles.exampleCard}>
            <Text style={styles.exampleTitle}>Example: ${exampleAmount.toFixed(0)} donation</Text>
            <View style={styles.exampleList}>
              <View style={styles.exampleRow}>
                <View style={styles.bullet} />
                <Text style={styles.exampleText}>${exampleNetToNonprofits.toFixed(2)} to nonprofits</Text>
              </View>
              <View style={styles.exampleRow}>
                <View style={styles.bullet} />
                <Text style={styles.exampleText}>${examplePlatformFee.toFixed(2)} platform costs</Text>
              </View>
              <View style={styles.exampleRow}>
                <View style={styles.bullet} />
                <Text style={styles.exampleText}>${exampleAmount.toFixed(2)} tax deduction</Text>
              </View>
            </View>
          </View>

          <View style={styles.noteCard}>
            <Text style={styles.noteText}>
              For donations under $10, the platform fee is $1.00.
            </Text>
          </View>
        </BottomSheetScrollView>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleClose} style={styles.primaryButton} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Outfit-SemiBold',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: '#6B7280',
    fontFamily: 'Outfit-Regular',
    marginBottom: 16,
  },
  taxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  taxCardText: {
    color: '#065F46',
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
  },
  exampleCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  exampleTitle: {
    color: '#111827',
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold',
    marginBottom: 10,
  },
  exampleList: {
    gap: 8,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 9999,
    backgroundColor: '#9CA3AF',
  },
  exampleText: {
    flex: 1,
    color: '#374151',
    fontSize: 13,
    fontFamily: 'Outfit-Regular',
  },
  noteCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
  },
  noteText: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Outfit-Regular',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  primaryButton: {
    backgroundColor: PrimaryBlue,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
  },
});
