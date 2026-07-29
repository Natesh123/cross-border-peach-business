import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    ViewStyle,
    ScrollView,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    useWindowDimensions,
    Platform,
    ActivityIndicator
} from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import moment from "moment";
import { useRecoilValue } from "recoil";
import { useIsFocused } from "@react-navigation/native";

import { GetDocument, GetGDPR } from "app/http-services";
import { ProfileState } from "app/atoms";
import { FONTS, SIZES, SHADOWS } from "../../../constants/Assets";
import Checkbox from "../../../components/Checkbox";
import Vector from "app/assets/vectors";

type Props = {
    profile: any;
    style?: ViewStyle;
};

const FieldRow = ({ label, value, icon, isHalf = false }: { label: string; value?: string; icon: any; isHalf?: boolean }) => (
    <View style={[localStyles.fieldGroup, isHalf && { flex: 1, paddingRight: 6 }]}>
        <Text style={localStyles.fieldLabel}>{String(label).toUpperCase()}</Text>
        <View style={[localStyles.inputWrapper, !value && localStyles.disabledInput]}>
            <MaterialCommunityIcons name={icon} size={18} color="#A19188" style={{ marginRight: 12 }} />
            <View style={localStyles.textContainer}>
                <Text style={localStyles.textValue} numberOfLines={1}>
                    {value || "---"}
                </Text>
            </View>
        </View>
    </View>
);

const SectionHeader = ({ title }: { title: string }) => (
    <View style={localStyles.sectionHeaderBox}>
        <Text style={localStyles.sectionTitleText}>{String(title).toUpperCase()}</Text>
        <View style={localStyles.pulseDot} />
    </View>
);

const PersonalDetails = ({ profile }: Props) => {
    const { width: screenWidth } = useWindowDimensions();
    const isFocused = useIsFocused();
    const currentToken = useRecoilValue(ProfileState);
    const [documentCount, setDocumentCount] = useState(0);
    const [gdpr, setGdpr] = useState({ rSMS: 'N', rEmail: 'N', iSMS: 'N', iEmail: 'N' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isFocused) {
            fetchData();
        }
    }, [isFocused]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const docRes: any = await GetDocument(currentToken.tokenId);
            if (docRes.status === 200 && docRes.data.StatusCode === "ER0000") {
                setDocumentCount(docRes.data.Document?.length || 0);
            }

            const gdprRes: any = await GetGDPR(currentToken.tokenId);
            if (gdprRes.status === 200) {
                setGdpr({
                    rSMS: gdprRes.data.Option1,
                    rEmail: gdprRes.data.Consent,
                    iSMS: gdprRes.data.Option2,
                    iEmail: gdprRes.data.Option3
                });
            }
        } catch (e) {
            console.error("fetchData error:", e);
        } finally {
            setLoading(false);
        }
    };

    const cardWidth = Math.min(screenWidth - 30, 600);

    const formattedDOB = profile?.DOB
        ? moment(String(profile.DOB).replace(/\\\//g, "/")).format('MMMM DD, YYYY')
        : "--";

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: '#FCF5F1' }}
            contentContainerStyle={{ paddingVertical: 20, alignItems: 'center', paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
        >
            {/* IDENTIFICATION CARD */}
            <View style={[localStyles.card, { width: cardWidth }]}>
                <SectionHeader title="IDENTIFICATION" />

                <View style={localStyles.row}>
                    <FieldRow label="FIRST NAME" value={profile?.FirstName} icon="account-outline" isHalf />
                    <FieldRow label="LAST NAME" value={profile?.LastName} icon="account-details-outline" isHalf />
                </View>

                <FieldRow label="EMAIL ADDRESS" value={profile?.Email} icon="email-outline" />
                <FieldRow label="MOBILE CONTACT" value={profile?.Mobile} icon="phone-outline" />
                <FieldRow label="DATE OF BIRTH" value={formattedDOB} icon="calendar-outline" />
            </View>

            {/* ADDRESS CARD */}
            <View style={[localStyles.card, { width: cardWidth, marginTop: 20 }]}>
                <SectionHeader title="RESIDENTIAL ADDRESS" />
                <FieldRow label="STREET ADDRESS (1)" value={profile?.Address1} icon="home-outline" />
                <FieldRow label="STREET ADDRESS (2)" value={profile?.Address2} icon="home-city-outline" />

                <View style={localStyles.row}>
                    <FieldRow label="COUNTRY" value={profile?.CountryName} icon="earth" isHalf />
                    <FieldRow label="POSTAL CODE" value={profile?.PostCode} icon="mailbox-outline" isHalf />
                </View>
            </View>

            {/* VERIFICATION CARD */}
            <View style={[localStyles.card, { width: cardWidth, marginTop: 20 }]}>
                <SectionHeader title="VERIFICATION & CONSENT" />

                <View style={localStyles.infoPill}>
                    <LinearGradient
                        colors={['rgba(255, 142, 114, 0.1)', 'rgba(255, 142, 114, 0.05)']}
                        style={localStyles.pillGradient}
                    >
                        <MaterialCommunityIcons name="file-document-outline" size={20} color="#FF8E72" style={{ marginRight: 12 }} />
                        <Text style={localStyles.pillText}>KYC DOCUMENTS: {String(documentCount)}</Text>
                        <View style={localStyles.statusDot} />
                    </LinearGradient>
                </View>

                <View style={localStyles.divider} />

                <View style={localStyles.consentGroup}>
                    <Text style={localStyles.consentLabel}>MARKETING PERMISSIONS</Text>

                    {[
                        { label: "SMS Notifications (Cross Border)", val: gdpr.rSMS },
                        { label: "Email Offers (Cross Border)", val: gdpr.rEmail },
                        { label: "SMS Notifications (Insure)", val: gdpr.iSMS },
                        { label: "Email Offers (Insure)", val: gdpr.iEmail },
                    ].map((item, idx) => (
                        <TouchableOpacity key={idx} style={localStyles.checkboxRow} activeOpacity={0.7}>
                            <Checkbox 
                                status={item.val === 'Y' ? 'checked' : 'unchecked'} 
                                onPress={() => { }} 
                                color="#FF8E72"
                            />
                            <Text style={localStyles.checkboxText}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
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
    row: {
        flexDirection: 'row',
        width: '100%',
    },
    fieldGroup: {
        marginBottom: 20,
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
    textContainer: {
        flex: 1,
    },
    textValue: {
        fontSize: RFValue(11),
        fontFamily: FONTS.semibold,
        color: '#3A2D27',
        fontWeight: '600',
    },
    infoPill: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 10,
    },
    pillGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 18,
    },
    pillText: {
        fontSize: RFValue(11),
        fontFamily: FONTS.bold,
        color: '#3B2F2F',
        flex: 1,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(59, 47, 47, 0.05)',
        marginVertical: 20,
    },
    consentGroup: {
        marginTop: 5,
    },
    consentLabel: {
        fontSize: RFValue(10),
        fontFamily: FONTS.bold,
        color: '#8E7F77',
        letterSpacing: 1,
        marginBottom: 18,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    checkboxText: {
        fontSize: RFValue(11),
        fontFamily: FONTS.medium,
        color: '#5D4F4F',
        marginLeft: 12,
        flex: 1,
    },
});

export default PersonalDetails;
