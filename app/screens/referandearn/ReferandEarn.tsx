import { View, Text, SafeAreaView, StyleSheet, TouchableOpacity, Alert, Linking, Dimensions, Platform, StatusBar, Image } from "react-native";
import React, { useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import { ProfileState } from "../../atoms";
import { Ionicons } from "@expo/vector-icons";
import { GetReferDetails, GetReferralCode } from "app/http-services";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import Clipboard from '@react-native-clipboard/clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import COLORS from "app/constants/Colors";
import { FONTS, SIZES } from "app/constants/Assets";
import Vector from "app/assets/vectors";
import { RFValue } from "react-native-responsive-fontsize";
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming, interpolate, Easing } from "react-native-reanimated";

const { width, height } = Dimensions.get('window');

const ReferandEarn = () => {
  const currentToken = useRecoilValue(ProfileState);
  const [reward, setReward] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const isFocused = useIsFocused();
  const navigation = useNavigation<any>();
  const [copied, setCopied] = useState(false);

  // Background Orb Animations
  const orb1Pos = useSharedValue(0);
  const orb2Pos = useSharedValue(0);

  useEffect(() => {
    orb1Pos.value = withRepeat(withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) }), -1, true);
    orb2Pos.value = withRepeat(withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);

  const orb1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(orb1Pos.value, [0, 1], [-30, 60]) },
      { translateY: interpolate(orb1Pos.value, [0, 1], [-20, 40]) },
      { scale: interpolate(orb1Pos.value, [0, 1], [1, 1.2]) },
    ],
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(orb2Pos.value, [0, 1], [50, -50]) },
      { translateY: interpolate(orb2Pos.value, [0, 1], [40, -40]) },
      { scale: interpolate(orb2Pos.value, [0, 1], [1.2, 0.9]) },
    ],
  }));

  useEffect(() => {
    if (currentToken.tokenId && currentToken.remitterId) {
      fetchReferDetails(currentToken.tokenId, currentToken.remitterId);
      fetchReferalCode(currentToken.tokenId, currentToken.remitterId);
    }
  }, [isFocused, currentToken]);

  const fetchReferDetails = async (tokenId: string, remitterId: string) => {
    try {
      setLoading(true);
      const response = await GetReferDetails(tokenId);
      if (response.status === 200) {
        setReward(response?.data?.Refer?.PotentialEarning);
      }
    } catch (error) {
      console.error("Error refer details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferalCode = async (tokenId: string, remitterId: string) => {
    try {
      setLoading(true);
      const response = await GetReferralCode(tokenId);
      if (response.status === 200) {
        setReferralCode(response?.data?.Code);
      }
    } catch (error) {
      console.error("Error referral code:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    const text = `Join by using my referral code "${referralCode}" and earn rewards!`;
    await Clipboard.setString(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async (platform: string) => {
    const message = `Join using my referral code "${referralCode}" and earn rewards!`;
    let url = "";

    switch (platform) {
      case 'whatsapp':
        url = `whatsapp://send?text=${encodeURIComponent(message)}`;
        break;
      case 'instagram':
        url = "instagram://direct";
        Clipboard.setString(message);
        break;
      case 'facebook':
        url = `fb-messenger://share?text=${encodeURIComponent(message)}`;
        break;
      case 'mail':
        const subject = `Join Cross Border and Earn Rewards!`;
        url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        break;
    }

    try {
      if (platform === 'mail') {
        const gmailURL = `googlegmail://co?subject=${encodeURIComponent("Join Cross Border and Earn Rewards!")}&body=${encodeURIComponent(message)}`;
        const canOpenGmail = await Linking.canOpenURL(gmailURL);
        if (canOpenGmail) {
          await Linking.openURL(gmailURL);
          return;
        }
      }

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        if (platform === 'whatsapp') Alert.alert("Error", "WhatsApp is not installed.");
        else if (platform === 'instagram') await Linking.openURL("https://www.instagram.com/direct/inbox/");
        else if (platform === 'facebook') await Linking.openURL("https://www.facebook.com/messages/t/");
        else Alert.alert("Error", "Unable to open application.");
      }
    } catch (error) {
      Alert.alert("Error", `Unable to share via ${platform}.`);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* DYNAMIC "ALIVE" BACKGROUND */}
      <View style={styles.bgWrapper}>
        <Animated.View style={[styles.glowOrb1, orb1Style]} />
        <Animated.View style={[styles.glowOrb2, orb2Style]} />
        <View style={styles.glassOverlay} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Vector as="ionicons" name="chevron-back" size={24} color="#3B2F2F" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Refer & Earn</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* FLOATING REWARDS PILL */}
        <Animated.View entering={FadeInDown.duration(800).delay(100)} style={styles.rewardsPillContainer}>
          <View style={styles.rewardsPill}>
            <View style={styles.rewardStat}>
              <Vector as="feather" name="check-circle" size={16} color="#10B981" />
              <Text style={styles.rewardLabel}>Earned</Text>
              <Text style={styles.rewardValue}>£30</Text>
            </View>
            <View style={styles.pillDivider} />
            <View style={styles.rewardStat}>
              <Vector as="feather" name="clock" size={16} color="#FF8E72" />
              <Text style={styles.rewardLabel}>Pending</Text>
              <Text style={styles.rewardValue}>£{reward || "0"}</Text>
            </View>
          </View>
        </Animated.View>

        {/* THE GLASSMORPHIC VOUCHER CARD */}
        <View style={styles.voucherCenterWrapper}>
          <Animated.View entering={FadeInUp.duration(800).delay(200)} style={styles.voucherShadow}>
            <View style={styles.voucherCard}>
              
              {/* Top Half of Voucher */}
              <View style={styles.voucherTop}>
                <Image
                  source={require("../../../assets/refer.png")}
                  style={styles.voucherImage}
                  resizeMode="contain"
                />
                <Text style={styles.voucherTitle}>Give £10, Get £10</Text>
                <Text style={styles.voucherSubtitle}>
                  For every friend that joins and transfers using your unique voucher code.
                </Text>
              </View>

              {/* The Ticket Cutout Divider */}
              <View style={styles.voucherDividerWrapper}>
                <View style={styles.cutoutLeft} />
                <View style={styles.dashedLine} />
                <View style={styles.cutoutRight} />
              </View>

              {/* Bottom Half of Voucher */}
              <View style={styles.voucherBottom}>
                <Text style={styles.codeLabel}>YOUR UNIQUE CODE</Text>
                <Text style={styles.codeText}>{referralCode || "------"}</Text>
                
                <TouchableOpacity 
                  style={[styles.copyBtn, copied && styles.copyBtnSuccess]} 
                  onPress={copyToClipboard}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={copied ? ['#10B981', '#059669'] : ['#FF8E72', '#FF5A36']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.copyBtnGradient}
                  >
                    <Vector as="ionicons" name={copied ? "checkmark-done" : "copy-outline"} size={20} color="#FFF" />
                    <Text style={styles.copyBtnText}>{copied ? "COPIED TO CLIPBOARD" : "COPY CODE"}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

            </View>
          </Animated.View>
        </View>

        {/* GLASS SOCIAL DOCK */}
        <Animated.View entering={FadeInUp.duration(800).delay(400)} style={styles.socialDockWrapper}>
          <Text style={styles.dockLabel}>QUICK SHARE</Text>
          <View style={styles.socialDock}>
            {[
              { id: 'whatsapp', icon: 'logo-whatsapp', color: '#25D366' },
              { id: 'instagram', icon: 'logo-instagram', color: '#E1306C' },
              { id: 'facebook', icon: 'logo-facebook', color: '#1877F2' },
              { id: 'mail', icon: 'mail', color: '#EA4335' }
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.socialBtn}
                onPress={() => handleShare(item.id)}
                activeOpacity={0.8}
              >
                <Vector as="ionicons" name={item.icon as any} size={28} color={item.color} />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F5',
  },
  bgWrapper: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glowOrb1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: width,
    height: width,
    borderRadius: width / 2,
    backgroundColor: 'rgba(255, 142, 114, 0.25)',
  },
  glowOrb2: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 249, 245, 0.6)',
  },
  safeArea: {
    flex: 1,
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,1)',
    ...Platform.select({
      ios: { shadowColor: '#3B2F2F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 2 }
    }),
  },
  headerTitle: {
    fontSize: RFValue(16),
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
  },
  rewardsPillContainer: {
    alignItems: 'center',
    zIndex: 10,
  },
  rewardsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: '#FFF',
    ...Platform.select({
      ios: { shadowColor: '#FF8E72', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 15 },
      android: { elevation: 5 }
    }),
  },
  rewardStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rewardLabel: {
    fontSize: RFValue(9),
    fontFamily: FONTS.medium,
    color: '#8E7F77',
  },
  rewardValue: {
    fontSize: RFValue(11),
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
  },
  pillDivider: {
    width: 1.5,
    height: 20,
    backgroundColor: 'rgba(59, 47, 47, 0.1)',
    marginHorizontal: 16,
  },
  voucherCenterWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  voucherShadow: {
    width: '100%',
    ...Platform.select({
      ios: { shadowColor: '#3B2F2F', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.1, shadowRadius: 30 },
      android: { elevation: 15 }
    }),
  },
  voucherCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: '#FFF',
    overflow: 'hidden',
  },
  voucherTop: {
    alignItems: 'center',
    paddingTop: 30,
    paddingHorizontal: 24,
    paddingBottom: 25,
  },
  voucherImage: {
    width: width * 0.5,
    height: width * 0.35,
    marginBottom: 20,
  },
  voucherTitle: {
    fontSize: RFValue(18),
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  voucherSubtitle: {
    fontSize: RFValue(11),
    fontFamily: FONTS.medium,
    color: '#8E7F77',
    textAlign: 'center',
    lineHeight: RFValue(18),
  },
  voucherDividerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 30,
    position: 'relative',
    overflow: 'hidden',
  },
  dashedLine: {
    flex: 1,
    height: 2,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: 'rgba(59, 47, 47, 0.15)',
    marginHorizontal: 15,
  },
  cutoutLeft: {
    position: 'absolute',
    left: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF9F5', // Matches app background
    borderRightWidth: 1.5,
    borderColor: '#FFF',
    zIndex: 10,
  },
  cutoutRight: {
    position: 'absolute',
    right: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF9F5', // Matches app background
    borderLeftWidth: 1.5,
    borderColor: '#FFF',
    zIndex: 10,
  },
  voucherBottom: {
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  codeLabel: {
    fontSize: RFValue(9),
    fontFamily: FONTS.bold,
    color: '#FF8E72',
    letterSpacing: 2,
    marginBottom: 10,
  },
  codeText: {
    fontSize: RFValue(24),
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
    letterSpacing: 4,
    marginBottom: 25,
  },
  copyBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#FF8E72', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15 },
      android: { elevation: 6 }
    }),
  },
  copyBtnSuccess: {
    ...Platform.select({
      ios: { shadowColor: '#10B981', shadowOpacity: 0.4 },
    }),
  },
  copyBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  copyBtnText: {
    color: '#FFF',
    fontSize: RFValue(12),
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  socialDockWrapper: {
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 35 : 25,
  },
  dockLabel: {
    fontSize: RFValue(8),
    fontFamily: FONTS.bold,
    color: '#8E7F77',
    letterSpacing: 2,
    marginBottom: 12,
  },
  socialDock: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: '#FFF',
    gap: 25,
    ...Platform.select({
      ios: { shadowColor: '#3B2F2F', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 20 },
      android: { elevation: 8 }
    }),
  },
  socialBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ReferandEarn;
