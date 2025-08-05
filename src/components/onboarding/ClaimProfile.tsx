import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native'
import React, { useState } from 'react'
import { ChevronLeft } from 'lucide-react-native'
import { Check } from 'lucide-react-native'
import OnboardingHeader from './OnboardingHeader'

export default function ClaimProfile() {
    const [checked, setChecked] = useState(false)
    return (
        <View style={{ flex: 1 }}>
            <OnboardingHeader />
            <Text style={{ fontSize: 32, fontWeight: '700', textAlign: 'center', marginTop: 40 }}>Claim Your Profile</Text>
            <View style={{ flex: 1, padding: 5, marginTop: 20, gap: 5 }}>

                <Text style={styles.label}>Full Name</Text>
                <TextInput placeholder='Full Name' style={styles.input} placeholderTextColor="#9ca3af" />
                <Text style={styles.label}>Date of Birth</Text>
                <TextInput placeholder='Date of Birth' style={styles.input} placeholderTextColor="#9ca3af" />
                <Text style={styles.label}>Email</Text>
                <TextInput placeholder='Email' style={styles.input} placeholderTextColor="#9ca3af" />
                <Text style={styles.label}>School (Optional)</Text>
                <TextInput placeholder='School (Optional)' style={styles.input} placeholderTextColor="#9ca3af" />
            </View>
            <View style={{ flexDirection: 'row', backgroundColor: "#f6f6f6", padding: 10, borderRadius: 10, gap: 10, marginTop: 10, alignItems: "center" }}>
                <TouchableOpacity style={{ borderWidth: 1.2, borderColor: checked ? 'black' : 'gray', borderRadius: 50, padding: checked ? 3 : 10.5, backgroundColor: checked ? 'black' : 'white' }} onPress={() => setChecked(!checked)}>
                    {checked ? <Check size={15} color="white" /> : <></>}
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, lineHeight: 18, color: 'gray', textAlign: 'center' }}>
                        By checking this box, you acknowledge and agree to Claim's Terms of Use and Privacy Policy.
                    </Text>
                </View>
            </View>
      <TouchableOpacity style={{backgroundColor: 'black', padding: 10, borderRadius: 5, marginTop: 20, alignItems: 'center'}}>
                <Text style={{ color: "white", textAlign: "center", fontSize: 16, fontWeight: "bold" }}>Continue</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        // marginBottom: 5,
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
    }
})