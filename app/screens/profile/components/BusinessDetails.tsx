import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Platform,
    useWindowDimensions,
} from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import { useRecoilValue } from "recoil";

import { ProfileState } from "app/atoms";
import ModalPicker from "app/components/customComponents/ModalPicker";
import { MetaService } from "app/services/meta.service";
import { TDropDown } from "types";
import { AddBusinesspersonalDetails, GetBusinesspersonalDetails } from "app/http-services";
import { FONTS } from "app/constants/Assets";
import Vector from "app/assets/vectors";

const SectionHeader = ({ title }: { title: string }) => (
    <View style={localStyles.sectionHeaderBox}>
        <Text style={localStyles.sectionTitleText}>{String(title).toUpperCase()}</Text>
        <View style={localStyles.pulseDot} />
    </View>
);

const FieldRow = ({ label, value, icon, onChange, placeholder, editable = true }: any) => (
    <View style={localStyles.fieldGroup}>
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
            />
        </View>
    </View>
);

export default function BusinessDetails() {
    const { width: screenWidth } = useWindowDimensions();
    const currentToken = useRecoilValue(ProfileState);
    const [companyName, setCompanyName] = useState("");
    const [regNumber, setRegNumber] = useState("");
    const [businessName, setBusinessName] = useState("");
    const [companyType, setCompanyType] = useState("Finance");
    const [countryCode, setCountryCode] = useState("IN");
    const [countryName, setCountryName] = useState("India");
    const [countryList, setCountryList] = useState<TDropDown[]>([]);
    const [date, setDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [loading, setLoading] = useState(false);

    const companyTypeList = [
        { dataValue: "Banking", displayvalue: "Banking" },
        { dataValue: "Network", displayvalue: "Network" },
        { dataValue: "Finance", displayvalue: "Finance" },
    ];

    useEffect(() => {
        fetchCountries();
    }, []);

    useEffect(() => {
        if (countryList.length > 0 && currentToken.tokenId) {
            fetchBusinessDetails();
        }
    }, [countryList, currentToken.tokenId]);

    const fetchCountries = async () => {
        MetaService.fetchCountryMetas(false, true, false, (countries: any[]) => {
            setCountryList(countries.map(c => ({
                dataValue: c.Alpha_2_Code,
                displayvalue: c.CountryName,
                name: c.CountryName,
                Alpha_2_Code: c.Alpha_2_Code,
                price: '0',
                description: '',
                id: c.CountryId || 0,
                image: ''
            } as any)));
        }, () => { }, () => { });
    };

    const fetchBusinessDetails = async () => {
        try {
            setLoading(true);
            const res: any = await GetBusinesspersonalDetails({});
            if (res?.status === 200 && res?.data?.StatusCode === "ER0000") {
                const details = res.data?.BusinessDetail?.[0] || {};
                setCompanyName(details.CompanyName || "");
                setRegNumber(details.RegistrationNumber || "");
                setBusinessName(details.RegisteredBusinessName || "");
                setCompanyType(details.CompanyType || "Finance");
                setCountryName(details.Country || "India");
                
                const found = countryList.find(c => c.displayvalue === details.Country);
                if (found) setCountryCode(found.dataValue);
                
                if (details.IncorporateDate) {
                    const cleanDate = String(details.IncorporateDate).replace(/\\\//g, "/");
                    const d = new Date(cleanDate);
                    if (!isNaN(d.getTime())) setDate(d);
                }
            }
        } catch (err) {
            console.error("fetchBusinessDetails Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!companyName || !regNumber || !businessName) {
            Toast.show({ type: "error", text2: "Please fill all required fields." });
            return;
        }
        try {
            setLoading(true);
            const res: any = await AddBusinesspersonalDetails({
                CompanyName: companyName,
                CompanyType: companyType,
                Country: countryName,
                IncorporateDate: date.toISOString().split("T")[0],
                RegisteredBusinessName: businessName,
                RegistrationNumber: regNumber,
            });
            if (res?.data?.StatusCode === "ER0000") {
                Toast.show({ type: "success", text2: "Business Profile updated successfully" });
                fetchBusinessDetails();
            } else {
                Toast.show({ type: "error", text2: res?.data?.StatusMsg || "Failed to update profile" });
            }
        } catch (err) {
            console.error("handleSave Error:", err);
            Toast.show({ type: "error", text2: "An error occurred while saving" });
        } finally {
            setLoading(false);
        }
    };

    const cardWidth = Math.min(screenWidth - 30, 600);

    return (
        <ScrollView
            style={localStyles.scroll}
            contentContainerStyle={localStyles.scrollContent}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}
        >
            <View style={[localStyles.card, { width: cardWidth }]}>
                <SectionHeader title="BUSINESS ENTITY" />

                <FieldRow label="REGISTERED COMPANY NAME" value={companyName} onChange={(v: string) => setCompanyName(v.replace(/[^A-Za-z\s]/g, ''))} placeholder="Enter Name" icon="office-building-outline" />
                <FieldRow label="REGISTRATION NUMBER" value={regNumber} onChange={setRegNumber} placeholder="Enter Reg #" icon="card-bulleted-outline" />
                <FieldRow label="TRADING/BUSINESS NAME" value={businessName} onChange={(v: string) => setBusinessName(v.replace(/[^A-Za-z\s]/g, ''))} placeholder="Enter Business Name" icon="briefcase-outline" />

                <View style={localStyles.pickerGroup}>
                    <Text style={localStyles.fieldLabel}>COMPANY TYPE</Text>
                    <ModalPicker
                        label=""
                        dataList={companyTypeList}
                        selectedValue={companyType}
                        onValueChange={setCompanyType}
                        placeholder="Select Type"
                        isPremium
                        iconName="domain"
                        iconType="materialcommunityicons"
                    />
                </View>

                <View style={localStyles.pickerGroup}>
                    <Text style={localStyles.fieldLabel}>COUNTRY OF REGISTRATION</Text>
                    <ModalPicker
                        label=""
                        dataList={countryList}
                        selectedValue={countryCode}
                        onValueChange={(val) => {
                            setCountryCode(val);
                            const selected = countryList.find(c => c.dataValue === val);
                            if (selected) setCountryName(selected.displayvalue);
                        }}
                        isPremium
                        iconName="earth"
                        iconType="materialcommunityicons"
                    />
                </View>

                <View style={localStyles.fieldGroup}>
                    <Text style={localStyles.fieldLabel}>INCORPORATION DATE</Text>
                    <TouchableOpacity 
                        activeOpacity={0.7}
                        onPress={() => setShowPicker(true)} 
                        style={localStyles.inputWrapper}
                    >
                        <MaterialCommunityIcons name="calendar-clock" size={18} color="#A19188" style={{ marginRight: 12 }} />
                        <Text style={localStyles.textValue}>
                            {date ? date.toLocaleDateString() : "---"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {showPicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display="default"
                        onChange={(e, d) => {
                            setShowPicker(false);
                            if (d) setDate(d);
                        }}
                    />
                )}

                <TouchableOpacity onPress={handleSave} disabled={loading} style={localStyles.saveBtn} activeOpacity={0.8}>
                    <LinearGradient colors={['#FFB09C', '#FF8E72']} style={localStyles.gradient}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <View style={localStyles.buttonContent}>
                                <Text style={localStyles.saveText}>UPDATE BUSINESS PROFILE</Text>
                                <Vector as="ionicons" name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 10 }} />
                            </View>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const localStyles = StyleSheet.create({
    scroll: {
        flex: 1,
        backgroundColor: '#FCF5F1',
    },
    scrollContent: {
        paddingVertical: 20,
        alignItems: 'center',
        paddingBottom: 120,
    },
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
        fontSize: RFValue(11),
        fontFamily: FONTS.semibold,
        color: '#3A2D27',
        fontWeight: '600',
        flex: 1,
    },
    saveBtn: {
        marginTop: 15,
        height: 56,
        borderRadius: 18,
        overflow: 'hidden',
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    saveText: {
        color: '#fff',
        fontFamily: FONTS.bold,
        fontSize: RFValue(12),
        letterSpacing: 1,
    },
});
