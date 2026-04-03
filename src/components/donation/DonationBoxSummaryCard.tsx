import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Alert } from 'react-native'
import { Pencil, Plus, Minus, CreditCard } from 'lucide-react-native'
import { PrimaryBlue, PrimaryGrey, LightGrey, SecondaryGrey } from '../../Constants/Colors'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateDonationBox } from '../../services/api/donation'
import { useAuthStore } from '../../store/store'

// Using View with backgroundColor for gradient effect (can be replaced with LinearGradient if available)

interface DonationBoxSummaryCardProps {
  monthlyAmount: number
  lifetimeAmount?: number
  causesCount: number
  collectivesCount: number
  currentCapacity: number
  maxCapacity: number
  donationBox?: any
  onEditAmount?: () => void
  onEditPayment?: () => void
  onAddCauses?: () => void
}

export default function DonationBoxSummaryCard({
  monthlyAmount,
  lifetimeAmount = 0,
  causesCount,
  collectivesCount,
  currentCapacity,
  maxCapacity,
  donationBox,
  onEditAmount,
  onEditPayment,
  onAddCauses,
}: DonationBoxSummaryCardProps) {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuthStore()
  const [isEditingAmount, setIsEditingAmount] = useState(false)
  const [editableAmount, setEditableAmount] = useState(monthlyAmount)

  const remainingCapacity = maxCapacity - currentCapacity
  const capacityPercentage = (currentCapacity / maxCapacity) * 100

  // Update editableAmount when monthlyAmount changes
  useEffect(() => {
    setEditableAmount(monthlyAmount)
  }, [monthlyAmount])

  // Calculate fees and capacity
  const calculateFees = (grossAmount: number) => {
    const gross = grossAmount;
    let crwdFee: number;
    let net: number;

    if (gross < 10.00) {
      crwdFee = 1.00;
      net = gross - crwdFee;
    } else {
      crwdFee = gross * 0.10;
      net = gross - crwdFee;
    }

    return {
      crwdFee: Math.round(crwdFee * 100) / 100,
      net: Math.round(net * 100) / 100,
    };
  }

  const incrementAmount = () => {
    setEditableAmount(prev => Math.round(prev) + 1)
  }

  const decrementAmount = () => {
    if (editableAmount > 5) {
      setEditableAmount(prev => Math.max(5, Math.round(prev) - 1))
    }
  }

  // Mutation to update donation box
  const updateAmountMutation = useMutation({
    mutationFn: (amount: number) => updateDonationBox({ monthly_amount: amount }),
    onSuccess: () => {
      console.log('Donation box amount updated successfully')
      queryClient.invalidateQueries({ queryKey: ['donationBox'] })
      queryClient.invalidateQueries({ queryKey: ['donationBox', currentUser?.id] })
      setIsEditingAmount(false)
    },
    onError: (error: any) => {
      console.error('Error updating donation box amount:', error)
      // Revert on error
      setEditableAmount(monthlyAmount)
      Alert.alert('Error', 'Failed to update donation amount. Please try again.')
    },
  })

  const handleSaveAmount = () => {
    // Calculate capacity for the new amount
    const fees = calculateFees(editableAmount)
    const net = fees.net
    const newMaxCapacity = Math.floor(net / 0.20)

    // Check if current causes exceed the new capacity
    if (currentCapacity > newMaxCapacity) {
      Alert.alert(
        'Capacity Exceeded',
        `You can only support up to ${newMaxCapacity} cause${newMaxCapacity !== 1 ? 's' : ''} with $${editableAmount}. Please remove some causes or increase the amount.`
      )
      return
    }

    // If capacity check passes, update the amount
    updateAmountMutation.mutate(editableAmount)
  }

  const handleCancelEdit = () => {
    setEditableAmount(monthlyAmount)
    setIsEditingAmount(false)
  }

  // Get day of month from next charge date
  const getChargeDay = (dateString?: string) => {
    if (!dateString) return '26th'

    try {
      const date = new Date(dateString)
      const day = date.getDate()
      // Add ordinal suffix
      if (day > 3 && day < 21) return `${day}th`
      switch (day % 10) {
        case 1: return `${day}st`
        case 2: return `${day}nd`
        case 3: return `${day}rd`
        default: return `${day}th`
      }
    } catch (error) {
      console.error('Error getting charge day:', error)
      return '26th'
    }
  }

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <View style={styles.gradientHeader} />

      <View style={styles.content}>
        {/* Monthly Donation Section */}
        <View style={styles.monthlySection}>
          <Text style={styles.monthlyLabel}>Monthly Donation</Text>

          {/* Amount Display with Controls */}
          <View style={styles.amountRow}>
            <View style={styles.amountContainer}>
              {isEditingAmount ? (
                <TextInput
                  value={Math.round(editableAmount).toString()}
                  onChangeText={(text) => {
                    const value = parseInt(text) || 5
                    setEditableAmount(Math.max(5, value))
                  }}
                  style={styles.amountInput}
                  keyboardType="numeric"
                  autoFocus
                />
              ) : (
                <Text style={styles.amountText}>${Math.round(editableAmount)}</Text>
              )}
              <Text style={styles.perMonthText}>/month</Text>
            </View>

            {/* +/- Buttons - Only show when editing */}
            {isEditingAmount && (
              <View style={styles.amountControls}>
                <TouchableOpacity
                  onPress={decrementAmount}
                  disabled={editableAmount <= 5}
                  style={[
                    styles.amountControlButton,
                    editableAmount <= 5 && styles.amountControlButtonDisabled
                  ]}
                >
                  <Minus size={20} color={editableAmount <= 5 ? '#9CA3AF' : '#fff'} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={incrementAmount}
                  style={styles.amountControlButton}
                >
                  <Plus size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {/* Pencil Icon - Only show when not editing */}
            {!isEditingAmount && (
              <TouchableOpacity
                onPress={() => setIsEditingAmount(true)}
                style={styles.editButton}
                accessibilityLabel="Edit amount"
              >
                <Pencil size={16} color={PrimaryGrey} />
              </TouchableOpacity>
            )}
          </View>

          {/* Lifetime Amount */}
          {lifetimeAmount > 0 && (
            <Text style={styles.lifetimeAmount}>${lifetimeAmount.toLocaleString()} lifetime</Text>
          )}

          {/* Billing Cycle Info - Only show when editing and donation box is active */}
          {isEditingAmount && donationBox?.is_active && donationBox?.next_charge_date && (
            <View style={styles.billingCycleBanner}>
              <Text style={styles.billingCycleText}>
                Changes take effect on your next billing cycle ({getChargeDay(donationBox.next_charge_date)} of the month)
              </Text>
            </View>
          )}

          {/* Action Buttons - Only show when editing */}
          {isEditingAmount && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={handleCancelEdit}
                disabled={updateAmountMutation.isPending}
                style={[styles.cancelButton, updateAmountMutation.isPending && styles.buttonDisabled]}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveAmount}
                disabled={updateAmountMutation.isPending}
                style={[styles.saveButton, updateAmountMutation.isPending && styles.buttonDisabled]}
              >
                {updateAmountMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Supported Entities */}
        <View style={styles.entitiesContainer}>
          <Text style={styles.entitiesText}>
            {causesCount} Nonprofit{causesCount !== 1 ? 's' : ''} • {collectivesCount} Giving Group{collectivesCount !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Donation Box Capacity */}
        {/* <View style={styles.capacityContainer}>
          <View style={styles.capacityHeader}>
            <Text style={styles.capacityTitle}>Donation Box Capacity</Text>
            <Text style={styles.capacityCount}>{currentCapacity}/{maxCapacity} causes</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(100, capacityPercentage)}%` }]} />
            </View>
          </View>
          <Text style={styles.capacityText}>
            You can support {remainingCapacity} more cause{remainingCapacity !== 1 ? 's' : ''} with this donation amount.
          </Text>
        </View> */}

        {/* Edit Payment and Add Causes Buttons */}
        {(onEditPayment || onAddCauses) && (
          <View style={styles.buttonsRow}>
            {onEditPayment && (
              <TouchableOpacity
                onPress={onEditPayment}
                style={styles.editPaymentButton}
                activeOpacity={0.7}
              >
                <CreditCard size={18} color="#111827" />
                <Text style={styles.editPaymentButtonText}>Edit payment</Text>
              </TouchableOpacity>
            )}
            {onAddCauses && (
              <TouchableOpacity
                onPress={onAddCauses}
                style={styles.addCausesButton}
                activeOpacity={0.7}
              >
                <Plus size={18} color="#FFFFFF" />
                <Text style={styles.addCausesButtonText}>Add Causes</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F9F2',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    // marginHorizontal: 16,
    marginVertical: 16,
  },
  gradientHeader: {
    height: 4,
    width: '100%',
    backgroundColor: '#1600ff', // Standard CRWD Blue
  },
  content: {
    padding: 24,
  },
  monthlySection: {
    marginBottom: 24,
  },
  monthlyLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'Outfit-Medium',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  amountText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Outfit-Bold',
  },
  perMonthText: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Outfit-Regular',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 48,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entitiesContainer: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  entitiesText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Outfit-Bold',
  },
  capacityContainer: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  capacityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  capacityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PrimaryBlue,
    fontFamily: 'Outfit-Bold',
  },
  capacityCount: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Outfit-Regular',
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: PrimaryBlue, // Gradient effect - can be enhanced with LinearGradient
  },
  capacityText: {
    fontSize: 14,
    color: PrimaryBlue,
    fontFamily: 'Outfit-Regular',
  },
  lifetimeAmount: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    fontFamily: 'Outfit-Regular',
  },
  amountInput: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
    minWidth: 80,
    fontFamily: 'Outfit-Bold',
  },
  amountControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountControlButton: {
    width: 40,
    height: 40,
    borderRadius: 50,
    backgroundColor: '#1600ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountControlButtonDisabled: {
    opacity: 0.5,
  },
  billingCycleBanner: {
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  billingCycleText: {
    fontSize: 13,
    color: PrimaryBlue,
    textAlign: 'center',
    fontFamily: 'Outfit-Regular',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Outfit-SemiBold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: PrimaryBlue,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Outfit-SemiBold',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  editPaymentButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
  },
  editPaymentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Outfit-SemiBold',
  },
  addCausesButton: {
    flex: 1,
    backgroundColor: '#1600ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addCausesButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Outfit-SemiBold',
  },
})

