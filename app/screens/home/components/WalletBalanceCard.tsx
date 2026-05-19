import { View, Text, useWindowDimensions, TouchableOpacity, StyleSheet, Platform, Image } from "react-native";
import React from "react";
import { FONTS, SIZES } from "../../../constants/Assets";
import { useNavigation } from "@react-navigation/native";
import Vector from "app/assets/vectors";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  interpolate,
  withSpring
} from "react-native-reanimated";

interface IProps {
  currency: string;
  balance: string;
  isMinimal?: boolean;
}

const WalletBalanceCard = ({ currency, balance, isMinimal }: IProps) => {
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const [integerPart, decimalPart] = (balance ?? "0.00").toString().split(".");

  const shimmer = useSharedValue(0);
  const pressScale = useSharedValue(1);

  React.useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 3500 }), -1, false);
  }, []);

  const animatedShine = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-width, width * 1.5]) }],
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  if (isMinimal) {
    return (
      <View style={localStyles.minimalWrapper}>
        <TouchableOpacity activeOpacity={0.9} style={localStyles.membershipCard}>
          <LinearGradient colors={['#FF8E72', '#FC6D41']} style={localStyles.membershipInner}>
            <View style={localStyles.memberHeader}>
              <Text style={localStyles.memberTitle}>PREMIUM ACCOUNT</Text>
              <Vector as="materialicons" name="workspace-premium" size={24} color="#FFF" />
            </View>
            <View style={localStyles.memberBody}>
              <View style={localStyles.perkItem}>
                <Vector as="feather" name="check-circle" size={12} color="#FFF" />
                <Text style={localStyles.perkTxt}>FAST PROCESSING</Text>
              </View>
              <View style={localStyles.perkItem}>
                <Vector as="feather" name="shield" size={12} color="#FFF" />
                <Text style={localStyles.perkTxt}>EXTRA SECURE</Text>
              </View>
            </View>
            <View style={localStyles.memberFooter}>
              <Text style={localStyles.validTxt}>ACCOUNT VERIFIED</Text>
              <Image
                source={require('../../../assets/logos/cb_logo_new.png')}
                style={localStyles.logoSmall}
                tintColor="rgba(255,255,255,0.4)"
              />
            </View>
            <Animated.View style={[localStyles.shimmerBar, animatedShine]} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }


  return (
    <View style={localStyles.mainWrapper}>
      {/* The Luxury Metal Card */}
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={() => pressScale.value = withSpring(0.98)}
        onPressOut={() => pressScale.value = withSpring(1)}
      >
        <Animated.View
          entering={FadeInDown.delay(200).duration(1000)}
          style={[localStyles.cardShadow, cardAnimatedStyle]}
        >
          <LinearGradient
            colors={['#1a1616', '#2D2424', '#3B2F2F', '#0c4a6e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={localStyles.premiumCard}
          >
            {/* Ambient Lighting */}
            <View style={localStyles.ambientLight} />
            <View style={localStyles.accentOrb} />

            <View style={localStyles.cardHeader}>
              <View style={localStyles.chipCont}>
                <Vector as="materialcommunityicons" name="integrated-circuit-chip" size={34} color="rgba(255,255,255,0.6)" />
              </View>
              <View style={localStyles.badgePill}>
                <Vector as="materialicons" name="wifi-tethering" size={12} color="#FCF5F1" />
                <Text style={localStyles.badgeTxt}>ELITE</Text>
              </View>
            </View>

            <View style={localStyles.balanceSection}>
              <Text style={localStyles.labelSmall}>AVAILABLE FUNDS</Text>
              <View style={localStyles.amountContainer}>
                <Text style={localStyles.currencySymbol}>{currency}</Text>
                <Text style={localStyles.mainAmount}>{integerPart || "0"}</Text>
                <Text style={localStyles.decimalAmount}>.{decimalPart || "00"}</Text>
              </View>
            </View>

            <View style={localStyles.cardFooter}>
              <View style={localStyles.accountMeta}>
                <Text style={localStyles.metaHeader}>ACCOUNT ID</Text>
                <Text style={localStyles.metaValue}>ST-7829-PX-01</Text>
              </View>
              <View style={localStyles.brandBox}>
                <Image
                  source={require('../../../assets/logos/cb_logo_new.png')}
                  style={localStyles.miniLogo}
                  tintColor="rgba(255,255,255,0.4)"
                />
              </View>
            </View>

            {/* Sweep Shimmer Effect */}
            <Animated.View style={[localStyles.sweepEffect, animatedShine]} />
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      {/* Modern Action Hub */}
      <View style={localStyles.actionHub}>
        <ActionItem
          icon="plus"
          label="Add"
          color="#FFF2EF"
          iconColor="#FF8E72"
          delay={400}
          onPress={() => navigation.navigate('AddFund')}
        />
        <ActionItem
          icon="arrow-up-right"
          label="Send"
          color="#FF8E72"
          iconColor="#FFF"
          delay={500}
          onPress={() => navigation.navigate('withdraw')}
        />
        <ActionItem
          icon="activity"
          label="History"
          color="#FFF2EF"
          iconColor="#FF8E72"
          delay={600}
          onPress={() => navigation.navigate("Transactions")}
        />
        <ActionItem
          icon="user"
          label="Profile"
          color="#FFF2EF"
          iconColor="#3B2F2F"
          delay={700}
          onPress={() => navigation.navigate("Profile")}
        />
      </View>

    </View>
  );
};

const ActionItem = ({ icon, label, color, iconColor, delay, onPress }: any) => (
  <Animated.View entering={FadeInUp.delay(delay).springify()} style={localStyles.actionWrapper}>
    <TouchableOpacity onPress={onPress} style={localStyles.actionBtn} activeOpacity={0.8}>
      <View style={[localStyles.iconBase, { backgroundColor: color }]}>
        <Vector as="feather" name={icon} size={20} color={iconColor} />
      </View>
      <Text style={localStyles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  </Animated.View>
);

const localStyles = StyleSheet.create({
  mainWrapper: {
    paddingHorizontal: 22,
    marginTop: 15,
  },
  minimalWrapper: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  membershipCard: {
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#FF8E72', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 15 },
      android: { elevation: 8 }
    }),
  },
  membershipInner: {
    padding: 20,
    height: 140,
    justifyContent: 'space-between',
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberTitle: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
  },
  memberBody: {
    gap: 8,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  perkTxt: {
    fontSize: 9,
    fontFamily: FONTS.semibold,
    color: '#FFF',
    letterSpacing: 1,
  },
  memberFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  validTxt: {
    fontSize: 8,
    fontFamily: FONTS.medium,
    color: '#FFF',
    letterSpacing: 1,
    opacity: 0.8,
  },
  logoSmall: {
    width: 40,
    height: 20,
    resizeMode: 'contain',
  },
  shimmerBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: 'rgba(255,255,255,0.1)',
    transform: [{ rotate: '25deg' }],
  },
  cardShadow: {
    borderRadius: 32,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.2, shadowRadius: 20 },
      android: { elevation: 15 }
    }),
  },
  premiumCard: {
    height: 190,
    borderRadius: 32,
    padding: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  ambientLight: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 142, 114, 0.1)',
  },
  accentOrb: {
    position: 'absolute',
    bottom: -40,
    right: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  sweepEffect: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 120,
    backgroundColor: 'rgba(255,255,255,0.06)',
    transform: [{ rotate: '30deg' }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chipCont: {
    opacity: 0.8,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  badgeTxt: {
    color: '#FFF',
    fontSize: 9,
    fontFamily: FONTS.bold,
    letterSpacing: 1.5,
  },
  balanceSection: {
    marginTop: 25,
  },
  labelSmall: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
    fontFamily: FONTS.bold,
    letterSpacing: 2,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  currencySymbol: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: FONTS.bold,
    marginRight: 4,
  },
  mainAmount: {
    color: '#FFF',
    fontSize: 34,
    fontFamily: FONTS.bold,
    letterSpacing: -0.8,
  },
  decimalAmount: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  cardFooter: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  accountMeta: {
    gap: 3,
  },
  metaHeader: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 8,
    fontFamily: FONTS.bold,
    letterSpacing: 1,
  },
  metaValue: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: FONTS.medium,
    letterSpacing: 0.5,
  },
  miniLogo: {
    width: 44,
    height: 28,
    resizeMode: 'contain',
  },
  brandBox: {
    padding: 2,
  },
  actionHub: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 24,
    shadowColor: '#FF8E72',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,142,114,0.05)',
  },
  actionWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  actionBtn: {
    alignItems: 'center',
    gap: 8,
  },
  iconBase: {
    width: 46,
    height: 46,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#FF8E72', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6 },
      android: { elevation: 6 }
    }),
  },
  actionLabel: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
  }

});

export default WalletBalanceCard;
