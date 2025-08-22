import * as React from "react";
import { Dimensions, Image, Text, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import Carousel, {
  ICarouselInstance,
  Pagination,
} from "react-native-reanimated-carousel";
import { LightGrey, PrimaryBlue, SecondaryBlue, TertiaryBlue, PrimaryGrey } from "../Constants/Colors";
 
const data = [{
    image: require('../assets/images/grocery.jpg'),
    heading: 'Pick your Causes',
    subHeading: 'Search or explore non-profits by category or local CRWDS.'
},
{
    image: require('../assets/images/grocery.jpg'),
    heading: 'Set One Donation',
    subHeading: 'Decide your amount once - it splits across your chosen causes.'
},
{
    image: require('../assets/images/grocery.jpg'),
    heading: 'Give Together',
    subHeading: 'Join CRWDs to give alongside others and see your shared impact.'
}];

const width = Dimensions.get("window").width;

export default function CausesCarousel() {
    const ref = React.useRef<ICarouselInstance>(null);
    const progress = useSharedValue<number>(0);
    
    const onPressPagination = (index: number) => {
      ref.current?.scrollTo({
        /**
         * Calculate the difference between the current index and the target index
         * to ensure that the carousel scrolls to the nearest index
         */
        count: index - progress.value,
        animated: true,
      });
    };
   
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: '#f8f9fa', 
        marginTop: 10, 
        padding: 20, 
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#e9ecef'
      }}>
        <Carousel
          ref={ref}
          width={width - 60}
          autoPlay
          autoPlayInterval={3000}
          height={120}
          data={data}
          onProgressChange={progress}
          renderItem={({item, index }) => (
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View style={{
                flexDirection: "row",
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                gap: 20,  
              }}>
                <Image 
                  source={item.image} 
                  style={{ 
                    width: 96, 
                    height: 96, 
                    resizeMode: 'cover',
                    borderRadius: 12,
                    shadowColor: "#000",
                    shadowOffset: {
                      width: 0,
                      height: 2,
                    },
                    shadowOpacity: 0.1,
                    shadowRadius: 3.84,
                    
                  }} 
                />
                <View style={{
                  flex: 1,
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                }}>
                  <Text style={{ 
                    fontSize: 22, 
                    fontWeight: '800',
                    color: '#6c757d',
                    marginBottom: 8,
                    textAlign: 'left',
                    lineHeight: 28,
                  }}>
                    {item.heading}
                  </Text>
                  <Text style={{ 
                    fontSize: 16, 
                    color: '#6c757d',
                    lineHeight: 22,
                    textAlign: 'left',
                  }}>
                    {item.subHeading}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
   
        <Pagination.Basic
          progress={progress}
          data={data}
          dotStyle={{ 
            backgroundColor: '#d1d5db', 
            borderRadius: 50,
            width: 8,
            height: 8,
          }}
          activeDotStyle={{ 
            backgroundColor: PrimaryGrey,
          }}
          containerStyle={{ 
            gap: 8, 
            marginTop: 24,
            alignItems: 'center',
            alignSelf: 'flex-end',
          }}
          onPress={onPressPagination}
        />
      </View>
  )
}