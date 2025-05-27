import { View, Text, SafeAreaView, ScrollView, Image, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import MainHeaderNav from '../components/MainHeaderNav'
import { CircleHelp, CreditCard, FileText, Info, Lock, Mail, MessageSquare, Shield, User } from 'lucide-react-native'
import { LightGrey, PrimaryBlue, PrimaryGrey, SecondaryGrey } from '../Constants/Colors'
import { useNavigation } from '@react-navigation/native'

export default function Settings() {

    const navigation = useNavigation();

    return (
        <SafeAreaView style={{ backgroundColor: '#fff', flex: 1 }}>
            <MainHeaderNav show={true} />

            <ScrollView style={{ paddingHorizontal: 20 }}>
                <View style={styles.container}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 }}>
                        <User size={20} color={PrimaryBlue} />
                        <View>
                            <Text style={{ fontSize: 18, fontWeight: '600' }}>Account</Text>
                            <Text style={{ color: PrimaryGrey, fontSize: 13 }}>Manage your account settings and preferences</Text>
                        </View>
                    </View>
                    <View style={{ borderBottomWidth: 1, borderBottomColor: LightGrey, marginHorizontal: -20 }} />
                    <TouchableOpacity onPress={() => navigation.navigate('Email')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 10 }}>
                        <Mail size={20} color={PrimaryGrey} />
                        <Text>Email</Text>
                    </TouchableOpacity>
                    <View style={{ borderTopWidth: 1, borderTopColor: LightGrey, marginHorizontal: -20 }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 10 }}>
                        <Lock size={20} color={PrimaryGrey} />
                        <Text>Password</Text>
                    </View>
                </View>
                <View style={styles.container}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 }}>
                        <CreditCard size={20} color={PrimaryBlue} />
                        <View>
                            <Text style={{ fontSize: 18, fontWeight: '600' }}>Financial</Text>
                            <Text style={{ color: PrimaryGrey, fontSize: 13 }}>Manage your payment methods and view transaction history</Text>
                        </View>
                    </View>
                    <View style={{ borderBottomWidth: 1, borderBottomColor: LightGrey, marginHorizontal: -20 }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 10 }}>
                        <CreditCard size={20} color={PrimaryGrey} />
                        <Text>Payment Methods</Text>
                    </View>
                    <View style={{ borderTopWidth: 1, borderTopColor: LightGrey, marginHorizontal: -20 }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 10 }}>
                        <Lock size={20} color={PrimaryGrey} />
                        <Text>Transaction History</Text>
                    </View>
                </View>
                <View style={styles.container}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 }}>
                        <CircleHelp size={20} color={PrimaryBlue} />
                        <View>
                            <Text style={{ fontSize: 18, fontWeight: '600' }}>Help & Support</Text>
                            <Text style={{ color: PrimaryGrey, fontSize: 13 }}>Get help and learn more about CRWD</Text>
                        </View>
                    </View>
                    <View style={{ borderBottomWidth: 1, borderBottomColor: LightGrey, marginHorizontal: -20 }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 10 }}>
                        <CircleHelp size={20} color={PrimaryGrey} />
                        <Text>Help Center</Text>
                    </View>
                    <View style={{ borderTopWidth: 1, borderTopColor: LightGrey, marginHorizontal: -20 }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 10 }}>
                        <FileText size={20} color={PrimaryGrey} />
                        <Text>Terms of Use</Text>
                    </View>
                    <View style={{ borderTopWidth: 1, borderTopColor: LightGrey, marginHorizontal: -20 }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 10 }}>
                        <Shield size={20} color={PrimaryGrey} />
                        <Text>Privacy Policy</Text>
                    </View>
                    <View style={{ borderTopWidth: 1, borderTopColor: LightGrey, marginHorizontal: -20 }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 10 }}>
                        <Info size={20} color={PrimaryGrey} />
                        <Text>About</Text>
                    </View>
                    <View style={{ borderTopWidth: 1, borderTopColor: LightGrey, marginHorizontal: -20 }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 10 }}>
                        <MessageSquare size={20} color={PrimaryGrey} />
                        <Text>Report an Issue</Text>
                    </View>

                </View>

            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
        // flexDirection: 'row',
        backgroundColor: 'white',
        gap: 10,
        // alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,   // no left/right shadow
            height: 1,  // more shadow downward
        },
        shadowOpacity: 0.1, // subtle transparency
        shadowRadius: 6,
        elevation: 3, // for Android
        borderRadius: 10,
        // padding: 12,
        paddingHorizontal: 20,
        paddingVertical: 10
    }
})