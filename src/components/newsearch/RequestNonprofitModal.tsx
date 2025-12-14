import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Send } from 'lucide-react-native';

interface RequestNonprofitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RequestNonprofitModal({
  isOpen,
  onClose,
}: RequestNonprofitModalProps) {
  const [nonprofitName, setNonprofitName] = useState('');
  const [ein, setEin] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!nonprofitName.trim() || !ein.trim() || !reason.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Implement API call to submit nonprofit request
      console.log('Submitting nonprofit request:', {
        nonprofitName,
        ein,
        reason,
      });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Reset form and close modal
      setNonprofitName('');
      setEin('');
      setReason('');
      onClose();

      // TODO: Show success toast
    } catch (error) {
      console.error('Error submitting nonprofit request:', error);
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = nonprofitName.trim() && ein.trim() && reason.trim();

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.overlay} />
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Request a Nonprofit</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
              <X size={20} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
              />
            </View>
          </ScrollView>

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
              <Send size={16} color="#FFFFFF" />
              <Text style={styles.submitText}>Submit Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  introText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
  },
  highlight: {
    color: '#1600ff',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#1600ff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
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
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
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
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

