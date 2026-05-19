import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    useWindowDimensions,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Platform,
    ScrollView
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { LinearGradient } from "expo-linear-gradient";
import { useRecoilValue } from "recoil";
import Toast from "react-native-toast-message";

import { ProfileState } from "app/atoms";
import { PutChangePassword } from "app/http-services";
import { confirmPasswordValidator, passwordValidator } from "app/core/utils";
import { FONTS, SIZES, SHADOWS } from "app/constants/Assets";
import Vector from "app/assets/vectors";

const SectionHeader = ({ title }: { title: string }) => (
    <View style={localStyles.sectionHeaderBox}>
        <Text style={localStyles.sectionTitleText}>{String(title).toUpperCase()}</Text>
        <View style={localStyles.pulseDot} />
    </View>
);

const PasswordInput = ({ label, value, onChange, error, secure, onToggleSecure, placeholder, icon }: any) => (
    <View style={localStyles.fieldGroup}>
        <Text style={localStyles.fieldLabel}>{String(label).toUpperCase()}</Text>
        <View style={[localStyles.inputWrapper, error ? { borderColor: '#EF4444' } : null]}>
            <MaterialCommunityIcons name={icon} size={18} color="#A19188" style={{ marginRight: 12 }} />
            <TextInput
                style={[localStyles.textValue, Platform.select({ web: { outlineStyle: 'none' } }) as any]}
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                placeholderTextColor="#94A3B8"
                secureTextEntry={secure}
            />
            <TouchableOpacity onPress={onToggleSecure} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={localStyles.eyeIcon}>
                <Ionicons name={secure ? "eye-off-outline" : "eye-outline"} size={20} color="#A19188" />
            </TouchableOpacity>
        </View>
        {error ? <Text style={localStyles.errorText}>{error}</Text> : null}
    </View>
);

const ChangePassword = () => {
    const { width: screenWidth } = useWindowDimensions();
    const currentToken = useRecoilValue(ProfileState);
    const [loading, setLoading] = useState(false);

    const [password, setPassword] = useState({ value: '', error: '' });
    const [newPassword, setNewPassword] = useState({ value: '', error: '' });
    const [confirmPassword, setConfirmPassword] = useState({ value: '', error: '' });

    const [secure, setSecure] = useState({ p: true, n: true, c: true });

    const onChangePassword = async () => {
        const pE = passwordValidator(password.value);
        const nE = passwordValidator(newPassword.value);
        const cE = confirmPasswordValidator(newPassword.value, confirmPassword.value);

        if (pE || nE || cE) {
            setPassword({ ...password, error: pE || '' });
            setNewPassword({ ...newPassword, error: nE || '' });
            setConfirmPassword({ ...confirmPassword, error: cE || '' });
            return;
        }

        setLoading(true);
        try {
            const res: any = await PutChangePassword({
                tokenId: currentToken.tokenId,
                remitterId: currentToken.remitterId,
                newPassword: newPassword.value,
                oldPassword: password.value,
            });
            if (res.status === 200) {
                Toast.show({ type: 'success', text2: 'Password updated successfully' });
                setPassword({ value: '', error: '' });
                setNewPassword({ value: '', error: '' });
                setConfirmPassword({ value: '', error: '' });
            }
        } catch (e) {
            Toast.show({ type: 'error', text2: 'Failed to update password' });
        } finally {
            setLoading(false);
        }
    };

    const cardWidth = Math.min(screenWidth - 30, 600);

    return (
        <ScrollView 
            style={{ flex: 1, backgroundColor: '#FCF5F1' }}
            contentContainerStyle={{ alignItems: 'center', paddingVertical: 20, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
        >
            <View style={[localStyles.card, { width: cardWidth }]}>
                <SectionHeader title="SECURITY SETTINGS" />

                <PasswordInput
                    label="CURRENT PASSWORD"
                    value={password.value}
                    onChange={(v: string) => setPassword({ value: v, error: '' })}
                    error={password.error}
                    secure={secure.p}
                    onToggleSecure={() => setSecure({ ...secure, p: !secure.p })}
                    placeholder="••••••••"
                    icon="key-outline"
                />

                <View style={localStyles.divider} />

                <PasswordInput
                    label="NEW PASSWORD"
                    value={newPassword.value}
                    onChange={(v: string) => setNewPassword({ value: v, error: '' })}
                    error={newPassword.error}
                    secure={secure.n}
                    onToggleSecure={() => setSecure({ ...secure, n: !secure.n })}
                    placeholder="Min. 8 characters"
                    icon="lock-outline"
                />

                <PasswordInput
                    label="CONFIRM NEW PASSWORD"
                    value={confirmPassword.value}
                    onChange={(v: string) => setConfirmPassword({ value: v, error: '' })}
                    error={confirmPassword.error}
                    secure={secure.c}
                    onToggleSecure={() => setSecure({ ...secure, c: !secure.c })}
                    placeholder="Re-enter new password"
                    icon="lock-check-outline"
                />

                <TouchableOpacity onPress={onChangePassword} disabled={loading} style={localStyles.actionBtn} activeOpacity={0.8}>
                    <LinearGradient colors={['#FFB09C', '#FF8E72']} style={localStyles.gradient}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={localStyles.actionText}>REVISE SECURITY KEY</Text>}
                    </LinearGradient>
                </TouchableOpacity>

                <View style={localStyles.hintBox}>
                    <Ionicons name="information-circle-outline" size={16} color="#8E7F77" style={{ marginRight: 8 }} />
                    <Text style={localStyles.hintText}>Updating your password will require re-authentication on all active sessions.</Text>
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
    fieldGroup: {
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
    textValue: {
        flex: 1,
        fontSize: RFValue(12.5),
        fontFamily: FONTS.semibold,
        color: '#3A2D27',
        fontWeight: '600',
    },
    eyeIcon: {
        marginLeft: 10,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 10,
        marginTop: 6,
        fontWeight: '600',
        paddingLeft: 4,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(59, 47, 47, 0.05)',
        marginVertical: 15,
        marginBottom: 25,
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
    hintBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 20,
        paddingHorizontal: 10,
    },
    hintText: {
        flex: 1,
        color: '#8E7F77',
        fontSize: 11,
        lineHeight: 18,
        fontFamily: FONTS.medium,
    },
});

export default ChangePassword;
