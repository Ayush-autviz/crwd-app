import { View, Text, Image, TouchableOpacity } from 'react-native'
import React from 'react'


export default function First() {
  return (
    <View style={{flex: 1}}>

            <Image source={require('../../assets/logo/logo3.webp')} style={{width: '50%', height: '7%', alignSelf: 'center', marginTop: 10, borderRadius: 30}}  resizeMode='contain' />
        
        
      <Text style={{fontSize: 18,textAlign: 'center', fontWeight: '600', marginTop: 10}}>Whats is CRWD</Text>
      <Text style={{fontSize: 14, color: 'gray', marginTop: 10, textAlign: 'center', fontWeight: '500'}}>CRWD makes giving simple, flexible and collective.</Text>
      {/* <Text style={{fontSize: 12, color: 'black', fontWeight: '500', marginTop: 10,textAlign: 'center'}}>FIRST YOU CARE AND THEN YOU ACT</Text> */}


      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Image source={require('../../assets/ngo/aspca.jpg')} style={{width: '50%', height: '7%', alignSelf: 'center', marginTop: 10, borderRadius: 30}}  resizeMode='contain' />
        <Image source={require('../../assets/ngo/cancerSociety.png')} style={{width: '50%', height: '7%', alignSelf: 'center', marginTop: 10, borderRadius: 30}}  resizeMode='contain' />
        <Image source={require('../../assets/ngo/girlCode.png')} style={{width: '50%', height: '7%', alignSelf: 'center', marginTop: 10, borderRadius: 30}}  resizeMode='contain' />
        <Image source={require('../../assets/ngo/redCross.png')} style={{width: '50%', height: '7%', alignSelf: 'center', marginTop: 10, borderRadius: 30}}  resizeMode='contain' />
        <Image source={require('../../assets/ngo/makeAwish.jpg')} style={{width: '50%', height: '7%', alignSelf: 'center', marginTop: 10, borderRadius: 30}}  resizeMode='contain' />
        <Image source={require('../../assets/ngo/paws.jpeg')} style={{width: '50%', height: '7%', alignSelf: 'center', marginTop: 10, borderRadius: 30}}  resizeMode='contain' />
      </View>

      <TouchableOpacity style={{backgroundColor: 'black', padding: 10, borderRadius: 5, marginTop: 20}}>
        <Text style={{color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center'}}>Join Now</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{backgroundColor: 'white', padding: 10, borderRadius: 5, marginTop:  10}}>
        <Text style={{color: 'black', fontSize: 16, fontWeight: 'bold', textAlign: 'center'}}>Login</Text>
      </TouchableOpacity>
    </View>
  )
}