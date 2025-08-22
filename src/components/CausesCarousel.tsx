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
    subHeading: 'Decide your amount once - it splits aross your chosen causes.'
},
{
    image: require('../assets/images/grocery.jpg'),
    heading: 'Give Together',
    subHeading: 'Join CRWDs to give alongside other and see your shared impact.'
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
        backgroundColor: SecondaryBlue, 
        marginTop: 10, 
        padding: 20, 
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
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
                    width: 80, 
                    height: 80, 
                    resizeMode: 'cover',
                    borderRadius: 12,
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
                    color: PrimaryBlue,
                    marginBottom: 8,
                    textAlign: 'left',
                  }}>
                    {item.heading}
                  </Text>
                  <Text style={{ 
                    fontSize: 14, 
                    color: PrimaryGrey,
                    lineHeight: 20,
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
            backgroundColor: TertiaryBlue, 
            borderRadius: 50,

          }}
          activeDotStyle={{ 
            backgroundColor: PrimaryBlue,
          }}
          containerStyle={{ 
            gap: 8, 
            marginTop: 20,
            alignItems: 'center',
          }}
          onPress={onPressPagination}
        />
      </View>
  )
}