import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  useWindowDimensions,
  StyleSheet,
  Platform,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useRecoilValue } from "recoil";
import Spinner from "react-native-loading-spinner-overlay";
import moment from "moment";
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
} from "react-native-popup-menu";

import { SIZES, FONTS } from "app/constants/Assets";
import { RFValue } from "react-native-responsive-fontsize";
import { ITransaction } from "types";
import { ProfileState } from "app/atoms";
import TransactionCard from "./components/TransactionCard";
import { GetReferDetails, GetTransactionDetails } from "app/http-services";
import GroupButton from "app/components/controls/GroupButton";
import Vector from "app/assets/vectors";

const Transactions = () => {
  const isFocused = useIsFocused();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const currentToken = useRecoilValue(ProfileState);

  const [currency, setCurrency] = useState("£");
  const [transactionType, setTransactionType] =
    useState<"MONEY_REMITTANCE" | "AIRTOPUP">("MONEY_REMITTANCE");
  const [loading, setLoading] = useState(false);
  const [reward, setReward] = useState("");
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch refer details
  const fetchReferDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await GetReferDetails(currentToken.tokenId);
      if (res?.status === 200) {
        setReward(res?.data?.Refer?.PotentialEarning || "");
      }
    } catch (err: any) {
      console.error("Fetch refer details:", err.response?.data?.message || err);
    } finally {
      setLoading(false);
    }
  }, [currentToken.tokenId]);

  // Fetch transactions
  const fetchTransactionDetails = useCallback(
    async (
      period: "ALL" | "1MONTH" | "6MONTH" | "1YEAR",
      transType: "MONEY_REMITTANCE" | "AIRTOPUP"
    ) => {
      setLoading(true);
      setTransactionType(transType);

      let fromDate = "";
      const toDate = moment().format("YYYY-MM-DD");

      if (period !== "ALL") {
        const periods: Record<string, moment.unitOfTime.DurationConstructor> = {
          "1MONTH": "months",
          "6MONTH": "months",
          "1YEAR": "years",
        };
        const value = period === "6MONTH" ? 6 : period === "1YEAR" ? 1 : 1;
        fromDate = moment().subtract(value, periods[period]).format("YYYY-MM-DD");
      }

      const request = {
        tokenId: currentToken.tokenId,
        remitterId: currentToken.remitterId,
        fromDate,
        toDate,
        numberTranList: "0",
        tranList: "COUNT",
        transId: "",
        transactionType: transType,
        walletMode: "Sendmoney",
      };

      try {
        const res: any = await GetTransactionDetails(request);
        if (res.status === 200) {
          const fixedList = (res?.data?.TransDetails || []).map((t: any) => ({
            ...t,
            TransactionMode:
              !t.TransactionMode || t.TransactionMode.trim() === ""
                ? "E-Wallet Debit"
                : t.TransactionMode,
          }));

          const sorted = fixedList.sort((a: ITransaction, b: ITransaction) =>
            (a.DestinationCountry || "").localeCompare(b.DestinationCountry || "")
          );

          setTransactions(sorted);
        }
      } catch (err: any) {
        console.error("Fetch Transaction details:", err.response?.data?.message || err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentToken.tokenId, currentToken.remitterId]
  );

  useEffect(() => {
    const _currency = process.env.CURRENCY_SYMBOL || "£";
    setCurrency(_currency);
    fetchReferDetails();
    fetchTransactionDetails("ALL", transactionType);
  }, [isFocused, fetchReferDetails, fetchTransactionDetails, transactionType]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactionDetails("ALL", transactionType);
  };

  const onChangeTransactionType = (selected: string) => {
    const type = selected === "Airtime Topup" ? "AIRTOPUP" : "MONEY_REMITTANCE";
    fetchTransactionDetails("ALL", type);
  };

  return (
    <View style={localStyles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <Spinner visible={loading} />

      <SafeAreaView style={localStyles.safeArea} edges={['top']}>
        {/* ── MINIMAL PEACH HEADER ── */}
        <View style={localStyles.headerRow}>
          {/* Back */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={localStyles.backBtn}
            activeOpacity={0.7}
          >
            <Vector as="ionicons" name="chevron-back" size={22} color="#3B2F2F" />
          </TouchableOpacity>

          {/* Pill badge */}
          <View style={localStyles.historyPill}>
            <View style={localStyles.pillDot} />
            <Text style={localStyles.pillLabel}>HISTORY</Text>
          </View>

          {/* Filter */}
          <Menu>
            <MenuTrigger>
              <View style={localStyles.filterBtn}>
                <Vector
                  as="materialcommunityicons"
                  name="filter-variant"
                  size={20}
                  color="#3B2F2F"
                />
              </View>
            </MenuTrigger>
            <MenuOptions customStyles={{ optionsContainer: localStyles.menuOptions }}>
              {[
                { label: "🔄 Reset", period: "ALL" },
                { label: "📅 Last month", period: "1MONTH" },
                { label: "📆 Last 6 months", period: "6MONTH" },
                { label: "🗓️ Last 1 year", period: "1YEAR" },
              ].map((opt) => (
                <MenuOption
                  key={opt.period}
                  onSelect={() => fetchTransactionDetails(opt.period as any, transactionType)}
                >
                  <Text style={menuStyles.option}>{opt.label}</Text>
                </MenuOption>
              ))}
            </MenuOptions>
          </Menu>
        </View>

        {/* ── LARGE PAGE TITLE ── */}
        <Text style={localStyles.pageTitle}>Transaction History</Text>
      </SafeAreaView>

      {/* ── SCROLLABLE CONTENT ── */}
      <ScrollView
        style={localStyles.scrollArea}
        contentContainerStyle={localStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF8E72"
            colors={["#FF8E72"]}
          />
        }
      >
        {/* Tab switcher */}
        <View style={localStyles.tabWrapper}>
          <GroupButton
            width={width * 0.45 - 20}
            onPress={onChangeTransactionType}
            buttons={["Money Transfer", "Airtime Topup"]}
          />
        </View>

        {/* Transaction list */}
        <TransactionCard item={transactions} />
      </ScrollView>
    </View>
  );
};

export default Transactions;

const menuStyles = {
  option: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    fontSize: RFValue(11),
    color: "#1e293b",
    fontFamily: FONTS.semibold,
  },
};

const localStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FCF5F1',
  },
  safeArea: {
    backgroundColor: '#FCF5F1',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  // ── Header ──
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59,47,47,0.07)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 30,
    ...Platform.select({
      ios: { shadowColor: '#3B2F2F', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  pillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FF8E72',
  },
  pillLabel: {
    fontSize: RFValue(8),
    fontFamily: FONTS.bold,
    color: '#3B2F2F',
    letterSpacing: 1.5,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59,47,47,0.07)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Page title ──
  pageTitle: {
    fontSize: RFValue(20),
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: '#3B2F2F',
    letterSpacing: -0.5,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 8,
    textAlign: 'center',
  },

  // ── Scroll ──
  scrollArea: {
    flex: 1,
    backgroundColor: '#FCF5F1',
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // ── Tab ──
  tabWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    backgroundColor: 'transparent',
    marginHorizontal: 15,
    marginBottom: 15,
    marginTop: 5,
  },

  menuOptions: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    borderRadius: 18,
    width: 190,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
});
