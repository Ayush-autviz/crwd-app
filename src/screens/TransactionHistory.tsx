import { View, Text, ScrollView, StyleSheet, Platform, ActivityIndicator, TouchableOpacity, Modal, Pressable, FlatList, Linking, Alert } from 'react-native'
import React, { useMemo, useState, useEffect } from 'react'
import { ChevronDown, Check, FileText } from 'lucide-react-native';
import MainHeaderNav from '../components/MainHeaderNav';
import { PrimaryBlue, PrimaryGrey, SecondaryGrey } from '../Constants/Colors';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getDonationHistory, getTransactionReceipt } from '../services/api/donation';
import { Toast } from '../components/Toast';

interface Transaction {
  id: number;
  donation_type: string;
  gross_amount: string;
  stripe_fee: string;
  crwd_fee: string;
  net_amount: string;
  status: string;
  charged_at: string;
  cause_count: number;
  collective_count: number;
  causes: Array<{
    id: number;
    name: string;
    tax_id_number: string;
    image: string | null;
  }>;
  collectives: Array<{
    id: number;
    name: string;
  }>;
}

export default function TransactionHistory() {
  const insets = useSafeAreaInsets()
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Fetch transaction history from API
  const { data: donationHistoryData, isLoading, error, refetch } = useQuery({
    queryKey: ['donationHistory'],
    queryFn: getDonationHistory,
  });

  // State for year selection
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [showYearPicker, setShowYearPicker] = useState(false);

  // Get available years
  const availableYears = useMemo(() => {
    if (!donationHistoryData?.results) return [];
    const years = new Set<string>();
    donationHistoryData.results.forEach((transaction: Transaction) => {
      if (transaction.charged_at) {
        years.add(new Date(transaction.charged_at).getFullYear().toString());
      }
    });
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [donationHistoryData]);

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  // Filter transactions by selected year
  const filteredTransactions = useMemo(() => {
    if (!donationHistoryData?.results) return [];

    return donationHistoryData.results
      .filter((transaction: Transaction) => {
        if (!transaction.charged_at) return false;
        return new Date(transaction.charged_at).getFullYear().toString() === selectedYear && transaction.status === 'succeeded';
      })
      .sort((a: Transaction, b: Transaction) => {
        return new Date(b.charged_at).getTime() - new Date(a.charged_at).getTime();
      });
  }, [donationHistoryData, selectedYear]);

  // Calculate total donated for selected year
  const totalDonated = useMemo(() => {
    return filteredTransactions.reduce((sum: number, transaction: Transaction) => {
      return sum + parseFloat(transaction.gross_amount || '0');
    }, 0);
  }, [filteredTransactions]);

  // Helper functions
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const calculateAmountPerNonprofit = (transaction: Transaction) => {
    const totalAmount = parseFloat(transaction.gross_amount || '0');
    const totalNonprofits = (transaction.cause_count || 0) + (transaction.collective_count || 0);
    // Use causes length if counts are 0 but array exists (fallback)
    const actualCount = totalNonprofits > 0 ? totalNonprofits : ((transaction.causes?.length || 0) + (transaction.collectives?.length || 0));

    if (actualCount === 0) return '0.00';
    return (totalAmount / actualCount).toFixed(2);
  };

  const generateReceiptNumber = (transaction: Transaction, index: number) => {
    try {
      const year = new Date(transaction.charged_at).getFullYear();
      const paddedIndex = String(index + 1).padStart(3, '0');
      return `REC-${year}-${paddedIndex}`;
    } catch {
      return `REC-${index + 1}`;
    }
  };

  // Download receipt mutation
  const downloadReceiptMutation = useMutation({
    mutationFn: (donationId: string) => getTransactionReceipt(donationId),
    onSuccess: (response: { receipt_url?: string; url?: string; file_url?: string }) => {
      const receiptUrl = response.receipt_url || response.url || response.file_url;
      if (receiptUrl) {
        Linking.canOpenURL(receiptUrl)
          .then((supported) => {
            if (supported) {
              Linking.openURL(receiptUrl);
            } else {
              console.error("Don't know how to open URI: " + receiptUrl);
              Alert.alert('Error', 'Cannot open receipt URL');
            }
          })
          .catch((err) => {
            console.error('An error occurred', err);
            Alert.alert('Error', 'Could not open receipt URL');
          });
      } else {
        setToastMessage('Failed to get receipt URL.');
        setShowToast(true);
      }
    },
    onError: (error: Error) => {
      console.error('Error fetching receipt:', error);
      setToastMessage('Failed to fetch receipt. Please try again.');
      setShowToast(true);
    },
  });

  const handleDownloadReceipt = (transaction: any) => {
    if (transaction.id) {
      downloadReceiptMutation.mutate(transaction.id.toString());
    }
  };

  return (
    <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }}>
      <MainHeaderNav show={true} menu={false} title={'Tax Receipts'} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 + (insets?.bottom ?? 0) }}>

        {/* Year Selector */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => setShowYearPicker(true)}
            style={styles.yearSelector}
          >
            <Text style={styles.yearText}>{selectedYear}</Text>
            <ChevronDown size={16} color="#111827" />
          </TouchableOpacity>
        </View>

        <Modal
          visible={showYearPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowYearPicker(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowYearPicker(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Year</Text>
              <FlatList
                data={availableYears.length > 0 ? availableYears : [new Date().getFullYear().toString()]}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedYear(item);
                      setShowYearPicker(false);
                    }}
                    style={styles.yearOption}
                  >
                    <Text style={[styles.yearOptionText, item === selectedYear && styles.selectedYearText]}>{item}</Text>
                    {item === selectedYear && <Check size={20} color={PrimaryBlue} />}
                  </TouchableOpacity>
                )}
              />
            </View>
          </Pressable>
        </Modal>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PrimaryBlue} />
            <Text style={styles.loadingText}>Loading transactions...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Failed to load transaction history. Please try again.
            </Text>
            <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Total Summary Card */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Donated</Text>
              <Text style={styles.summaryAmount}>${totalDonated.toFixed(2)}</Text>
            </View>

            {/* Info Banner */}
            <View style={styles.infoBanner}>
              <Text style={styles.infoText}>
                All donations are fully tax deductible. Donations are made through CRWD Foundation INC., a 501(c)(3) organization. Keep these receipts for your tax records.
              </Text>
            </View>

            {/* Receipts List */}
            {filteredTransactions.length === 0 ? (
              <View style={styles.emptyState}>
                <FileText size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>No receipts found for {selectedYear}</Text>
              </View>
            ) : (
              <View style={{ gap: 16 }}>
                {filteredTransactions.map((transaction: any, index: number) => {
                  const formattedDate = formatDate(transaction.charged_at);
                  const amountPerNonprofit = calculateAmountPerNonprofit(transaction);
                  const allNonprofits = [
                    ...(transaction.causes || []).map((c: any) => ({ ...c, type: 'cause' })),
                  ];

                  return (
                    <View key={transaction.id} style={styles.receiptCard}>
                      {/* Header */}
                      <View style={styles.receiptHeader}>
                        <View style={styles.receiptHeaderLeft}>
                          <View style={styles.iconContainer}>
                            <FileText size={20} color={PrimaryBlue} />
                          </View>
                          <View>
                            <Text style={styles.receiptDate}>{formattedDate}</Text>
                          </View>
                        </View>
                        <Text style={styles.receiptAmount}>
                          ${parseFloat(transaction.gross_amount).toFixed(2)}
                        </Text>
                      </View>

                      {/* Nonprofits List */}
                      {allNonprofits.length > 0 && (
                        <View style={styles.nonprofitsSection}>
                          <Text style={styles.nonprofitsTitle}>Nonprofits Supported:</Text>
                          {allNonprofits.map((nonprofit: any, idx: number) => (
                            <View key={idx} style={styles.nonprofitRow}>
                              <Text style={styles.nonprofitName}>{nonprofit.name}</Text>
                              <Text style={styles.nonprofitAmount}>${amountPerNonprofit}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Footer */}
                      <View style={styles.receiptFooter}>
                        <View style={styles.taxTag}>
                          <Check size={12} color="#15803d" />
                          <Text style={styles.taxTagText}>Tax Deductible</Text>
                        </View>

                        <TouchableOpacity
                          style={styles.downloadButton}
                          onPress={() => handleDownloadReceipt(transaction)}
                          disabled={downloadReceiptMutation.isPending}
                        >
                          {downloadReceiptMutation.isPending && downloadReceiptMutation.variables === transaction.id.toString() ? (
                            <ActivityIndicator size="small" color="#374151" />
                          ) : (
                            <>
                              <FileText size={14} color="#374151" />
                              <Text style={styles.downloadButtonText}>View Receipt</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
      <Toast
        message={toastMessage}
        show={showToast}
        onHide={() => setShowToast(false)}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: PrimaryGrey,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    color: PrimaryBlue,
    textDecorationLine: 'underline',
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    gap: 8,
  },
  yearText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    maxHeight: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  yearOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  yearOptionText: {
    fontSize: 16,
    color: '#111827',
  },
  selectedYearText: {
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: PrimaryBlue,
  },
  infoBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoText: {
    fontSize: 13,
    color: PrimaryBlue,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 15,
    color: '#6B7280',
  },
  receiptCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  receiptHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 999,
  },
  receiptDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  receiptAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  nonprofitsSection: {
    marginBottom: 16,
  },
  nonprofitsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  nonprofitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nonprofitName: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
    marginRight: 8,
  },
  nonprofitAmount: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  receiptFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  taxTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  taxTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803d',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
  },
  downloadButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
});