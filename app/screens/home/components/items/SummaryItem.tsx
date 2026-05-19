import { View, Text, StyleSheet, Platform, useWindowDimensions, TouchableOpacity } from "react-native";
import React from "react";
import { FONTS } from "../../../../constants/Assets";
import { RFValue } from "react-native-responsive-fontsize";
import Vector from "app/assets/vectors";
import { SummaryModel } from "app/models/summary-model";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
    FadeInDown,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    useSharedValue,
    interpolate,
    withSpring,
    withDelay,
    withSequence
} from "react-native-reanimated";
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import { line, curveBasis } from "d3-shape";
import COLORS from "../../../../constants/Colors";

interface ExtendedSummaryModel extends SummaryModel {
    variant?: 'large' | 'small' | 'referral';
    trend?: string;
    trendUp?: boolean;
    isBento?: boolean;
    onPress?: () => void;
    subtitle?: string;
}

const Sparkline = ({ data, color, width, height }: { data: number[], color: string, width: number, height: number }) => {
    const margin = 2;

    // Native linear scale for X and Y to avoid missing d3-scale dependency
    const getX = (i: number) => margin + (i / (data.length - 1)) * (width - 2 * margin);
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const getY = (d: number) => (height - margin) - ((d - min) / range) * (height - 2 * margin);

    const lineGenerator = line<number>()
        .x((_, i) => getX(i))
        .y(d => getY(d))
        .curve(curveBasis)(data);

    return (
        <Svg width={width} height={height}>
            <Defs>
                <SvgGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={color} stopOpacity="0.3" />
                    <Stop offset="1" stopColor={color} stopOpacity="0" />
                </SvgGradient>
            </Defs>
            <Path
                d={lineGenerator || ""}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
            />
            <Path
                d={`${lineGenerator} L ${getX(data.length - 1)} ${height} L ${getX(0)} ${height} Z`}
                fill="url(#grad)"
            />
        </Svg>
    );
};

const SummaryItem = ({ id, icon, title, value, variant = 'small', trend, trendUp = true, isBento, onPress, subtitle }: ExtendedSummaryModel) => {
    const { width } = useWindowDimensions();
    const isLarge = variant === 'large';
    const isReferral = variant === 'referral';

    // Animation values
    const flow = useSharedValue(0);
    const pressScale = useSharedValue(1);
    const pulse = useSharedValue(1);

    React.useEffect(() => {
        flow.value = withRepeat(withTiming(1, { duration: 6000 }), -1, true);
        if (id === 2) { // Activity Pulse animation
            pulse.value = withRepeat(
                withSequence(
                    withTiming(1.2, { duration: 800 }),
                    withTiming(1, { duration: 800 })
                ), -1, true
            );
        }
    }, [id]);

    const auroraStyle1 = useAnimatedStyle(() => ({
        transform: [
            { translateX: interpolate(flow.value, [0, 1], [0, 30]) },
            { translateY: interpolate(flow.value, [0, 1], [0, -20]) },
            { scale: interpolate(flow.value, [0, 1], [1, 1.4]) },
        ],
        opacity: interpolate(flow.value, [0, 1], [0.3, 0.6]),
    }));

    const auroraStyle2 = useAnimatedStyle(() => ({
        transform: [
            { translateX: interpolate(flow.value, [0, 1], [0, -40]) },
            { translateY: interpolate(flow.value, [0, 1], [0, 20]) },
            { scale: interpolate(flow.value, [0, 1], [1.2, 0.8]) },
        ],
        opacity: interpolate(flow.value, [0, 1], [0.2, 0.5]),
    }));

    const pulseIconStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }],
        opacity: interpolate(pulse.value, [1, 1.2], [1, 0.8]),
    }));

    const cardAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pressScale.value }],
    }));

    const config = [
        { main: COLORS.primary, secondary: COLORS.primaryDeep, bg: COLORS.executive.peachSoft, stroke: COLORS.primary },
        { main: COLORS.secondary, secondary: '#4A3B3B', bg: '#F2EFED', stroke: COLORS.secondary },
        { main: COLORS.primaryDeep, secondary: COLORS.primary, bg: '#FFF5F0', stroke: COLORS.primaryDeep },
        { main: COLORS.executive.gold, secondary: '#B8860B', bg: COLORS.secondary, stroke: COLORS.executive.gold },
    ];

    const cfg = isReferral ? config[3] : config[(id - 1) % 3];
    const cardWidth = isBento ? '100%' : isLarge ? width - 40 : (width - 55) / 2;

    // Mock data for sparkline
    const sparkData = id === 1 ? [10, 15, 8, 20, 18, 25, 22] : [5, 8, 12, 7, 10, 15, 13];

    return (
        <TouchableOpacity
            activeOpacity={1}
            onPress={onPress}
            onPressIn={() => (pressScale.value = withSpring(0.96))}
            onPressOut={() => (pressScale.value = withSpring(1))}
            style={{ width: cardWidth }}
        >
            <Animated.View
                style={[
                    localStyles.card,
                    isLarge && localStyles.cardLarge,
                    isBento && localStyles.cardBento,
                    cardAnimatedStyle,
                    isReferral && { backgroundColor: COLORS.secondary, borderColor: 'rgba(212, 175, 55, 0.15)' }
                ]}
            >
                {/* Immersive Background */}
                <View style={[localStyles.bgContainer, { backgroundColor: cfg.bg }]}>
                    {!isReferral && (
                        <>
                            <Animated.View style={[localStyles.blob, { backgroundColor: cfg.main, width: 160, height: 160, bottom: -40, right: -40 }, auroraStyle1]} />
                            <Animated.View style={[localStyles.blob, { backgroundColor: cfg.secondary, width: 120, height: 120, top: -20, left: -20 }, auroraStyle2]} />
                        </>
                    )}
                    {isReferral && (
                        <LinearGradient
                            colors={['#3B2F2F', '#2D2424', '#1A1515']}
                            style={StyleSheet.absoluteFill}
                        />
                    )}
                    <LinearGradient
                        colors={isReferral ? ['transparent', 'rgba(212, 175, 55, 0.05)'] : ['rgba(255,255,255,0.4)', 'transparent']}
                        style={StyleSheet.absoluteFill}
                    />
                </View>

                <View style={localStyles.content}>
                    {/* Header */}
                    <View style={localStyles.header}>
                        <Animated.View style={[
                            localStyles.iconContainer,
                            { backgroundColor: isReferral ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255,255,255,0.9)' },
                            id === 2 && pulseIconStyle
                        ]}>
                            <Vector
                                as={isReferral ? "materialcommunityicons" : "feather"}
                                name={icon}
                                size={18}
                                color={isReferral ? COLORS.executive.gold : cfg.main}
                            />
                        </Animated.View>

                        {trend && (
                            <View style={[localStyles.trendBadge, { backgroundColor: trendUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                                <Text style={[localStyles.trendText, { color: trendUp ? '#10B981' : '#EF4444' }]}>
                                    {trend}
                                </Text>
                            </View>
                        )}

                        {isReferral && (
                            <View style={localStyles.hotBadge}>
                                <Text style={localStyles.hotText}>HOT</Text>
                            </View>
                        )}
                    </View>

                    {/* Body */}
                    <View style={localStyles.body}>
                        <Text style={[localStyles.value, isReferral && { color: '#FFF' }]}>{value}</Text>
                        <Text style={[localStyles.title, isReferral && { color: 'rgba(255,255,255,0.4)' }]}>{title}</Text>
                        {subtitle && <Text style={localStyles.subtitle}>{subtitle}</Text>}
                    </View>

                    {/* Footer / Sparkline */}
                    <View style={localStyles.footer}>
                        <View style={localStyles.footerTop}>
                            <View style={localStyles.statusContainer}>
                                <View style={[localStyles.dot, { backgroundColor: isReferral ? COLORS.executive.gold : cfg.main }]} />
                                <Text style={[localStyles.statusText, { color: isReferral ? COLORS.executive.gold : cfg.main }]}>
                                    {isReferral ? 'EARN CASH' : 'LIVE'}
                                </Text>
                            </View>
                            <View style={[localStyles.arrowCircle, isReferral && { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                                <Vector as="feather" name="chevron-right" size={12} color={isReferral ? "#FFF" : COLORS.secondary} />
                            </View>
                        </View>

                        {/* Interactive Visualization */}
                        <View style={localStyles.vizContainer}>
                            {!isReferral ? (
                                <Sparkline
                                    data={sparkData}
                                    color={cfg.main}
                                    width={width / 2.8}
                                    height={24}
                                />
                            ) : (
                                <View style={localStyles.referralTrack}>
                                    <LinearGradient
                                        colors={[COLORS.executive.gold, 'transparent']}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                        style={localStyles.referralProgress}
                                    />
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
};

const localStyles = StyleSheet.create({
    card: {
        borderRadius: 32,
        height: 170,
        backgroundColor: '#FFF',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(59, 47, 47, 0.04)',
        ...Platform.select({
            ios: {
                shadowColor: '#3B2F2F',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.1,
                shadowRadius: 24,
            },
            android: { elevation: 6 },
        }),
    },
    cardLarge: {
        height: 185,
    },
    cardBento: {
        height: 180,
    },
    bgContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    blob: {
        position: 'absolute',
        borderRadius: 100,
        opacity: 0.4,
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    iconContainer: {
        width: 38,
        height: 38,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 },
            android: { elevation: 2 },
        }),
    },
    trendBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    trendText: {
        fontSize: RFValue(9),
        fontFamily: FONTS.bold,
    },
    hotBadge: {
        backgroundColor: 'rgba(212, 175, 55, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
    },
    hotText: {
        color: COLORS.executive.gold,
        fontSize: RFValue(9),
        fontFamily: FONTS.bold,
        letterSpacing: 0.8,
    },
    body: {
        marginTop: 12,
    },
    value: {
        fontSize: RFValue(20),
        fontFamily: FONTS.bold,
        color: COLORS.secondary,
        letterSpacing: -0.5,
    },
    title: {
        fontSize: RFValue(9),
        fontFamily: FONTS.bold,
        color: 'rgba(59, 47, 47, 0.85)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 4,
    },
    subtitle: {
        fontSize: RFValue(9),
        fontFamily: FONTS.medium,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    footer: {
        marginTop: 10,
    },
    footerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: RFValue(9),
        fontFamily: FONTS.bold,
        letterSpacing: 0.8,
    },
    arrowCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(59, 47, 47, 0.05)',
    },
    vizContainer: {
        height: 24,
        justifyContent: 'center',
    },
    referralTrack: {
        height: 3,
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    referralProgress: {
        width: '60%',
        height: '100%',
    }
});

export default SummaryItem;



