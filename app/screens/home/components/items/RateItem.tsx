import { View, Text, StyleSheet, Platform, useWindowDimensions } from "react-native";
import React from "react";
import { FONTS } from "../../../../constants/Assets";
import Vector from "app/assets/vectors";
import CountryFlag from "react-native-country-flag";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInRight, useAnimatedStyle, withRepeat, withTiming, useSharedValue, interpolate, withSequence, withDelay } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

interface Props {
    id: number;
    fromRate: string;
    fromCurrency: string;
    toRate: string;
    toCurrency: string;
    countryCode: string;
    countryflag: string;
    columnIndex: number;
    totalColumns: number;
}

const RateItem = ({
    fromCurrency,
    toRate,
    toCurrency,
    countryflag,
    columnIndex,
}: Props) => {
    const { width } = useWindowDimensions();

    const pulse = useSharedValue(0);
    const float = useSharedValue(0);

    React.useEffect(() => {
        pulse.value = withRepeat(withTiming(1, { duration: 2000 }), -1, true);
        float.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 2500 }),
                withTiming(0, { duration: 2500 })
            ),
            -1,
            true
        );
    }, []);

    const glowStyle = useAnimatedStyle(() => ({
        opacity: interpolate(pulse.value, [0, 1], [0.4, 1]),
        transform: [{ scale: interpolate(pulse.value, [0, 1], [0.8, 1.2]) }]
    }));

    const cardFloatingStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: interpolate(float.value, [0, 1], [0, -5]) }]
    }));

    // Mock Sparkline Data
    const pathData = "M0 25C10 20 15 35 25 30C35 25 45 10 55 15C65 20 75 5 85 10L100 0";

    return (
        <Animated.View
            entering={FadeInRight.delay(columnIndex * 150).duration(1000)}
            style={[
                localStyles.outerContainer,
                { width: width * 0.72, marginLeft: columnIndex === 0 ? 0 : 16 },
                cardFloatingStyle
            ]}
        >
            <View style={localStyles.mainCard}>
                {/* Decorative Background Elements */}
                <View style={localStyles.bgGlow} />

                <View style={localStyles.content}>
                    <View style={localStyles.topHeader}>
                        <View style={localStyles.currencyPair}>
                            <View style={localStyles.flagWrapper}>
                                <CountryFlag isoCode={countryflag || 'IND'} size={24} style={localStyles.flag} />
                                <View style={localStyles.sourceBadge}>
                                    <Text style={localStyles.sourceSymbol}>£</Text>
                                </View>
                            </View>
                            <View>
                                <Text style={localStyles.pairText}>{fromCurrency} / {toCurrency}</Text>
                                <View style={localStyles.liveStatus}>
                                    <Animated.View style={[localStyles.liveDot, glowStyle]} />
                                    <Text style={localStyles.liveLabel}>Market Rate</Text>
                                </View>
                            </View>
                        </View>

                        <View style={localStyles.chartContainer}>
                            <Svg width="60" height="30" viewBox="0 0 100 40">
                                <Path
                                    d={pathData}
                                    fill="none"
                                    stroke="#FF8E72"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                />
                            </Svg>
                        </View>
                    </View>

                    <View style={localStyles.rateHero}>
                        <View style={localStyles.heroTop}>
                            <Text style={localStyles.fromAmount}>1.00 {fromCurrency}</Text>
                            <Vector as="feather" name="refresh-cw" size={14} color="rgba(59, 47, 47, 0.3)" />
                        </View>
                        <View style={localStyles.heroBottom}>
                            <Text style={localStyles.toAmount}>{toRate}</Text>
                            <Text style={localStyles.toSymbol}>{toCurrency}</Text>
                        </View>
                    </View>

                    <View style={localStyles.divider} />

                    <View style={localStyles.footer}>
                        <LinearGradient
                            colors={['rgba(255, 142, 114, 0.1)', 'rgba(255, 142, 114, 0.02)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={localStyles.featureBadge}
                        >
                            <Vector as="materialicons" name="flash-on" size={12} color="#FF8E72" />
                            <Text style={localStyles.featureText}>Instant Transfer</Text>
                        </LinearGradient>

                        <View style={localStyles.trendSection}>
                            <Vector as="feather" name="trending-up" size={12} color="#10B981" />
                            <Text style={localStyles.trendText}>+0.42%</Text>
                        </View>
                    </View>
                </View>
            </View>
        </Animated.View>
    );
};

const localStyles = StyleSheet.create({
    outerContainer: {
        borderRadius: 28,
        backgroundColor: '#FFF',
        ...Platform.select({
            ios: {
                shadowColor: '#3B2F2F',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.1,
                shadowRadius: 20,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    mainCard: {
        padding: 20,
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(59, 47, 47, 0.03)',
    },
    bgGlow: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255, 142, 114, 0.05)',
        transform: [{ scale: 1.5 }],
    },
    content: {
        zIndex: 1,
    },
    topHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    currencyPair: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    flagWrapper: {
        position: 'relative',
    },
    flag: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 3,
        borderColor: '#FCF5F1',
    },
    sourceBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#3B2F2F',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    sourceSymbol: {
        color: '#FFF',
        fontSize: 10,
        fontFamily: FONTS.bold,
    },
    pairText: {
        fontSize: 14,
        fontFamily: FONTS.bold,
        color: '#3B2F2F',
    },
    liveStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 2,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
    },
    liveLabel: {
        fontSize: 10,
        fontFamily: FONTS.medium,
        color: '#10B981',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    chartContainer: {
        opacity: 0.8,
        marginTop: 5,
    },
    rateHero: {
        marginTop: 24,
        marginBottom: 16,
    },
    heroTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    fromAmount: {
        fontSize: 12,
        fontFamily: FONTS.medium,
        color: 'rgba(59, 47, 47, 0.4)',
    },
    heroBottom: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
    },
    toAmount: {
        fontSize: 32,
        fontFamily: FONTS.bold,
        color: '#3B2F2F',
        letterSpacing: -0.8,
    },
    toSymbol: {
        fontSize: 14,
        fontFamily: FONTS.bold,
        color: '#FF8E72',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(59, 47, 47, 0.05)',
        width: '100%',
        marginBottom: 16,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    featureBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    featureText: {
        fontSize: 10,
        fontFamily: FONTS.bold,
        color: '#FF8E72',
    },
    trendSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    trendText: {
        fontSize: 12,
        fontFamily: FONTS.bold,
        color: '#10B981',
    }
});

export default RateItem;