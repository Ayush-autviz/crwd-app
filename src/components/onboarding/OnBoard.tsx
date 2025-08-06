import {
    View,
    Text,
    Image,
    TouchableOpacity,
    Animated,
    Easing,
    Dimensions,
  } from 'react-native';
  import React, { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { PrimaryGrey } from '../../Constants/Colors';
  
  const images = [
    require('../../assets/ngo/aspca.jpg'),
    require('../../assets/ngo/cancerSociety.png'),
    require('../../assets/ngo/girlCode.png'),
    require('../../assets/ngo/redCross.png'),
    require('../../assets/ngo/makeAwish.jpg'),
    require('../../assets/ngo/paws.jpeg'),
  ];
  
  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  
  function shuffleArray(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  
  export default function OnBoard() {
    const scrollXTop = useRef(new Animated.Value(0)).current;
    const scrollXBottom = useRef(new Animated.Value(0)).current;
    const navigation = useNavigation();
  
    useEffect(() => {
      const animateTop = Animated.loop(
        Animated.timing(scrollXTop, {
          toValue: -SCREEN_WIDTH,
          duration: 15000, // slower animation
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
  
      const animateBottom = Animated.loop(
        Animated.timing(scrollXBottom, {
          toValue: -SCREEN_WIDTH,
          duration: 20000, // even slower
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
  
      animateTop.start();
      animateBottom.start();
  
      return () => {
        animateTop.stop();
        animateBottom.stop();
      };
    }, []);
  
    const repeatedImagesTop = [...images, ...images, ...images];
    const repeatedImagesBottom = [...shuffleArray(images), ...shuffleArray(images), ...shuffleArray(images)];
  
    return (
      <View
        style={{
          flex: 1,
          paddingTop: 60,
        //   paddingHorizontal: 10,
          justifyContent: 'space-between',
        }}
      >
        <View>
          <Image
            source={require('../../assets/logo/CRWD.png')}
            style={{
              width: '50%',
              height: 60,
              alignSelf: 'center',
              borderRadius: 30,
            }}
            resizeMode="contain"
          />
  
          <Text
            style={{
              fontSize: 28,
              fontWeight: '700',
              color: '#111827',
              marginBottom: 12,
              textAlign: 'center',marginTop: 20 
            }}
          >
            What is CRWD
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: PrimaryGrey,
              textAlign: 'center',
              lineHeight: 24,
              marginBottom : 20,
            }}
          >
            CRWD makes giving simple, flexible and collective.
          </Text>
  
          {/* <Text
            style={{
              fontSize: 14,
              color: 'gray',
              marginTop: 10,
              textAlign: 'center',
              fontWeight: '500',
            }}
          >
            First you care then you act
          </Text> */}
  
          {/* TOP ROW */}
          <View
            style={{
              height: 160,
              // marginTop: 20,
              overflow: 'hidden',
              justifyContent: 'center',
              marginHorizontal: -20
            }}
          >
            <Animated.View
              style={{
                flexDirection: 'row',
                transform: [{ translateX: scrollXTop }],
              }}
            >
              {repeatedImagesTop.map((img, index) => {
                const verticalOffset = index % 2 === 0 ? 0 : 20;
                return (
                  <View
                    key={'top_' + index}
                    style={{
                      marginHorizontal: 15,
                      transform: [{ translateY: verticalOffset }],
                    }}
                  >
                    <Image
                      source={img}
                      style={{
                        width: 110,
                        height: 110,
                        borderRadius: 75,
                      }}
                      resizeMode="cover"
                    />
                  </View>
                );
              })}
            </Animated.View>
          </View>
  
          {/* BOTTOM ROW */}
          <View
            style={{
              height: 160,
            //   marginTop: 10,
              overflow: 'hidden',
              justifyContent: 'center',
              marginHorizontal: -20
            }}
          >
            <Animated.View
              style={{
                flexDirection: 'row',
                transform: [{ translateX: scrollXBottom }],
              }}
            >
              {repeatedImagesBottom.map((img, index) => {
                const verticalOffset = index % 2 === 0 ? 25 : 5; // different pattern
                return (
                  <View
                    key={'bottom_' + index}
                    style={{
                      marginHorizontal: 15,
                      transform: [{ translateY: verticalOffset }],
                    }}
                  >
                    <Image
                      source={img}
                      style={{
                        width: 110,
                        height: 110,
                        borderRadius: 75,
                      }}
                      resizeMode="cover"
                    />
                  </View>
                );
              })}
            </Animated.View>
          </View>
        </View>
  
        <View style={{ marginBottom: 30 }}>
          <TouchableOpacity
            style={{
              backgroundColor: 'black',
              padding: 14,
              borderRadius: 12,
            }}
            onPress={() => navigation.navigate('ClaimProfile')}
          >
            <Text
              style={{
                color: 'white',
                fontSize: 16,
                fontWeight: 'bold',
                textAlign: 'center',
              }}
            >
              Join Now
            </Text>
          </TouchableOpacity>
  
          <TouchableOpacity
            style={{
              backgroundColor: 'white',
              padding: 14,
              borderRadius: 12,
              marginTop: 10,
              borderWidth: 1,
              borderColor: 'black',
            }}
            onPress={() => navigation.navigate('Login')}
          >
            <Text
              style={{
                color: 'black',
                fontSize: 16,
                fontWeight: 'bold',
                textAlign: 'center',
              }}
            >
              Login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  