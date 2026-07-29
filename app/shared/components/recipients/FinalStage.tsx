import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, StyleSheet, TextInput, TouchableOpacity, useWindowDimensions, Platform, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialIcons, FontAwesome5, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Container from "app/theme/Container";
import Button from "app/components/controls/Button";
import CircularProgress from "app/components/CircularProgress";
import { GetCardDetails, GetGDPR, GetPromoCode, GetPurposeOfTransaction, GetWalletBalance, InitTransaction, ValidateSendMoney } from "app/http-services";
import { useRecoilValue } from "recoil";
import Toast from 'react-native-toast-message';
import { ProfileState } from "app/atoms";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ToastConfig from "app/components/ToastConfig";
import { useSetRecoilState } from "recoil";
import { ProfileTabState } from "app/atoms";
import { FONTS, SIZES } from "app/constants/Assets";


const FinalStage = () => {
    const navigation = useNavigation();
    const currentToken = useRecoilValue(ProfileState);
    const [loading, setLoading] = useState(false);
    const [purposeList, setPurposeList] = useState<any[]>([]);
    const [selectedPurpose, setSelectedPurpose] = useState("");
    const [accountBalance, setAccountBalance] = useState("0");
    const [checkedTermsRemitSMS, setCheckedTermsRemitSMS] = useState('N');
    const [checkedTermsRemitEMAIL, setCheckedTermsRemitEMAIL] = useState('N');
    const [checkedTermsInsureSMS, setCheckedTermsInsureSMS] = useState('N');
    const [checkedTermsInsureEMAIL, setCheckedTermsInsureEMAIL] = useState('N');
    const [popupVisible, setPopupVisible] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [promoCode, setPromoCode] = useState<string>("");
    const setProfileTab = useSetRecoilState(ProfileTabState);
    const [amount, setAmount] = useState<number>(500);
    const [promoDiscount, setPromoDiscount] = useState<number>(0);


    // ✅ State for AsyncStorage values
    const [transferDetails, setTransferDetails] = useState({
        sendAmount: "0",
        transferFee: "0",
        transferFeeDiscount: "0",
        amountToBePaid: "0",
        conversionRate: "0",
        DebitfromAccountBalance: "0",
        amountConvert: "0",
    });

    const [recipientDetails, setRecipientDetails] = useState({
        userEmail: "",
        Mobile: "",
        AccountName: "0",
        AccountNumber: "0",
        IFSCCode: "0",
        CashPickup: "0",
        ChannelTransferType: "Banks",
    });

    // ✅ Single state for radio buttons
    const [selectedTransferType, setSelectedTransferType] = useState<"accountBalance" | "debitCard">("accountBalance");

    useEffect(() => {
        fetchPurposeOfTransaction(currentToken.tokenId, currentToken.remitterId);
        fetchStoredTransferData();
        fetchStoredRecipientData();
        fetchWalletBalance(currentToken.tokenId, currentToken.remitterId);
        fetchCardDetails(currentToken.tokenId, currentToken.remitterId);
        fetchGDPR(currentToken.tokenId, currentToken.remitterId);
        fetchValidateSendMoney(currentToken.tokenId, currentToken.remitterId);
    }, []);


    const fetchValidateSendMoney = async (tokenId: string, remitterId: string) => {
        try {
            setLoading(true);
            const response = await ValidateSendMoney();
            if (response.status === 200 && response.data) {
                const data = response.data?.data || response.data;

            }
        } catch (err) {
            console.error("Error fetching send money:", err);
        } finally {
            setLoading(false);
        }
    };



    const fetchWalletBalance = async (tokenId: string, remitterId: string) => {
        try {
            setLoading(true);
            const response = GetWalletBalance({});
            console.log("Response :", response)
            response.then((res: any) => {
                if (res.status === 200) {
                    setAccountBalance(res?.data?.BalanceAmount?.toString() ?? "0");
                }
            })
                .catch((err) => {
                    console.error('Fetch dashboard details', err.response?.data?.message)
                })
                .finally(() => setLoading(false));
        } catch (error) {
            console.error('Error fetching dashboard details:', error);
        }
    };


    const fetchGDPR = async (tokenId: string, remitterId: string) => {
        try {
            setLoading(true);
            const response = GetGDPR(tokenId);
            response.then((res: any) => {
                if (res.status === 200) {
                    setCheckedTermsRemitSMS(res?.data?.Option1)
                    setCheckedTermsRemitEMAIL(res?.data?.Consent)
                    setCheckedTermsInsureSMS(res?.data?.Option2)
                    setCheckedTermsInsureEMAIL(res?.data?.Option3)
                }
            })
                .catch((err) => {
                    console.error('Fetch Remitter profile', err.response?.data?.message)
                })
                .finally(() => setLoading(false));
        } catch (error) {
            console.error('Error Remitter profile:', error);
        }
    };


    const fetchInitTransaction = async (tokenId: string, remitterId: string) => {
        try {
            setLoading(true);

            const res: any = await InitTransaction();
            console.log("Response :", res);

            const statusCode = res?.data?.StatusCode;
            const statusMsg = res?.data?.StatusMsg;

            if (statusMsg) {
                setStatusMessage(statusMsg);
                setPopupVisible(true);
            }

            if (statusCode === "ER00115") {
                setTimeout(() => {
                    setPopupVisible(false);
                    setProfileTab(1);
                    navigation.navigate("Profile" as never);
                }, 2000);
            }

        } catch (error: any) {
            console.error('Fetch Init Transaction Error:', error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };


    const fetchGetPromocode = async (req: { Amount: number; PromocodeValue: string }) => {
        try {
            setLoading(true);
            const res: any = await GetPromoCode(req);

            if (res?.data?.StatusCode === "ER0000" && res.data.promocode?.Offer_Applicable === "Y") {
                const discount = res.data.promocode.Offer_Amount ?? 0;

                setPromoDiscount(discount);
                setPromoCode(req.PromocodeValue);
                setStatusMessage(res.data.StatusMsg);
                Toast.show({
                    type: "success",
                    text1: "Promo Code",
                    text2: res.data.StatusMsg,
                });
            } else if (res?.data?.StatusCode === "ER0001") {
                setStatusMessage("Promo code not applicable");
                Toast.show({
                    type: "error",
                    text1: "Promo Code",
                    text2: res.data.StatusMsg,
                });

            }
        } catch (error: any) {
            console.error(
                "Fetch GetPromoCode error:",
                error.response?.data?.message || error.message
            );
            setStatusMessage("Promo code failed");
        } finally {
            setLoading(false);
        }
    };


    const fetchCardDetails = async (tokenId: string, remitterId: string) => {
        try {
            setLoading(true);
            const response = GetCardDetails(tokenId);
            console.log("Response :", response)
            response.then((res: any) => {
                if (res.status === 200) {

                }
            })
                .catch((err) => {
                    console.error('Fetch dashboard details', err.response?.data?.message)
                })
                .finally(() => setLoading(false));
        } catch (error) {
            console.error('Error fetching dashboard details:', error);
        }
    };

    // ✅ Fetch stored values from AsyncStorage
    const fetchStoredTransferData = async () => {
        try {
            const sendAmount = await AsyncStorage.getItem("sendAmount");
            const transferFee = await AsyncStorage.getItem("Transfer Fee");
            const amountToBePaid = await AsyncStorage.getItem("Amount to be paid");
            const amountConvert = await AsyncStorage.getItem("Amount we'll convert");
            const ConversionRate = await AsyncStorage.getItem("ConversionRate");
            setTransferDetails({
                sendAmount: sendAmount ?? "0",
                transferFee: transferFee ?? "0",
                transferFeeDiscount: "0",
                amountToBePaid: amountToBePaid ?? "0",
                conversionRate: ConversionRate ?? "0",
                DebitfromAccountBalance: amountToBePaid ?? "0",
                amountConvert: amountConvert ?? "0",
            });
        } catch (err) {
            console.error("Error fetching transfer data:", err);
        }
    };

    const fetchStoredRecipientData = async () => {
        try {
            const AccountName = await AsyncStorage.getItem("Account Name");
            const AccountNumber = await AsyncStorage.getItem("Account Number");
            const IFSCCode = await AsyncStorage.getItem("IFSC Code");
            const userEmail = await AsyncStorage.getItem("userEmail");
            const Mobile = await AsyncStorage.getItem("Mobile");
            const CashPickup = await AsyncStorage.getItem("Cash Pickup");
            const ChannelTransferType = await AsyncStorage.getItem("ChannelTransferType");

            setRecipientDetails({
                AccountName: AccountName ?? "0",
                AccountNumber: AccountNumber ?? "0",
                IFSCCode: IFSCCode ?? "0",
                userEmail: userEmail ?? "0",
                Mobile: Mobile ?? "",
                CashPickup: CashPickup ?? "0",
                ChannelTransferType: ChannelTransferType ?? "Banks",
            });
        } catch (err) {
            console.error("Error fetching recipient data:", err);
        }
    };

    // ✅ Fetch dropdown list
    const fetchPurposeOfTransaction = async (tokenId: string, remitterId: string) => {
        try {
            setLoading(true);
            const response = await GetPurposeOfTransaction(tokenId);
            console.log("Response :", response);

            if (response.status === 200 && response.data.POT) {
                const formattedList = response.data.POT
                    .filter((item: any) => item.Value_AnnualIncome !== "0")
                    .map((item: any) => ({
                        dataValue: item.Value_POT,
                        displayvalue: item.Text_POT,
                    }));

                setPurposeList(formattedList);
            }
        } catch (err) {
            console.error("Error fetching Purposeoftransaction list:", err);
        } finally {
            setLoading(false);
        }
    };

    const { width } = useWindowDimensions();

    return (
        <View style={localStyles.container}>
            <StatusBar barStyle="light-content" />

            {/* Immersive Elite Header with Glow */}
            <LinearGradient
                colors={['#1C0D06', '#3A2C2C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={localStyles.immersiveHeader}
            >
                <SafeAreaView edges={['top']} style={localStyles.headerSafe}>
                    <View style={localStyles.headerTop}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={localStyles.backButtonCircle}
                        >
                            <Ionicons name="chevron-back" size={24} color="#FCF5F1" />
                        </TouchableOpacity>
                        <Text style={localStyles.headerTitle}>Review & Pay</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <View style={localStyles.headerAmountSection}>
                        <Text style={localStyles.amountLabel}>Total Payable Amount</Text>
                        <View style={localStyles.amountRow}>
                            <Text style={localStyles.amountText}>
                                {(Number(transferDetails.amountToBePaid) - promoDiscount).toFixed(2)}
                            </Text>
                            <Text style={localStyles.currencyText}>GBP</Text>
                        </View>
                        <View style={localStyles.recipientBadge}>
                            <Ionicons name="person" size={14} color="#FCF5F1" style={{ marginRight: 6 }} />
                            <Text style={localStyles.recipientBadgeText}>
                                To: {recipientDetails.AccountName}
                            </Text>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView
                style={localStyles.contentScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 140, paddingTop: 20 }}
            >
                {/* Section: Payment Method */}
                <View style={localStyles.sectionWrapper}>
                    <Text style={localStyles.sectionTitle}>SELECT PAYMENT METHOD</Text>

                    {/* Wallet Option - Glossy Card */}
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => setSelectedTransferType("accountBalance")}
                        style={[
                            localStyles.paymentCard,
                            selectedTransferType === "accountBalance" && localStyles.paymentCardActive
                        ]}
                    >
                        {selectedTransferType === "accountBalance" ? (
                            <LinearGradient
                                colors={['#3A2C2C', '#1C0D06']}
                                style={localStyles.cardGradientOverlay}
                            >
                                <View style={[localStyles.iconBox, { backgroundColor: 'rgba(252, 245, 241, 0.15)' }]}>
                                    <Ionicons name="wallet-outline" size={24} color="#FCF5F1" />
                                </View>
                                <View style={localStyles.cardContent}>
                                    <Text style={[localStyles.cardLabel, { color: '#FCF5F1' }]}>Wallet Balance</Text>
                                    <Text style={[localStyles.cardValue, { color: 'rgba(252, 245, 241, 0.7)' }]}>
                                        Available: {accountBalance} GBP
                                    </Text>
                                </View>
                                <View style={[localStyles.checkCircle, { borderColor: '#FCF5F1' }]}>
                                    <View style={[localStyles.checkInner, { backgroundColor: '#FCF5F1' }]} />
                                </View>
                            </LinearGradient>
                        ) : (
                            <View style={localStyles.cardInnerUnselected}>
                                <View style={[localStyles.iconBox, { backgroundColor: '#FCF5F1' }]}>
                                    <Ionicons name="wallet-outline" size={24} color="#8E7F77" />
                                </View>
                                <View style={localStyles.cardContent}>
                                    <Text style={localStyles.cardLabel}>Wallet Balance</Text>
                                    <Text style={localStyles.cardValue}>Available: {accountBalance} GBP</Text>
                                </View>
                                <View style={localStyles.checkCircle} />
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Debit Card Option - Glossy Card */}
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => setSelectedTransferType("debitCard")}
                        style={[
                            localStyles.paymentCard,
                            selectedTransferType === "debitCard" && localStyles.paymentCardActive
                        ]}
                    >
                        {selectedTransferType === "debitCard" ? (
                            <LinearGradient
                                colors={['#3A2C2C', '#1C0D06']}
                                style={localStyles.cardGradientOverlay}
                            >
                                <View style={[localStyles.iconBox, { backgroundColor: 'rgba(252, 245, 241, 0.15)' }]}>
                                    <Ionicons name="card-outline" size={24} color="#FCF5F1" />
                                </View>
                                <View style={localStyles.cardContent}>
                                    <Text style={[localStyles.cardLabel, { color: '#FCF5F1' }]}>Debit / Credit Card</Text>
                                    <Text style={[localStyles.cardValue, { color: 'rgba(252, 245, 241, 0.7)' }]}>
                                        Visa, Mastercard, etc.
                                    </Text>
                                </View>
                                <View style={[localStyles.checkCircle, { borderColor: '#FCF5F1' }]}>
                                    <View style={[localStyles.checkInner, { backgroundColor: '#FCF5F1' }]} />
                                </View>
                            </LinearGradient>
                        ) : (
                            <View style={localStyles.cardInnerUnselected}>
                                <View style={[localStyles.iconBox, { backgroundColor: '#FCF5F1' }]}>
                                    <Ionicons name="card-outline" size={24} color="#8E7F77" />
                                </View>
                                <View style={localStyles.cardContent}>
                                    <Text style={localStyles.cardLabel}>Debit / Credit Card</Text>
                                    <Text style={localStyles.cardValue}>Visa, Mastercard, etc.</Text>
                                </View>
                                <View style={localStyles.checkCircle} />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Promo Code Section */}
                <View style={localStyles.sectionWrapper}>
                    <Text style={localStyles.sectionTitle}>APPLY PROMO CODE</Text>
                    <View style={localStyles.promoInputWrapper}>
                        <TextInput
                            style={localStyles.promoInput}
                            placeholder="Promo Code"
                            placeholderTextColor="#8E7F77"
                            value={promoCode}
                            onChangeText={setPromoCode}
                            // @ts-ignore
                            outlineStyle="none"
                        />
                        <TouchableOpacity
                            style={localStyles.promoApplyBtn}
                            onPress={async () => {
                                const sendAmountValue = await AsyncStorage.getItem("sendAmount");
                                fetchGetPromocode({
                                    Amount: Number(sendAmountValue) || 0,
                                    PromocodeValue: promoCode,
                                });
                            }}
                        >
                            <LinearGradient
                                colors={['#3A2C2C', '#1C0D06']}
                                style={localStyles.promoApplyBtnGradient}
                            >
                                <Text style={localStyles.promoApplyText}>Apply</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Ticket-Style Digital Receipt */}
                <View style={localStyles.sectionWrapper}>
                    <Text style={localStyles.sectionTitle}>TRANSACTION DETAILS</Text>
                    <View style={localStyles.ticketCard}>
                        <View style={localStyles.receiptHeader}>
                            <Ionicons name="receipt-outline" size={24} color="#1C0D06" />
                            <Text style={localStyles.receiptHeaderTitle}>Payment Ticket</Text>
                        </View>

                        <View style={localStyles.receiptDivider} />

                        <View style={localStyles.receiptBody}>
                            {recipientDetails.ChannelTransferType === "CGMONEY" ? (
                                <>
                                    {renderEliteRow("Email", `${recipientDetails.userEmail}`)}
                                    {renderEliteRow("Cash pickup point", `${recipientDetails.CashPickup}`)}
                                </>
                            ) : (
                                <>
                                    {renderEliteRow("Recipient Name", `${recipientDetails.AccountName}`)}
                                    {renderEliteRow("Account Number", `${recipientDetails.AccountNumber}`)}
                                    {renderEliteRow("IFSC Code", `${recipientDetails.IFSCCode}`)}
                                    {renderEliteRow("Mobile Number", `${recipientDetails.Mobile || 'N/A'}`)}
                                    {renderEliteRow("Receive Amount", `${transferDetails.sendAmount}`)}
                                </>
                            )}
                        </View>

                        {/* Ticket Notch Divider */}
                        <View style={localStyles.notchDividerWrapper}>
                            <View style={localStyles.leftNotch} />
                            <View style={localStyles.rightNotch} />
                            <View style={localStyles.receiptDashedDivider} />
                        </View>

                        <View style={localStyles.receiptFooter}>
                            {renderEliteRow("Actual Send", `${transferDetails.sendAmount} GBP`)}
                            {renderEliteRow("Transfer Fee", `${transferDetails.transferFee} GBP`)}
                            {promoDiscount > 0 && renderEliteRow("Discount", `-${promoDiscount} GBP`, false, true)}
                            
                            <View style={localStyles.totalRow}>
                                <Text style={localStyles.totalLabel}>Total Payable</Text>
                                <Text style={localStyles.totalValue}>
                                    {Number(transferDetails.amountToBePaid) - promoDiscount} GBP
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Sticky Footer */}
            <View style={localStyles.footer}>
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => fetchInitTransaction(currentToken.tokenId, currentToken.remitterId)}
                    style={localStyles.payButton}
                >
                    <LinearGradient
                        colors={['#3A2C2C', '#1C0D06']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={localStyles.payGradient}
                    >
                        <Text style={localStyles.payText}>Confirm Payment</Text>
                        <Ionicons name="shield-checkmark" size={22} color="#FCF5F1" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <ToastConfig
                visible={popupVisible}
                message={statusMessage}
                onClose={() => {
                    setPopupVisible(false);
                    navigation.navigate("Root" as never);
                }}
            />
        </View>
    );
};

const renderEliteRow = (label: string, value: string, isLast: boolean = false, isDiscount: boolean = false) => (
    <View style={localStyles.eliteRow}>
        <Text style={localStyles.eliteLabel}>{label}</Text>
        <Text style={[localStyles.eliteValue, isDiscount && { color: '#ef4444' }]}>{value}</Text>
    </View>
);

const localStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FCF5F1',
    },
    immersiveHeader: {
        paddingBottom: 40,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        shadowColor: "#1C0D06",
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    headerSafe: {
        paddingHorizontal: 20,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 10 : 20,
        marginBottom: 25,
    },
    backButtonCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FCF5F1',
        fontFamily: FONTS.bold,
    },
    headerAmountSection: {
        alignItems: 'center',
    },
    amountLabel: {
        fontSize: 12,
        color: 'rgba(252, 245, 241, 0.6)',
        fontFamily: FONTS.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 6,
    },

    amountRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
    },
    amountText: {
        fontSize: 48,
        fontWeight: '900',
        color: '#FCF5F1',
        fontFamily: FONTS.bold,
    },
    currencyText: {
        fontSize: 22,
        fontWeight: '700',
        color: 'rgba(252, 245, 241, 0.9)',
        fontFamily: FONTS.bold,
    },
    recipientBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    recipientBadgeText: {
        fontSize: 14,
        color: '#FCF5F1',
        fontFamily: FONTS.medium,
        fontWeight: '600',
    },
    contentScroll: {
        flex: 1,
    },
    sectionWrapper: {
        paddingHorizontal: 20,
        marginBottom: 28,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#8E7F77',
        fontFamily: FONTS.bold,
        letterSpacing: 2,
        marginBottom: 14,
        paddingLeft: 4,
    },
    paymentCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(44, 24, 16, 0.05)',
        shadowColor: "#1C0D06",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 4,
        overflow: 'hidden',
    },
    paymentCardActive: {
        borderColor: '#1C0D06',
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
    },
    cardGradientOverlay: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    cardInnerUnselected: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    iconBox: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
    },
    cardLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1C0D06',
        fontFamily: FONTS.bold,
    },
    cardValue: {
        fontSize: 13,
        color: '#8E7F77',
        fontFamily: FONTS.regular,
        marginTop: 4,
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#D2C5BD',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#1C0D06',
    },
    promoInputWrapper: {
        flexDirection: 'row',
        gap: 12,
    },
    promoInput: {
        flex: 1,
        height: 60,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 20,
        fontSize: 16,
        fontFamily: FONTS.medium,
        color: '#1C0D06',
        borderWidth: 1,
        borderColor: 'rgba(44, 24, 16, 0.05)',
        shadowColor: "#1C0D06",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    promoApplyBtn: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    promoApplyBtnGradient: {
        height: 60,
        paddingHorizontal: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    promoApplyText: {
        color: '#FCF5F1',
        fontSize: 16,
        fontFamily: FONTS.bold,
        fontWeight: '700',
    },
    ticketCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: 24,
        shadowColor: "#1C0D06",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 25,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(44, 24, 16, 0.03)',
    },
    receiptHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    receiptHeaderTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1C0D06',
        fontFamily: FONTS.bold,
    },
    receiptDivider: {
        height: 1,
        backgroundColor: '#FCF5F1',
        marginVertical: 18,
    },
    receiptBody: {
        gap: 14,
    },
    notchDividerWrapper: {
        height: 24,
        justifyContent: 'center',
        marginVertical: 20,
        marginHorizontal: -24,
        position: 'relative',
    },
    leftNotch: {
        position: 'absolute',
        left: -12,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FCF5F1',
        zIndex: 2,
    },
    rightNotch: {
        position: 'absolute',
        right: -12,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FCF5F1',
        zIndex: 2,
    },
    receiptDashedDivider: {
        height: 1,
        borderWidth: 1,
        borderColor: '#D2C5BD',
        borderStyle: 'dashed',
        borderRadius: 1,
        marginHorizontal: 24,
    },
    receiptFooter: {
        gap: 14,
    },
    eliteRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    eliteLabel: {
        fontSize: 14,
        color: '#8E7F77',
        fontFamily: FONTS.medium,
    },
    eliteValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1C0D06',
        fontFamily: FONTS.bold,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 6,
        paddingTop: 18,
        borderTopWidth: 1,
        borderColor: '#FCF5F1',
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1C0D06',
        fontFamily: FONTS.bold,
    },
    totalValue: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1C0D06',
        fontFamily: FONTS.bold,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        backgroundColor: 'rgba(252, 245, 241, 0.95)',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    payButton: {
        height: 64,
        borderRadius: 22,
        overflow: 'hidden',
        shadowColor: "#1C0D06",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    payGradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    payText: {
        color: '#FCF5F1',
        fontSize: 18,
        fontWeight: '800',
        fontFamily: FONTS.bold,
    },
});

export default FinalStage;
