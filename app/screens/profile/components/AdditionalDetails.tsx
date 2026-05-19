import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Platform,
    useWindowDimensions
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { LinearGradient } from "expo-linear-gradient";
import { useIsFocused } from "@react-navigation/native";
import { useRecoilValue } from "recoil";
import Toast from "react-native-toast-message";

import { ProfileState } from "app/atoms";
import { MetaService } from "app/services/meta.service";
import ModalPicker from "app/components/customComponents/ModalPicker";
import TransactionalPreferences from "./TransactionalPreferences";
import {
    GetOccupation,
    ViewPreferCountry,
    GetIndustry,
    GetAnnualIncome,
    GetPurposeOfTransaction,
    UpdateRemitterProfile
} from "app/http-services";
import { FONTS, SIZES, SHADOWS } from "app/constants/Assets";
import Vector from "app/assets/vectors";

const SectionHeader = ({ title }: { title: string }) => (
    <View style={localStyles.sectionHeaderBox}>
        <Text style={localStyles.sectionTitleText}>{String(title).toUpperCase()}</Text>
        <View style={localStyles.pulseDot} />
    </View>
);

const FieldRow = ({ label, value, icon, onChange, placeholder, editable = true, isHalf = false, keyboardType = "default" }: any) => (
    <View style={[localStyles.fieldGroup, isHalf && { flex: 1, paddingRight: 6 }]}>
        <Text style={localStyles.fieldLabel}>{String(label).toUpperCase()}</Text>
        <View style={[localStyles.inputWrapper, !editable && localStyles.disabledInput]}>
            <MaterialCommunityIcons name={icon} size={18} color="#A19188" style={{ marginRight: 12 }} />
            <TextInput
                style={[localStyles.textValue, Platform.select({ web: { outlineStyle: 'none' } }) as any]}
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                placeholderTextColor="#94A3B8"
                editable={editable}
                keyboardType={keyboardType}
            />
        </View>
    </View>
);

const AdditionalDetails = ({ profile }: any) => {
    const { width: screenWidth } = useWindowDimensions();
    const isFocused = useIsFocused();
    const currentToken = useRecoilValue(ProfileState);

    const [loading, setLoading] = useState(false);
    const [companyName, setCompanyName] = useState(profile?.CompanyName || '');
    const [occupation, setOccupation] = useState({ value: profile?.Occupation || '' });
    const [industry, setIndustry] = useState({ value: profile?.OrgType || '' });
    const [annualincome, setAnnualincome] = useState({ value: profile?.AnnualIncome || '' });
    const [purposeoftransaction, setPurposeoftransaction] = useState({ value: '' });
    const [country, setCountry] = useState({ value: '' });
    const [amountPerTransaction, setAmountPerTransaction] = useState({ value: '' });
    const [numberOfTransactionsPerMonth, setNumberOfTransactionsPerMonth] = useState({ value: '' });

    const [countryList, setCountryList] = useState<any[]>([]);
    const [occupationList, setOccupationList] = useState<any[]>([]);
    const [industryList, setIndustryList] = useState<any[]>([]);
    const [annualincomeList, setAnnualincomeList] = useState<any[]>([]);
    const [purposeoftransactionList, setPurposeoftransactionList] = useState<any[]>([]);
    const [preferCountryList, setPreferCountryList] = useState<any[]>([]);

    useEffect(() => {
        fetchCountries();
        fetchLists();
    }, []);

    useEffect(() => {
        if (isFocused) fetchViewPreferCountry();
    }, [isFocused]);

    const fetchCountries = () => {
        MetaService.fetchCountryMetas(false, true, false, (countries: any[]) => {
            setCountryList(countries.map(c => ({
                dataValue: c.Alpha_2_Code,
                displayvalue: c.CountryName,
            })));
        }, () => { }, () => { });
    };

    const fetchLists = async () => {
        try {
            setLoading(true);
            const [occ, ind, ann, pur] = await Promise.all([
                GetOccupation(currentToken.tokenId),
                GetIndustry(currentToken.tokenId),
                GetAnnualIncome(currentToken.tokenId),
                GetPurposeOfTransaction(currentToken.tokenId)
            ]);

            if (occ.data.OccpationDetail) setOccupationList(occ.data.OccpationDetail.filter((i: any) => i.Value_occupation !== "0").map((i: any) => ({ dataValue: i.Value_occupation, displayvalue: i.Text_occupation })));
            if (ind.data.Industry) setIndustryList(ind.data.Industry.filter((i: any) => i.Value_Industry !== "0").map((i: any) => ({ dataValue: i.Value_Industry, displayvalue: i.Text_Industry })));
            if (ann.data.AnnualIncome) setAnnualincomeList(ann.data.AnnualIncome.filter((i: any) => i.Value_AnnualIncome !== "0").map((i: any) => ({ dataValue: i.Value_AnnualIncome, displayvalue: i.Annual_Income })));
            if (pur.data.POT) setPurposeoftransactionList(pur.data.POT.filter((i: any) => i.Value_POT !== "0").map((i: any) => ({ dataValue: i.Value_POT, displayvalue: i.Text_POT })));
        } finally {
            setLoading(false);
        }
    };

    const fetchViewPreferCountry = async () => {
        const res: any = await ViewPreferCountry(currentToken.tokenId);
        if (res.status === 200 && res.data.StatusCode === "ER0000") setPreferCountryList(res.data.prefercountry || []);
    };

    const handleUpdateProfile = async () => {
        if (!companyName || !occupation.value) {
            Toast.show({ type: 'error', text2: 'Please fill all mandatory fields' });
            return;
        }
        setLoading(true);
        try {
            const res: any = await UpdateRemitterProfile({
                remitterId: currentToken.remitterId,
                tokenId: currentToken.tokenId,
                CompanyName: companyName,
                Occupation: occupation.value,
                OrgType: industry.value,
                AnnualIncome: annualincome.value,
            });
            if (res?.data?.StatusCode === 'ER0000') {
                Toast.show({ type: 'success', text2: 'Profile updated successfully' });
            } else {
                Toast.show({ type: 'error', text2: res?.data?.StatusMsg || 'Update failed' });
            }
        } finally {
            setLoading(false);
        }
    };

    const cardWidth = Math.min(screenWidth - 30, 600);

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: '#FCF5F1' }}
            contentContainerStyle={{ paddingVertical: 20, alignItems: 'center', paddingBottom: 120 }}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}
        >
            {/* PROFESSIONAL INFO CARD */}
            <View style={[localStyles.card, { width: cardWidth }]}>
                <SectionHeader title="PROFESSIONAL STATUS" />

                <FieldRow label="EMPLOYER NAME" value={companyName} onChange={(v: string) => setCompanyName(v.replace(/[^A-Za-z\s]/g, ''))} placeholder="Enter Employer" icon="office-building-outline" />

                <View style={localStyles.pickerGroup}>
                    <Text style={localStyles.fieldLabel}>ROLE / OCCUPATION</Text>
                    <ModalPicker 
                        dataList={occupationList} 
                        selectedValue={occupation.value} 
                        onValueChange={(v) => setOccupation({ value: v })} 
                        label="" 
                        isPremium 
                        iconName="account-work-outline"
                        iconType="materialcommunityicons"
                    />
                </View>

                <View style={localStyles.pickerGroup}>
                    <Text style={localStyles.fieldLabel}>INDUSTRY TYPE</Text>
                    <ModalPicker 
                        dataList={industryList} 
                        selectedValue={industry.value} 
                        onValueChange={(v) => setIndustry({ value: v })} 
                        label="" 
                        isPremium 
                        iconName="domain"
                        iconType="materialcommunityicons"
                    />
                </View>

                <View style={localStyles.pickerGroup}>
                    <Text style={localStyles.fieldLabel}>ANNUAL GROSS INCOME</Text>
                    <ModalPicker 
                        dataList={annualincomeList} 
                        selectedValue={annualincome.value} 
                        onValueChange={(v) => setAnnualincome({ value: v })} 
                        label="" 
                        isPremium 
                        iconName="cash-multiple"
                        iconType="materialcommunityicons"
                    />
                </View>

                <TouchableOpacity onPress={handleUpdateProfile} style={localStyles.actionBtn} activeOpacity={0.8}>
                    <LinearGradient colors={['#FFB09C', '#FF8E72']} style={localStyles.gradient}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={localStyles.actionText}>UPDATE PROFESSIONAL PROFILE</Text>}
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* TRANSACTION PREFERENCES CARD */}
            <View style={[localStyles.card, { width: cardWidth, marginTop: 20 }]}>
                <SectionHeader title="TRANSACTIONAL LIMITS" />
                <TransactionalPreferences preferCountry={preferCountryList} onPress={() => { }} />

                <View style={localStyles.divider} />

                <Text style={localStyles.miniHeader}>ADD NEW PREFERENCE</Text>

                <View style={localStyles.pickerGroup}>
                    <Text style={localStyles.fieldLabel}>TARGET COUNTRY</Text>
                    <ModalPicker 
                        dataList={countryList} 
                        selectedValue={country.value} 
                        onValueChange={(v) => setCountry({ value: v })} 
                        label="" 
                        isPremium 
                        iconName="earth"
                        iconType="materialcommunityicons"
                    />
                </View>

                <View style={localStyles.pickerGroup}>
                    <Text style={localStyles.fieldLabel}>PRIMARY PURPOSE</Text>
                    <ModalPicker 
                        dataList={purposeoftransactionList} 
                        selectedValue={purposeoftransaction.value} 
                        onValueChange={(v) => setPurposeoftransaction({ value: v })} 
                        label="" 
                        isPremium 
                        iconName="bullseye-arrow"
                        iconType="materialcommunityicons"
                    />
                </View>

                <View style={localStyles.row}>
                    <FieldRow label="APPROX. AMOUNT" value={amountPerTransaction.value} onChange={(v: any) => setAmountPerTransaction({ value: v.replace(/[^0-9]/g, '') })} placeholder="0.00" icon="cash-multiple" isHalf keyboardType="numeric" />
                    <FieldRow label="COUNT / MONTH" value={numberOfTransactionsPerMonth.value} onChange={(v: any) => setNumberOfTransactionsPerMonth({ value: v.replace(/[^0-9]/g, '') })} placeholder="0" icon="numeric-1-circle-outline" isHalf keyboardType="numeric" />
                </View>

                <TouchableOpacity style={localStyles.secondaryBtn} activeOpacity={0.7}>
                    <Text style={localStyles.secondaryBtnText}>ADD PREFERENCE</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const localStyles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 142, 114, 0.2)',
        ...Platform.select({
            ios: { shadowColor: '#3A2D27', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20 },
            android: { elevation: 5 },
        }),
    },
    sectionHeaderBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 25,
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 142, 114, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#FF8E72",
        marginLeft: 10,
    },
    sectionTitleText: {
        fontSize: RFValue(11),
        fontFamily: FONTS.bold,
        color: '#3B2F2F',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    fieldGroup: {
        marginBottom: 20,
        width: '100%',
    },
    pickerGroup: {
        marginBottom: 20,
        width: '100%',
    },
    fieldLabel: {
        fontSize: RFValue(10),
        fontFamily: FONTS.semibold,
        color: '#6E5D54',
        letterSpacing: 0.5,
        marginBottom: 8,
        paddingLeft: 4,
        fontWeight: '600',
    },
    inputWrapper: {
        height: RFValue(48),
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E2C5BD',
        paddingHorizontal: 16,
        ...Platform.select({
            ios: { shadowColor: '#3A2D27', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8 },
            android: { elevation: 2 },
        }),
    },
    disabledInput: {
        backgroundColor: '#F8FAFC',
        borderColor: '#E2E8F0',
        opacity: 0.7,
    },
    textValue: {
        fontSize: RFValue(12.5),
        fontFamily: FONTS.semibold,
        color: '#3A2D27',
        fontWeight: '600',
        flex: 1,
    },
    actionBtn: {
        marginTop: 10,
        height: 56,
        borderRadius: 18,
        overflow: 'hidden',
        ...Platform.select({
            ios: { shadowColor: '#FF8E72', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15 },
            android: { elevation: 6 }
        }),
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionText: {
        color: '#fff',
        fontFamily: FONTS.bold,
        fontSize: 14,
        letterSpacing: 1,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(59, 47, 47, 0.05)',
        marginVertical: 25,
    },
    miniHeader: {
        fontSize: 11,
        fontFamily: FONTS.bold,
        color: '#8E7F77',
        letterSpacing: 2,
        marginBottom: 20,
        textTransform: 'uppercase',
    },
    row: {
        flexDirection: 'row',
        width: '100%',
    },
    secondaryBtn: {
        marginTop: 15,
        height: 56,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 142, 114, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 142, 114, 0.2)',
    },
    secondaryBtnText: {
        color: '#FF8E72',
        fontFamily: FONTS.bold,
        fontSize: 14,
        letterSpacing: 1,
    },
});

export default AdditionalDetails;
