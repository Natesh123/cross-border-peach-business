import React, { useCallback, useMemo, useEffect } from "react";
import { Dimensions, Text, useWindowDimensions, View, ViewToken, TouchableOpacity, Image, StyleSheet, Platform } from "react-native";
import AppStatusBar from "../../components/AppStatusBar";
import { FONTS, SIZES } from "../../constants/Assets";
import { Navigation } from "../../../types";
import Animated, {
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolate,
  withSpring,
  FadeIn,
  FadeInDown,
  ZoomIn,
} from 'react-native-reanimated';
import ListItem from "./components/listItem";
import PaginationElement from "./components/paginationElement";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from 'expo-linear-gradient';
import Vector from "app/assets/vectors";
import { RFValue } from "react-native-responsive-fontsize";

const pages = [
  {
    text: 'Fast and Reliable',
    description: 'Send money quickly and safely to your family and friends.',
    image: require('../../assets/logos/cb_logo_new.png'),
    eyebrow: 'EASY',
    icon: 'lightning-bolt'
  },
  {
    text: 'Global Transfers',
    description: 'Send money to over 100 countries with the best exchange rates.',
    image: require('../../assets/logos/cb_logo_new.png'),
    eyebrow: 'WORLDWIDE',
    icon: 'earth'
  },
  {
    text: 'Safe and Secure',
    description: 'Your money is always protected with our advanced security.',
    image: require('../../assets/logos/cb_logo_new.png'),
    eyebrow: 'SECURE',
    icon: 'shield-check'
  },
];

type PageData = typeof pages[0];

type Props = {
  navigation: Navigation;
};

const Onboarding = ({ navigation }: Props) => {
  const { width, height: screenHeight } = useWindowDimensions();
  const x = useSharedValue(0);
  const flatListIndex = useSharedValue(0);
  const flatListRef = useAnimatedRef<Animated.FlatList<PageData>>();

  const completeOnboarding = async (nextRoute: "Login" | "Signup") => {
    try {
      await AsyncStorage.setItem("hasOnboarded", "true");
      navigation.replace(nextRoute);
    } catch (error) {
      console.error("Error saving onboarding status:", error);
    }
  };

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        flatListIndex.value = viewableItems[0].index;
      }
    },
    [flatListIndex]
  );

  const scrollHandle = useAnimatedScrollHandler({
    onScroll: (event) => {
      x.value = event.contentOffset.x;
    },
  });

  const logoAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(x.value % width, [0, width / 2, width], [1, 0.92, 1], Extrapolate.CLAMP);
    const translateY = interpolate(x.value % width, [0, width / 2, width], [0, -10, 0], Extrapolate.CLAMP);
    return {
      transform: [
        { scale: withSpring(scale) },
        { translateY }
      ],
      opacity: interpolate(x.value % width, [0, width * 0.15, width * 0.85, width], [1, 0, 0, 1], Extrapolate.CLAMP)
    };
  }, [width]);

  const responsiveStyles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FCF5F1',
      overflow: 'hidden',
      width: '100%',
    },
    visualHeader: {
      height: screenHeight * 0.44,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    floatingSymbol: {
      position: 'absolute',
      zIndex: 1,
    },
    logoContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    brandOrb: {
      width: 140,
      height: 90,
      borderRadius: 28,
      backgroundColor: '#FFF',
      padding: 12,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: { shadowColor: '#3B2F2F', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24 },
        android: { elevation: 18 }
      })
    },
    heroLogo: {
      width: 110,
      height: 65,
    },
    skipButton: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 60 : 40,
      right: 24,
      zIndex: 100,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: 'rgba(59, 47, 47, 0.08)',
      backdropFilter: 'blur(10px)',
    },
    skipText: {
      color: '#3B2F2F',
      fontSize: 13,
      fontFamily: FONTS.bold,
      textTransform: 'uppercase',
      letterSpacing: 1,
      opacity: 0.7,
    },
    interactionSheet: {
      flex: 1,
      backgroundColor: '#FCF5F1',
      borderTopLeftRadius: 50,
      borderTopRightRadius: 50,
      marginTop: -40,
      paddingTop: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.8)',
      ...Platform.select({
        ios: { shadowColor: '#3B2F2F', shadowOffset: { width: 0, height: -20 }, shadowOpacity: 0.06, shadowRadius: 40 },
        android: { elevation: 25 }
      }),
    },
    sheetHandle: {
      width: 44,
      height: 5,
      backgroundColor: 'rgba(59, 47, 47, 0.06)',
      borderRadius: 10,
      alignSelf: 'center',
      marginBottom: 10,
    },
    flatListContainer: {
      height: screenHeight * 0.30,
    },
    footerContainer: {
      paddingBottom: Platform.OS === 'ios' ? 45 : 35,
      paddingHorizontal: 28,
      flex: 1,
      justifyContent: 'flex-end',
    },
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 35,
    },
    buttonGroup: {
      gap: 15,
    },
    mainButtons: {
      flexDirection: 'row',
      gap: 15,
    },
    ctaButton: {
      flex: 1,
      height: 68,
      borderRadius: 22,
      overflow: 'hidden',
      ...Platform.select({
        ios: { shadowColor: '#3B2F2F', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20 },
        android: { elevation: 10 }
      })
    },
    ctaGradient: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    outlineButton: {
      flex: 1,
      height: 68,
      borderRadius: 22,
      borderWidth: 2,
      borderColor: '#F3EFEF',
      backgroundColor: '#FFF',
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: { shadowColor: '#3B2F2F', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 15 },
        android: { elevation: 5 }
      })
    },
    buttonTextPrimary: {
      color: '#FCF5F1',
      fontSize: 15,
      fontFamily: FONTS.bold,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    buttonTextSecondary: {
      color: '#3B2F2F',
      fontSize: 15,
      fontFamily: FONTS.bold,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    googleButton: {
      flexDirection: 'row',
      backgroundColor: '#fff',
      height: 68,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#F1ECE9',
      marginTop: 2,
      ...Platform.select({
        ios: { shadowColor: '#3B2F2F', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 12 },
        android: { elevation: 4 }
      })
    },
    googleIconContainer: {
      width: 24,
      height: 24,
      marginRight: 14,
    },
    googleIcon: {
      width: '100%',
      height: '100%',
    },
    googleText: {
      fontSize: 14,
      color: '#3B2F2F',
      fontFamily: FONTS.semibold,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
  }), [width, screenHeight]);

  return (
    <View style={responsiveStyles.container}>
      <AppStatusBar style="dark" translucent />

      {/* Cinematic Asset Background (Same as Login) */}
      <View style={StyleSheet.absoluteFill}>
        <Image
          source={require('../../assets/images/currency_financial_bg.png')}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(252, 245, 241, 0.55)', 'rgba(252, 245, 241, 0.98)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Cinematic Floating Elements */}
        <Animated.View entering={FadeIn.delay(800)} style={[responsiveStyles.floatingSymbol, { top: '12%', left: '15%' }]}>
          <Vector as="materialcommunityicons" name="currency-usd" size={RFValue(65)} color="rgba(59, 47, 47, 0.04)" />
        </Animated.View>
        <Animated.View entering={FadeIn.delay(1000)} style={[responsiveStyles.floatingSymbol, { top: '22%', right: '10%' }]}>
          <Vector as="materialcommunityicons" name="currency-eur" size={RFValue(85)} color="rgba(59, 47, 47, 0.03)" />
        </Animated.View>
        <Animated.View entering={FadeIn.delay(1400)} style={[responsiveStyles.floatingSymbol, { top: '38%', right: '25%' }]}>
          <Vector as="materialcommunityicons" name="currency-gbp" size={RFValue(45)} color="rgba(59, 47, 47, 0.04)" />
        </Animated.View>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        style={responsiveStyles.skipButton}
        onPress={() => completeOnboarding("Login")}
      >
        <Text style={responsiveStyles.skipText}>Skip</Text>
      </TouchableOpacity>

      <View style={responsiveStyles.visualHeader}>
        <View style={responsiveStyles.logoContainer}>
          <Animated.View entering={ZoomIn.delay(200).duration(800)} style={responsiveStyles.brandOrb}>
            <Animated.View style={logoAnimatedStyle}>
              <Image
                source={require('../../assets/logos/cb_logo_new.png')}
                style={responsiveStyles.heroLogo}
                resizeMode="contain"
              />
            </Animated.View>
          </Animated.View>
        </View>
      </View>

      <Animated.View
        entering={FadeInDown.delay(600).duration(1000)}
        style={responsiveStyles.interactionSheet}
      >
        <View style={responsiveStyles.sheetHandle} />

        <View style={responsiveStyles.flatListContainer}>
          <Animated.FlatList
            ref={flatListRef}
            onScroll={scrollHandle}
            horizontal
            scrollEventThrottle={16}
            pagingEnabled={true}
            data={pages}
            keyExtractor={(_, index) => index.toString()}
            bounces={false}
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            renderItem={({ item, index }) => (
              <ListItem
                item={item}
                index={index}
                x={x}
              />
            )}
          />
        </View>

        <View style={responsiveStyles.footerContainer}>
          <View style={responsiveStyles.paginationContainer}>
            <PaginationElement length={pages.length} x={x} />
          </View>

          <View style={responsiveStyles.buttonGroup}>
            <View style={responsiveStyles.mainButtons}>
              <TouchableOpacity
                activeOpacity={0.9}
                style={responsiveStyles.ctaButton}
                onPress={() => completeOnboarding("Signup")}
              >
                <LinearGradient
                  colors={['#3B2F2F', '#574646']}
                  style={responsiveStyles.ctaGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={responsiveStyles.buttonTextPrimary}>Get Started</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={responsiveStyles.outlineButton}
                onPress={() => completeOnboarding("Login")}
              >
                <Text style={responsiveStyles.buttonTextSecondary}>Login</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={responsiveStyles.googleButton}
              onPress={() => { }}
            >
              <View style={responsiveStyles.googleIconContainer}>
                <Image
                  source={require('../../assets/icons/google.png')}
                  style={responsiveStyles.googleIcon}
                  resizeMode="contain"
                />
              </View>
              <Text style={responsiveStyles.googleText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

export default Onboarding;
