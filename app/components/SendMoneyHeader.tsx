import React from "react";
import { useNavigation } from "@react-navigation/native";
import { TouchableOpacity, Text, StyleSheet, View, Platform, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS, SIZES } from "../constants/Assets";

type Props = {
    title?: string;
    subtitle?: string;
};

const SendMoneyHeader = ({ title = 'Send Money', subtitle = 'TRANSFER FUNDS SECURELY' }: Props) => {
    const navigation = useNavigation();

    return (
        <View style={styles.outerContainer}>
            <LinearGradient
                colors={['#2A1F1F', '#1A1212']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.container}
            >
                {/* Decorative Faint Swirls/Ellipses */}
                <View style={styles.decorativeCircle1} />
                <View style={styles.decorativeCircle2} />

                <View style={styles.content}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-back" size={24} color="#FCF5F1" />
                    </TouchableOpacity>

                    <View style={styles.textContainer}>
                        <Text style={styles.titleText}>{title}</Text>
                        <View style={styles.subtitleRow}>
                            <View style={styles.greenDot} />
                            <Text style={styles.subtitleText}>{subtitle}</Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        backgroundColor: '#FCF5F1',
    },
    container: {
        paddingTop: Platform.OS === 'ios' ? 55 : (StatusBar.currentHeight || 20) + 20,
        paddingBottom: 48,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 56,
        borderBottomRightRadius: 56,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 12,
        overflow: 'hidden',
    },
    decorativeCircle1: {
        position: 'absolute',
        top: -60,
        right: -40,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
    },
    decorativeCircle2: {
        position: 'absolute',
        bottom: -40,
        left: -60,
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        zIndex: 10,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    textContainer: {
        marginLeft: 20,
        flex: 1,
        justifyContent: 'center',
    },
    titleText: {
        fontSize: SIZES.p34,
        color: '#FFFFFF',
        fontFamily: FONTS.bold,
        letterSpacing: 0.5,
    },
    subtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    greenDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
        marginRight: 6,
        shadowColor: "#10B981",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 2,
    },
    subtitleText: {
        fontSize: SIZES.p22,
        color: 'rgba(255, 255, 255, 0.5)',
        fontFamily: FONTS.bold,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
});

export default SendMoneyHeader;

