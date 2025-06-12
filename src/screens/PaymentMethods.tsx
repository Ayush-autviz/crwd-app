import React, { useState } from 'react'
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArrowLeft, Plus, CreditCard, Trash2, ChevronLeft } from 'lucide-react-native'
import { useNavigation } from '@react-navigation/native'
import { PrimaryGrey, PrimaryBlue, LightGrey } from '../Constants/Colors'

interface PaymentMethod {
  id: number
  type: string
  last4: string
  brand: string
  expiryMonth: number
  expiryYear: number
  isDefault: boolean
}

export default function PaymentMethods() {
  const navigation = useNavigation()
  
  const [isLoading, setIsLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: 1,
      type: "credit_card",
      last4: "4242",
      brand: "Visa",
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true
    },
    {
      id: 2,
      type: "credit_card",
      last4: "5555",
      brand: "Mastercard",
      expiryMonth: 8,
      expiryYear: 2026,
      isDefault: false
    }
  ])
  const [newCard, setNewCard] = useState({
    number: "",
    name: "",
    expiry: "",
    cvc: ""
  })

  const handleAddCard = async () => {
    if (!newCard.number || !newCard.name || !newCard.expiry || !newCard.cvc) {
      Alert.alert('Error', 'Please fill in all card details')
      return
    }

    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      const last4 = newCard.number.slice(-4)
      const newPaymentMethod: PaymentMethod = {
        id: paymentMethods.length + 1,
        type: "credit_card",
        last4,
        brand: "Visa", // This would be determined by card number in real implementation
        expiryMonth: parseInt(newCard.expiry.split('/')[0]),
        expiryYear: parseInt(`20${newCard.expiry.split('/')[1]}`),
        isDefault: paymentMethods.length === 0
      }

      setPaymentMethods(prev => [...prev, newPaymentMethod])
      setShowAddForm(false)
      setNewCard({ number: "", name: "", expiry: "", cvc: "" })
      Alert.alert('Success', 'Payment method added successfully!')
    } catch (error) {
      Alert.alert('Error', 'Failed to add payment method. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCard = async (id: number) => {
    const cardToDelete = paymentMethods.find(card => card.id === id)
    
    if (cardToDelete?.isDefault) {
      Alert.alert('Error', 'Cannot delete the default payment method. Please set another card as default first.')
      return
    }

    Alert.alert(
      'Delete Payment Method',
      'Are you sure you want to delete this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true)
            try {
              await new Promise(resolve => setTimeout(resolve, 1000))
              setPaymentMethods(prev => prev.filter(card => card.id !== id))
              Alert.alert('Success', 'Payment method removed successfully!')
            } catch (error) {
              Alert.alert('Error', 'Failed to remove payment method. Please try again.')
            } finally {
              setIsLoading(false)
            }
          }
        }
      ]
    )
  }

  const handleSetDefault = async (id: number) => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setPaymentMethods(prev => 
        prev.map(card => ({ ...card, isDefault: card.id === id }))
      )
      Alert.alert('Success', 'Default payment method updated!')
    } catch (error) {
      Alert.alert('Error', 'Failed to update default payment method. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={24} color="#374151" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.title}>Payment Methods</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddForm(true)}
          >
            <Plus size={20} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Add Form */}
          {showAddForm && (
            <View style={styles.addFormContainer}>
              <Text style={styles.formTitle}>Add New Payment Method</Text>
              <Text style={styles.formSubtitle}>Enter your card details securely</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Card Number</Text>
                <TextInput
                  style={styles.textInput}
                  value={newCard.number}
                  onChangeText={(text) => setNewCard(prev => ({ ...prev, number: text }))}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor={PrimaryGrey}
                  keyboardType="numeric"
                  maxLength={19}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Name on Card</Text>
                <TextInput
                  style={styles.textInput}
                  value={newCard.name}
                  onChangeText={(text) => setNewCard(prev => ({ ...prev, name: text }))}
                  placeholder="John Doe"
                  placeholderTextColor={PrimaryGrey}
                />
              </View>

              <View style={styles.rowContainer}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Expiry Date</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newCard.expiry}
                    onChangeText={(text) => setNewCard(prev => ({ ...prev, expiry: text }))}
                    placeholder="MM/YY"
                    placeholderTextColor={PrimaryGrey}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
                <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>CVC</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newCard.cvc}
                    onChangeText={(text) => setNewCard(prev => ({ ...prev, cvc: text }))}
                    placeholder="123"
                    placeholderTextColor={PrimaryGrey}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.addCardButton]}
                  onPress={handleAddCard}
                  disabled={isLoading}
                >
                  <Text style={styles.addButtonText}>
                    {isLoading ? 'Adding...' : 'Add Card'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setShowAddForm(false)}
                  disabled={isLoading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Payment Methods List */}
          <View style={styles.methodsContainer}>
            <Text style={styles.sectionTitle}>Your Payment Methods</Text>
            
            {paymentMethods.map((method) => (
              <View key={method.id} style={styles.methodCard}>
                <View style={styles.methodInfo}>
                  <CreditCard size={32} color={PrimaryGrey} />
                  <View style={styles.methodDetails}>
                    <Text style={styles.methodTitle}>
                      {method.brand} ending in {method.last4}
                    </Text>
                    <Text style={styles.methodExpiry}>
                      Expires {method.expiryMonth}/{method.expiryYear}
                    </Text>
                  </View>
                </View>

                <View style={styles.methodActions}>
                  {method.isDefault ? (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.setDefaultButton}
                      onPress={() => handleSetDefault(method.id)}
                      disabled={isLoading}
                    >
                      <Text style={styles.setDefaultText}>Set as Default</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteCard(method.id)}
                    disabled={isLoading || method.isDefault}
                  >
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {paymentMethods.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No payment methods added yet</Text>
                <Text style={styles.emptySubtext}>Add a card to get started</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  addButton: {
    backgroundColor: PrimaryBlue,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  addFormContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: PrimaryGrey,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: 'white',
  },
  rowContainer: {
    flexDirection: 'row',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addCardButton: {
    backgroundColor: PrimaryBlue,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  methodsContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 20,
    marginBottom: 16,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodDetails: {
    marginLeft: 12,
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  methodExpiry: {
    fontSize: 14,
    color: PrimaryGrey,
  },
  methodActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  defaultBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  setDefaultButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  setDefaultText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: PrimaryGrey,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: PrimaryGrey,
  },
}) 