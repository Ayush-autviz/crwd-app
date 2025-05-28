// 


import { View, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import MainHeaderNav from '../MainHeaderNav'
import { PrimaryBlue, PrimaryGrey, SecondaryGrey } from '../../Constants/Colors'
import { Eye, EyeOff, Lock } from 'lucide-react-native'

export default function Password() {
  const [currentVisible, setCurrentVisible] = useState(false)
  const [newVisible, setNewVisible] = useState(false)
  const [confirmVisible, setConfirmVisible] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  return (
    <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }}>
      <MainHeaderNav show={true} />
      <ScrollView style={{ paddingHorizontal: 20, marginTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <Lock size={20} color={PrimaryBlue} />
          <Text style={{ fontSize: 20, fontWeight: '600' }}>Change Password</Text>
        </View>
        <Text style={{ fontSize: 14, color: PrimaryGrey, marginBottom: 10 }}>
          Update your password to keep your account secure. Make sure to use a strong password that you don't use elsewhere.
        </Text>
        
        <Text style={{ fontSize: 14, marginVertical: 10 }}>Current Password</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderColor: SecondaryGrey, borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 20 }}>
          <TextInput 
            style={{ flex: 1, color: 'black' }} 
            secureTextEntry={!currentVisible} 
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
          <TouchableOpacity onPress={() => setCurrentVisible(!currentVisible)}>
            {currentVisible ? <Eye size={20} color={PrimaryGrey}/> : <EyeOff size={20} color={PrimaryGrey} />}
          </TouchableOpacity>
        </View>
        
        <Text style={{ fontSize: 14, marginBottom: 10 }}>New Password</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderColor: SecondaryGrey, borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 20 }}>
          <TextInput 
            style={{ flex: 1, color: 'black' }} 
            secureTextEntry={!newVisible} 
            // value={newPassword}
            // onChangeText={setNewPassword}
          />
          <TouchableOpacity onPress={() => setNewVisible(!newVisible)}>
            {newVisible ? <Eye size={20} color={PrimaryGrey}/> : <EyeOff size={20} color={PrimaryGrey} />}
          </TouchableOpacity>
        </View>
        
        <Text style={{ fontSize: 14, marginBottom: 10 }}>Confirm New Password</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderColor: SecondaryGrey, borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 20 }}>
          <TextInput 
            style={{ flex: 1, color: 'black' }} 
            secureTextEntry={!confirmVisible} 
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity onPress={() => setConfirmVisible(!confirmVisible)}>
            {confirmVisible ? <Eye size={20} color={PrimaryGrey}/> : <EyeOff size={20} color={PrimaryGrey} />}
          </TouchableOpacity>
        </View>
        
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', }}>
          <TouchableOpacity style={{ backgroundColor: PrimaryBlue, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10,}}>
            <Text style={{ color: 'white', textAlign: 'center' }}>Update Password</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10, borderColor: SecondaryGrey, borderWidth: 1 }}>
            <Text style={{ textAlign: 'center' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}