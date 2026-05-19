import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRecoilValue } from "recoil";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  ZoomIn, 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming, 
  useSharedValue 
} from "react-native-reanimated";

import { ProfileState } from "app/atoms";
import { InitTransactions, GetWalletBalance } from "app/http-services";
import COLORS from "app/constants/Colors";
import { FONTS } from "app/constants/Assets";
import ToastConfig from "app/components/ToastConfig";

const { width } = Dimensions.get("window");

type SelectedPackageType = {
  name?: string;
  price?: string | number;
  amount?: number;
  description?: string;
  validity?: string;
  displayvalue?: string;
  product_id?: number;
  operator_id?: number;
};

type RecipientDetailsType = {
  displayvalue: string;
  operator_id: any;
  userEmail: string;
  AccountName: string;
  AccountNumber: string;
  IFSCCode: string;
  CashPickup: string;
  ChannelTransferType: string;
  selectedPackage?: SelectedPackageType;
  CountryCode?: string;
  CountryFlag?: string;
};

const AirtimeTopupPay = () => {
  const navigation = useNavigation<any>();
  const currentToken = useRecoilValue(ProfileState);

  const [loading, setLoading] = useState(false);
  const [accountBalance, setAccountBalance] = useState("0");
  const [popupVisible, setPopupVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const [recipientDetails, setRecipientDetails] = useState<RecipientDetailsType>({
    displayvalue: "",
    operator_id: "",
    userEmail: "",
    AccountName: "",
    AccountNumber: "",
    IFSCCode: "",
    CashPickup: "",
    ChannelTransferType: "Banks",
  });

  const [selectedTransferType, setSelectedTransferType] =
    useState<"accountBalance" | "debitCard">("accountBalance");

  const pulse = useSharedValue(1);

  useEffect(() => {
    fetchStoredRecipientData();
    fetchWalletBalance();
    
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const fetchStoredRecipientData = async () => {
    try {
      const storedRecipient = await AsyncStorage.getItem("selectedRecipient");
      if (storedRecipient) {
        setRecipientDetails(JSON.parse(storedRecipient));
      }
    } catch (err) {
      console.error("Error fetching recipient:", err);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      setLoading(true);
      const res: any = await GetWalletBalance({});
      if (res.status === 200) {
        setAccountBalance(res?.data?.BalanceAmount?.toString() ?? "0");
      }
    } catch (err) {
      console.error("Error fetching wallet balance:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async () => {
    try {
      setLoading(true);
      const storedRecipient = await AsyncStorage.getItem("selectedRecipient");
      if (!storedRecipient) return;

      const recipient: RecipientDetailsType = JSON.parse(storedRecipient);
      const pkg = recipient.selectedPackage;
      if (!pkg) return;

      const priceValue = parseFloat(pkg.price?.toString().replace(/[^\d.]/g, "") || "0");
      
      const requestPayload = {
        operator_id: recipient.operator_id,
        operator_name: "Service One",
        product_id: pkg.product_id?.toString() ?? "8141",
        product_name: pkg.displayvalue ?? "",
        price: priceValue,
        displayvalue: pkg.displayvalue ? parseInt(pkg.displayvalue.replace(/\D/g, ""), 10) : 0,
        unit: "Local",
        toCountry: recipient.CountryCode ?? "IND",
        Mobile: recipient.AccountNumber || recipient.userEmail,
      };

      const response = await InitTransactions(requestPayload);
      const statusCode = response?.data?.StatusCode;
      const statusMsg = response?.data?.StatusMsg || "Transaction Failed";

      setStatusMessage(statusCode === "ER0000" ? "Payment successful!" : statusMsg);
      setPopupVisible(true);
    } catch (err) {
      Alert.alert("Error", "Processing failed. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const cleanPrice = (price: string | number | undefined) => {
    if (!price) return "0.00";
    return price.toString().replace(/[a-zA-Z\s]/g, "");
  };

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View style={localStyles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ULTRA-EXECUTIVE HEADER */}
      <View style={localStyles.headerArea}>
        <SafeAreaView>
          <View style={localStyles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={localStyles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#FCF5F1" />
            </TouchableOpacity>
            <View style={localStyles.titleCont}>
              <Text style={localStyles.navLabel}>SECURE CHECKOUT</Text>
              <Text style={localStyles.pageTitle}>Review & Pay</Text>
            </View>
            <TouchableOpacity style={localStyles.infoBtn}>
              <Feather name="info" size={20} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={localStyles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={localStyles.scrollContent}
      >
        {/* PREMIUM HUB CARD */}
        <Animated.View entering={ZoomIn.duration(800)} style={localStyles.hubCard}>
          <LinearGradient
            colors={["#FF8E72", "#FC6D41"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={localStyles.hubGradient}
          >
            <View style={localStyles.hubTop}>
              <Text style={localStyles.hubLabel}>RECHARGE VALUE</Text>
              <View style={localStyles.hubPriceRow}>
                <Text style={localStyles.hubSymbol}>£</Text>
                <Text style={localStyles.hubAmount}>{cleanPrice(recipientDetails.selectedPackage?.price)}</Text>
              </View>
              <Animated.View style={[localStyles.badge, animatedPulseStyle]}>
                <FontAwesome5 name="shield-alt" size={10} color="#FF8E72" />
                <Text style={localStyles.badgeText}>ENCRYPTED PAYMENT</Text>
              </Animated.View>
            </View>
          </LinearGradient>

          {/* PATH FLOW OVERLAY */}
          <View style={localStyles.flowSection}>
            <View style={localStyles.flowSide}>
              <View style={localStyles.userCircle}>
                <Text style={localStyles.initial}>Y</Text>
              </View>
              <Text style={localStyles.flowName}>You</Text>
            </View>
            <View style={localStyles.flowPath}>
              <View style={localStyles.pathLine} />
              <View style={localStyles.pathIcon}>
                <Ionicons name="airplane" size={14} color="#FF8E72" />
              </View>
            </View>
            <View style={localStyles.flowSide}>
              <View style={localStyles.recipientCircle}>
                {recipientDetails.CountryFlag ? (
                  <Image source={{ uri: recipientDetails.CountryFlag }} style={localStyles.flag} />
                ) : (
                  <View style={localStyles.flagPlaceholder} />
                )}
              </View>
              <Text style={localStyles.flowName} numberOfLines={1}>{recipientDetails.AccountName || "Recipient"}</Text>
            </View>
          </View>
        </Animated.View>

        {/* PAYMENT METHOD SECTION */}
        <View style={localStyles.sectionCont}>
          <Text style={localStyles.sectionHeader}>PAYMENT METHOD</Text>
          
          <TouchableOpacity
            style={[localStyles.methodTile, selectedTransferType === "accountBalance" && localStyles.methodTileActive]}
            onPress={() => setSelectedTransferType("accountBalance")}
            activeOpacity={0.9}
          >
            <View style={localStyles.iconBox}>
              <LinearGradient 
                colors={selectedTransferType === "accountBalance" ? ["#FF8E72", "#FC6D41"] : ["#F8FAFC", "#F1F5F9"]}
                style={localStyles.iconGradient}
              >
                <MaterialCommunityIcons name="wallet" size={20} color={selectedTransferType === "accountBalance" ? "#FFF" : "#94A3B8"} />
              </LinearGradient>
            </View>
            <View style={localStyles.methodInfo}>
              <Text style={localStyles.methodTitle}>Wallet Balance</Text>
              <Text style={localStyles.methodValue}>Balance: £{accountBalance}</Text>
            </View>
            <View style={[localStyles.radio, selectedTransferType === "accountBalance" && localStyles.radioActive]}>
              {selectedTransferType === "accountBalance" && <View style={localStyles.radioInner} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[localStyles.methodTile, selectedTransferType === "debitCard" && localStyles.methodTileActive]}
            onPress={() => setSelectedTransferType("debitCard")}
            activeOpacity={0.9}
          >
            <View style={localStyles.iconBox}>
              <LinearGradient 
                colors={selectedTransferType === "debitCard" ? ["#10B981", "#059669"] : ["#F8FAFC", "#F1F5F9"]}
                style={localStyles.iconGradient}
              >
                <MaterialCommunityIcons name="credit-card" size={20} color={selectedTransferType === "debitCard" ? "#FFF" : "#94A3B8"} />
              </LinearGradient>
            </View>
            <View style={localStyles.methodInfo}>
              <Text style={localStyles.methodTitle}>Debit/Credit Card</Text>
              <Text style={localStyles.methodValue}>Visa, Mastercard, Amex</Text>
            </View>
            <View style={[localStyles.radio, selectedTransferType === "debitCard" && localStyles.radioActive]}>
              {selectedTransferType === "debitCard" && <View style={localStyles.radioInner} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* DIGITAL RECEIPT SECTION */}
        <View style={localStyles.receiptCont}>
          <Text style={localStyles.sectionHeader}>TRANSACTION SUMMARY</Text>
          <View style={localStyles.receiptCard}>
            <View style={localStyles.receiptRow}>
              <Text style={localStyles.receiptLabel}>Top-up Package</Text>
              <Text style={localStyles.receiptValue}>{recipientDetails.selectedPackage?.displayvalue || "Plan"}</Text>
            </View>
            <View style={localStyles.receiptRow}>
              <Text style={localStyles.receiptLabel}>Operator</Text>
              <Text style={localStyles.receiptValue}>Global Network</Text>
            </View>
            <View style={localStyles.receiptRow}>
              <Text style={localStyles.receiptLabel}>Service Fee</Text>
              <Text style={localStyles.receiptValueFree}>£0.00 (FREE)</Text>
            </View>
            <View style={localStyles.dashLine} />
            <View style={localStyles.totalRow}>
              <Text style={localStyles.totalLabel}>Payable Total</Text>
              <Text style={localStyles.totalValue}>£{cleanPrice(recipientDetails.selectedPackage?.price)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* STICKY ACTION FOOTER */}
      <View style={localStyles.footer}>
        <TouchableOpacity 
          disabled={loading}
          style={localStyles.mainAction} 
          onPress={handlePayNow}
          activeOpacity={0.9}
        >
          <LinearGradient 
            colors={["#FF8E72", "#FC6D41"]} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 0 }} 
            style={localStyles.actionGradient}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={localStyles.actionText}>AUTHORIZE PAYMENT</Text>
                <View style={localStyles.actionIconCont}>
                  <Ionicons name="lock-closed" size={16} color="#FC6D41" />
                </View>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ToastConfig
        visible={popupVisible}
        message={statusMessage}
        onClose={() => {
          setPopupVisible(false);
          navigation.reset({ index: 0, routes: [{ name: "Root" }] });
        }}
      />
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDFCFB",
  },
  headerArea: {
    backgroundColor: '#1C0D06',
    paddingBottom: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
  },
  headerContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  titleCont: {
    flex: 1,
    marginLeft: 16,
  },
  navLabel: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 2,
  },
  pageTitle: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: "#FCF5F1",
    marginTop: 2,
    fontWeight: '800',
  },
  infoBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  scroll: {
    flex: 1,
    marginTop: -30,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 140,
  },
  hubCard: {
    borderRadius: 32,
    backgroundColor: "#FFF",
    shadowColor: "#FF8E72",
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 8,
    marginBottom: 32,
    overflow: "hidden",
  },
  hubGradient: {
    padding: 32,
    alignItems: "center",
  },
  hubTop: {
    alignItems: "center",
  },
  hubLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  hubPriceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  hubSymbol: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFF",
    marginTop: 10,
    marginRight: 4,
  },
  hubAmount: {
    fontSize: 56,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: -1.5,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 20,
    gap: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FF8E72",
    letterSpacing: 0.5,
  },
  flowSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFF",
  },
  flowSide: {
    flex: 1,
    alignItems: "center",
  },
  userCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    marginBottom: 8,
  },
  recipientCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF9F7",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFE5D9",
    marginBottom: 8,
  },
  flag: {
    width: "100%",
    height: "100%",
  },
  flagPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E2E8F0",
  },
  initial: {
    fontSize: 16,
    fontWeight: "800",
    color: "#94A3B8",
  },
  flowName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1A1515",
  },
  flowPath: {
    width: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  pathLine: {
    height: 2,
    width: "100%",
    backgroundColor: "#F1F5F9",
    position: "absolute",
  },
  pathIcon: {
    backgroundColor: "#FFF",
    padding: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  sectionCont: {
    marginBottom: 32,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 1.5,
    marginBottom: 16,
    marginLeft: 4,
  },
  methodTile: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 10,
  },
  methodTileActive: {
    borderColor: "#FF8E72",
    backgroundColor: "#FFF9F7",
  },
  iconBox: {
    marginRight: 16,
  },
  iconGradient: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1A1515",
  },
  methodValue: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
  },
  radioActive: {
    borderColor: "#FF8E72",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF8E72",
  },
  receiptCont: {
    marginBottom: 20,
  },
  receiptCard: {
    backgroundColor: "#FFF",
    borderRadius: 28,
    padding: 24,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  receiptLabel: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "600",
  },
  receiptValue: {
    fontSize: 13,
    color: "#1A1515",
    fontWeight: "800",
  },
  receiptValueFree: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "900",
  },
  dashLine: {
    height: 2,
    backgroundColor: "#F8FAFC",
    marginVertical: 16,
    borderStyle: "dashed",
    borderRadius: 1,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1515",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FF8E72",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: "rgba(253, 252, 251, 0.95)",
  },
  mainAction: {
    borderRadius: 24,
    shadowColor: "#FF8E72",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  actionGradient: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    gap: 16,
  },
  actionText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 1.5,
  },
  actionIconCont: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default AirtimeTopupPay;
