import { RefreshControl, ScrollView, View, BackHandler, StyleSheet, Platform, StatusBar, Alert, useWindowDimensions, Image, TouchableOpacity, Text } from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import moment from "moment";
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
import { scale, verticalScale, moderateScale } from '../../helpers/responsive';
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

      const reqMoney = GetTransactionDetails({
        tokenId, remitterId, fromDate: '', numberTranList: '0', toDate: '', tranList: 'COUNT', transId: '', transactionType: 'MONEY_REMITTANCE', walletMode: 'Sendmoney'
      });

      const reqWallet = GetTransactionDetails({
        tokenId, remitterId, fromDate: '', numberTranList: '0', toDate: '', tranList: 'COUNT', transId: '', transactionType: 'WALLET', walletMode: 'Wallet Transfer'
      });

      const reqAirtime = GetTransactionDetails({
        tokenId, remitterId, fromDate: '', numberTranList: '0', toDate: '', tranList: 'COUNT', transId: '', transactionType: 'AIRTOPUP', walletMode: 'Sendmoney'
      });

      Promise.allSettled([reqMoney, reqWallet, reqAirtime]).then((results) => {
        let allTxns: any[] = [];
        const res1: any = results[0].status === 'fulfilled' ? results[0].value : null;
        const res2: any = results[1].status === 'fulfilled' ? results[1].value : null;
        const res3: any = results[2].status === 'fulfilled' ? results[2].value : null;

        if (res1?.status === 200 && res1?.data?.TransDetails) {
          allTxns = [...allTxns, ...res1.data.TransDetails];
        }
        if (res2?.status === 200 && res2?.data?.TransDetails) {
          const walletTxns = res2.data.TransDetails.map((t: any) => ({ ...t, TransactionType: 'WALLET' }));
          console.log("DEBUG_WALLET_DATES:", walletTxns.map((t: any) => t.TransactionDate));
          console.log("DEBUG_WALLET_TXN_0:", JSON.stringify(walletTxns[0], null, 2));
          allTxns = [...allTxns, ...walletTxns];
        }
        if (res3?.status === 200 && res3?.data?.TransDetails) {
          allTxns = [...allTxns, ...res3.data.TransDetails];
        }

        allTxns = allTxns.map((t: any) => ({
          ...t,
          TransactionMode: !t.TransactionMode || t.TransactionMode.trim() === "" ? "E-Wallet Debit" : t.TransactionMode,
        }));

        // Sort by date descending reliably using London offset logic
        const getLondonOffset = (date: Date): number => {
          try {
            const dtf = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/London', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false });
            const parts = dtf.formatToParts(date);
            const getVal = (type: string) => { const part = parts.find(p => p.type === type); return part ? parseInt(part.value, 10) : 0; };
            const year = getVal('year'); const month = getVal('month') - 1; const day = getVal('day');
            let hour = getVal('hour'); if (hour === 24) hour = 0;
            const minute = getVal('minute'); const second = getVal('second');
            const londonUTCDate = Date.UTC(year, month, day, hour, minute, second);
            const inputUTCDate = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
            return (londonUTCDate - inputUTCDate) / 60000;
          } catch (e) { return 0; }
        };

        const parseDateSort = (txn: any) => {
          const d = txn.TransactionDate;
          if (!d) return 0;
          const formats = [
            "YYYY-MM-DDTHH:mm:ss[Z]",
            "YYYY-MM-DDTHH:mm:ss.SSS[Z]",
            "YYYY-MM-DD HH:mm:ss",
            "M/D/YYYY h:mm:ss A",
            "MM/DD/YYYY hh:mm:ss A",
            "DD/MM/YYYY hh:mm:ss A",
            "DD/MM/YYYY HH:mm:ss",
            "DD-MM-YYYY hh:mm:ss A",
            "DD-MM-YYYY HH:mm:ss",
            "YYYY-MM-DD hh:mm:ss A",
            "YYYY/MM/DD hh:mm:ss A",
            "DD-MM-YYYY",
            "DD/MM/YYYY",
            "DD-MMM-YYYY",
            "DD MMM, YYYY",
            "YYYY/MM/DD",
            "DD MMM YYYY hh:mm:ss A",
            "DD MMM YYYY"
          ];
          const isWalletTxn = txn.TransactionType === 'WALLET' || txn.TransactionMode === 'E-Wallet Debit' || (txn.TransID && txn.TransID.toString().startsWith("EE"));

          if (!isWalletTxn) {
            let m = moment.utc(d, formats);
            if (m.isValid()) {
              const utcDate = new Date(m.format("YYYY-MM-DDTHH:mm:ss[Z]"));
              m.subtract(getLondonOffset(utcDate), "minutes");
              return m.valueOf();
            }
          }
          let m = moment.utc(d, formats, true);
          if (m.isValid()) return m.valueOf();
          return moment(new Date(d)).valueOf() || 0;
        };

        allTxns.sort((a, b) => parseDateSort(b) - parseDateSort(a));

        // Take top 5
        setRecentTransaction(allTxns.slice(0, 5));
      }).catch((err) => {
        console.error('Fetch Transaction details error:', err);
      }).finally(() => setLoading(false));

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
    top: scale(0),
    left: scale(0),
    right: scale(0),
    bottom: scale(0),
    zIndex: -1,
  },
  floatingSymbol: {
    position: 'absolute',
    zIndex: -1,
  },
  scrollContent: {
    paddingBottom: scale(40),
  },
  dynamicContent: {
    marginTop: scale(-20),
    gap: scale(20),
  },
  bentoGrid: {
    marginHorizontal: scale(20),
    gap: scale(15),
  },
  bentoMain: {
    paddingTop: scale(5),
    overflow: 'hidden',
  },
  bentoRow: {
    flexDirection: 'row',
    gap: scale(15),
  },
  bentoHalf: {
    flex: 1,
  },
  insightHeader: {
    marginTop: scale(25),
    marginBottom: scale(15),
    paddingHorizontal: scale(25),
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    marginBottom: scale(8),
    backgroundColor: 'rgba(255, 142, 114, 0.08)',
    alignSelf: 'flex-start',
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: scale(20),
    borderWidth: scale(1),
    borderColor: 'rgba(255, 142, 114, 0.1)',
  },
  liveDot: {
    width: scale(6),
    height: verticalScale(6),
    borderRadius: scale(3),
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
    borderRadius: scale(32),
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#FF8E72', shadowOffset: { width: scale(0), height: 8 }, shadowOpacity: 0.15, shadowRadius: 15 },
      android: { elevation: 8 }
    }),
  },
  referralInner: {
    flex: 1,
    padding: scale(22),
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  referralGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: scale(32),
  },
  giftIconContainer: {
    width: scale(64),
    height: verticalScale(64),
    borderRadius: scale(32),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: scale(1),
    borderColor: 'rgba(255,255,255,0.2)',
  },
  referralTxtBox: {
    alignItems: 'center',
    gap: scale(4),
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
    gap: scale(8),
    backgroundColor: '#FFF',
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderRadius: scale(16),
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: scale(0), height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 4 }
    }),
  },
  referralActionTxt: {
    fontSize: RFValue(10),
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
  },
  actionArrow: {
    width: scale(20),
    height: verticalScale(20),
    borderRadius: scale(10),
    backgroundColor: 'rgba(252, 142, 114, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityZone: {
    marginTop: scale(10),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(25),
    marginBottom: scale(15),
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
