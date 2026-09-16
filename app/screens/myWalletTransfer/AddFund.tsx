import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    ScrollView,
    Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useRecoilValue } from "recoil";
import { ProfileState } from "../../atoms";
import { Ionicons } from "@expo/vector-icons";
import { FONTS } from "app/constants/Assets";
import Vector from "app/assets/vectors";

const AddFund = () => {
    const [amount, setAmount] = useState("");
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [selectedPayment, setSelectedPayment] = useState("ewallet"); // "ewallet" by default
    const currentToken = useRecoilValue(ProfileState);
    const accountBalance = "0.00";
    const currency = "£";

    const handlePayNow = () => {
        (navigation as any).navigate("MyWalletTransfer", { amount: amount, isFromFundRequest: true });
    };

    const renderRadioButton = (value: string) => {
        const isSelected = selectedPayment === value;
        return (
            <Vector
                as="ionicons"
                name={isSelected ? "radio-button-on" : "radio-button-off"}
                size={22}
                color={isSelected ? "#FF8E72" : "#D1D5DB"}
                style={{ marginRight: 12 }}
            />
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.headerContainer, { paddingTop: insets.top || 40 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Fund Requests</Text>
            </View>

            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false}>

                {/* Amount Section */}
                <View style={styles.cardGroup}>
                    <Text style={styles.label}>Enter the Amount</Text>
                    <View style={styles.inputWrapper}>
                        <Text style={styles.currency}>{currency}</Text>
                        <TextInput
                            placeholder="0.00"
                            placeholderTextColor="#9CA3AF"
                            style={styles.input}
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                        />
                    </View>
                    <Text style={styles.balance}>
                        Available Withdraw Wallet Balance {currency}{accountBalance}
                    </Text>
                </View>

                {/* Wallet Transfers */}
                <View style={[styles.sectionHeaderWrapper, { marginTop: 32 }]}>
                    <Text style={[styles.sectionHeading, { color: "#2d3748", fontSize: 20, fontFamily: FONTS.bold, marginLeft: 0, textTransform: 'none', letterSpacing: 0 }]}>Wallet Transfers</Text>
                </View>
                <View style={[styles.cardGroup, { padding: 0, backgroundColor: 'transparent', borderWidth: 0, elevation: 0, shadowOpacity: 0 }]}>
                    <View
                        style={[styles.paymentOptionCard, { backgroundColor: '#FFF0ED', borderRadius: 12, padding: 16 }]}
                    >
                        {renderRadioButton("ewallet")}
                        <View style={styles.paymentInfoCard}>
                            <Text style={[styles.paymentText, { fontSize: 18, color: '#2C1810' }]}>E-Wallet Request</Text>
                            <Text style={[styles.subText, { fontSize: 15, color: '#a0aec0' }]}>Request through e-wallet</Text>
                        </View>
                    </View>
                </View>

                {/* Cards Section */}
                <View style={[styles.sectionHeaderWrapper, { opacity: 0.5 }]}>
                    <Vector as="ionicons" name="card-outline" size={20} color="#FF8E72" />
                    <Text style={[styles.sectionHeading, { color: "#FF8E72", marginTop: 0, marginBottom: 0 }]}>Cards</Text>
                </View>
                <View style={[styles.cardGroup, { opacity: 0.5 }]}>
                    {["debit", "credit"].map((type, index) => (
                        <View key={type}>
                            <TouchableOpacity
                                style={styles.paymentOptionCard}
                                activeOpacity={1}
                                disabled={true}
                            >
                                {renderRadioButton(type)}
                                <View style={styles.paymentInfoCard}>
                                    <Text style={styles.paymentText}>
                                        {type === "debit" ? "Debit Card" : "Credit Card"}
                                    </Text>
                                    <Text style={styles.subText}>Add new card (Visa or Mastercard)</Text>
                                </View>
                                <View style={styles.cardLogos}>
                                    <Image
                                        source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" }}
                                        style={styles.logo}
                                    />
                                    <Image
                                        source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png" }}
                                        style={styles.logo}
                                    />
                                </View>
                            </TouchableOpacity>
                            {index === 0 && <View style={styles.divider} />}
                        </View>
                    ))}
                </View>

                {/* Digital Wallets */}
                <View style={[styles.sectionHeaderWrapper, { opacity: 0.5 }]}>
                    <Vector as="ionicons" name="wallet-outline" size={20} color="#FF8E72" />
                    <Text style={[styles.sectionHeading, { color: "#FF8E72", marginTop: 0, marginBottom: 0 }]}>Digital Wallets</Text>
                </View>
                <View style={[styles.walletsWrapper, { opacity: 0.5 }]}>
                    <View style={styles.walletRow}>
                        <TouchableOpacity style={styles.walletButtonLarge} activeOpacity={1} disabled={true}>
                            <Image source={require('../../assets/images/gpay.png')} style={styles.walletLogoLarge} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.walletButtonLarge} activeOpacity={1} disabled={true}>
                            <Image source={require('../../assets/images/applepay.png')} style={styles.walletLogoLarge} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.walletRow}>
                        <TouchableOpacity style={[styles.walletButtonLarge, { marginRight: 0 }]} activeOpacity={1} disabled={true}>
                            <Image
                                source={require('../../assets/images/paypal.png')}
                                style={styles.walletLogoLarge}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Bank Transfers */}
                <View style={[styles.sectionHeaderWrapper, { opacity: 0.5 }]}>
                    <Vector as="materialcommunityicons" name="bank-outline" size={20} color="#FF8E72" />
                    <Text style={[styles.sectionHeading, { color: "#FF8E72", marginTop: 0, marginBottom: 0 }]}>Bank Transfers</Text>
                </View>
                <View style={[styles.cardGroup, { opacity: 0.5 }]}>
                    <TouchableOpacity
                        style={styles.paymentOptionCard}
                        activeOpacity={1}
                        disabled={true}
                    >
                        {renderRadioButton("netbanking")}
                        <View style={styles.paymentInfoCard}>
                            <Text style={styles.paymentText}>Net Banking</Text>
                            <Text style={styles.subText}>Transfer directly from your bank</Text>
                        </View>
                        <Vector as="materialcommunityicons" name="bank-outline" size={24} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                {/* Action Buttons */}
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.payButton, (!amount || !selectedPayment) && styles.payButtonDisabled]}
                        onPress={handlePayNow}
                        disabled={!amount || !selectedPayment}
                    >
                        <Text style={styles.payText}>Pay Now</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FCF5F1" },
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: "#2C1810",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.05)",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    backButton: {
        padding: 4,
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 17,
        fontFamily: FONTS.bold,
        color: "#fff",
    },
    scrollContent: { paddingVertical: 20, paddingHorizontal: 16 },

    sectionHeaderWrapper: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 24,
        marginBottom: 8,
        marginLeft: 8,
    },
    sectionHeading: {
        fontSize: 15,
        fontFamily: FONTS.semiBold,
        color: "#6B7280",
        marginLeft: 6,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },

    cardGroup: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },

    label: { fontSize: 14, fontFamily: FONTS.medium, marginBottom: 12, color: "#374151" },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F9FAFB",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 52,
    },
    currency: { fontSize: 16, fontFamily: FONTS.semiBold, color: "#111827", marginRight: 8 },
    input: { flex: 1, height: "100%", fontSize: 16, fontFamily: FONTS.semiBold, color: "#111827", ...(Platform.OS === "web" ? { outlineStyle: "none" } as any : {}) },
    balance: { fontSize: 12, fontFamily: FONTS.medium, marginTop: 12, color: "#6B7280" },

    divider: {
        height: 1,
        backgroundColor: "#F3F4F6",
        marginLeft: 34,
        marginVertical: 4,
    },

    paymentOptionCard: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
    },
    paymentInfoCard: { flex: 1 },
    paymentText: { fontSize: 15, fontFamily: FONTS.semiBold, color: "#111827", marginBottom: 2 },
    subText: { fontSize: 12, fontFamily: FONTS.regular, color: "#6B7280" },

    cardLogos: { flexDirection: "row", alignItems: "center" },
    logo: { width: 34, height: 22, resizeMode: "contain", marginLeft: 8 },

    walletsWrapper: {
        marginTop: 4,
    },
    walletRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12
    },
    walletButtonLarge: {
        flex: 1,
        backgroundColor: "#fff",
        height: 60,
        borderRadius: 12,
        marginRight: 12,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    walletLogoLarge: { width: 60, height: 24, resizeMode: "contain" },

    actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 32 },
    cancelButton: {
        flex: 1,
        backgroundColor: "#fff",
        height: 52,
        borderRadius: 26,
        marginRight: 12,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#D1D5DB",
    },
    cancelText: { color: "#374151", fontFamily: FONTS.semiBold, fontSize: 15 },
    payButton: {
        flex: 1,
        backgroundColor: "#FF8E72",
        height: 52,
        borderRadius: 26,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#FF8E72",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    payButtonDisabled: {
        backgroundColor: "#9CA3AF",
        shadowOpacity: 0,
        elevation: 0,
    },
    payText: { color: "#fff", fontFamily: FONTS.semiBold, fontSize: 15 },
});

export default AddFund;
