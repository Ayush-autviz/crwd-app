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
import { PrimaryBlue, PrimaryGrey } from '../../Constants/Colors';

const images = [
  require('../../assets/ngo/aspca.jpg'),
  require('../../assets/ngo/cancerSociety.png'),
  require('../../assets/ngo/girlCode.png'),
  require('../../assets/ngo/redCross.png'),
  require('../../assets/ngo/makeAwish.jpg'),
  require('../../assets/ngo/paws.jpeg'),
  require('../../assets/ngo/CRI.jpg'),
  require('../../assets/ngo/catAllies.jpeg'),
  require('../../assets/ngo/cureSearch.png'),
];

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

  const IMAGE_SIZE = 80;
  const IMAGE_MARGIN = 15;
  const ITEM_WIDTH = IMAGE_SIZE + IMAGE_MARGIN * 2;

  const rowTop = images;
  const rowBottom = shuffleArray(images);

  const rowWidth = rowTop.length * ITEM_WIDTH;

  const startLoop = (animatedValue, duration) => {
    animatedValue.setValue(0);
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: -rowWidth,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  useEffect(() => {
    startLoop(scrollXTop, 15000);
    startLoop(scrollXBottom, 20000);
  }, []);

  const renderRow = (rowImages, animatedValue, verticalOffsetPattern) => (
    <View style={{ height: 140, overflow: 'hidden', marginHorizontal: -20 }}>
      <Animated.View
        style={{
          flexDirection: 'row',
          transform: [{ translateX: animatedValue }],
        }}
      >
        {/* first copy */}
        {rowImages.map((img, index) => {
          const verticalOffset =
            index % 2 === 0 ? verticalOffsetPattern[0] : verticalOffsetPattern[1];
          return (
            <View
              key={'first_' + index}
              style={{
                marginHorizontal: IMAGE_MARGIN,
                transform: [{ translateY: verticalOffset }],
              }}
            >
              <Image
                source={img}
                style={{
                  width: IMAGE_SIZE,
                  height: IMAGE_SIZE,
                  borderRadius: 75,
                }}
                resizeMode="cover"
              />
            </View>
          );
        })}
        {/* second copy */}
        {rowImages.map((img, index) => {
          const verticalOffset =
            index % 2 === 0 ? verticalOffsetPattern[0] : verticalOffsetPattern[1];
          return (
            <View
              key={'second_' + index}
              style={{
                marginHorizontal: IMAGE_MARGIN,
                transform: [{ translateY: verticalOffset }],
              }}
            >
              <Image
                source={img}
                style={{
                  width: IMAGE_SIZE,
                  height: IMAGE_SIZE,
                  borderRadius: 75,
                }}
                resizeMode="cover"
              />
            </View>
          );
        })}
      </Animated.View>
    </View>
  );

  return (
    <View style={{ flex: 1, paddingTop: 60, justifyContent: 'space-between' }}>
      <View>
        {/* Logo */}
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

        {/* Heading */}
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
          What is CRWD
        </Text>

        {/* Subtitle */}
        <Text
          style={{
            fontSize: 16,
            color: PrimaryGrey,
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 50,
          }}
        >
          CRWD makes giving simple, flexible and collective.
        </Text>

        {/* Top row */}
        {renderRow(rowTop, scrollXTop, [0, 20])}

        {/* Bottom row */}
        {renderRow(rowBottom, scrollXBottom, [25, 5])}
      </View>

      {/* Buttons */}
      <View style={{ marginBottom: 30 }}>
        <TouchableOpacity
          style={{
            backgroundColor: PrimaryBlue,
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
