import React, { useState } from "react";
import {
  Image,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../core/theme";
import Button from "../../components/Button";
import Container from "../../theme/Container";
import Vector from "app/assets/vectors";
import { emailValidator } from "../../core/utils";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { FONTS, SIZES } from "app/constants/Assets";
import AppStatusBar from "../../components/AppStatusBar";
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const isShortDevice = SCREEN_HEIGHT < 750;
const vScale = SCREEN_HEIGHT / 812;

const ForgotPassword = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState({ value: "", error: "" });
  const [loading, setLoading] = useState(false);

  const handleSendResetLink = () => {
    const emailError = emailValidator(email.value);
    if (emailError) {
      setEmail({ ...email, error: emailError });
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      Toast.show({
        type: "success",
        text1: "Reset Link Sent",
        text2: "If this email is registered, a reset link has been sent!",
      });
    }, 1500);
  };

  const toastConfig = {
    success: ({ text1, text2 }: any) => (
      <View style={localStyles.toastContainerSuccess}>
        <LinearGradient
          colors={['#f0fdf4', '#ffffff']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={localStyles.toastGradient}
        >
          <View style={localStyles.toastIconBoxSuccess}>
            <Vector as="feather" name="check-circle" size={20} color="#10b981" />
          </View>
          <View style={localStyles.toastContent}>
            <Text style={localStyles.toastTitleSuccess}>{text1}</Text>
            {text2 && <Text style={localStyles.toastMessageSuccess}>{text2}</Text>}
          </View>
        </LinearGradient>
      </View>
    ),
    error: ({ text1, text2 }: any) => (
      <View style={localStyles.toastContainerError}>
        <LinearGradient
          colors={['#fef2f2', '#ffffff']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={localStyles.toastGradient}
        >
          <View style={localStyles.toastIconBoxError}>
            <Vector as="feather" name="alert-circle" size={20} color="#ef4444" />
          </View>
          <View style={localStyles.toastContent}>
            <Text style={localStyles.toastTitleError}>{text1}</Text>
            {text2 && <Text style={localStyles.toastMessageError}>{text2}</Text>}
          </View>
        </LinearGradient>
      </View>
    ),
  };

  return (
    <View style={[localStyles.mainContainer, { overflow: 'hidden' }]}>
      <AppStatusBar style="dark" translucent />

      {/* Background with Decorative Glows */}
      <View style={StyleSheet.absoluteFill}>
        <Image
          source={require('../../assets/images/currency_financial_bg.png')}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1 }}>
          {/* Top Header Section */}
          <View style={[localStyles.headerSection, { height: SCREEN_HEIGHT * (isShortDevice ? 0.28 : 0.35) }]}>
            <View style={localStyles.headerTop}>
              <Animated.View entering={FadeInDown.duration(800)} style={localStyles.backButtonContainer}>
                <TouchableOpacity
                  style={localStyles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <Vector as="ionicons" name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(100).duration(800)} style={localStyles.logoContainer}>
                <Image
                  source={require('../../assets/logos/cb_logo_new.png')}
                  style={localStyles.appLogo}
                  resizeMode="contain"
                />
              </Animated.View>
            </View>

            <View style={localStyles.headerTextContainer}>
              <Animated.Text entering={FadeInDown.delay(200).duration(800)} style={localStyles.welcomeText}>
                Forgot Password?
              </Animated.Text>
              <Animated.Text entering={FadeInDown.delay(400).duration(800)} style={localStyles.subWelcomeText}>
                No worries! Enter your email to receive a reset link.
              </Animated.Text>
            </View>
          </View>

          {/* Form Content Card */}
          <Animated.View
            entering={FadeInUp.delay(600).duration(800)}
            style={localStyles.contentCard}
          >
            <LinearGradient
              colors={['#ffffff', '#ffffff']}
              style={localStyles.cardGradient}
            >
              <View style={localStyles.topContentGroup}>
                {/* Input Fields */}
                <View style={localStyles.inputContainer}>
                  <View style={localStyles.inputGroup}>
                    <Text style={localStyles.fieldLabel}>EMAIL ADDRESS</Text>
                    <View style={[localStyles.inputWrapper, email.error ? localStyles.inputError : null]}>
                      <View style={localStyles.iconBox}>
                        <Vector as="feather" name="mail" size={18} color="#1E293B" />
                      </View>
                      <TextInput
                        style={localStyles.textInput}
                        value={email.value}
                        onChangeText={(text) => setEmail({ value: text, error: "" })}
                        autoCapitalize="none"
                        placeholder="your@email.com"
                        placeholderTextColor="#94a3b8"
                        keyboardType="email-address"
                        autoComplete="off"
                        importantForAutofill="no"
                        textContentType="none"
                      />
                    </View>
                    {email.error ? <Text style={localStyles.errorText}>{email.error}</Text> : null}
                  </View>
                </View>
              </View>

              <View style={localStyles.bottomActions}>
                <TouchableOpacity
                  onPress={handleSendResetLink}
                  activeOpacity={0.85}
                  style={localStyles.resetBtn}
                >
                  <LinearGradient
                    colors={['#3A2D27', '#2C2323']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={localStyles.btnGradient}
                  >
                    <Text style={localStyles.resetBtnText}>Send Reset Link</Text>
                    <View style={localStyles.btnArrow}>
                      <Vector as="ionicons" name="arrow-forward" size={18} color="#fff" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                <View style={localStyles.loginLinkContainer}>
                  <Text style={localStyles.rememberText}>Remember your password? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                    <Text style={localStyles.loginText}>Login</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
      <Toast config={toastConfig} />
    </View>
  );
};

const localStyles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F4EFEA',
  },
  backButtonContainer: {
    position: 'absolute',
    left: 0,
    zIndex: 10,
  },
  headerSection: {
    paddingTop: Platform.OS === 'ios' ? 55 : 45,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  logoContainer: {
    width: 100,
    height: 60,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      }
    }),
  },
  appLogo: {
    width: 80,
    height: 45,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      }
    }),
  },
  headerTextContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 32,
    fontFamily: FONTS.bold,
    color: '#3A2D27',
    fontWeight: '800',
    textAlign: 'center',
  },
  subWelcomeText: {
    fontSize: SIZES.h4,
    fontFamily: FONTS.medium,
    color: '#6E5D54',
    marginTop: 10,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },
  contentCard: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    backgroundColor: '#ffffff',
    marginHorizontal: 30,
    marginBottom: 30,
    marginTop: -30,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      }
    }),
  },
  cardGradient: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 24,
    borderRadius: 40,
    overflow: 'hidden',
  },
  topContentGroup: {
    width: '100%',
  },
  inputContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
    color: '#6E5D54',
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fff1f2',
  },
  iconBox: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#3A2D27',
    fontFamily: FONTS.medium,
    fontWeight: '600',
    backgroundColor: 'transparent',
    // @ts-ignore
    outlineStyle: 'none',
  },
  errorText: {
    fontSize: SIZES.small,
    color: '#ef4444',
    marginTop: 8,
    marginLeft: 6,
    fontFamily: FONTS.medium,
  },
  bottomActions: {
    marginTop: 25,
  },
  resetBtn: {
    height: 56,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#3A2D27',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      }
    }),
    marginBottom: 20,
  },
  btnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
  },
  resetBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  btnArrow: {
    position: 'absolute',
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  rememberText: {
    color: '#64748b',
    fontSize: 14,
    fontFamily: FONTS.regular,
    fontWeight: '500',
  },
  loginText: {
    color: '#3A2D27',
    fontSize: 14,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  // Toast Styles
  toastContainerSuccess: {
    height: 70,
    width: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderLeftWidth: 6,
    borderLeftColor: '#10b981',
    marginTop: Platform.OS === 'ios' ? 20 : 50,
    overflow: 'hidden',
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
      },
      android: {
        elevation: 8,
      }
    }),
  },
  toastContainerError: {
    height: 70,
    width: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderLeftWidth: 6,
    borderLeftColor: '#ef4444',
    marginTop: Platform.OS === 'ios' ? 20 : 50,
    overflow: 'hidden',
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
      },
      android: {
        elevation: 8,
      }
    }),
  },
  toastGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  toastIconBoxSuccess: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastIconBoxError: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastContent: {
    marginLeft: 12,
    flex: 1,
  },
  toastTitleSuccess: {
    fontSize: SIZES.medium,
    fontWeight: '900',
    color: '#064e3b',
    fontFamily: FONTS.bold,
  },
  toastTitleError: {
    fontSize: SIZES.medium,
    fontWeight: '900',
    color: '#7f1d1d',
    fontFamily: FONTS.bold,
  },
  toastMessageSuccess: {
    fontSize: SIZES.p13,
    color: '#047857',
    fontFamily: FONTS.regular,
    marginTop: 1,
  },
  toastMessageError: {
    fontSize: SIZES.p13,
    color: '#b91c1c',
    fontFamily: FONTS.regular,
    marginTop: 1,
  },
});

export default ForgotPassword;
