import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Pen } from 'lucide-react-native'
import { PrimaryBlue, PrimaryGrey, LightGrey, SecondaryGrey } from '../../Constants/Colors'
// Using View with backgroundColor for gradient effect (can be replaced with LinearGradient if available)

interface DonationBoxSummaryCardProps {
  monthlyAmount: number
  lifetimeAmount?: number
  causesCount: number
  collectivesCount: number
  currentCapacity: number
  maxCapacity: number
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
  onEditAmount,
  onEditPayment,
  onAddCauses,
}: DonationBoxSummaryCardProps) {
  const remainingCapacity = maxCapacity - currentCapacity
  const capacityPercentage = (currentCapacity / maxCapacity) * 100

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <View style={styles.gradientHeader} />

      <View style={styles.content}>
        {/* Monthly Donation Section */}
        <View style={styles.monthlySection}>
          <Text style={styles.monthlyLabel}>Monthly Donation</Text>
          <View style={styles.amountRow}>
            <View style={styles.amountContainer}>
              <Text style={styles.amountText}>${monthlyAmount}</Text>
              <Text style={styles.perMonthText}>/   month</Text>
            </View>
            {onEditAmount && (
              <TouchableOpacity
                onPress={onEditAmount}
                style={styles.editButton}
                accessibilityLabel="Edit amount"
              >
                <Pen size={16} color={PrimaryGrey} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Supported Entities */}
        <View style={styles.entitiesContainer}>
          <Text style={styles.entitiesText}>
            {causesCount} Cause{causesCount !== 1 ? 's' : ''} • {collectivesCount} Collective{collectivesCount !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Donation Box Capacity */}
        <View style={styles.capacityContainer}>
          <View style={styles.capacityHeader}>
            <Text style={styles.capacityTitle}>Donation Box Capacity</Text>
            <Text style={styles.capacityCount}>{currentCapacity}/{maxCapacity} causes</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${capacityPercentage}%` }]} />
            </View>
          </View>
          <Text style={styles.capacityText}>
            You can support {remainingCapacity} more cause{remainingCapacity !== 1 ? 's' : ''} with this donation amount.
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: SecondaryGrey,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginVertical: 16,
  },
  gradientHeader: {
    height: 2,
    width: '100%',
    backgroundColor: PrimaryBlue, // Gradient effect - can be enhanced with LinearGradient
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
  },
  perMonthText: {
    fontSize: 16,
    color: '#6b7280',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: LightGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entitiesContainer: {
    backgroundColor: LightGrey,
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
  },
  capacityCount: {
    fontSize: 14,
    color: '#111827',
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
  },
})

