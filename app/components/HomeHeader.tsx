import React, { useEffect, useState } from "react";
import { DrawerActions, useIsFocused, useNavigation } from "@react-navigation/native";
import { FONTS, SIZES, IMAGES } from "../constants/Assets";
import { TouchableOpacity, Image, Text, View, StyleSheet, Platform, useWindowDimensions } from "react-native";
import Vector from "app/assets/vectors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GetNotificationListInfo } from "app/http-services";
import { LinearGradient } from "expo-linear-gradient";
import { RFValue } from "react-native-responsive-fontsize";
import { scale, verticalScale, moderateScale } from '../helpers/responsive';
import Colors from "../constants/Colors";
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  interpolate,
  withSpring,
} from "react-native-reanimated";

interface IProps {
  showDetails?: boolean;
  reward: string;
  currency: string;
  name: string;
  balance: string;
  onPress?: () => void;
}

const HomeHeader = ({ reward, currency, balance }: IProps) => {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const [firstName, setFirstName] = useState("User");
  const [notifications, setNotifications] = useState<any[]>([]);
  const isFocused = useIsFocused();

  // Animation values for cinematic orbs and flair
  const orb1Pos = useSharedValue(0);
  const orb2Pos = useSharedValue(0);
  const profilePulse = useSharedValue(1);
  const balancePulse = useSharedValue(0);

  const [integerPart, decimalPart] = (balance ?? "0.00").toString().split(".");

  useEffect(() => {
    orb1Pos.value = withRepeat(withTiming(1, { duration: 10000 }), -1, true);
    orb2Pos.value = withRepeat(withTiming(1, { duration: 12000 }), -1, true);
    profilePulse.value = withRepeat(withTiming(1.15, { duration: 2500 }), -1, true);
    balancePulse.value = withRepeat(withTiming(1, { duration: 3000 }), -1, true);
  }, []);

  const orb1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(orb1Pos.value, [0, 1], [-30, 80]) },
      { translateY: interpolate(orb1Pos.value, [0, 1], [-20, 50]) },
      { scale: interpolate(orb1Pos.value, [0, 1], [1, 1.2]) },
    ],
    opacity: interpolate(orb1Pos.value, [0, 0.5, 1], [0.04, 0.1, 0.04]),
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(orb2Pos.value, [0, 1], [60, -60]) },
      { translateY: interpolate(orb2Pos.value, [0, 1], [40, -40]) },
      { scale: interpolate(orb2Pos.value, [0, 1], [1.1, 0.9]) },
    ],
    opacity: interpolate(orb2Pos.value, [0, 0.5, 1], [0.03, 0.08, 0.03]),
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: profilePulse.value }],
    opacity: interpolate(profilePulse.value, [1, 1.15], [0.2, 0]),
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(balancePulse.value, [0, 0.5, 1], [0.3, 0.7, 0.3]),
  }));

  useEffect(() => {
    const fetchName = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const parsed = JSON.parse(userData);
          setFirstName(parsed?.FirstName || "User");
        }
      } catch (error) {
        console.error("Error fetching name:", error);
      }
    };
    fetchName();
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await GetNotificationListInfo({});
        const data = response?.data?.Notifications || [];
        const mappedNotifications = data.map((item: any) => ({
          id: item.NotificationLogId,
          unread: item.NotificationIsread === "False",
        }));
        setNotifications(mappedNotifications);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };
    if (isFocused) fetchNotifications();
  }, [isFocused]);

  const unreadCount = notifications.filter((n) => n.unread).length;
  const hasUnread = unreadCount > 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning,";
    if (hour < 17) return "Good Afternoon,";
    return "Good Evening,";
  };

  return (
    <View style={localStyles.topWrapper}>
      <View style={localStyles.heroContainer}>
        {/* Advanced Gradient Overlay */}
        <LinearGradient
          colors={['rgba(255, 142, 114, 0.12)', 'rgba(252, 245, 241, 0)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Cinematic Animated Orbs */}
        <Animated.View style={[localStyles.orb, localStyles.orb1, orb1Style]} />
        <Animated.View style={[localStyles.orb, localStyles.orb2, orb2Style]} />

        {/* Header Navigation */}
        <View style={localStyles.headerNav}>
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            style={localStyles.glassBtn}
          >
            <Vector as="feather" name="menu" size={22} color="#3B2F2F" />
          </TouchableOpacity>

          <View style={localStyles.navTitleCont}>
            <Image
              source={require('../assets/logos/cb_logo_new.png')}
              style={localStyles.headerLogo}
              resizeMode="contain"
            />
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate("Notification")}
            style={localStyles.glassBtn}
          >
            <Vector as="ionicons" name="notifications-outline" size={24} color="#3B2F2F" />
            {hasUnread && (
              <View style={localStyles.notifBadge}>
                <Text style={localStyles.notifBadgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Hero Content - Executive Focus */}
        <View style={localStyles.heroContent}>
          <TouchableOpacity activeOpacity={0.8} style={localStyles.avatarNexus}>
            <Animated.View style={[localStyles.avatarPulse, pulseStyle]} />
            <View style={localStyles.avatarFrame}>
              <Image source={IMAGES.MenUser} style={localStyles.profilePic} />
            </View>
            <View style={localStyles.premiumTag}>
              <Vector as="materialicons" name="verified" size={14} color="#FF8E72" />
            </View>
          </TouchableOpacity>

          <Animated.View entering={FadeInDown.delay(300).duration(800)} style={localStyles.greetCont}>
            <Text style={localStyles.salutation}>{getGreeting()}</Text>
            <Text style={localStyles.profileName}>{firstName}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500).duration(800)} style={localStyles.balanceNexus}>
            <View style={localStyles.labelRow}>
              <View style={localStyles.dot} />
              <Text style={localStyles.liquidityLabel}>TOTAL BALANCE</Text>
              <View style={localStyles.dot} />
            </View>
            <View style={localStyles.mainAmountCont}>
              <Text style={localStyles.heroCurrency}>{currency}</Text>
              <Text style={localStyles.heroInteger}>{integerPart || "0"}</Text>
              <Text style={localStyles.heroDecimal}>.{decimalPart || "00"}</Text>
            </View>
            <Animated.View style={[localStyles.reflectionFlare, shimmerStyle]} />
          </Animated.View>
        </View>

        {/* Reward Pill - Modern & Interactive */}
        <View style={localStyles.bottomHeroRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate("ReferandEarn")}
            style={localStyles.rewardChip}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['rgba(255,142,114,0.15)', 'rgba(255,142,114,0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={localStyles.chipInner}
            >
              <View style={localStyles.chipIconCont}>
                <Vector as="feather" name="gift" size={14} color="#FFF" />
              </View>
              <Text style={localStyles.chipLabel}>{currency}{reward || "0"} EARNED</Text>
              <Vector as="feather" name="chevron-right" size={16} color="#FF8E72" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Luxury Glassmorphic Action Tray */}
      <View style={localStyles.actionTrayWrapper}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.95)', 'rgba(252, 245, 241, 0.95)']}
          style={localStyles.actionTray}
        >
          <ActionOrb
            icon="plus"
            label="Fund Request"
            bgColor="#3B2F2F"
            iconColor="#FCF5F1"
            onPress={() => navigation.navigate('AddFund')}
          />
          <ActionOrb
            icon="arrow-up-right"
            label="Withdraw"
            bgColor="#FF8E72"
            iconColor="#FFF"
            onPress={() => navigation.navigate('withdraw')}
          />
          <ActionOrb
            icon="clock"
            label="History"
            bgColor="#A19188"
            iconColor="#FFF"
            onPress={() => navigation.navigate('Transactions')}
          />
        </LinearGradient>
      </View>
    </View>
  );
};

const ActionOrb = ({ icon, label, bgColor, iconColor, onPress }: any) => (
  <TouchableOpacity onPress={onPress} style={localStyles.orbItem} activeOpacity={0.7}>
    <View style={[localStyles.orbIconCont, { backgroundColor: bgColor || '#FFF', borderColor: bgColor || 'rgba(59, 47, 47, 0.1)' }]}>
      <Vector as="feather" name={icon} size={22} color={iconColor || '#3B2F2F'} />
    </View>
    <Text style={localStyles.orbLabel}>{label}</Text>
  </TouchableOpacity>
);

const localStyles = StyleSheet.create({
  topWrapper: {
    backgroundColor: 'transparent',
    paddingBottom: scale(25),
  },
  heroContainer: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: scale(95),
    paddingHorizontal: scale(25),
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  orb: {
    position: 'absolute',
    borderRadius: scale(1000),
    zIndex: -1,
  },
  orb1: {
    width: scale(320),
    height: verticalScale(320),
    top: scale(-60),
    right: scale(-40),
    backgroundColor: 'rgba(255, 142, 114, 0.25)',
  },
  orb2: {
    width: scale(260),
    height: verticalScale(260),
    bottom: scale(30),
    left: scale(-50),
    backgroundColor: 'rgba(255, 218, 185, 0.2)',
  },
  headerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  glassBtn: {
    width: scale(48),
    height: verticalScale(48),
    borderRadius: scale(16),
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#3B2F2F', shadowOffset: { width: scale(0), height: 6 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 }
    }),
    borderWidth: scale(1),
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  navTitleCont: {
    alignItems: 'center',
  },
  navBrand: {
    fontSize: RFValue(13),
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
    letterSpacing: 4,
    textTransform: 'uppercase',
    fontWeight: '900',
    opacity: 0.9,
  },
  headerLogo: {
    width: RFValue(120),
    height: RFValue(35),
  },
  navUnderline: {
    width: scale(20),
    height: verticalScale(2),
    backgroundColor: '#FF8E72',
    marginTop: scale(4),
    borderRadius: scale(1),
    opacity: 0.5,
  },
  notifBadge: {
    position: 'absolute',
    top: scale(8),
    right: scale(8),
    minWidth: scale(18),
    height: verticalScale(18),
    borderRadius: scale(9),
    backgroundColor: '#FF8E72',
    borderWidth: 1.5,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(4),
  },
  notifBadgeText: {
    color: '#FFF',
    fontSize: RFValue(8),
    fontFamily: FONTS.bold,
  },
  heroContent: {
    alignItems: 'center',
    marginTop: scale(25),
  },
  avatarNexus: {
    width: RFValue(96),
    height: RFValue(96),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarPulse: {
    position: 'absolute',
    width: RFValue(120),
    height: RFValue(120),
    borderRadius: RFValue(60),
    borderWidth: scale(1),
    borderColor: '#FF8E72',
  },
  avatarFrame: {
    width: RFValue(90),
    height: RFValue(90),
    borderRadius: RFValue(45),
    backgroundColor: '#FFF',
    padding: scale(3),
    ...Platform.select({
      ios: { shadowColor: '#3B2F2F', shadowOffset: { width: scale(0), height: 12 }, shadowOpacity: 0.12, shadowRadius: 20 },
      android: { elevation: 15 }
    }),
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  profilePic: {
    width: '100%',
    height: '100%',
    borderRadius: RFValue(42),
  },
  premiumTag: {
    position: 'absolute',
    bottom: scale(0),
    right: scale(0),
    width: scale(30),
    height: verticalScale(30),
    borderRadius: scale(15),
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: scale(0), height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    borderWidth: scale(1),
    borderColor: 'rgba(255, 142, 114, 0.2)',
  },
  greetCont: {
    alignItems: 'center',
    marginTop: scale(20),
  },
  salutation: {
    fontSize: RFValue(11),
    fontFamily: FONTS.medium,
    color: '#8E7F77',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  profileName: {
    fontSize: RFValue(22),
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
    letterSpacing: -0.8,
    fontWeight: '900',
    marginTop: scale(2),
  },
  balanceNexus: {
    alignItems: 'center',
    marginTop: scale(35),
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  dot: {
    width: scale(4),
    height: verticalScale(4),
    borderRadius: scale(2),
    backgroundColor: '#FF8E72',
    opacity: 0.3,
  },
  liquidityLabel: {
    fontSize: RFValue(9),
    fontFamily: FONTS.bold,
    color: '#8E7F77',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  mainAmountCont: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: scale(8),
  },
  heroCurrency: {
    fontSize: RFValue(20),
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
    marginRight: scale(8),
    fontWeight: '800',
  },
  heroInteger: {
    fontSize: RFValue(38),
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
    letterSpacing: -1,
    fontWeight: '900',
  },
  heroDecimal: {
    fontSize: RFValue(18),
    fontFamily: FONTS.medium,
    color: '#FF8E72',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  reflectionFlare: {
    height: verticalScale(4),
    width: scale(60),
    backgroundColor: '#FF8E72',
    marginTop: scale(18),
    borderRadius: scale(2),
    opacity: 0.6,
  },
  bottomHeroRow: {
    marginTop: scale(40),
    alignItems: 'center',
  },
  rewardChip: {
    borderRadius: scale(30),
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#FF8E72', shadowOffset: { width: scale(0), height: 8 }, shadowOpacity: 0.15, shadowRadius: 15 },
      android: { elevation: 8 }
    }),
    borderWidth: scale(1),
    borderColor: 'rgba(255, 142, 114, 0.2)',
  },
  chipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(10),
    paddingHorizontal: scale(22),
    gap: scale(12),
  },
  chipIconCont: {
    width: scale(24),
    height: verticalScale(24),
    borderRadius: scale(12),
    backgroundColor: '#FF8E72',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipLabel: {
    fontSize: RFValue(11),
    fontFamily: FONTS.bold,
    color: '#FF8E72',
    letterSpacing: 0.5,
    fontWeight: '900',
  },
  actionTrayWrapper: {
    marginTop: scale(-60),
    paddingHorizontal: scale(20),
    zIndex: 20,
  },
  actionTray: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: scale(20),
    paddingHorizontal: scale(15),
    borderRadius: scale(32),
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    ...Platform.select({
      ios: { shadowColor: '#3B2F2F', shadowOffset: { width: scale(0), height: 15 }, shadowOpacity: 0.12, shadowRadius: 25 },
      android: { elevation: 12 }
    }),
  },
  orbItem: {
    alignItems: 'center',
    width: '32%',
    gap: scale(10),
  },
  orbIconCont: {
    width: RFValue(50),
    height: RFValue(50),
    borderRadius: RFValue(18),
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: scale(1),
    borderColor: 'rgba(59, 47, 47, 0.05)',
    ...Platform.select({
      ios: { shadowColor: '#3B2F2F', shadowOffset: { width: scale(0), height: 6 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 3 }
    }),
  },
  primaryOrbIcon: {
    backgroundColor: '#3B2F2F',
    borderColor: '#3B2F2F',
  },
  orbLabel: {
    fontSize: RFValue(9),
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
    letterSpacing: 0.5,
    fontWeight: '800',
    opacity: 0.8,
  }
});

export default HomeHeader;

