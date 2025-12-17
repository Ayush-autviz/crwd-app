import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Search, Menu, ChevronRight, LogIn, Users, CheckSquare, Settings, X } from 'lucide-react-native';
import { PrimaryBlue } from '../Constants/Colors';
import Slider from '@react-native-community/slider';
import AutomaticImpact from './guest/AutomaticImpact';
import PopularCollectives from './guest/PopularCollectives';
import LearnAndGetInspired from './guest/LearnAndGetInspired';
import CommunityTestimonials from './guest/CommunityTestimonials';
import StartMakingDifference from './guest/StartMakingDifference';
import CommentsBottomSheet from './post/CommentsBottomSheet';

const { width: screenWidth } = Dimensions.get('window');

// Define two sets of causes with their styling
const causeSets = [
  [
    { name: 'refugees', bgColor: '#94a3b8' },
    { name: 'sanctuaries', bgColor: '#c4b5fd' },
    { name: 'veteran housing', bgColor: '#86efac' },
    { name: 'pediatric care', bgColor: '#fdba74' },
  ],
  [
    { name: 'food banks', bgColor: '#94a3b8' },
    { name: 'animal shelters', bgColor: '#c4b5fd' },
    { name: 'homeless shelters', bgColor: '#86efac' },
    { name: 'cancer research', bgColor: '#fdba74' },
  ],
  [
    { name: 'disaster relief', bgColor: '#94a3b8' },
    { name: 'wildlife rescue', bgColor: '#c4b5fd' },
    { name: 'affordable housing', bgColor: '#86efac' },
    { name: 'mental health', bgColor: '#fdba74' },
  ],
];

// Simple NewLogo component
const NewLogo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeStyles = {
    sm: { grid: 24, dot: 6, text: 16 },
    md: { grid: 32, dot: 8, text: 20 },
    lg: { grid: 48, dot: 12, text: 28 },
  };

  const currentSize = sizeStyles[size];

  const dotSize = currentSize.dot;
  const gridGap = 4;
  const gridSize = currentSize.grid;

  return (
    <View style={styles.logoContainer}>
      <View style={[styles.logoGrid, { width: gridSize, height: gridSize }]}>
        <View
          style={[
            styles.logoDot,
            {
              width: dotSize,
              height: dotSize,
              backgroundColor: '#0000FF',
              position: 'absolute',
              top: 0,
              left: 0,
            },
          ]}
        />
        <View
          style={[
            styles.logoDot,
            {
              width: dotSize,
              height: dotSize,
              backgroundColor: '#FF3366',
              position: 'absolute',
              top: 0,
              right: 0,
            },
          ]}
        />
        <View
          style={[
            styles.logoDot,
            {
              width: dotSize,
              height: dotSize,
              backgroundColor: '#ADFF2F',
              position: 'absolute',
              bottom: 0,
              left: 0,
            },
          ]}
        />
        <View
          style={[
            styles.logoDot,
            {
              width: dotSize,
              height: dotSize,
              backgroundColor: '#A855F7',
              position: 'absolute',
              bottom: 0,
              right: 0,
            },
          ]}
        />
      </View>
      <Text style={[styles.logoText, { fontSize: currentSize.text }]}>crwd</Text>
    </View>
  );
};

export default function GuestHome() {
  const navigation = useNavigation();
  const [donationAmount, setDonationAmount] = useState(5);
  const [currentCauseSet, setCurrentCauseSet] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showAppBanner, setShowAppBanner] = useState(true);
  const [showCommentsSheet, setShowCommentsSheet] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  // Rotate cause sets every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCauseSet((prev) => (prev + 1) % causeSets.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Handle bottom sheet menu animations
  useEffect(() => {
    if (menuOpen) {
      setIsVisible(true);
      setIsAnimating(false);
      setTimeout(() => setIsAnimating(true), 20);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (isVisible) {
      setIsAnimating(false);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setIsVisible(false));
    }
  }, [menuOpen, isVisible]);

  const handleCloseMenu = () => {
    setMenuOpen(false);
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.navigate('Waitlist' as never)}>
          <Image source={require('../assets/newLogo/FullLogo.png')} style={{ resizeMode: 'contain', width: 100, height: 50 }} />
        </TouchableOpacity>

        {/* Right side buttons */}
        <View style={styles.navbarRight}>
          <TouchableOpacity
            onPress={() => navigation.navigate('NewSearch' as never)}
            style={styles.navbarButton}
          >
            <Search size={24} color="#374151" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login' as never)}
            style={styles.signInButton}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMenuOpen(!menuOpen)}
            style={styles.menuButton}
          >
            <Menu size={30} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            Stop Wishing You Made a Difference.{' '}
            <Text style={styles.heroTitleHighlight}>Start Being Someone Who Does.</Text>
          </Text>

          <Text style={styles.heroDescription}>
            What if you could support every cause you care about automatically, affordably, and powerfully?
          </Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('OnBoard' as never)}
            style={styles.getStartedButton}
          >
            <Text style={styles.getStartedButtonText}>Get started</Text>
          </TouchableOpacity>
        </View>

        {/* See the Magic in Action Section */}
        <View style={styles.magicSection}>
          <Text style={styles.magicTitle}>
            See the <Text style={styles.magicTitleHighlight}>Magic</Text> in Action
          </Text>
          <Text style={styles.magicDescription}>
            Pick your causes. Give once. Multiply your impact.
          </Text>

          {/* Demo Card */}
          <View style={styles.demoCard}>
            <Text style={styles.demoCardText}>
              You can give{' '}
              <Text style={styles.demoCardAmount}>${donationAmount}</Text>/month to
            </Text>

            {/* Slider */}
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={5}
                maximumValue={100}
                step={5}
                value={donationAmount}
                onValueChange={(value) => setDonationAmount(Math.round(value / 5) * 5)}
                minimumTrackTintColor="#1600ff"
                maximumTrackTintColor="#E5E7EB"
                thumbTintColor="#1600ff"
              />
            </View>

            {/* Cause Buttons */}
            <View style={styles.causeButtonsContainer}>
              {causeSets[currentCauseSet].map((cause, index) => (
                <View
                  key={`${cause.name}-${currentCauseSet}-${index}`}
                  style={[styles.causeButton, { backgroundColor: cause.bgColor }]}
                >
                  <Text style={styles.causeButtonText}>{cause.name}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.yearlyImpact}>
              = <Text style={styles.yearlyImpactAmount}>${donationAmount * 12}</Text> /year of impact
            </Text>

            {/* Distribution Bar */}
            <View style={styles.distributionBar}>
              <View style={[styles.distributionSegment, { backgroundColor: '#EC4899' }]} />
              <View style={[styles.distributionSegment, { backgroundColor: '#F59E0B' }]} />
              <View style={[styles.distributionSegment, { backgroundColor: '#10B981' }]} />
              <View style={[styles.distributionSegment, { backgroundColor: '#1600ff' }]} />
            </View>

            <Text style={styles.oneGiftText}>One gift. Multiple causes.</Text>

            <TouchableOpacity
              onPress={() => navigation.navigate('Waitlist' as never)}
              style={styles.startSupportingButton}
            >
              <Text style={styles.startSupportingButtonText}>
                Start Supporting
              </Text>
              <ChevronRight size={20} color="white" />
            </TouchableOpacity>
            <Text style={styles.everyDollarText}>Every dollar makes a difference</Text>
          </View>
        </View>

        {/* Automatic Impact Section */}
        <AutomaticImpact />

        {/* Popular Collectives Section */}
        <PopularCollectives />

        {/* Learn & Get Inspired Section */}
        <LearnAndGetInspired />

        {/* Community Testimonials Section */}
        <CommunityTestimonials />

        {/* Start Making a Difference Section */}
        <StartMakingDifference />

      </ScrollView>

      {/* Fixed iOS App Banner */}
      {showAppBanner && (
        <View style={styles.appBanner}>
          <View style={styles.appBannerContent}>
            <NewLogo size="sm" />
            <View style={styles.appBannerTextContainer}>
              <Text style={styles.appBannerTitle}>Get the full experience on iOS</Text>
              <Text style={styles.appBannerSubtitle}>Easily manage all of your giving</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowAppBanner(false)}
              style={styles.appBannerClose}
            >
              <X size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bottom Sheet Menu */}
      {isVisible && (
        <Modal
          transparent
          visible={isVisible}
          animationType="none"
          onRequestClose={handleCloseMenu}
        >
          <TouchableWithoutFeedback onPress={handleCloseMenu}>
            <Animated.View
              style={[
                styles.menuOverlay,
                {
                  opacity: opacityAnim,
                },
              ]}
            >
              <TouchableWithoutFeedback>
                <Animated.View
                  style={[
                    styles.menuSheet,
                    {
                      transform: [{ translateY }],
                    },
                  ]}
                >
                  {/* Scroll indicator */}
                  <View style={styles.menuScrollIndicator}>
                    <View style={styles.menuScrollBar} />
                  </View>

                  {/* Menu Items */}
                  <View style={styles.menuItems}>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        navigation.navigate('OnBoard' as never);
                        handleCloseMenu();
                      }}
                    >
                      <LogIn size={20} color="#1600ff" />
                      <Text style={styles.menuItemText}>Log In/Get Started</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        navigation.navigate('Circles' as never);
                        handleCloseMenu();
                      }}
                    >
                      <Users size={20} color="#1600ff" />
                      <Text style={styles.menuItemText}>Collectives</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        navigation.navigate('Donation' as never);
                        handleCloseMenu();
                      }}
                    >
                      <CheckSquare size={20} color="#1600ff" />
                      <Text style={styles.menuItemText}>Donation Box</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Separator */}
                  <View style={styles.menuSeparator} />

                  {/* Learn More */}
                  <View style={styles.menuItems}>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        navigation.navigate('Waitlist' as never);
                        handleCloseMenu();
                      }}
                    >
                      <Settings size={20} color="#1600ff" />
                      <Text style={styles.menuItemText}>Learn More</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              </TouchableWithoutFeedback>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* Comments Bottom Sheet */}
      {selectedPost && (
        <CommentsBottomSheet
          isOpen={showCommentsSheet}
          onClose={() => {
            setShowCommentsSheet(false);
            setSelectedPost(null);
          }}
          post={selectedPost}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingBottom: 55,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoGrid: {
    position: 'relative',
  },
  logoDot: {
    borderRadius: 9999,
  },
  logoText: {
    fontWeight: 'bold',
    color: '#000000',
    textTransform: 'lowercase',
  },
  navbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navbarButton: {
    padding: 8,
    borderRadius: 20,
  },
  signInButton: {
    backgroundColor: '#FF3366',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  signInButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  menuButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  heroSection: {
    backgroundColor: 'white',
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
  },
  heroTitleHighlight: {
    color: '#1600ff',
  },
  heroDescription: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 600,
    lineHeight: 28,
  },
  getStartedButton: {
    backgroundColor: '#1600ff',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 8,
  },
  getStartedButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  magicSection: {
    backgroundColor: '#F1F6FF',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  magicTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  magicTitleHighlight: {
    color: '#1600ff',
  },
  magicDescription: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  demoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    maxWidth: screenWidth * 0.9,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  demoCardText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  demoCardAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1600ff',
  },
  sliderContainer: {
    marginBottom: 24,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  causeButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 16,
  },
  causeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  causeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  yearlyImpact: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1600ff',
    textAlign: 'center',
    marginBottom: 16,
  },
  yearlyImpactAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
  distributionBar: {
    flexDirection: 'row',
    height: 16,
    borderRadius: 9999,
    overflow: 'hidden',
    marginBottom: 24,
  },
  distributionSegment: {
    flex: 1,
  },
  oneGiftText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 24,
  },
  startSupportingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1600ff',
    paddingVertical: 14,
    borderRadius: 9999,
    marginBottom: 16,
  },
  startSupportingButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  everyDollarText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  mainMessageSection: {
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  mainMessageTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 26,
    color: '#111827',
  },
  mainMessageHighlight: {
    color: PrimaryBlue,
    fontStyle: 'italic',
  },
  startDonationButton: {
    backgroundColor: PrimaryBlue,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  startDonationButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  appBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  appBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  appBannerTextContainer: {
    flex: 1,
    gap: 4,
  },
  appBannerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  appBannerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  appBannerClose: {
    padding: 4,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  menuScrollIndicator: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  menuScrollBar: {
    width: 48,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
  },
  menuItems: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  menuItemText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  menuSeparator: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginHorizontal: 24,
  },
});

