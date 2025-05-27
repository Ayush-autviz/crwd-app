import { View, Text, Image, Dimensions, TouchableOpacity } from 'react-native'
import React from 'react'
import { AlignJustify, Archive, ChevronLeft } from 'lucide-react-native'
import { LightGrey, PrimaryGrey } from '../Constants/Colors';
import { useNavigation, DrawerActions } from '@react-navigation/native';

export default function MainHeaderNav({show = false}) {
    const navigation = useNavigation();
    const screenWidth = Dimensions.get('window').width;
    const imageWidth = screenWidth * 0.25;

    const handleDonationPress = () => {
        navigation.navigate('Donation' as never);
    };

    const handleMenuPress = () => {
        navigation.dispatch(DrawerActions.openDrawer());
    };

    console.log(show);
    

    return (
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, borderBottomWidth: 2, borderBottomColor: LightGrey, }}>
            <View style={{flexDirection: 'row', gap: 20, }}>
            <TouchableOpacity disabled={!show}  onPress={() => navigation.goBack()}>
                    <ChevronLeft color={show? '#000' : '#fff'}/>
                </TouchableOpacity> 
                <TouchableOpacity>
                    <AlignJustify color="#fff" />
                </TouchableOpacity>
            </View>
            <Image source={require('../assets/logo/logo3.webp')} style={{resizeMode: 'center', width: imageWidth}} />
            <View style={{flexDirection: 'row', gap: 20}}>
                <TouchableOpacity onPress={handleDonationPress}>
                    <Archive color="#000" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleMenuPress}>
                    <AlignJustify color="#000" />
                </TouchableOpacity>
            </View>
        </View>
    )
}