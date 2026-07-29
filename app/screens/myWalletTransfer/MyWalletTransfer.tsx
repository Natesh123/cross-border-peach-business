import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  useWindowDimensions,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { useRecoilValue } from "recoil";
import { useIsFocused, useNavigation } from "@react-navigation/native";

import { ProfileState } from "../../atoms";
import { GetWalletBalance, WalletTransfer } from "app/http-services";
import { FONTS, SIZES } from "../../constants/Assets";

import Container from "app/theme/Container";
import Vector from "app/assets/vectors";
import ToastConfig from "app/components/ToastConfig";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeInLeft,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  withSpring,
  Easing
} from "react-native-reanimated";

const MyWalletTransfer = () => {
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const currentToken = useRecoilValue(ProfileState);

  const isFocused = useIsFocused();

  const [currency, setCurrency] = useState("£");
  const [accountBalance, setAccountBalance] = useState("0.00");
  const [withdrawAccountBalance, setWithdrawAccountBalance] = useState("");

  const [receiverId, setReceiverId] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [amount, setAmount] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [showTransferForm, setShowTransferForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Animations
  const shimmer = useSharedValue(0);
  const orb1Pos = useSharedValue(0);
  const orb2Pos = useSharedValue(0);
  const buttonGlow = useSharedValue(0.8);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 3500, easing: Easing.linear }), -1, false);
    orb1Pos.value = withRepeat(withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) }), -1, true);
    orb2Pos.value = withRepeat(withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.ease) }), -1, true);
    buttonGlow.value = withRepeat(withTiming(1.2, { duration: 2000, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);

  const animatedShine = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-width, width * 1.5]) }],
  }));

  const orb1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(orb1Pos.value, [0, 1], [-20, 50]) },
      { translateY: interpolate(orb1Pos.value, [0, 1], [-20, 30]) },
      { scale: interpolate(orb1Pos.value, [0, 1], [1, 1.1]) },
    ],
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(orb2Pos.value, [0, 1], [40, -40]) },
      { translateY: interpolate(orb2Pos.value, [0, 1], [30, -30]) },
      { scale: interpolate(orb2Pos.value, [0, 1], [1.1, 0.9]) },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonGlow.value }],
    opacity: interpolate(buttonGlow.value, [0.8, 1.2], [0.5, 0]),
  }));

  useEffect(() => {
    const _currency = process.env.CURRENCY_SYMBOL || "£";
    setCurrency(_currency);
    fetchWalletBalance(currentToken.tokenId, currentToken.remitterId);
  }, [isFocused]);

  const fetchWalletBalance = async (tokenId: string, remitterId: string) => {
    try {
      setLoading(true);
      const res = await GetWalletBalance(tokenId);
      if (res?.status === 200) {
        setAccountBalance(res?.data?.BalanceAmount || "0.00");
        setWithdrawAccountBalance(res?.data?.WD_BalanceAmount || "0.00");
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTransfer = async () => {
    if (!receiverId || !amount || !email) {
      setToastMsg("Please fill all fields");
      setShowToast(true);
      return;
    }

    try {
      setSubmitting(true);

      const reqBody = {
        ToRemitterID: receiverId,
        Amount: amount,
        RemitterEmail: email,
        OTP: otp,
      };

      const res = await WalletTransfer(reqBody);

      if (res?.data?.StatusCode === "ER0073") {
        setToastMsg(res.data.StatusMsg);
        fetchWalletBalance(currentToken.tokenId, currentToken.remitterId);
      } else {
        setToastMsg(res?.data?.StatusMsg || "Transaction failed. Please try again.");
      }

      setReceiverId("");
      setReceiverName("");
      setAmount("");
      setEmail("");
      setOtp("");
      setShowTransferForm(false);

      setTimeout(() => {
        navigation.navigate("HomeDrawer");
      }, 500);

    } catch (error) {
      console.error("Wallet Transfer Error: ", error);
      setToastMsg("Something went wrong. Please try again.");
    } finally {
      setShowToast(true);
      setSubmitting(false);
    }
  };

  const [integerPart, decimalPart = "00"] = accountBalance.toString().split(".");

  return (
    <SafeAreaView style={localStyles.container}>
      {/* Immersive Animated Background */}
      <View style={localStyles.topBackground}>
        <Animated.View style={[localStyles.shape1, orb1Style]} />
        <Animated.View style={[localStyles.shape2, orb2Style]} />
        <View style={localStyles.glassOverlay} />
      </View>

      <View style={localStyles.header}>
        <TouchableOpacity
          style={localStyles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Vector as="feather" name="chevron-left" size={24} color="#3B2F2F" />
        </TouchableOpacity>
        <Text style={localStyles.headerTitle}>Wallet Transfer</Text>
        <View style={{ width: 44 }} />
      </View>

      <Container>
        <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }} showsVerticalScrollIndicator={false}>
          
          {/* Ultra-Luxury Balance Card */}
          <Animated.View entering={FadeInDown.delay(100).duration(800)} style={localStyles.cardShadowWrapper}>
            <LinearGradient
              colors={['#1F1A1A', '#2D2424', '#4A3B3B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={localStyles.eliteCard}
            >
              {/* Inner glow / ambient light */}
              <View style={localStyles.ambientCardLight} />

              <View style={localStyles.balanceTopRow}>
                <View style={localStyles.chipIconBox}>
                  <Vector as="materialcommunityicons" name="integrated-circuit-chip" size={28} color="rgba(255,255,255,0.7)" />
                </View>
                <View style={localStyles.eliteBadgePill}>
                  <Vector as="materialicons" name="wifi-tethering" size={14} color="#FF8E72" />
                  <Text style={localStyles.eliteBadgeTxt}>ELITE ACCOUNT</Text>
                </View>
              </View>
              
              <Text style={localStyles.balanceLabel}>AVAILABLE FUNDS</Text>
              <View style={localStyles.amountContainer}>
                <Text style={localStyles.currencySymbol}>{currency}</Text>
                <Text style={localStyles.mainAmount}>{integerPart || "0"}</Text>
                <Text style={localStyles.decimalAmount}>.{decimalPart}</Text>
              </View>
              
              <View style={localStyles.balanceFooter}>
                <View style={localStyles.footerCol}>
                  <Text style={localStyles.userLabel}>CARDHOLDER</Text>
                  <Text style={localStyles.userName}>{currentToken.firstName || "User"}</Text>
                </View>
                <Vector as="feather" name="pocket" size={24} color="rgba(255,255,255,0.2)" />
              </View>

              {/* Sweep Shimmer Effect */}
              <Animated.View style={[localStyles.sweepEffect, animatedShine]} />
            </LinearGradient>
          </Animated.View>

          {!showTransferForm ? (
            <Animated.View entering={FadeInUp.delay(300).duration(800)} style={localStyles.infoCard}>
              <View style={localStyles.iconGlowWrapper}>
                <View style={localStyles.iconCircle}>
                  <Vector as="feather" name="send" size={32} color="#FFF" />
                </View>
              </View>
              
              <Text style={localStyles.infoTitle}>Instant Transfer</Text>
              <Text style={localStyles.infoDesc}>
                Experience a seamless flow. Send money securely across borders in real-time.
              </Text>

              <View style={localStyles.timelineWrapper}>
                {[
                  { icon: "user", title: "Remitter ID", desc: "Target receiver's unique ID" },
                  { icon: "dollar-sign", title: "Amount", desc: "Value you wish to send" },
                  { icon: "shield", title: "Verification", desc: "Confirm with registered email" }
                ].map((step, index) => (
                  <View key={index} style={localStyles.timelineNode}>
                    <View style={localStyles.nodeIconCol}>
                      <View style={localStyles.nodeIconBox}>
                        <Vector as="feather" name={step.icon} size={16} color="#FF8E72" />
                      </View>
                      {index < 2 && <View style={localStyles.nodeConnector} />}
                    </View>
                    <View style={localStyles.nodeContent}>
                      <Text style={localStyles.nodeTitle}>{step.title}</Text>
                      <Text style={localStyles.nodeDesc}>{step.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={localStyles.startBtnWrapper}>
                <Animated.View style={[localStyles.startBtnGlow, glowStyle]} />
                <TouchableOpacity
                  style={localStyles.startBtn}
                  activeOpacity={0.9}
                  onPress={() => setShowTransferForm(true)}
                >
                  <LinearGradient
                    colors={['#FF8E72', '#FF5A36']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={localStyles.startBtnGradient}
                  >
                    <Text style={localStyles.startBtnText}>Start New Transfer</Text>
                    <Vector as="feather" name="arrow-right" size={20} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInUp.delay(200).duration(600)} style={localStyles.formContainer}>
              <View style={localStyles.formHeader}>
                <Text style={localStyles.formTitle}>Transfer Details</Text>
                <TouchableOpacity onPress={() => setShowTransferForm(false)} style={localStyles.cancelBtn}>
                  <Vector as="feather" name="x" size={16} color="#3B2F2F" />
                </TouchableOpacity>
              </View>

              {/* Amount Hero Section */}
              <View style={localStyles.amountHeroSection}>
                <LinearGradient
                  colors={['rgba(255, 142, 114, 0.08)', 'rgba(255, 255, 255, 0.5)']}
                  style={localStyles.amountHeroBackground}
                />
                <Text style={localStyles.amountHeroLabel}>ENTER AMOUNT</Text>
                <View style={localStyles.amountInputWrapper}>
                  <Text style={localStyles.amountHeroCurrency}>{currency}</Text>
                  <TextInput
                    style={localStyles.amountHeroInput}
                    placeholder="0.00"
                    placeholderTextColor="#cbd5e1"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={(val) => {
                      const onlyNums = val.replace(/[^0-9.]/g, "");
                      setAmount(onlyNums);
                    }}
                  />
                </View>
                <View style={localStyles.amountGlowLine} />
              </View>

              <View style={localStyles.inputGroup}>
                <Text style={localStyles.inputLabel}>RECEIVER ID</Text>
                <View style={[localStyles.inputWrapper, receiverId ? localStyles.inputWrapperActive : null]}>
                  <View style={localStyles.inputIconCont}>
                    <Vector as="feather" name="user" size={18} color={receiverId ? "#FF8E72" : "#94a3b8"} />
                  </View>
                  <TextInput
                    style={localStyles.textInput}
                    placeholder="e.g. KM00000001"
                    placeholderTextColor="#94a3b8"
                    value={receiverId}
                    onChangeText={(val) => setReceiverId(val.replace(/[^a-zA-Z0-9]/g, ""))}
                  />
                </View>
                {receiverId ? (
                  <Animated.View entering={FadeInLeft} style={localStyles.verifiedRow}>
                    <Vector as="feather" name="check-circle" size={14} color="#10b981" />
                    <Text style={localStyles.receiverHint}>Ready to verify</Text>
                  </Animated.View>
                ) : null}
              </View>

              <View style={localStyles.inputGroup}>
                <Text style={localStyles.inputLabel}>VERIFICATION EMAIL</Text>
                <View style={[localStyles.inputWrapper, email ? localStyles.inputWrapperActive : null]}>
                  <View style={localStyles.inputIconCont}>
                    <Vector as="feather" name="mail" size={18} color={email ? "#FF8E72" : "#94a3b8"} />
                  </View>
                  <TextInput
                    style={localStyles.textInput}
                    placeholder="name@email.com"
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              <View style={localStyles.warningBox}>
                <View style={localStyles.warningIconBox}>
                  <Vector as="feather" name="shield" size={14} color="#d97706" />
                </View>
                <Text style={localStyles.warningText}>End-to-end encrypted transfer. Only withdrawal-enabled balances can be sent.</Text>
              </View>

              <View style={localStyles.footerActions}>
                <TouchableOpacity
                  style={[localStyles.mainActionBtn, (!receiverId || !amount || !email || submitting) && localStyles.mainActionBtnDisabled]}
                  disabled={!receiverId || !amount || !email || submitting}
                  onPress={handleConfirmTransfer}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#FF8E72', '#FF5A36']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={localStyles.mainBtnGradient}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <View style={localStyles.btnContentRow}>
                        <Text style={localStyles.mainBtnText}>Confirm Transfer</Text>
                        <Vector as="feather" name="chevron-right" size={22} color="#fff" />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

            </Animated.View>
          )}

        </ScrollView>
      </Container>
      <ToastConfig visible={showToast} message={toastMsg} onClose={() => setShowToast(false)} />
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDF4F0",
  },
  topBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
    overflow: 'hidden',
    zIndex: 0,
  },
  shape1: {
    position: 'absolute',
    top: -50,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 142, 114, 0.15)',
  },
  shape2: {
    position: 'absolute',
    top: 150,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 218, 185, 0.25)',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(253, 244, 240, 0.4)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 15,
    zIndex: 10,
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#FF8E72', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10 },
      android: { elevation: 3 }
    }),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  headerTitle: {
    fontSize: RFValue(18),
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
    letterSpacing: 0.5,
  },
  cardShadowWrapper: {
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 30,
    ...Platform.select({
      ios: { shadowColor: '#3B2F2F', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.25, shadowRadius: 25 },
      android: { elevation: 15 }
    }),
  },
  eliteCard: {
    padding: 26,
    borderRadius: 30,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  ambientCardLight: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 142, 114, 0.12)',
  },
  sweepEffect: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
    transform: [{ rotate: '30deg' }],
  },
  balanceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  chipIconBox: {
    opacity: 0.8,
  },
  eliteBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 142, 114, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 142, 114, 0.3)',
    gap: 6,
  },
  eliteBadgeTxt: {
    color: '#FF8E72',
    fontSize: RFValue(9),
    fontFamily: FONTS.bold,
    letterSpacing: 1.5,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: RFValue(9),
    fontFamily: FONTS.bold,
    letterSpacing: 2,
    marginBottom: 6,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currencySymbol: {
    color: '#FFF',
    fontSize: RFValue(18),
    fontFamily: FONTS.bold,
    marginRight: 6,
  },
  mainAmount: {
    color: '#FFF',
    fontSize: RFValue(32),
    fontFamily: FONTS.bold,
    letterSpacing: -1.5,
  },
  decimalAmount: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: RFValue(14),
    fontFamily: FONTS.medium,
  },
  balanceFooter: {
    marginTop: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerCol: {
    gap: 4,
  },
  userLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: RFValue(9),
    fontFamily: FONTS.bold,
    letterSpacing: 1.5,
  },
  userName: {
    color: '#FFF',
    fontSize: RFValue(11),
    fontFamily: FONTS.medium,
    letterSpacing: 0.5,
  },
  infoCard: {
    marginHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 36,
    padding: 32,
    ...Platform.select({
      ios: { shadowColor: '#FF8E72', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 20 },
      android: { elevation: 6 }
    }),
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  iconGlowWrapper: {
    alignSelf: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: '#FF8E72', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15 },
      android: { elevation: 10 }
    }),
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF8E72',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  infoTitle: {
    fontSize: RFValue(18),
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  infoDesc: {
    fontSize: RFValue(11),
    fontFamily: FONTS.medium,
    color: '#8E7F77',
    textAlign: 'center',
    lineHeight: RFValue(18),
    marginBottom: 30,
    paddingHorizontal: 15,
  },
  timelineWrapper: {
    marginBottom: 35,
    paddingHorizontal: 10,
  },
  timelineNode: {
    flexDirection: 'row',
    minHeight: 70,
  },
  nodeIconCol: {
    alignItems: 'center',
    width: 32,
    marginRight: 15,
  },
  nodeIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 142, 114, 0.3)',
    ...Platform.select({
      ios: { shadowColor: '#FF8E72', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 3 }
    }),
  },
  nodeConnector: {
    flex: 1,
    width: 2,
    backgroundColor: 'rgba(255, 142, 114, 0.2)',
    marginVertical: 4,
  },
  nodeContent: {
    flex: 1,
    paddingBottom: 25,
    paddingTop: 4,
  },
  nodeTitle: {
    fontSize: RFValue(12),
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
    marginBottom: 4,
  },
  nodeDesc: {
    fontSize: RFValue(10),
    fontFamily: FONTS.medium,
    color: '#8E7F77',
  },
  startBtnWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  startBtnGlow: {
    position: 'absolute',
    width: '90%',
    height: 60,
    backgroundColor: '#FF8E72',
    borderRadius: 20,
    top: 5,
  },
  startBtn: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  startBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  startBtnText: {
    color: '#FFF',
    fontSize: RFValue(12),
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  formContainer: {
    marginHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 36,
    padding: 32,
    ...Platform.select({
      ios: { shadowColor: '#3B2F2F', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.1, shadowRadius: 25 },
      android: { elevation: 8 }
    }),
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  formTitle: {
    fontSize: RFValue(16),
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
    letterSpacing: -0.5,
  },
  cancelBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 47, 47, 0.1)',
  },
  amountHeroSection: {
    alignItems: 'center',
    marginBottom: 35,
    padding: 25,
    borderRadius: 28,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  amountHeroBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  amountHeroLabel: {
    fontSize: RFValue(9),
    fontFamily: FONTS.bold,
    color: '#FF8E72',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountHeroCurrency: {
    fontSize: RFValue(24),
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
    marginRight: 8,
    marginTop: -6,
  },
  amountHeroInput: {
    fontSize: RFValue(36),
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
    minWidth: 120,
    textAlign: 'center',
    letterSpacing: -1.5,
    // @ts-ignore
    outlineStyle: 'none',
  },
  amountGlowLine: {
    width: '40%',
    height: 3,
    backgroundColor: '#FF8E72',
    borderRadius: 2,
    marginTop: 15,
    opacity: 0.8,
  },
  inputGroup: {
    marginBottom: 22,
  },
  inputLabel: {
    fontSize: RFValue(9),
    fontFamily: FONTS.bold,
    color: '#8E7F77',
    marginBottom: 10,
    marginLeft: 6,
    letterSpacing: 1.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(59, 47, 47, 0.05)',
  },
  inputWrapperActive: {
    borderColor: 'rgba(255, 142, 114, 0.4)',
    ...Platform.select({
      ios: { shadowColor: '#FF8E72', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 2 }
    }),
  },
  inputIconCont: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 142, 114, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: '#3B2F2F',
    // @ts-ignore
    outlineStyle: 'none',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 8,
    gap: 6,
  },
  receiverHint: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#10b981',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    padding: 16,
    borderRadius: 20,
    gap: 12,
    marginTop: 15,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.15)',
  },
  warningIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#92400e',
    flex: 1,
    lineHeight: 18,
  },
  footerActions: {
    marginTop: 35,
  },
  mainActionBtn: {
    borderRadius: 22,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#FF8E72', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20 },
      android: { elevation: 8 }
    }),
  },
  mainActionBtnDisabled: {
    opacity: 0.5,
  },
  mainBtnGradient: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mainBtnText: {
    color: '#FFF',
    fontSize: RFValue(15),
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
});

export default MyWalletTransfer;
