import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native'
import React, { useState } from 'react'
import { ChevronLeft, Check } from 'lucide-react-native'
import OnboardingHeader from './OnboardingHeader'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import DatePicker from 'react-native-date-picker'
import { PrimaryBlue } from '../../Constants/Colors'

export default function ClaimProfile() {
    const navigation = useNavigation<any>()
    const [checked, setChecked] = useState(false)
    const [date, setDate] = useState<Date | null>(null)
    const [open, setOpen] = useState(false)

    const formattedDate = date
        ? date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
        : ''

    return (
        <SafeAreaView style={{ flex: 1, paddingHorizontal: 20, backgroundColor: 'white' }}>
            <OnboardingHeader />

            <DatePicker
                modal
                open={open}
                date={date || new Date()} // fallback date if none selected
                mode="date"
                maximumDate={new Date()}
                onConfirm={(selectedDate) => {
                    setOpen(false)
                    setDate(selectedDate)
                }}
                onCancel={() => {
                    setOpen(false)
                }}
                theme='light'
            />

            <Text
                style={{
                    fontSize: 28,
                    fontWeight: '700',
                    color: '#111827',
                    marginBottom: 12,
                    textAlign: 'center',
                    marginTop: 20,
                }}
            >
                Claim Your Profile
            </Text>

            <View style={{ flex: 1, padding: 5, marginTop: 20, gap: 5 }}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput placeholder="Full Name" style={styles.input} placeholderTextColor="#9ca3af" />

                <Text style={styles.label}>Date of Birth</Text>
                <TouchableOpacity onPress={() => setOpen(true)}>
                    {/* <Text style={styles.input}>
                        {formattedDate || 'Select your birth date'}
                    </Text> */}
                    {formattedDate ? <Text style={styles.input}>{formattedDate}</Text> : <Text style={[styles.input, { color: '#9ca3af' }]}>Select your birth date</Text>}
                </TouchableOpacity>

                <Text style={styles.label}>Email</Text>
                <TextInput placeholder="Email" style={styles.input} placeholderTextColor="#9ca3af" />
            </View>

            <View
                style={{
                    flexDirection: 'row',
                    backgroundColor: '#f6f6f6',
                    padding: 12,
                    borderRadius: 10,
                    gap: 10,
                    marginTop: 10,
                    alignItems: 'center',
                }}
            >
                <TouchableOpacity
                    style={{
                        borderWidth: 1.2,
                        borderColor: checked ? 'black' : 'gray',
                        borderRadius: 50,
                        padding: checked ? 3 : 10.5,
                        backgroundColor: checked ? 'black' : 'white',
                    }}
                    onPress={() => setChecked(!checked)}
                >
                    {checked ? <Check size={15} color="white" /> : null}
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, lineHeight: 18, color: 'gray', textAlign: 'center' }}>
                        By checking this box, you acknowledge and agree to Claim's Terms of Use and Privacy Policy.
                    </Text>
                </View>
            </View>

            <TouchableOpacity
                style={{
                    backgroundColor: PrimaryBlue,
                    padding: 15,
                    borderRadius: 12,
                    marginTop: 20,
                    alignItems: 'center',
                }}
                onPress={() => navigation.navigate('AddPhoto')}
            >
                <Text style={{ color: 'white', textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>Continue</Text>
            </TouchableOpacity>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    input: {
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 16,
        backgroundColor: '#f9fafb',
        fontSize: 16,
        color: '#111827',
        marginBottom: 8,
    },
})
