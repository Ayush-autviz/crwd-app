import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { ArrowLeft, Minus, Plus, CreditCard, DollarSign, Trash2, ChevronLeft } from 'lucide-react-native';
import { Organization } from '../../Constants/organizations';
import { PrimaryBlue } from '../../Constants/Colors';

interface ManageDonationBoxProps {
  amount: number;
  causes: Organization[];
  onBack: () => void;
}

export default function ManageDonationBox({
  amount,
  causes,
  onBack,
}: ManageDonationBoxProps) {
  const [editableAmount, setEditableAmount] = useState(amount);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [temporarilyRemovedCauses, setTemporarilyRemovedCauses] = useState<string[]>([]);

  const incrementAmount = () => {
    setEditableAmount(prev => prev + 1);
  };

  const decrementAmount = () => {
    if (editableAmount > 1) {
      setEditableAmount(prev => prev - 1);
    }
  };

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue === '') {
      setEditableAmount(0);
    } else {
      setEditableAmount(parseInt(numericValue));
    }
  };

  const handleRemove = (causeId: string) => {
    // Temporarily remove the cause
    setTemporarilyRemovedCauses(prev => [...prev, causeId]);
  };

  const handleEditCauses = () => {
    if (isEditMode) {
      // "Close" clicked - restore temporarily removed causes
      setTemporarilyRemovedCauses([]);
    }
    setIsEditMode(!isEditMode);
  };

  const handleRemoveCause = (causeId: string) => {
    Alert.alert(
      'Remove Cause',
      'Are you sure you want to remove this cause from your donation box?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => {
          handleRemove(causeId);
        }},
      ]
    );
  };

  const handleSave = () => {
    // Permanently remove the causes
    temporarilyRemovedCauses.forEach((id) => {
      // Handle permanent removal logic here
      console.log('Permanently removing cause:', id);
    });
    // Clear the temporarily removed causes
    setTemporarilyRemovedCauses([]);
    setIsEditMode(false);
    Alert.alert(
      'Changes Saved',
      'Your donation box has been updated successfully.',
      [{ text: 'OK' }]
    );
  };

  // Filter out temporarily removed causes for display
  const visibleCauses = causes.filter(
    (cause) => !temporarilyRemovedCauses.includes(cause.id)
  );

  const handleDeactivate = () => {
    Alert.alert(
      'Deactivate Donation Box',
      'Are you sure you want to deactivate your donation box? This will stop all recurring donations.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Deactivate', style: 'destructive', onPress: () => {
          console.log('Deactivating donation box');
        }},
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          {/* <ArrowLeft color="#374151" /> */}
          <ChevronLeft />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Donation Box</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Blue Summary Card */}
        <View style={styles.summaryCard}>
          <TouchableOpacity style={styles.transactionLink}>
            <Text style={styles.transactionLinkText}>See full transaction history</Text>
          </TouchableOpacity>

          <View style={styles.amountSection}>
            <View style={styles.amountControls}>
              <TouchableOpacity
                onPress={decrementAmount}
                style={styles.amountButton}
              >
                <Minus size={20} color="#ffffff" />
              </TouchableOpacity>

              {isEditingAmount ? (
                <TextInput
                  value={editableAmount.toString()}
                  onChangeText={handleAmountChange}
                  onBlur={() => setIsEditingAmount(false)}
                  autoFocus
                  style={styles.amountInput}
                  keyboardType="numeric"
                />
              ) : (
                <TouchableOpacity onPress={() => setIsEditingAmount(true)}>
                  <Text style={styles.amountText}>${editableAmount}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={incrementAmount}
                style={styles.amountButton}
              >
                <Plus size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.scheduleText}>on the 26th of every month</Text>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setIsEditingAmount(true)}
              >
                <DollarSign size={22} color="#ffffff" />
                <Text style={styles.actionButtonText}>Edit amount</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <CreditCard size={22} color="#ffffff" />
                <Text style={styles.actionButtonText}>Edit payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Causes List */}
        <View style={styles.causesSection}>
          <Text style={styles.sectionTitle}>CAUSES</Text>

          <View style={styles.causesList}>
            {visibleCauses.map((cause) => (
              <View key={cause.id} style={styles.causeItem}>
                <View style={styles.causeImageContainer}>
                  {cause.imageUrl ? (
                    <Image source={{ uri: cause.imageUrl }} style={styles.causeImage} />
                  ) : (
                    <View style={[styles.causePlaceholder, { backgroundColor: cause.color || '#e2e8f0' }]}>
                      <Text style={styles.causePlaceholderText}>
                        {cause.name.charAt(0)}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.causeInfo}>
                  <View style={styles.causeHeader}>
                    <Text style={styles.causeName}>{cause.name}</Text>
                    {/* <Text style={styles.causeUsername}>
                      @{cause.name.replace(/\s+/g, '').toLowerCase()}
                    </Text> */}
                  </View>
                  {cause.description && (
                    <Text style={styles.causeDescription}>
                      {cause.description}
                    </Text>
                  )}
                </View>

                {isEditMode && (
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveCause(cause.id)}
                    >
                      <Trash2 size={12} color="#6b7280" />
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Distribution Details */}
        <View style={styles.distributionSection}>
          <Text style={styles.distributionText}>
            Your ${editableAmount} becomes ${(editableAmount * 0.9).toFixed(2)}{" "}
            after fees, split evenly across causes. Your donation will be evenly
            distributed across all {visibleCauses.length} organizations.
          </Text>
        </View>

        {/* Payment Method Section */}
        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>PAYMENT METHOD</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentInfo}>
              <View style={styles.paymentIcon}>
                <CreditCard size={16} color="#6b7280" />
              </View>
              <View style={styles.paymentDetails}>
                <Text style={styles.paymentNumber}>**** **** **** 4242</Text>
                <Text style={styles.paymentExpiry}>12/25</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.changeButton}>
              <Text style={styles.changeButtonText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Next Payment Section */}
        <View style={styles.nextPaymentSection}>
          <Text style={styles.sectionTitle}>NEXT PAYMENT</Text>
          <View style={styles.nextPaymentCard}>
            <View style={styles.nextPaymentInfo}>
              <Text style={styles.nextPaymentLabel}>Next payment date</Text>
              <Text style={styles.nextPaymentDate}>December 26, 2024</Text>
            </View>
            <View style={styles.nextPaymentAmount}>
              <Text style={styles.nextPaymentValue}>${editableAmount}</Text>
              <Text style={styles.nextPaymentFrequency}>Monthly</Text>
            </View>
          </View>
        </View>

        <Text style={styles.allocationNote}>
          Allocations will automatically adjust for 100% distribution
        </Text>

        {/* Edit Causes Button */}
        <View style={styles.editCausesSection}>
          <TouchableOpacity 
            style={styles.editCausesButton}
            onPress={handleEditCauses}
          >
            <Text style={styles.editCausesButtonText}>
              {isEditMode ? "Close" : "Edit Causes"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer - Only show in edit mode */}
      {isEditMode && (
        <View style={styles.footer}>
          {visibleCauses.length > 0 && (
            <TouchableOpacity onPress={handleDeactivate}>
              <Text style={styles.deactivateText}>Deactivate donation box</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[
              styles.saveButton, 
              visibleCauses.length === 0 && styles.saveButtonFull
            ]} 
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    // backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5
  },
  headerTitle: {
    flex: 1,
    // textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    paddingBottom: 24,
    position: 'relative',
  },
  transactionLink: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  transactionLinkText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textDecorationLine: 'underline',

    
  },
  amountSection: {
    alignItems: 'center',
    marginTop: 35,
  },
  amountControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  amountButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    minWidth: 120,
    textAlign: 'center',
  },
  amountInput: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 120,
    textAlign: 'center',
    paddingVertical: 4,
  },
  scheduleText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    maxWidth: 300,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#ffffff',
    marginTop: 4,
  },
  editCausesSection: {
    paddingHorizontal: 32,
    marginTop: 24,
    marginBottom: 16,
  },
  editCausesButton: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  editCausesButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  causesSection: {
    paddingHorizontal: 32,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  causesList: {
    marginBottom: 16,
  },
  causeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  causeImageContainer: {
    marginRight: 16,
  },
  causeImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  causePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  causePlaceholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  causeInfo: {
    flex: 1,
  },
  causeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  causeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  causeUsername: {
    fontSize: 12,
    color: '#6b7280',
  },
  causeDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  editActions: {
    justifyContent: 'flex-end',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  removeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  distributionSection: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  distributionText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  paymentSection: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  paymentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentDetails: {
    gap: 2,
  },
  paymentNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  paymentExpiry: {
    fontSize: 12,
    color: '#6b7280',
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  changeButtonText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  nextPaymentSection: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  nextPaymentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextPaymentInfo: {
    gap: 2,
  },
  nextPaymentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  nextPaymentDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  nextPaymentAmount: {
    alignItems: 'flex-end',
    gap: 2,
  },
  nextPaymentValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  nextPaymentFrequency: {
    fontSize: 12,
    color: '#6b7280',
  },
  allocationNote: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 32,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  deactivateText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  saveButton: {
    backgroundColor: PrimaryBlue,
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonFull: {
    flex: 1,
    marginLeft: 0,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
