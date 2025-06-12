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
                    <View style={{ flexDirection: 'row', alignItems: 'center',marginVertical: 10, gap: 10 }}>
                        <User size={20} color={PrimaryBlue} />
                        <View>
                            <Text style={{ fontSize: 18, fontWeight: '600' }}>Account</Text>
                        </View>
                    </View>
                    <View style={{ borderBottomWidth: 1, borderBottomColor: LightGrey, marginHorizontal: -20 }} />
                    <TouchableOpacity onPress={() => navigation.navigate('Email')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 10 }}>
                        <Mail size={20} color={PrimaryGrey} />
                        <Text>Email</Text>
                    </TouchableOpacity>
                    <View style={{ borderTopWidth: 1, borderTopColor: LightGrey, marginHorizontal: -20 }} />
                    <TouchableOpacity onPress={() => navigation.navigate('Password')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 10 }}>
                        <Lock size={20} color={PrimaryGrey} />
                        <Text>Password</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.container}>
                    <View style={{ flexDirection: 'row', alignItems: 'center',marginVertical: 10, gap: 10 }}>
                        <CreditCard size={20} color={PrimaryBlue} />
                        <View>
                            <Text style={{ fontSize: 18, fontWeight: '600' }}>Financial</Text>
                          
                        </View>
                    </View>
                    <View style={{ borderBottomWidth: 1, borderBottomColor: LightGrey, marginHorizontal: -20 }} />
                    <TouchableOpacity onPress={() => navigation.navigate('PaymentMethods' as never)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 10 }}>
                        <CreditCard size={20} color={PrimaryGrey} />
                        <Text>Payment Methods</Text>
                    </TouchableOpacity>
                    <View style={{ borderTopWidth: 1, borderTopColor: LightGrey, marginHorizontal: -20 }} />
                    <TouchableOpacity onPress={() => navigation.navigate('TransactionHistory' as never)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 10 }}>
                        <Lock size={20} color={PrimaryGrey} />
                        <Text>Transaction History</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.container}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10, gap: 10 }}>
                        <CircleHelp size={20} color={PrimaryBlue} />
                        <View>
                            <Text style={{ fontSize: 18, fontWeight: '600' }}>Help & Support</Text>
                        </View>
                    </View>
                    <View style={{ borderBottomWidth: 1, borderBottomColor: LightGrey, marginHorizontal: -20 }} />
                    <TouchableOpacity onPress={() => navigation.navigate('HelpCenter' as never)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 10 }}>
                        <CircleHelp size={20} color={PrimaryGrey} />
                        <Text>Help Center</Text>
                    </TouchableOpacity>
                    <View style={{ borderTopWidth: 1, borderTopColor: LightGrey, marginHorizontal: -20 }} />
                    <TouchableOpacity onPress={() => navigation.navigate('TermsOfUse')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 10 }}>
                        <FileText size={20} color={PrimaryGrey} />
                        <Text>Terms of Use</Text>
                    </TouchableOpacity>
                    <View style={{ borderTopWidth: 1, borderTopColor: LightGrey, marginHorizontal: -20 }} />
                    <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 10 }}>
                        <Shield size={20} color={PrimaryGrey} />
                        <Text>Privacy Policy</Text>
                    </TouchableOpacity>
                    <View style={{ borderTopWidth: 1, borderTopColor: LightGrey, marginHorizontal: -20 }} />
                    <TouchableOpacity onPress={() => navigation.navigate('About' as never)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 10 }}>
                        <Info size={20} color={PrimaryGrey} />
                        <Text>About</Text>
                    </TouchableOpacity>
                    <View style={{ borderTopWidth: 1, borderTopColor: LightGrey, marginHorizontal: -20 }} />
                    <TouchableOpacity onPress={() => navigation.navigate('ReportIssue')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 10 }}>
                        <MessageSquare size={20} color={PrimaryGrey} />
                        <Text>Report an Issue</Text>
                    </TouchableOpacity>

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