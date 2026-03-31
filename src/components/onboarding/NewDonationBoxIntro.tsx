import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Heart } from 'lucide-react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming, withSequence } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Custom staggered animation component
const SlideInItem = ({ children, delay = 0, index = 0 }: { children: React.ReactNode, delay?: number, index?: number }) => {
  const finalDelay = delay || (index * 150);

  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-40);
  const translateY = useSharedValue(-10);

  useEffect(() => {
    // 0% to 50% state: translateX -40 -> 0, opacity 0 -> 1
    opacity.value = withDelay(finalDelay, withTiming(1, { duration: 400 }));

    translateX.value = withDelay(
      finalDelay,
      withTiming(0, { duration: 400 })
    );

    // 50% to 100% state: translateY -10 -> 0
    translateY.value = withDelay(
      finalDelay + 400, // Start after Phase 1
      withSpring(0, { damping: 15, stiffness: 60 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value }
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
};

export default function NewDonationBoxIntro() {
  const navigation = useNavigation();
  const route = useRoute();
  const redirectTo = (route.params as any)?.redirectTo || 'DrawerNav';

  const handleContinue = () => {
    (navigation as any).navigate('AddNonprofits', {
      ...route.params,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          {/* Progress Indicator - Step 2 of 5 */}
          <SlideInItem index={0}>
            <View style={styles.progressContainer}>
              <View style={[styles.progressStep, styles.progressActive]} />
              <View style={[styles.progressStep, styles.progressActive]} />
              <View style={styles.progressStep} />
              <View style={styles.progressStep} />
              <View style={styles.progressStep} />
            </View>
          </SlideInItem>

          {/* Icon */}
          <SlideInItem index={1}>
            <View style={styles.iconContainer}>
              <View style={styles.heartWrapper}>
                <Heart size={32} color="#FFFFFF" />
              </View>
            </View>
          </SlideInItem>

          {/* Text Content */}
          <View style={styles.textContent}>
            <SlideInItem index={2}>
              <Text style={styles.subtitle}>
                Meet your Donation Box.
              </Text>
            </SlideInItem>

            <SlideInItem index={3}>
              <Text style={styles.title}>
                One amount. Split across every nonprofit you support.
              </Text>
            </SlideInItem>

            <SlideInItem index={4}>
              <Text style={styles.description}>
                Give to every nonprofit you care about. Add new ones when something moves you. Your amount never changes.
              </Text>
            </SlideInItem>

            <SlideInItem index={5}>
              <Text style={styles.boldDescription}>
                It just reaches further.
              </Text>
            </SlideInItem>
          </View>

          {/* Donation Box Preview Card */}
          <SlideInItem index={6}>
            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>YOUR DONATION BOX</Text>

              <View style={styles.badgeRow}>
                {/* Badge 1 */}
                <SlideInItem delay={1200}>
                  <View style={styles.badgeColumn}>
                    <Image source={{ uri: 'https://crwdfund.org/ngo/aspca.jpg' }} style={styles.ngoImage} />
                    <View style={styles.percentBadge}>
                      <Text style={styles.percentText}>33%</Text>
                    </View>
                  </View>
                </SlideInItem>

                {/* Badge 2 */}
                <SlideInItem delay={1400}>
                  <View style={styles.badgeColumn}>
                    <Image source={{ uri: 'https://crwdfund.org/ngo/CRI.jpg' }} style={styles.ngoImage} />
                    <View style={styles.percentBadge}>
                      <Text style={styles.percentText}>33%</Text>
                    </View>
                  </View>
                </SlideInItem>

                {/* Badge 3 */}
                <SlideInItem delay={1600}>
                  <View style={styles.badgeColumn}>
                    <Image source={{ uri: 'https://crwdfund.org/ngo/girlCode.png' }} style={styles.ngoImage} />
                    <View style={styles.percentBadge}>
                      <Text style={styles.percentText}>33%</Text>
                    </View>
                  </View>
                </SlideInItem>

                {/* Add Badge */}
                <SlideInItem delay={1800}>
                  <View style={styles.badgeColumn}>
                    <View style={styles.addNgoPlaceholder}>
                      <Text style={styles.addPlus}>+</Text>
                    </View>
                    <View style={styles.amountBadge}>
                      <Text style={styles.amountText}>$30/mo</Text>
                    </View>
                  </View>
                </SlideInItem>
              </View>
            </View>
          </SlideInItem>

        </View>
      </ScrollView>

      {/* Sticky Footer Action Button */}
      <SlideInItem index={8}>
        <View style={styles.footer}>
          <TouchableOpacity style={styles.button} onPress={handleContinue} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </SlideInItem>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 40,
  },
  progressStep: {
    height: 4,
    width: (width - 48 - 32) / 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressActive: {
    backgroundColor: '#1600ff',
  },
  iconContainer: {
    marginBottom: 24,
  },
  heartWrapper: {
    width: 64,
    height: 64,
    backgroundColor: '#1600ff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: {
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1600ff',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 34,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    color: '#4B5563',
    // lineHeight: 26,
    marginBottom: 12,
    fontWeight: '500',
  },
  boldDescription: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '700',
  },
  previewCard: {
    backgroundColor: '#F9F9F5',
    borderRadius: 20,
    padding: 20,
    marginBottom: 40,
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9CA3AF',
    letterSpacing: 2,
    marginBottom: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 15,
  },
  badgeColumn: {
    alignItems: 'center',
    gap: 8,
  },
  ngoImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  percentBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1600ff',
  },
  addNgoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPlus: {
    fontSize: 24,
    color: '#9CA3AF',
    fontWeight: '300',
  },
  amountBadge: {
    paddingVertical: 4,
  },
  amountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  footer: {
    padding: 24,
    // borderTopWidth: 1,
    // borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  button: {
    backgroundColor: '#1600ff',
    height: 45,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
