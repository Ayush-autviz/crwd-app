import { View, Text, SafeAreaView, ScrollView, FlatList, TextInput, TouchableOpacity } from 'react-native'
import React from 'react'
import MainHeaderNav from '../MainHeaderNav'
import { PrimaryBlue, PrimaryGrey, SecondaryBlue, SecondaryGrey } from '../../Constants/Colors'
import { Mail } from 'lucide-react-native'

export default function Email() {

    const values = [{
        name: 'Transparency',
        description: 'We believe in complete transparency in all our operations and transactions.'
    },
    {
        name: 'Community',
        description: 'Building strong, supportive communities is at the heart of everything we do.'
    },
    {
        name: 'Impact',
        description: 'We measure our success by the positive impact we create in communities.'
    },
    ]

    return (
        <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }}>
            <MainHeaderNav show={true} post={false} menu={false} />
            <ScrollView style={{ paddingHorizontal: 20, marginTop: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <Mail size={20} color={PrimaryBlue} />
                    <Text style={{ fontSize: 20, fontWeight: '600' }}>Change Email</Text>
                </View>
                <Text style={{ fontSize: 14, color: PrimaryGrey, marginBottom: 10 }}>
                    Update your email address. You'll need to verify your new email address after the change.
                </Text>
                <Text style={{ fontSize: 14, marginVertical: 10 }}>Current Email</Text>
                <TextInput style={{ borderColor: SecondaryGrey, borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 20 }}  />
                <Text style={{ fontSize: 14, marginBottom: 10 }}>New Email</Text>
                <TextInput style={{ borderColor: SecondaryGrey, borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 20 }}  />
                <Text style={{ fontSize: 14, marginBottom: 10 }}>Confirm New Email</Text>
                <TextInput style={{ borderColor: SecondaryGrey, borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 20 }} />
                <Text style={{ fontSize: 14, marginBottom: 10 }}>
                    Current Password
                </Text>
                <TextInput style={{ borderColor: SecondaryGrey, borderWidth: 1, borderRadius: 10, padding: 10, }} secureTextEntry={true} />
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 20 }}>
                    <TouchableOpacity style={{ backgroundColor: PrimaryBlue, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10,}}>
                    <Text style={{ color: 'white', textAlign: 'center' }}>Update Email</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{  paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10, borderColor: SecondaryGrey, borderWidth: 1 }}>
                    <Text style={{ textAlign: 'center' }}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}