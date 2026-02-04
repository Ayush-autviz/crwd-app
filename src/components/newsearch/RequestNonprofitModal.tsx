import * as React from 'react';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { X, ArrowRight } from 'lucide-react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { requestCause } from '../../services/api/crwd';
import { useToast } from '../../contexts/ToastContext';

interface RequestNonprofitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RequestNonprofitModal({
  isOpen,
  onClose,
}: RequestNonprofitModalProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [nonprofitName, setNonprofitName] = useState('');
  const [ein, setEin] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const snapPoints = useMemo(() => ['70%'], []);

  // Open/close bottom sheet based on isOpen prop
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
        opacity={0.5}
      />
    ),
    []
  );

  const handleSubmit = async () => {
    if (!nonprofitName.trim() || !ein.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await requestCause({
        name: nonprofitName.trim(),
        ein_number: ein.trim(),
        description: reason.trim() || 'No reason provided',
      });

      // Reset form first
      setNonprofitName('');
      setEin('');
      setReason('');

      // Close modal first
      onClose();

      // Show success toast after modal closes
      setTimeout(() => {
        showToast('Request submitted successfully!', 3000);
      }, 300);
    } catch (error: any) {
      console.error('Error submitting nonprofit request:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to submit request. Please try again.';
      showToast(errorMessage, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = nonprofitName.trim() && ein.trim();

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: 'white' }}
      onDismiss={onClose}
      enableDynamicSizing={false}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Request a Nonprofit</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
            <X size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <KeyboardAwareScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid={true}
          extraScrollHeight={Platform.OS === 'ios' ? 20 : 0}
        >
          <Text style={styles.introText}>
            Can't find the nonprofit you're looking for? Let us know and if everything checks
            out we'll add it within{' '}
            <Text style={styles.highlight}>72 hours</Text>.
          </Text>

          {/* Nonprofit Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nonprofit Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Local Food Bank"
              value={nonprofitName}
              onChangeText={setNonprofitName}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* EIN */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>EIN (Employer Identification Number)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 12-3456789"
              value={ein}
              onChangeText={setEin}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Why do you care */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Why do you care about this cause?</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us why this nonprofit matters to you..."
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </KeyboardAwareScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.cancelButton}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            style={[
              styles.submitButton,
              (!isFormValid || isSubmitting) && styles.submitButtonDisabled,
            ]}
            activeOpacity={0.7}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.submitText}>Submitting...</Text>
              </>
            ) : (
              <>
                <ArrowRight size={16} color="#FFFFFF" />
                <Text style={styles.submitText}>Submit Request</Text>
              </>
            )}
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Outfit-Bold',
  },
  closeButton: {
    padding: 8,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  introText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: 'Outfit-Regular',
  },
  highlight: {
    color: '#1600ff',
    fontWeight: '600',
    fontFamily: 'Outfit-SemiBold',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
    fontFamily: 'Outfit-Medium',
  },
  input: {
    borderWidth: 1,
    borderColor: '#1600ff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Outfit-Regular',
  },
  textArea: {
    height: 100,
    paddingTop: 10,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
    fontFamily: 'Outfit-Medium',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1600ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Outfit-Medium',
  },
});

