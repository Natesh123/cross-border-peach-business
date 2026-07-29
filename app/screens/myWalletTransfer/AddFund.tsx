import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  StatusBar,
  Dimensions,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useRecoilValue } from "recoil";
import { ProfileState } from "../../atoms";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp, FadeInRight } from "react-native-reanimated";
import Colors from "app/constants/Colors";
import { FONTS } from "app/constants/Assets";
import { RFValue } from "react-native-responsive-fontsize";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const AddFund = () => {
  const [amount, setAmount] = useState("");
  const navigation = useNavigation<any>();
  const [selectedPayment, setSelectedPayment] = useState("debit");
  const currentToken = useRecoilValue(ProfileState);
  const { width } = useWindowDimensions();

  const accountBalance = "0.00";
  const currency = "£";

  const handlePayNow = () => {
    console.log("Pay Now clicked", amount, selectedPayment);
  };

  const paymentMethods = [
    { id: "debit", title: "Debit Card", sub: "Visa, Mastercard, Maestro", icon: "credit-card", badge: "POPULAR" },
    { id: "credit", title: "Credit Card", sub: "Visa, Mastercard, AMEX", icon: "credit-card-plus", badge: null },
    { id: "netbanking", title: "Net Banking", sub: "Direct bank transfer", icon: "bank", badge: "SECURE" },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FCF5F1' }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={localStyles.container}>
          
          {/* UNIFIED EXECUTIVE HEADER */}
          <View style={localStyles.headerCurveContainer}>
            <LinearGradient
              colors={["#3B2F2F", "#2D2424"]}
              style={localStyles.headerGradient}
            >
              <View style={localStyles.headerTopRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={localStyles.backBtn}>
                  <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={localStyles.headerTitleText}>Top-up Wallet</Text>
                <View style={localStyles.vaultBadge}>
                  <Ionicons name="shield-checkmark" size={12} color="#FF8E72" />
                </View>
              </View>

              <View style={localStyles.balanceDisplay}>
                <Text style={localStyles.balanceLabel}>AVAILABLE FUNDS</Text>
                <Text style={localStyles.balanceValueText}>{currency}{accountBalance}</Text>
              </View>

              {/* INTEGRATED AMOUNT HUB (ALL BOXES REMOVED) */}
              <View style={localStyles.integratedAmountHub}>
                <View style={localStyles.hubTop}>
                  <Text style={localStyles.hubTitle}>ENTER DEPOSIT AMOUNT</Text>
                  <View style={localStyles.maxTag}>
                    <Text style={localStyles.maxTagText}>MAX £5,000</Text>
                  </View>
                </View>
                
                <View style={localStyles.inputWrapper}>
                  <View style={localStyles.currencySymbolWrapper}>
                    <Text style={localStyles.currencySymbolText}>£</Text>
                  </View>
                  <TextInput
                    placeholder="0.00"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    style={localStyles.cleanInput}
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={setAmount}
                    // Preventing any default focus ring or outline on web
                    {...Platform.select({
                      web: {
                        style: [localStyles.cleanInput, { outlineStyle: 'none' }] as any
                      }
                    })}
                  />
                </View>
                <View style={localStyles.inputUnderline} />
              </View>
            </LinearGradient>
          </View>

          {/* UNIFIED SELECTION HUB */}
          <Animated.View entering={FadeInUp.delay(300)} style={localStyles.selectionHub}>
            <View style={localStyles.hubSection}>
              <View style={localStyles.sectionHeaderRow}>
                <Text style={localStyles.hubSectionTitle}>Cards & Bank</Text>
                <View style={localStyles.hubSectionLine} />
              </View>

              {paymentMethods.map((method, index) => (
                <TouchableOpacity
                  key={method.id}
                  activeOpacity={0.8}
                  onPress={() => setSelectedPayment(method.id)}
                  style={[
                    localStyles.methodStrip,
                    selectedPayment === method.id && localStyles.methodStripActive
                  ]}
                >
                  <View style={[
                    localStyles.methodIconBg,
                    selectedPayment === method.id && localStyles.methodIconBgActive
                  ]}>
                    <MaterialCommunityIcons 
                      name={method.icon as any} 
                      size={18} 
                      color={selectedPayment === method.id ? "#FFFFFF" : "#3B2F2F"} 
                    />
                  </View>
                  
                  <View style={localStyles.methodMainInfo}>
                    <View style={localStyles.methodTitleLine}>
                      <Text style={[
                        localStyles.methodTitleText,
                        selectedPayment === method.id && localStyles.methodTitleTextActive
                      ]}>{method.title}</Text>
                      {method.badge && (
                        <View style={localStyles.stripBadge}>
                          <Text style={localStyles.stripBadgeText}>{method.badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={localStyles.methodSubText}>{method.sub}</Text>
                  </View>

                  <View style={[
                    localStyles.customRadio,
                    selectedPayment === method.id && localStyles.customRadioActive
                  ]}>
                    {selectedPayment === method.id && <View style={localStyles.customRadioDot} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[localStyles.hubSection, { borderTopWidth: 1, borderTopColor: '#F1F5F9', marginTop: 10, paddingTop: 20 }]}>
              <View style={localStyles.sectionHeaderRow}>
                <Text style={localStyles.hubSectionTitle}>Digital Wallets</Text>
                <View style={localStyles.hubSectionLine} />
              </View>

              <View style={localStyles.walletsContainer}>
                <TouchableOpacity style={localStyles.walletBox} activeOpacity={0.7}>
                  <Image source={require('../../assets/images/gpay.png')} style={localStyles.walletIconImg} />
                </TouchableOpacity>
                <TouchableOpacity style={localStyles.walletBox} activeOpacity={0.7}>
                  <Image source={require('../../assets/images/applepay.png')} style={localStyles.walletIconImg} />
                </TouchableOpacity>
                <TouchableOpacity style={localStyles.walletBox} activeOpacity={0.7}>
                  <Image source={require('../../assets/images/paypal.png')} style={localStyles.walletIconImg} />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          <View style={localStyles.securityFooter}>
            <Ionicons name="lock-closed" size={14} color="#059669" />
            <Text style={localStyles.securityFooterText}>SECURED BY END-TO-END ENCRYPTION</Text>
          </View>

        </View>
      </ScrollView>

      {/* FIXED ACTION BUTTON */}
      <View style={localStyles.actionContainer}>
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={handlePayNow}
          style={localStyles.finalRechargeBtn}
        >
          <LinearGradient
            colors={["#FF8E72", "#FF6B4A"]}
            style={localStyles.btnGradientLayout}
          >
            <View style={localStyles.btnLeft}>
              <Text style={localStyles.btnMainText}>RECHARGE NOW</Text>
              <Text style={localStyles.btnSmallDesc}>Funds will be added instantly</Text>
            </View>
            <View style={localStyles.btnRightCircle}>
              <Ionicons name="arrow-forward" size={18} color="#FF6B4A" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCurveContainer: {
    backgroundColor: '#3B2F2F',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    paddingBottom: 40,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  headerGradient: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerTitleText: {
    fontSize: RFValue(12),
    fontFamily: FONTS.bold,
    color: '#fff',
    letterSpacing: 0.5,
  },
  vaultBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceDisplay: {
    alignItems: 'center',
    marginBottom: 32,
  },
  balanceLabel: {
    fontSize: RFValue(8),
    fontFamily: FONTS.bold,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  balanceValueText: {
    fontSize: RFValue(26),
    fontFamily: FONTS.bold,
    color: '#fff',
    marginTop: 4,
  },
  integratedAmountHub: {
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  hubTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  hubTitle: {
    fontSize: 8,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
  },
  maxTag: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },
  maxTagText: {
    fontSize: 7,
    fontWeight: '900',
    color: '#FF8E72',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  currencySymbolWrapper: {
    marginRight: 12,
  },
  currencySymbolText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FF8E72',
  },
  cleanInput: {
    flex: 1,
    fontSize: RFValue(28),
    fontFamily: FONTS.bold,
    color: '#fff',
    // Removing any possible borders/outlines
    borderWidth: 0,
    padding: 0,
    margin: 0,
  },
  inputUnderline: {
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    width: '100%',
    marginTop: 4,
  },
  selectionHub: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 32,
    padding: 20,
    elevation: 8,
    shadowColor: "#3B2F2F",
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  hubSection: {
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 15,
  },
  hubSectionTitle: {
    fontSize: RFValue(11),
    fontFamily: FONTS.bold,
    color: '#1E293B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  hubSectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  methodStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginBottom: 6,
  },
  methodStripActive: {
    backgroundColor: '#FFF7F5',
  },
  methodIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  methodIconBgActive: {
    backgroundColor: '#3B2F2F',
  },
  methodMainInfo: {
    flex: 1,
  },
  methodTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  methodTitleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  methodTitleTextActive: {
    color: '#3B2F2F',
  },
  stripBadge: {
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stripBadgeText: {
    fontSize: 7,
    fontWeight: '900',
    color: '#F43F5E',
  },
  methodSubText: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '600',
  },
  customRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customRadioActive: {
    borderColor: '#FF8E72',
  },
  customRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF8E72',
  },
  walletsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  walletBox: {
    flex: 1,
    height: 44,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  walletIconImg: {
    width: 50,
    height: 25,
    resizeMode: 'contain',
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
  },
  securityFooterText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  finalRechargeBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: "#FF8E72",
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  btnGradientLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 24,
    paddingRight: 6,
    paddingVertical: 8,
    height: 60,
  },
  btnLeft: {
    justifyContent: 'center',
  },
  btnMainText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  btnSmallDesc: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    marginTop: 2,
  },
  btnRightCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default AddFund;
