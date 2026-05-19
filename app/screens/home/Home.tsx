import { RefreshControl, ScrollView, View, BackHandler, StyleSheet, Platform, StatusBar, Alert, useWindowDimensions, Image, TouchableOpacity, Text } from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import Container from "../../theme/Container";
import WalletBalanceCard from "./components/WalletBalanceCard";
import HomeHeader from "../../components/HomeHeader";
import styles from "../../styles";
import { SafeAreaView } from "react-native-safe-area-context";
import SummaryCard from "./components/SummaryCard";
import TransactionCard from "./components/TransactionCard";
import { ITransaction } from "types";
import { useIsFocused, useFocusEffect } from "@react-navigation/native";
import { ProfileState } from "../../atoms";
import { useRecoilValue } from "recoil";
import RateCard from "./components/RateCard";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp, FadeIn, FadeInLeft, FadeInRight } from "react-native-reanimated";
import AppStatusBar from "../../components/AppStatusBar";
import { RFValue } from "react-native-responsive-fontsize";
import { FONTS } from "../../constants/Assets";
import { useNavigation } from "@react-navigation/native";
import Vector from "../../assets/vectors";

import { GetDashboardDetails, GetReferDetails, GetRemitterProfile, GetTransactionDetails, GetWalletBalance } from "../../http-services";
import Spinner from "react-native-loading-spinner-overlay";

const Home = () => {
  const isFocused = useIsFocused();
  const currentToken = useRecoilValue(ProfileState);
  const { height } = useWindowDimensions();
  const navigation = useNavigation<any>();

  // 100% ORIGINAL LOGIC: Handle hardware back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        BackHandler.exitApp();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [])
  );

  const [currency, setCurrency] = useState('£');
  const [loading, setLoading] = useState(false);
  const [reward, setReward] = useState('');
  const [accountBalance, setAccountBalance] = useState('');
  const [withdrawAccountBalance, setWithdrawAccountBalance] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [checkRate, setCheckRate] = useState<any[]>([]);
  const [totalBeneficiaries, setTotalBeneficiaries] = useState('');
  const [transactionCount, setTransactionCount] = useState('');
  const [LastMonthSummary, setLastMonthSummary] = useState([]);
  const [RecentTransaction, setRecentTransaction] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // 100% ORIGINAL LOGIC: Fetch Refer Details
  const fetchReferDetails = async (tokenId: string, remitterId: string) => {
    try {
      if (!tokenId || !remitterId) return;
      setLoading(true);
      const response = GetReferDetails(tokenId);
      response.then((res: any) => {
        if (res.status === 200) {
          setReward(res?.data?.Refer?.PotentialEarning);
        }
      })
        .catch((err) => {
          console.error('Fetch refer details error:', err.response?.data || err.message)
        })
        .finally(() => setLoading(false));
    } catch (error) {
      console.error('Error refer details:', error);
    }
  };

  // 100% ORIGINAL LOGIC: Fetch Dashboard Details
  const fetchDashboardDetails = async (tokenId: string, remitterId: string) => {
    try {
      if (!tokenId || !remitterId) return;
      setLoading(true);
      const response = GetDashboardDetails(tokenId);
      response.then((res: any) => {
        if (res.status === 200) {
          const dashboardData = res?.data?.Dashboard || res?.data?.Dasboard;
          setTotalAmount(dashboardData?.TotalAmount || "0.00");
          setTotalBeneficiaries(dashboardData?.TotalBeneficiaries || "0");
          setTransactionCount(dashboardData?.TransactionCount || "0");
        }
      })
        .catch((err) => {
          console.error('Fetch dashboard details error:', err.response?.data || err.message);
        })
        .finally(() => setLoading(false));
    } catch (error) {
      console.error('Error fetching dashboard details:', error);
    }
  };

  // 100% ORIGINAL LOGIC: Fetch Wallet Balance
  const fetchWalletBalance = async (tokenId: string, remitterId: string) => {
    try {
      if (!tokenId || !remitterId) return;
      setLoading(true);
      const response = GetWalletBalance(tokenId);
      response.then((res: any) => {
        if (res.status === 200) {
          setAccountBalance(res?.data?.BalanceAmount);
          setWithdrawAccountBalance(res?.data?.WD_BalanceAmount);
        }
      })
        .catch((err) => {
          console.error('Fetch wallet balance error:', err.response?.data || err.message)
        })
        .finally(() => setLoading(false));
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  // 100% ORIGINAL LOGIC: Fetch Transaction Details
  const fetchTransactionDetails = async (tokenId: string, remitterId: string) => {
    try {
      if (!tokenId || !remitterId) return;
      setLoading(true);
      const requestPayload = {
        tokenId: tokenId,
        remitterId: remitterId,
        fromDate: '',
        numberTranList: '5',
        toDate: '',
        tranList: 'COUNT',
        transId: '',
        transactionType: 'MONEY_REMITTANCE',
        walletMode: 'Sendmoney'
      }
      const response = GetTransactionDetails(requestPayload);
      response.then((res: any) => {
        if (res.status === 200) {
          const fixedList = (res?.data?.TransDetails || []).map((t: any) => {
            return {
              ...t,
              TransactionMode:
                !t.TransactionMode || t.TransactionMode.trim() === ""
                  ? "E-Wallet Debit"
                  : t.TransactionMode,
            };
          });
          setRecentTransaction(fixedList);
        }
      })
        .catch((err) => {
          console.error('Fetch Transaction details error:', err.response?.data || err.message)
        })
        .finally(() => setLoading(false));
    } catch (error) {
      console.error('Error fetching Transaction details:', error);
    }
  };

  useEffect(() => {
    if (isFocused && currentToken.tokenId && currentToken.remitterId) {
      const _currency = (typeof process !== 'undefined' && process.env && process.env.CURRENCY_SYMBOL) || '£';
      setCurrency(_currency);
      fetchReferDetails(currentToken.tokenId, currentToken.remitterId);
      fetchTransactionDetails(currentToken.tokenId, currentToken.remitterId);
      fetchWalletBalance(currentToken.tokenId, currentToken.remitterId);
      fetchDashboardDetails(currentToken.tokenId, currentToken.remitterId);
    }
  }, [isFocused]);

  const onRefresh = () => { }

  // Logic to sync summary values if API returns 0 but we have transactions
  useEffect(() => {
    if (RecentTransaction.length > 0 && (!totalAmount || totalAmount === "0.00" || totalAmount === "")) {
      const sum = RecentTransaction.reduce((acc, curr: any) => acc + parseFloat(curr.Amount || 0), 0);
      setTotalAmount(sum.toFixed(2));

      if (!transactionCount || transactionCount === "0" || transactionCount === "") {
        setTransactionCount(RecentTransaction.length.toString());
      }

      if (!totalBeneficiaries || totalBeneficiaries === "0" || totalBeneficiaries === "") {
        const uniqueBeneficiaries = new Set(RecentTransaction.map((t: any) => t.ReceiverID)).size;
        setTotalBeneficiaries(uniqueBeneficiaries.toString());
      }
    }
  }, [RecentTransaction, totalAmount]);

  return (
    <View style={localStyles.mainContainer}>
      <AppStatusBar style="dark" translucent />

      {/* Cinematic Asset Background */}
      <View style={localStyles.globalBackground}>
        <Image
          source={require('../../assets/images/currency_financial_bg.png')}
          style={[StyleSheet.absoluteFill, { opacity: 0.02 }]}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(252, 245, 241, 0.5)', '#FCF5F1']}
          style={StyleSheet.absoluteFill}
        />

        {/* Ambient Symbols for visual depth */}
        <Animated.View entering={FadeIn.delay(1000)} style={[localStyles.floatingSymbol, { top: '5%', left: '2%' }]}>
          <Vector as="materialcommunityicons" name="shield-crown-outline" size={RFValue(40)} color="rgba(255, 142, 114, 0.05)" />
        </Animated.View>
        <Animated.View entering={FadeIn.delay(1500)} style={[localStyles.floatingSymbol, { top: '40%', right: '-5%' }]}>
          <Vector as="materialcommunityicons" name="currency-gbp" size={RFValue(60)} color="rgba(59, 47, 47, 0.02)" />
        </Animated.View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[localStyles.scrollContent]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B2F2F" />
        }
      >
        {/* PHASE 1: THE EXECUTIVE IDENTITY HUB */}
        <HomeHeader
          name={currentToken.firstName}
          currency={currency}
          reward={reward}
          balance={accountBalance}
        />

        <View style={localStyles.dynamicContent}>
          {/* PHASE 2: SMART ACTION DECK (Horizontal Premium Actions) */}
          {/* Note: WalletBalanceCard with isMinimal={true} is used here as a status bar, 
              but we can also use a custom mini-stats component */}

          {/* PHASE 3: THE DASHBOARD BENTO GRID */}
          <View style={localStyles.bentoGrid}>
            <Animated.View
              entering={FadeInUp.delay(600).duration(800)}
              style={localStyles.bentoMain}
            >
              <RateCard />
            </Animated.View>

            {/* Dashboard Insights Header (Unified) */}
            <View style={localStyles.insightHeader}>
              <Animated.View entering={FadeInLeft.delay(700)} style={localStyles.badgeRow}>
                <View style={localStyles.liveDot} />
                <Text style={localStyles.insightBadge}>ANALYTICS</Text>
              </Animated.View>
              <Animated.View entering={FadeInLeft.delay(800)}>
                <Text style={localStyles.insightTitle}>Dashboard Insights</Text>
              </Animated.View>
            </View>

            <SummaryCard
              currency={currency}
              value={totalAmount}
              count={transactionCount}
              beneficiaries={totalBeneficiaries}
              reward={reward}
            />
          </View>


          {/* PHASE 4: ACTIVITY STREAM */}
          <Animated.View
            entering={FadeInUp.delay(1100).duration(1000)}
            style={localStyles.activityZone}
          >
            <View style={localStyles.sectionHeader}>
              <Text style={localStyles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Transactions")}>
                <Text style={localStyles.seeAllTxt}>See All</Text>
              </TouchableOpacity>
            </View>
            <TransactionCard item={RecentTransaction} currency={currency} />
          </Animated.View>
        </View>
      </ScrollView>

      {loading && <Spinner visible={true} size='large' animation='fade' overlayColor="rgba(255,142,114,0.1)" />}
    </View>
  );
};

const localStyles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FCF5F1',
  },
  globalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  floatingSymbol: {
    position: 'absolute',
    zIndex: -1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  dynamicContent: {
    marginTop: -20,
    gap: 20,
  },
  bentoGrid: {
    marginHorizontal: 20,
    gap: 15,
  },
  bentoMain: {
    paddingTop: 5,
    overflow: 'hidden',
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 15,
  },
  bentoHalf: {
    flex: 1,
  },
  insightHeader: {
    marginTop: 25,
    marginBottom: 15,
    paddingHorizontal: 25,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 142, 114, 0.08)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 142, 114, 0.1)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF8E72',
  },
  insightBadge: {
    color: '#FF8E72',
    fontSize: RFValue(8),
    fontFamily: FONTS.bold,
    letterSpacing: 1.5,
  },
  insightTitle: {
    fontSize: RFValue(18),
    fontFamily: FONTS.bold,
    color: "#3B2F2F",
    letterSpacing: -0.8,
  },
  referralBento: {
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#FF8E72', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 15 },
      android: { elevation: 8 }
    }),
  },
  referralInner: {
    flex: 1,
    padding: 22,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  referralGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 32,
  },
  giftIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  referralTxtBox: {
    alignItems: 'center',
    gap: 4,
  },
  referralTitle: {
    fontSize: RFValue(14),
    fontFamily: FONTS.bold,
    color: '#FFF',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  referralSub: {
    fontSize: RFValue(9),
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  referralAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 4 }
    }),
  },
  referralActionTxt: {
    fontSize: RFValue(10),
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
  },
  actionArrow: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(252, 142, 114, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityZone: {
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: RFValue(16),
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
    letterSpacing: -0.5,
  },
  seeAllTxt: {
    fontSize: RFValue(11),
    fontFamily: FONTS.bold,
    color: '#FF8E72',
  }
});

export default Home;
