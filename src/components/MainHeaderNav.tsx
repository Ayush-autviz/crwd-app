import { View, Text, Image, Dimensions, TouchableOpacity, SafeAreaView } from 'react-native'
import React from 'react'
import { AlignJustify, ChevronLeft, Plus } from 'lucide-react-native'
import { LightGrey, PrimaryGrey } from '../Constants/Colors';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
    Post: undefined;
    Donation: undefined;
    // ... other screens
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MainHeaderNav({show = false,menu=true,post=true}) {
    const navigation = useNavigation<NavigationProp>();
    const screenWidth = Dimensions.get('window').width;
    const imageWidth = screenWidth * 0.25;

    const handlePostPress = () => {
        navigation.navigate('Post');
    };

    const handleMenuPress = () => {
        navigation.dispatch(DrawerActions.openDrawer());
    };
    

    return (
        <SafeAreaView style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, borderBottomWidth: 2, borderBottomColor: LightGrey, }}>
            <View style={{flexDirection: 'row', gap: 20 }}>
            <TouchableOpacity disabled={!show}  onPress={() => navigation.goBack()}>
                    <ChevronLeft color={show? '#000' : '#fff'}/>
                </TouchableOpacity>
                {
                    post &&  <TouchableOpacity>
                    <AlignJustify color="#fff" />
                </TouchableOpacity>
                }

            </View>
            <Image source={require('../assets/logo/logo3.webp')} style={{resizeMode: 'center', width: imageWidth}} />
            <View style={{flexDirection: 'row', gap: 20}}>
                {
                    post && <TouchableOpacity onPress={handlePostPress}>
                    <Plus color="#000" />
                </TouchableOpacity>
                }
                {
                    menu && 
                }
                
                 <TouchableOpacity onPress={handleMenuPress}>
                    <AlignJustify color="#000" />
                </TouchableOpacity>
                
   

            </View>
        </SafeAreaView>
    )
}