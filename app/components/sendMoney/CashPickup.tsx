import React, { useEffect, useState, useCallback, useMemo } from "react";
import { apiClient, GetTransactionDetails, GetTransactionLimit, GetTransactionLimits } from 'app/http-services'; // if it's exported there
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Switch,
  Image,
  Modal,
  Platform,
  ActivityIndicator,
} from "react-native";
import Toast from "react-native-toast-message";
import ToastConfig from "app/components/ToastConfig";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import CountryFlag from "react-native-country-flag";
import { MetaService } from "app/services/meta.service";
import { FONTS } from "app/constants/Assets";
import { RFValue } from "react-native-responsive-fontsize";
import { CheckRate, getRequest, SendMoneyCalculates, TransferType } from "app/http-services";
import { ProfileState, SelectedRecipientCurrencyState, SelectedSenderCountryDataState, SelectedSenderCurrencyState, SendMoneyTabState } from "app/atoms";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { TransferTypeListState } from "app/atoms/TransferTypeListState";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useNavigation } from "@react-navigation/native";
import { useNavigation, useFocusEffect } from '@react-navigation/native';


import { GetCountryLists } from "app/http-services";

import ModalPicker from "app/components/customComponents/ModalPicker";

const FeeStep = ({
  label,
  value,
  currency = "GBP",
  isLast,
}: {
  label: string;
  value?: string;
  currency?: string;
  isLast?: boolean;
}) => (
  <View style={styles.feeStep}>
    <View style={styles.timelineContainer}>
      <View style={styles.dot} />
      {!isLast && <View style={styles.verticalLine} />}
    </View>
    <View style={styles.feeTextContainer}>
      <Text
        style={[
          styles.feeValueText,
          label.toLowerCase().includes("total") && styles.feeTextBold,
        ]}
      >
        {value ? `${value} ${currency}` : "--"}
      </Text>
      <Text
        style={[
          styles.feeLabelText,
          label.toLowerCase().includes("total") && styles.feeTextBold,
        ]}
      >
        {label}
      </Text>
    </View>
  </View>
);

const CashPickup = () => {
  const { width } = useWindowDimensions();

  const [isCoupon, setIsCoupon] = useState(false);
  const [coupon, setCoupon] = useState("");
  const currentToken = useRecoilValue(ProfileState);
  const [loading, setLoading] = useState(false);
  const [countryList, setCountryList] = useState<any[]>([]);
  const [recipientCurrency, setRecipientCurrency] = useRecoilState(SelectedRecipientCurrencyState);
  const [searchText, setSearchText] = useState("");
  const [showCurrencyList, setShowCurrencyList] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [warningMsg, setWarningMsg] = useState("");
  const [hasTransactionError, setHasTransactionError] = useState(false);
  const modalShownRef = React.useRef(false);

  /* YOU SEND */
  const [sendCountryList, setSendCountryList] = useState<any[]>([]);
  const [selectedSendCountry, setSelectedSendCountry] = useRecoilState(SelectedSenderCountryDataState);
  const [sendCurrency, setSendCurrency] = useRecoilState(SelectedSenderCurrencyState);

  const [sendAmount, setSendAmount] = useState("1");
  const [recipientAmount, setRecipientAmount] = useState("");
  const [commissionAmount, setCommissionAmount] = useState("");
  const [chargedAmount, setChargedAmount] = useState("");
  const [creditedAmount, setCreditedAmount] = useState("");
  const [checkrateList, setCheckrateList] = useState<any[]>([]);
  const [isSwapped, setIsSwapped] = useState(false);
  const navigation = useNavigation<any>();
  const banksRate = checkrateList?.find((item: { TransferType: string; }) => item.TransferType === "Banks");

  // --- Combined List for Pickers ---
  const combinedCountryList = useMemo(() => {
    const map = new Map();
    sendCountryList.forEach(item => map.set(item.dataValue, item));
    countryList.forEach(item => {
      if (!map.has(item.dataValue)) map.set(item.dataValue, item);
    });
    return Array.from(map.values());
  }, [sendCountryList, countryList]);

  const setTransferTypeList = useSetRecoilState(TransferTypeListState);

  const tabIndex = useRecoilValue(SendMoneyTabState);

  // Reset amount whenever screen comes into focus (handles navigation back)
  useFocusEffect(
    useCallback(() => {
      const resetAmount = async () => {
        // Clear persisted sendAmount from previous transaction
        await AsyncStorage.removeItem("sendAmount");
        setSendAmount("1");
        setRecipientAmount("");
        setCommissionAmount("");
        setChargedAmount("");
        setHasTransactionError(false);
        setIsSwapped(false);
        modalShownRef.current = false;
      };
      resetAmount();
    }, [])
  );

  useEffect(() => {
    if (tabIndex === 0) { // Index for CashPickup
      console.log("CashPickup Tab Active - Fetching Data");
      // Reset 'You Send' on every tab focus
      setSendAmount("1");
      setRecipientAmount("");
      setCommissionAmount("");
      setChargedAmount("");
      setHasTransactionError(false); // Reset error state
      modalShownRef.current = false; // Reset modal shown flag

      const initData = async () => {
        // Clear persisted sendAmount from previous transaction
        await AsyncStorage.removeItem("sendAmount");

        // Initial fetching
        fetchSendCountries();
        fetchCountries();
        fetchTransfertype();
        fetchCheckRate();

        // Re-load 'Recipient Gets' from persistence
        const stored = await AsyncStorage.getItem("selectedRecipientCurrency");
        if (stored) {
          setRecipientCurrency(stored);
          // Explicitly call fetchSendMoney for the default amount of 1
          await fetchSendMoney("1", stored);
        } else {
          // Explicitly call fetchSendMoney for the default amount of 1 if no stored currency
          await fetchSendMoney("1", recipientCurrency || "IND");
        }
      };
      initData();
    }
  }, [tabIndex]);

  // Removed standard useEffect mount as tabIndex effect handles it
  /*
  useEffect(() => {
     fetchSendCountries();
     fetchCountries();
     fetchSendMoney("1");
     fetchTransfertype();
     fetchCheckRate();
  }, []);
  */

  // ✅ Fetch dynamically when amount changes
  // useEffect(() => {
  //   if (sendAmount && !isNaN(Number(sendAmount))) {
  //     fetchSendMoney(sendAmount);
  //   }
  // }, [sendAmount]);


  useEffect(() => {
    const fetchCurrencyAndSendMoney = async () => {
      if (sendAmount && !isNaN(Number(sendAmount))) {
        try {
          const storedCountryCode = await AsyncStorage.getItem("selectedRecipientCurrency");
          console.log("Stored Country Code:", storedCountryCode);

          if (storedCountryCode) {
            await fetchSendMoney(sendAmount, storedCountryCode);
          } else {
            console.warn("No selectedRecipientCurrency found in AsyncStorage");
          }
        } catch (err) {
          console.error("Error reading selectedRecipientCurrency:", err);
        }
      }
    };

    fetchCurrencyAndSendMoney();
  }, [sendAmount]);

  /* ---------------- YOU SEND ---------------- */
  const fetchSendCountries = () => {
    setLoading(true);
    MetaService.fetchCountryMeta(
      true,
      false,
      false,
      async (countries: any[]) => {
        const list = countries.map((c) => ({
          dataValue: c.Alpha_3_Code,
          displayvalue: c.CurrencyCode ?? c.Alpha_3_Code,
          flag: c.Alpha_2_Code
            ? `https://flagcdn.com/w40/${c.Alpha_2_Code.toLowerCase()}.png`
            : null,
        }));
        setSendCountryList(list);

        // Set initial country and currency (amount is already set to "1" in useFocusEffect/tab focus)
        let initialCountry = list[0];
        let initialCurrency = list[0]?.displayvalue || "GBP";

        setSelectedSendCountry(initialCountry);
        setSendCurrency(initialCurrency);

        if (initialCountry?.displayvalue) {
          AsyncStorage.setItem("selectedSendCurrency", initialCountry.displayvalue);
        }

        if (initialCountry?.dataValue) {
          AsyncStorage.setItem("selectedCountryDisplayValue", initialCountry.dataValue);
          // Don't call fetchSendMoney here, it will be triggered by the useEffect watching sendAmount
        }
      },
      () => { },
      () => setLoading(false)
    );
  };

  const fetchCountries = async () => {
    try {
      setLoading(true);
      MetaService.fetchCountryMetas(
        false,
        true,
        false,
        async (countries: any[]) => {
          const list = countries.map((c: any) => ({
            dataValue: c.Alpha_3_Code,
            displayvalue: c.Alpha_3_Code,
            flag: `https://flagcdn.com/w40/${c.Alpha_2_Code.toLowerCase()}.png`,
          }));
          setCountryList(list);

          // ✅ Check AsyncStorage first
          const storedCurrency = await AsyncStorage.getItem(
            "selectedRecipientCurrency"
          );

          if (storedCurrency) {
            setRecipientCurrency(storedCurrency);
          } else {
            // ✅ Default recipient = IND if available, else first country
            const defaultReceive =
              list.find((c) => c.dataValue === "IND") || list[0];
            if (defaultReceive) {
              setRecipientCurrency(defaultReceive.displayvalue || "");
              await AsyncStorage.setItem(
                "selectedRecipientCurrency",
                defaultReceive.displayvalue || ""
              );
            }
          }
        },
        () => { },
        () => setLoading(false)
      );
    } catch (error) {
      console.error("fetchCountries error:", error);
      setLoading(false);
    }
  };


  // ✅ Modified fetchSendMoney to accept amount dynamically
  // const fetchSendMoney = async (amount: string, toCountryCode?: string) => {
  //   try {
  //     setLoading(true);

  //     const countryCode = toCountryCode || recipientCurrency;

  //     const response = await SendMoneyCalculates(Number(amount), countryCode);
  //     if (response.status === 200 && response.data) {
  //       const data = response.data?.data || response.data;

  //       setCommissionAmount(data?.SenderPayerProposal?.CommisionAmount?.Amount?.toString() || '');
  //       setChargedAmount(data?.SenderPayerProposal?.ChargedAmount?.Amount?.toString() || '');
  //       setRecipientAmount(data?.SenderPayerProposal?.CreditedAmount?.Amount?.toString() || '0');
  //     }
  //   } catch (err) {
  //     console.error("Error fetching send money:", err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const fetchSendMoney = async (
    amount: string,
    toCountryCode?: string,
    fromCountryCode?: string,
    reverse?: string
  ) => {
    try {
      setLoading(true);

      const finalTo = toCountryCode || await AsyncStorage.getItem("selectedRecipientCurrency") || recipientCurrency || "IND";
      const finalFrom = fromCountryCode || await AsyncStorage.getItem("selectedCountryDisplayValue") || selectedSendCountry?.dataValue || "GBR";

      const finalCurrency = await AsyncStorage.getItem("selectedSendCurrency") || sendCurrency || "GBP";
      const actualReverse = reverse !== undefined ? reverse : (isSwapped ? finalCurrency : "");
      const isReverseActive = actualReverse !== "";

      const response = await SendMoneyCalculates(
        Number(amount),
        finalTo,
        finalFrom,
        actualReverse
      );
      if (response.status === 200 && response.data) {
        // Check for error status code ER1111
        if (response.data.StatusCode === "ER1111") {
          setHasTransactionError(true); // Always set error state

          // Only show modal if: 1) hasn't been shown yet, 2) modal not visible, 3) THIS tab is active
          if (!modalShownRef.current && !modalVisible && tabIndex === 0) {
            setWarningMsg(response.data.StatusMsg || "Transaction limit exceeded");
            modalShownRef.current = true; // Mark modal as shown
            setModalVisible(true);
          }
          return;
        }

        // Reset error state on successful response
        setHasTransactionError(false);

        const data = response.data?.data || response.data;
        AsyncStorage.setItem("SessionCode", response.data.SessionCode);

        const comm = data?.SenderPayerProposal?.CommisionAmount?.Amount?.toString() || "";
        const total = data?.SenderPayerProposal?.ChargedAmount?.Amount?.toString() || "";
        const cred = data?.SenderPayerProposal?.CreditedAmount?.Amount?.toString() || "0";

        // When swapped, show InitialAmount. When not swapped, show CreditedAmount.
        const recv = isReverseActive
          ? data?.SenderPayerProposal?.InitialAmount?.Amount?.toString() || "0"
          : data?.SenderPayerProposal?.CreditedAmount?.Amount?.toString() || "0";

        setCommissionAmount(comm);
        setChargedAmount(total);
        setCreditedAmount(cred);
        setRecipientAmount(recv);
      }
    } catch (err) {
      console.error("Error fetching send money:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransfertype = async (toCountryCode?: string, fromCountryCode?: string) => {
    try {
      const finalTo = toCountryCode || await AsyncStorage.getItem('selectedRecipientCurrency') || recipientCurrency || "IND";
      const finalFrom = fromCountryCode || await AsyncStorage.getItem('selectedCountryDisplayValue') || selectedSendCountry?.dataValue || "GBR";

      const response = await TransferType(finalTo, finalFrom);

      const tdFields = response?.data?.TransferDetails?.TDFields;

      if (
        response?.data?.StatusCode === "ER0000" &&
        Array.isArray(tdFields) &&
        tdFields.length > 0
      ) {
        const transferTypes = tdFields.map(item => item.TransferType);

        setTransferTypeList(transferTypes); // 🔥 Update Recoil state

        await AsyncStorage.setItem(
          "TransferTypeList",
          JSON.stringify(transferTypes)
        );

        console.log("Saved TransferType List:", transferTypes);
      }

    } catch (err) {
      console.error("fetchTransfertype error:", err);
    }
  };

  const fetchCheckRate = async (toCountryCode?: string, fromCountryCode?: string) => {
    try {
      const finalTo = toCountryCode || await AsyncStorage.getItem("selectedRecipientCurrency") || recipientCurrency || "IND";
      const finalFrom = fromCountryCode || await AsyncStorage.getItem("selectedCountryDisplayValue") || selectedSendCountry?.dataValue || "GBR";

      const response = await CheckRate(finalTo, finalFrom);

      if (response.status === 200 && response.data?.TransferDetails?.TDFields) {
        setCheckrateList(response.data.TransferDetails.TDFields);
      } else {
        setCheckrateList([]);
      }
    } catch (err) {
      console.error("fetchCheckRate error:", err);
      setCheckrateList([]);
    }
  };



  const onSendMoney = async () => {
    try {
      setLoading(true);
      await AsyncStorage.removeItem('selectedRecipientCurrency');
      await AsyncStorage.setItem("Transfer Fee", String(commissionAmount ?? '0'));
      const amountToBePaid = isSwapped
        ? (Number(creditedAmount || 0) + Number(commissionAmount || 0)).toString()
        : String(chargedAmount ?? '0');
      await AsyncStorage.setItem("Amount to be paid", amountToBePaid);
      await AsyncStorage.setItem("Amount we'll convert", recipientAmount);
      await AsyncStorage.setItem("sendAmount", sendAmount);
      await AsyncStorage.setItem("ConversionRate", recipientAmount);
      await AsyncStorage.setItem("selectedRecipientCurrency", recipientCurrency || "");
      await AsyncStorage.setItem("ChannelTransferType", "CGMONEY");

      const sessionCode = await AsyncStorage.getItem("SessionCode");
      const req = {
        SendAmount: Number(sendAmount),
        fromcountry: "GBP",
        sessionCode: sessionCode,
        tocountry: recipientCurrency || "IND",
        tokenId: currentToken.tokenId,
        remitterId: currentToken.remitterId,
      };

      const response = await GetTransactionLimit(req);
      if (response?.data?.StatusCode === "ER00119") {
        setWarningMsg(response.data.StatusMsg);
        setModalVisible(true);
        return;
      }
      navigation.navigate('Recipient', { data: response.data });
    } catch (error) {
      console.error("GetTransactionLimit error:", error);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = !!(sendAmount && !isNaN(Number(sendAmount)) && recipientCurrency !== "Select" && !hasTransactionError);


  const handleSwap = () => {
    const nextSwapped = !isSwapped;
    setIsSwapped(nextSwapped);
    fetchSendMoney(sendAmount, undefined, undefined, nextSwapped ? (sendCurrency || "") : "");
  };

  return (
    <ScrollView
      style={{ backgroundColor: "transparent" }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.mainWrapper}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#3B2F2F" />
          </View>
        )}

        {/* TWO-TONE SPLIT CARD */}
        <View style={styles.splitCard}>
          
          {/* TOP SECTION: DARK BROWN */}
          <View style={styles.topSection}>
            <View style={styles.headerRow}>
              <View style={styles.labelWithIcon}>
                <View style={styles.iconCircleWhite}>
                  <Ionicons name="arrow-up" size={16} color="#3B2F2F" />
                </View>
                <Text style={styles.labelWhite}>You Send</Text>
              </View>
              
              <View style={styles.currencyPickerWrapper}>
                <ModalPicker
                  selectedValue={isSwapped ? recipientCurrency : selectedSendCountry?.dataValue}
                  onValueChange={(val: any) => {
                    if (isSwapped) {
                      setRecipientCurrency(val);
                      AsyncStorage.setItem("selectedRecipientCurrency", val);
                      fetchSendMoney(sendAmount, val, selectedSendCountry?.dataValue, sendCurrency || "");
                      fetchTransfertype(val, selectedSendCountry?.dataValue);
                      fetchCheckRate(val, selectedSendCountry?.dataValue);
                    } else {
                      const c = sendCountryList.find((item) => item.dataValue === val);
                      if (c) {
                        setSelectedSendCountry(c);
                        setSendCurrency(c.displayvalue);
                        AsyncStorage.setItem("selectedSendCurrency", c.displayvalue);
                        AsyncStorage.setItem("selectedCountryDisplayValue", c.dataValue);
                        fetchTransfertype(recipientCurrency || "IND", c.dataValue);
                        fetchCheckRate(recipientCurrency || "IND", c.dataValue);
                        fetchSendMoney(sendAmount, recipientCurrency || "IND", c.dataValue, "");
                      }
                    }
                  }}
                  dataList={isSwapped ? countryList : sendCountryList}
                  placeholder="Select"
                />
              </View>
            </View>

            <TextInput
              style={styles.amountInputWhite}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={sendAmount}
              onChangeText={(t) => setSendAmount(t.replace(/[^0-9.]/g, ""))}
            />

            {/* Translucent Fee Box */}
            <View style={styles.translucentFeeBox}>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabelWhite}>Transfer Fee</Text>
                <Text style={styles.feeValueWhite}>{commissionAmount} {sendCurrency || "GBP"}</Text>
              </View>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabelWhite}>Total Amount</Text>
                <Text style={styles.feeValueWhite}>{chargedAmount} {sendCurrency || "GBP"}</Text>
              </View>
              <View style={[styles.feeRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <Text style={styles.feeLabelWhite}>Exchange Rate</Text>
                <Text style={styles.feeValueWhite}>1 {sendCurrency || "GBP"} = {recipientAmount} {recipientCurrency || "IND"}</Text>
              </View>
            </View>
          </View>

          {/* Overlapping Swap Button on the Right */}
          <View style={styles.swapButtonWrapper}>
            <TouchableOpacity style={styles.swapButton} onPress={handleSwap} activeOpacity={0.8}>
              <Ionicons name="swap-vertical" size={24} color="#3B2F2F" />
            </TouchableOpacity>
          </View>

          {/* BOTTOM SECTION: WHITE */}
          <View style={styles.bottomSection}>
            <View style={styles.headerRow}>
              <View style={styles.labelWithIcon}>
                <View style={styles.iconCircleGrey}>
                  <Ionicons name="arrow-down" size={16} color="#A3968F" />
                </View>
                <Text style={styles.labelDark}>Recipient Gets</Text>
              </View>

              <View style={styles.currencyPickerWrapper}>
                <ModalPicker
                  selectedValue={isSwapped ? selectedSendCountry?.dataValue : recipientCurrency}
                  onValueChange={(val: any) => {
                    if (isSwapped) {
                      const c = sendCountryList.find((item) => item.dataValue === val);
                      if (c) {
                        setSelectedSendCountry(c);
                        setSendCurrency(c.displayvalue);
                        AsyncStorage.setItem("selectedSendCurrency", c.displayvalue);
                        AsyncStorage.setItem("selectedCountryDisplayValue", c.dataValue);
                        fetchTransfertype(recipientCurrency || "IND", c.dataValue);
                        fetchCheckRate(recipientCurrency || "IND", c.dataValue);
                        fetchSendMoney(sendAmount, recipientCurrency || "IND", c.dataValue, c.displayvalue || "");
                      }
                    } else {
                      setRecipientCurrency(val);
                      AsyncStorage.setItem("selectedRecipientCurrency", val);
                      fetchSendMoney(sendAmount, val, selectedSendCountry?.dataValue, "");
                      fetchTransfertype(val, selectedSendCountry?.dataValue);
                      fetchCheckRate(val, selectedSendCountry?.dataValue);
                    }
                  }}
                  dataList={isSwapped ? sendCountryList : countryList}
                  placeholder="Select"
                />
              </View>
            </View>

            <TextInput
              style={styles.amountInputDark}
              keyboardType="numeric"
              value={recipientAmount}
              editable={false}
              placeholder="0.00"
              placeholderTextColor="#A3968F"
            />
          </View>

        </View>

        {/* ACTION BUTTON */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.sendButton, !isFormValid && styles.disabledButton]}
            onPress={onSendMoney}
            disabled={!isFormValid}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#4A3C3C", "#3B2F2F"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendButtonGradient}
            >
              <Text style={styles.sendButtonText}>Send Money Now</Text>
              <View style={styles.sendIconWrapper}>
                <Ionicons name="arrow-forward" size={20} color="#3B2F2F" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
          <View style={styles.secureBadge}>
            <Ionicons name="lock-closed" size={12} color="#059669" />
            <Text style={styles.secureText}>Secure SSL Encryption</Text>
          </View>
        </View>
      </View>

      {/* Warning Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          modalShownRef.current = false;
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconInner}>
                <Ionicons name="alert-circle" size={32} color="#f59e0b" />
              </View>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalTitle}>Notice</Text>
              <Text style={styles.modalMessage}>{warningMsg}</Text>

              <View style={styles.modalActionWrapper}>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    modalShownRef.current = false;
                  }}
                  activeOpacity={0.8}
                  style={styles.modalOkButton}
                >
                  <Text style={styles.modalOkText}>I Understand</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default CashPickup;

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
  mainWrapper: {
    paddingHorizontal: 20,
    paddingTop: 16,
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    backgroundColor: "rgba(252,245,241,0.8)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 32,
  },
  splitCard: {
    borderRadius: 36,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 12,
    overflow: "hidden",
    position: "relative",
    zIndex: 1,
  },
  topSection: {
    backgroundColor: "#3B2F2F", // Dark brown
    padding: 28,
    paddingTop: 32,
    paddingBottom: 40,
  },
  bottomSection: {
    backgroundColor: "#FFFFFF",
    padding: 28,
    paddingTop: 40,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircleWhite: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircleGrey: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5E5E5",
    justifyContent: "center",
    alignItems: "center",
  },
  labelWhite: {
    fontSize: RFValue(14),
    fontFamily: FONTS.bold,
    color: "#FFFFFF",
  },
  labelDark: {
    fontSize: RFValue(14),
    fontFamily: FONTS.bold,
    color: "#3B2F2F",
  },
  currencyPickerWrapper: {
    width: 150,
  },
  amountInputWhite: {
    fontSize: RFValue(24),
    fontFamily: FONTS.bold,
    color: "#FFFFFF",
    marginTop: 10,
    marginBottom: 20,
    paddingVertical: 0,
    borderWidth: 0,
    // @ts-ignore
    outlineStyle: "none",
  },
  amountInputDark: {
    fontSize: RFValue(24),
    fontFamily: FONTS.bold,
    color: "#3B2F2F",
    marginTop: 10,
    paddingVertical: 0,
    borderWidth: 0,
    // @ts-ignore
    outlineStyle: "none",
  },
  translucentFeeBox: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    marginRight: 65,
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  feeLabelWhite: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },
  feeValueWhite: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  swapButtonWrapper: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -26 }],
    zIndex: 20,
  },
  swapButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E5E5E5",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  footer: {
    marginTop: 32,
    alignItems: "center",
  },
  sendButton: {
    width: "100%",
    borderRadius: 24,
    shadowColor: "#3B2F2F",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  sendButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 32,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 24,
    height: 64,
  },
  disabledButton: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  sendButtonText: {
    color: "#FCF5F1",
    fontSize: 16,
    fontWeight: "800",
    fontFamily: "System",
    letterSpacing: 0.5,
  },
  sendIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 20,
    backgroundColor: "#E8DCD5",
    justifyContent: "center",
    alignItems: "center",
  },
  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    backgroundColor: "rgba(5, 150, 105, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  secureText: {
    fontSize: 12,
    color: "#059669", // Emerald green
    fontFamily: "System",
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FCF5F1", // Peach background
    borderRadius: 36, // Softer radius
    padding: 32, // More padding for premium feel
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 20,
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalIconInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FDEBDE", // Soft peach glow for warning
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: {
    alignItems: "center",
    width: "100%",
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: "System",
    fontWeight: "800",
    color: "#3B2F2F", // Peach Dark
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: "#7A6C66", // Mocha color
    textAlign: "center",
    fontFamily: "System",
    lineHeight: 24,
    marginBottom: 32,
  },
  modalActionWrapper: {
    width: "100%",
  },
  modalOkButton: {
    width: "100%",
    backgroundColor: "#3B2F2F", // Peach Dark Button
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: "center",
  },
  modalOkText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "System",
    fontWeight: "800",
  },
});