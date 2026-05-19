import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView, Modal, Platform, StyleSheet } from "react-native";
import Vector from "app/assets/vectors";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import CountryFlag from "react-native-country-flag";
import { FONTS, SHADOWS, SIZES } from "app/constants/Assets";
import Colors from "app/constants/Colors";
import styles from "app/styles";
import { dateFormat } from "app/helpers";
import { GetReceiverInfoList, GetRemitterProfile, GetTransactionDetails } from "app/http-services";
import { useIsFocused } from "@react-navigation/native";
import { useRecoilValue } from "recoil";
import { ProfileState } from "app/atoms";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { ITransaction } from "types";
import moment from "moment";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { RFValue } from "react-native-responsive-fontsize";
import { Asset } from 'expo-asset';


interface IProps {
  item: ITransaction;
  variant?: 'hero' | 'square' | 'minimal' | 'standard';
  index?: number;
}

const TransactionItem = ({ item, variant = 'standard', index = 0 }: IProps) => {
  const [showViewModal, setShowViewModal] = useState(false);
  const getCountryISO2 = require("country-iso-3-to-2");
  const isoCode = getCountryISO2(item.DestinationCountry) || "";
  const [loading, setLoading] = useState(false);
  const currentToken = useRecoilValue(ProfileState);
  const [recipientList, setRecipientList] = useState<any[]>([]);
  const [remitterProfile, setRemitterProfile] = useState<any>(null);

  const fetchReceiverList = async (tokenId: string, remitterId: string) => {
    try {
      const response = await GetReceiverInfoList(tokenId);
      if (response.status === 200) {
        const _data = response?.data?.ReceiverDetails;
        if (Array.isArray(_data)) {
          setRecipientList(_data);
          return _data;
        }
      }
    } catch (err) { console.error(err); return []; }
  };

  const fetchRemitterProfile = async (tokenId: string, remitterId: string) => {
    try {
      const response = await GetRemitterProfile(tokenId);
      if (response.status === 200) {
        setRemitterProfile(response.data.Sender);
        return response.data.Sender;
      }
    } catch (err) { console.error(err); return null; }
  };

  const handleDownload = async (transactionItem: ITransaction) => {
    try {
      setLoading(true);

      // 1. Fetch Supporting Data
      const remitter = await fetchRemitterProfile(currentToken.tokenId, currentToken.remitterId);
      const receiverList = await fetchReceiverList(currentToken.tokenId, currentToken.remitterId);
      
      // Try to find the specific receiver for this transaction if possible
      const receiveinfo = receiverList?.find((r: any) => 
        r.ReceiverFirstName === transactionItem.ReceiverFirstName && 
        r.ReceiverLastName === transactionItem.ReceiverLastName
      ) || receiverList?.[0] || {};

      // 2. Load Logo Asset as Base64
      let logoBase64 = "";
      try {
        const asset = Asset.fromModule(require('../../../../assets/logos/cb_logo_new.png'));
        await asset.downloadAsync();
        if (asset.localUri) {
          logoBase64 = await FileSystem.readAsStringAsync(asset.localUri, { encoding: FileSystem.EncodingType.Base64 });
        }
      } catch (assetErr) {
        console.warn("Could not load logo for PDF:", assetErr);
      }

      // 3. Format Date/Time
      const [datePart, timePart, ampm] = (transactionItem.TransactionDate || "").split(" ");
      const txnDate = datePart || moment().format("MM/DD/YYYY");
      const txnTime = timePart ? `${timePart} ${ampm || ""}` : moment().format("hh:mm:ss A");

      // 4. Prepare HTML Content (Matching Screenshot Layout)
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; color: #3B2F2F; margin: 0; padding: 20px; font-size: 10pt; line-height: 1.4; }
            .header { text-align: center; margin-bottom: 20px; }
            .logo { width: 180px; margin-bottom: 8px; }
            .company-name { font-weight: bold; font-size: 14pt; color: #3B2F2F; }
            .company-addr { font-size: 8pt; color: #666; margin-top: 4px; }
            .receipt-title { text-align: center; font-weight: bold; font-size: 16pt; margin: 20px 0 5px 0; border-top: 1px solid #EEE; padding-top: 15px; }
            .txn-id { text-align: center; font-size: 10pt; font-weight: bold; margin-bottom: 25px; }
            
            .meta-table { width: 100%; margin-bottom: 20px; }
            .meta-table td { width: 50%; }
            
            .section-header { background-color: #F8F4F1; padding: 6px 12px; font-weight: bold; font-size: 9pt; letter-spacing: 1px; color: #3B2F2F; border-bottom: 2px solid #FF8E72; margin-top: 15px; }
            
            .details-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            .details-table th, .details-table td { text-align: left; padding: 8px 12px; border: 1px solid #EEE; font-size: 9pt; }
            .details-table th { background-color: #FAFAFA; width: 35%; color: #888; text-transform: uppercase; font-size: 7pt; letter-spacing: 0.5px; }
            
            .split-container { display: flex; gap: 20px; }
            .split-column { flex: 1; }
            
            .important-notice { margin-top: 40px; border-top: 1px dashed #DDD; padding-top: 15px; }
            .notice-label { color: #EF4444; font-weight: bold; font-size: 9pt; margin-bottom: 5px; }
            .notice-text { font-size: 7.5pt; color: #777; text-align: justify; }
            
            .footer-brand { margin-top: 30px; text-align: center; font-size: 8pt; color: #A19188; }
          </style>
        </head>
        <body>
          <div class="header">
            ${logoBase64 ? `<img src="data:image/png;base64,${logoBase64}" class="logo" />` : '<div class="company-name">CROSS BORDER</div>'}
            <div class="company-name">KASHREMIT FINTECH LIMITED</div>
            <div class="company-addr">1st Floor, Tidelpark, Adyar, Chennai, India, 600073</div>
            <div class="company-addr">Email: customersupport@kashremit.com | Phone: 44-207 132 0015</div>
          </div>

          <div class="receipt-title">CUSTOMER RECEIPT</div>
          <div class="txn-id">TXN ID: ${transactionItem.TransID}</div>

          <table class="meta-table">
            <tr>
              <td>
                <div><strong>Txn. Date:</strong> ${txnDate}</div>
                <div><strong>Txn. Time:</strong> ${txnTime}</div>
              </td>
              <td style="text-align: right;">
                <div><strong>Service opted for:</strong> ${transactionItem.TransactionMode || 'BANK TRANSFER'}</div>
                <div><strong>Payout Country:</strong> ${transactionItem.DestinationCountry}</div>
              </td>
            </tr>
          </table>

          <div class="split-container" style="display: table; width: 100%;">
            <div style="display: table-cell; width: 48%; vertical-align: top; padding-right: 2%;">
              <div class="section-header">BENEFICIARY DETAILS</div>
              <table class="details-table">
                <tr><th>Beneficiary Name</th><td>${transactionItem.ReceiverFirstName} ${transactionItem.ReceiverLastName}</td></tr>
                <tr><th>Country</th><td>${transactionItem.DestinationCountry}</td></tr>
                <tr><th>Acc No. / IBAN</th><td>${transactionItem.AccountNumber || '--'}</td></tr>
                <tr><th>Bank Name</th><td>${transactionItem.BankName || '--'}</td></tr>
                <tr><th>Bank Branch</th><td>${transactionItem.BranchName || '--'}</td></tr>
                <tr><th>Mobile</th><td>${receiveinfo.mobileNumber || '--'}</td></tr>
              </table>
            </div>

            <div style="display: table-cell; width: 48%; vertical-align: top;">
              <div class="section-header">PAYMENT DETAILS</div>
              <table class="details-table">
                <tr><th>Receive Currency</th><td>${transactionItem.Currency}</td></tr>
                <tr><th>Receive Amount</th><td>${transactionItem.Amount}</td></tr>
                <tr><th>Send Amount</th><td>${transactionItem.Amount} ${transactionItem.Currency}</td></tr>
                <tr><th>Exchange Rate</th><td>1 ${transactionItem.Currency} = ${transactionItem.ExchangeRate || '1.00'}</td></tr>
                <tr><th>Transfer Fee</th><td>${transactionItem.Fee || '0.00'}</td></tr>
                <tr><th>Total</th><td style="font-weight: bold; color: #FF8E72;">${transactionItem.Amount} ${transactionItem.Currency}</td></tr>
              </table>
            </div>
          </div>

          <div class="section-header">REMITTER DETAILS</div>
          <table class="details-table">
            <tr>
              <th style="width: 20%;">Remitter ID</th><td style="width: 30%;">${currentToken.remitterId}</td>
              <th style="width: 20%;">Remitter Name</th><td style="width: 30%;">${remitter?.FirstName} ${remitter?.LastName}</td>
            </tr>
            <tr>
              <th>Address</th><td colspan="3">${remitter?.Address1 || ''} ${remitter?.Address2 || ''}</td>
            </tr>
            <tr>
              <th>City / State</th><td>${remitter?.City || '--'} / ${remitter?.State || '--'}</td>
              <th>Nationality</th><td>${remitter?.Nationality || '--'}</td>
            </tr>
            <tr>
              <th>Country</th><td>${remitter?.CountryName || '--'}</td>
              <th>Mobile No</th><td>${remitter?.Mobile || '--'}</td>
            </tr>
          </table>

          <div class="important-notice">
            <div class="notice-label">Important Notice:</div>
            <div class="notice-text">
              1. This receipt is generated electronically and does not require a physical signature. 
              2. Transaction is subject to regulatory approval and compliance checks. 
              3. Funds are usually available within the specified timeframe for the selected payout method. 
              4. For any queries, please contact our support team with the Transaction ID mentioned above. 
              5. Kashremit Fintech Limited is regulated as a Payment Institution. All funds are safeguarded in accordance with regulatory requirements.
            </div>
          </div>

          <div class="footer-brand">
            &bull; CROSS BORDER GLOBAL &bull; OFFICIAL TRANSACTION RECORD &bull;
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      } else {
        Alert.alert("Receipt Saved", uri);
      }
    } catch (e) {
      console.error("PDF Gen Error:", e);
      Alert.alert("Error", "Failed to generate receipt");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Success": return "#10B981";
      case "Failed": case "Rejected": return "#EF4444";
      default: return "#F59E0B";
    }
  };

  const renderStandard = () => (
    <Animated.View entering={FadeInDown.delay(index * 100).springify().damping(15)} style={localStyles.standardWrapper}>
      <TouchableOpacity activeOpacity={0.9} onPress={() => setShowViewModal(true)} style={localStyles.premiumCard}>
        {/* Ambient Glow Background */}
        <View style={[localStyles.cardAmbientGlow, { backgroundColor: getStatusColor(item.TranStatus) + '08' }]} />

        <View style={localStyles.cardTopRow}>
          <View style={localStyles.cardLeftGroup}>
            <View style={localStyles.iconFrame}>
              {isoCode ? (
                <CountryFlag isoCode={isoCode} size={26} style={localStyles.frameFlag} />
              ) : (
                <Vector as="feather" name="zap" size={22} color="#FF8E72" />
              )}
              <View style={[localStyles.indicatorPulse, { backgroundColor: getStatusColor(item.TranStatus) }]} />
            </View>
            <View>
              <Text style={localStyles.cardNameTxt} numberOfLines={1}>{item.ReceiverFirstName} {item.ReceiverLastName}</Text>
              <Text style={localStyles.cardDateTxt}>{dateFormat(item.TransactionDate)}</Text>
            </View>
          </View>

          <View style={localStyles.cardRightGroup}>
            <Text style={localStyles.cardAmountTxt}>
              <Text style={localStyles.currSymbol}>{String(item.Currency)}</Text>
              <Text>{String(item.Amount).split('.')[0]}</Text>
              <Text style={localStyles.amountDecimals}>.{String(item.Amount).split('.')[1] || '00'}</Text>
            </Text>
            <View style={[localStyles.cardStatusPill, { backgroundColor: getStatusColor(item.TranStatus) + '12' }]}>
              <Text style={[localStyles.cardStatusTxt, { color: getStatusColor(item.TranStatus) }]}>{item.TranStatus}</Text>
            </View>
          </View>
        </View>

        <View style={localStyles.cardActionDivider} />

        <View style={localStyles.cardBottomRow}>
          <View style={localStyles.modeTag}>
            <Vector as="feather" name="repeat" size={14} color="#A19188" />
            <Text style={localStyles.modeTagTxt}>{item.TransactionMode}</Text>
          </View>

          <View style={localStyles.actionButtonGroup}>
            <TouchableOpacity onPress={() => setShowViewModal(true)} style={localStyles.glassButton}>
              <Vector as="feather" name="file-text" size={14} color="#3B2F2F" />
              <Text style={localStyles.glassButtonTxt}>Details</Text>
            </TouchableOpacity>

            {item.TranStatus?.toLowerCase() === 'success' && (
              <TouchableOpacity
                onPress={() => handleDownload(item)}
                style={localStyles.peachButtonAction}
              >
                <Vector as="feather" name="download" size={16} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderHero = () => {
    const amountStr = String(item.Amount || "0.00");
    const [whole, decimal] = amountStr.includes(".") ? amountStr.split(".") : [amountStr, "00"];

    return (
      <Animated.View entering={FadeInDown.delay(index * 100).springify()} style={localStyles.heroWrapper}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => setShowViewModal(true)}>
          <LinearGradient
            colors={['#3B2F2F', '#4A3B3B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={localStyles.heroCard}
          >
            <View style={localStyles.meshCircle1} />
            <View style={localStyles.meshCircle2} />

            <View style={localStyles.heroHeader}>
              <View style={localStyles.auraBadge}>
                <View style={[localStyles.auraDot, { backgroundColor: getStatusColor(item.TranStatus) }]} />
                <Text style={localStyles.auraTxt}>{item.TranStatus}</Text>
              </View>
              <Text style={localStyles.heroTime}>{dateFormat(item.TransactionDate)}</Text>
            </View>

            <View style={localStyles.heroBody}>
              <Text style={localStyles.heroAmountLarge}>
                {item.Currency} {whole}
                <Text style={localStyles.heroDecimals}>.{decimal}</Text>
              </Text>
              <Text style={localStyles.heroNameSmall}>{item.ReceiverFirstName} {item.ReceiverLastName}</Text>
            </View>

            <View style={localStyles.heroFooter}>
              <View style={localStyles.flagPill}>
                {isoCode && <CountryFlag isoCode={isoCode} size={14} style={localStyles.pillFlag} />}
                <Text style={localStyles.pillText}>{item.DestinationCountry}</Text>
              </View>
              <View style={localStyles.glassAction}>
                <Vector as="feather" name="arrow-up-right" size={20} color="#FFF" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderSquare = () => {
    const amountStr = String(item.Amount || "0.00");
    const [whole, decimal] = amountStr.includes(".") ? amountStr.split(".") : [amountStr, "00"];

    return (
      <Animated.View entering={FadeInDown.delay(index * 100).springify()} style={localStyles.squareWrapper}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => setShowViewModal(true)} style={localStyles.squareCard}>
          <View style={[localStyles.indicatorGlow, { backgroundColor: getStatusColor(item.TranStatus) + '10' }]} />
          <Text style={localStyles.squareDate}>{moment(item.TransactionDate).format('MMM DD')}</Text>

          <View>
            <Text style={localStyles.squareAmount}>
              {item.Currency}{whole}
              <Text style={localStyles.squareDecimals}>.{decimal}</Text>
            </Text>
            <Text style={localStyles.standardName} numberOfLines={1}>{item.ReceiverFirstName}</Text>
          </View>

          <View style={localStyles.squareFooter}>
            <Text style={localStyles.squareMode}>{item.TransactionMode}</Text>
            <Vector as="feather" name="chevron-right" size={14} color="#DBCAC0" />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderMinimal = () => (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()} style={localStyles.timelineItem}>
      <View style={localStyles.timelineLeft}>
        <View style={localStyles.timelineLine} />
        <View style={[localStyles.timelineNode, { borderColor: getStatusColor(item.TranStatus) + '20' }]}>
          <View style={[localStyles.timelineInner, { backgroundColor: getStatusColor(item.TranStatus) }]} />
        </View>
      </View>

      <TouchableOpacity activeOpacity={0.7} onPress={() => setShowViewModal(true)} style={localStyles.timelineContent}>
        <View style={localStyles.timelineHeader}>
          <Text style={localStyles.timelineTitle}>{item.ReceiverFirstName} {item.ReceiverLastName}</Text>
          <Text style={localStyles.timelineValue}>{item.Currency}{item.Amount}</Text>
        </View>
        <Text style={localStyles.timelineSub}>{dateFormat(item.TransactionDate)} • {item.TranStatus}</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View>
      {variant === 'hero' ? renderHero() :
        variant === 'square' ? renderSquare() :
          variant === 'minimal' ? renderMinimal() :
            renderStandard()}

      <Modal visible={showViewModal} transparent animationType="slide">
        <View style={localStyles.cinematicOverlay}>
          <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={() => setShowViewModal(false)}>
            <View style={localStyles.blurBackdrop} />
          </TouchableOpacity>

          <Animated.View
            entering={FadeInDown.springify().damping(15).mass(1)}
            style={localStyles.quartzContainer}
          >
            {/* ATMOSPHERIC BACKGROUND LAYERS */}
            <LinearGradient
              colors={['#FFFFFF', '#FDF8F5', '#F2E8E2']}
              style={StyleSheet.absoluteFill}
            />
            <View style={localStyles.quartzAtmosphere}>
              <View style={[localStyles.auraGlowTop, { backgroundColor: getStatusColor(item.TranStatus) + '15' }]} />
              <View style={localStyles.auraGlowBottom} />
            </View>

            {/* MODAL HEADER ACTIONS */}
            <View style={localStyles.quartzHeader}>
              <TouchableOpacity onPress={() => setShowViewModal(false)} style={localStyles.circleGlassBtn}>
                <Vector as="ionicons" name="chevron-down" size={22} color="#3B2F2F" />
              </TouchableOpacity>

              <View style={localStyles.statusBadgeQuartz}>
                <View style={[localStyles.statusDotPulse, { backgroundColor: getStatusColor(item.TranStatus) }]} />
                <Text style={localStyles.statusBadgeTxt}>AUTHENTICATED RECEIPT</Text>
              </View>

              {item.TranStatus?.toLowerCase() === 'success' ? (
                <TouchableOpacity onPress={() => handleDownload(item)} style={localStyles.circleGlassBtn}>
                  <Vector as="feather" name="share-2" size={18} color="#3B2F2F" />
                </TouchableOpacity>
              ) : (
                <View style={{ width: 48 }} />
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={localStyles.quartzScroll} contentContainerStyle={{ paddingBottom: 160 }}>
              {/* HYPER-SUCCESS AURA */}
              <View style={localStyles.hyperStatusHub}>
                <View style={localStyles.auraVisualContainer}>
                  <Animated.View entering={FadeIn.delay(200)} style={[localStyles.auraRing1, { borderColor: getStatusColor(item.TranStatus) + '10' }]} />
                  <Animated.View entering={FadeIn.delay(400)} style={[localStyles.auraRing2, { borderColor: getStatusColor(item.TranStatus) + '20' }]} />
                  <LinearGradient
                    colors={[getStatusColor(item.TranStatus), getStatusColor(item.TranStatus) + 'AA']}
                    style={localStyles.auraCoreQuartz}
                  >
                    <Vector as="ionicons" name={item.TranStatus === 'Success' ? 'checkmark-done' : 'alert'} size={38} color="#FFF" />
                  </LinearGradient>
                </View>
                <Text style={[localStyles.auraTitleTxt, { color: getStatusColor(item.TranStatus) }]}>
                  {item.TranStatus === 'Success' ? 'TRANSFER COMPLETE' : item.TranStatus.toUpperCase()}
                </Text>
                <View style={localStyles.verifiedBadge}>
                  <Vector as="materialcommunityicons" name="shield-check" size={12} color="#10B981" />
                  <Text style={localStyles.verifiedTxt}>BANK-GRADE SECURITY</Text>
                </View>
              </View>

              {/* CENTERPIECE AMOUNT CARD */}
              <View style={localStyles.heroAmountQuartz}>
                <Text style={localStyles.heroLabelQuartz}>TRANSACTION VALUE</Text>
                <View style={localStyles.heroValueRow}>
                  <Text style={localStyles.heroCurrQuartz}>{item.Currency}</Text>
                  <Text style={localStyles.heroMainQuartz}>{item.Amount.split('.')[0]}</Text>
                  <Text style={localStyles.heroDeciQuartz}>.{item.Amount.split('.')[1] || '00'}</Text>
                </View>
                <View style={localStyles.quartzDividerHero} />
                <Text style={localStyles.heroStampQuartz}>ISSUED ON {moment(item.TransactionDate).format('MMMM DD, YYYY')}</Text>
              </View>

              {/* UNIFIED DATA GRID */}
              <View style={localStyles.quartzDataGrid}>
                <View style={localStyles.quartzDataRow}>
                  <View style={localStyles.quartzItem}>
                    <Text style={localStyles.quartzLabel}>BENEFICIARY</Text>
                    <Text style={localStyles.quartzValMain}>{item.ReceiverFirstName} {item.ReceiverLastName}</Text>
                  </View>
                  <View style={localStyles.quartzItem}>
                    <Text style={localStyles.quartzLabel}>DESTINATION</Text>
                    <View style={localStyles.quartzDestBox}>
                      {isoCode && <CountryFlag isoCode={isoCode} size={16} style={{ borderRadius: 3 }} />}
                      <Text style={localStyles.quartzValMain}>{item.DestinationCountry}</Text>
                    </View>
                  </View>
                </View>

                <View style={localStyles.quartzDividerSub} />

                <View style={localStyles.quartzDataRow}>
                  <View style={localStyles.quartzItem}>
                    <Text style={localStyles.quartzLabel}>PAYMENT METHOD</Text>
                    <Text style={localStyles.quartzValSmall}>{item.TransactionMode || 'DIRECT DEBIT'}</Text>
                  </View>
                  <View style={localStyles.quartzItem}>
                    <Text style={localStyles.quartzLabel}>ENTRY TYPE</Text>
                    <Text style={localStyles.quartzValSmall}>EXTERNAL DEBIT</Text>
                  </View>
                </View>
              </View>

              {/* ACCENT REFERENCE BOX */}
              <View style={localStyles.referenceGlassBox}>
                <LinearGradient
                  colors={['rgba(255, 142, 114, 0.08)', 'rgba(255, 142, 114, 0.02)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={localStyles.refHeaderQuartz}>
                  <Text style={localStyles.refLabelQuartz}>TRANSACTION REFERENCE ID</Text>
                  <TouchableOpacity activeOpacity={0.6} style={localStyles.refCopyBtn}>
                    <Vector as="feather" name="copy" size={14} color="#FF8E72" />
                    <Text style={localStyles.refCopyTxt}>COPY</Text>
                  </TouchableOpacity>
                </View>
                <Text style={localStyles.refIdQuartz}>{item.TransID}</Text>
              </View>

              <View style={localStyles.receiptFooterQuartz}>
                <Text style={localStyles.footerLegalQuartz}>
                  Cross Border Global Limited is regulated as a Payment Institution.
                  All funds are safeguarded in accordance with regulatory requirements.
                </Text>
                <View style={localStyles.footerBrandQuartz}>
                  <View style={localStyles.brandDotSmall} />
                  <Text style={localStyles.brandTxtQuartz}>CROSS BORDER GLOBAL • LONDON HQ</Text>
                </View>
              </View>
            </ScrollView>

            {/* FROSTED ACTION DOCK */}
            <View style={localStyles.quartzActionDock}>
              {item.TranStatus?.toLowerCase() === 'success' && (
                <TouchableOpacity
                  onPress={() => { setShowViewModal(false); handleDownload(item); }}
                  activeOpacity={0.9}
                  style={localStyles.quartzPrimaryBtn}
                >
                  <LinearGradient
                    colors={['#3B2F2F', '#1A1414']}
                    style={localStyles.primaryBtnGrad}
                  >
                    <Vector as="feather" name="file-text" size={20} color="#FFF" />
                    <Text style={localStyles.quartzPrimaryBtnTxt}>Export Official PDF</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={() => setShowViewModal(false)} style={localStyles.quartzSecondaryBtn}>
                <Text style={localStyles.quartzSecondaryBtnTxt}>Dismiss Receipt</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const localStyles = StyleSheet.create({
  premiumCard: {
    backgroundColor: '#EFF8F7',
    borderRadius: 35,
    padding: 24,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.08)',
    ...Platform.select({
      ios: { shadowColor: '#3B2F2F', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 16 },
      android: { elevation: 4 },
    }),
  },
  cardAmbientGlow: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 250,
    height: 250,
    borderRadius: 125,
    zIndex: -1,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  cardLeftGroup: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  iconFrame: {
    width: 60,
    height: 60,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.12)',
    ...Platform.select({
      ios: { shadowColor: '#3B2F2F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  frameFlag: { borderRadius: 4 },
  indicatorPulse: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#EFF8F7',
  },
  cardNameTxt: { fontSize: 18, fontFamily: FONTS.bold, color: '#3B2F2F', letterSpacing: -0.5 },
  cardDateTxt: { fontSize: 11, fontFamily: FONTS.medium, color: '#A19188', marginTop: 2 },
  cardRightGroup: { alignItems: 'flex-end', gap: 8 },
  cardAmountTxt: { fontSize: 24, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', color: '#3B2F2F' },
  currSymbol: { fontSize: 14, color: '#FF8E72', marginRight: 2 },
  amountDecimals: { fontSize: 14, color: '#DBCAC0' },
  cardStatusPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  cardStatusTxt: { fontSize: 9, fontFamily: FONTS.bold, textTransform: 'uppercase', letterSpacing: 1 },
  cardActionDivider: { height: 1.5, backgroundColor: 'rgba(59, 47, 47, 0.02)', marginVertical: 0 },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  modeTag: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.7)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  modeTagTxt: { fontSize: 10, fontFamily: FONTS.bold, color: '#A19188', textTransform: 'uppercase', letterSpacing: 0.5 },
  actionButtonGroup: { flexDirection: 'row', gap: 10 },
  glassButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 16 },
  glassButtonTxt: { fontSize: 12, fontFamily: FONTS.bold, color: '#3B2F2F' },
  peachButtonAction: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#3B2F2F', justifyContent: 'center', alignItems: 'center' },

  // 🔮 AURA HERO STYLES
  heroWrapper: { marginBottom: 25 },
  heroCard: {
    height: 240,
    borderRadius: 45,
    padding: 28,
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#FF8E72', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.35, shadowRadius: 30 },
      android: { elevation: 15 },
    }),
  },
  meshCircle1: {
    position: 'absolute',
    top: -50,
    right: -20,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  meshCircle2: {
    position: 'absolute',
    bottom: -80,
    left: -40,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 142, 114, 0.12)',
  },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  auraBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  auraDot: { width: 6, height: 6, borderRadius: 3 },
  auraTxt: { color: '#FFF', fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 1.5, textTransform: 'uppercase' },
  heroTime: { color: 'rgba(255, 255, 255, 0.4)', fontSize: 11, fontFamily: FONTS.medium },
  heroBody: { alignItems: 'center' },
  heroAmountLarge: {
    fontSize: RFValue(58),
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: '#FFF',
    letterSpacing: -1.5,
  },
  heroDecimals: { fontSize: RFValue(30), color: 'rgba(255, 255, 255, 0.3)' },
  heroNameSmall: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 14, fontFamily: FONTS.medium, marginTop: -4 },
  heroFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  flagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pillFlag: { borderRadius: 2 },
  pillText: { color: '#FFF', fontSize: 12, fontFamily: FONTS.bold, letterSpacing: 0.5 },
  glassAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  // 📊 HIGHLIGHT SQUARE STYLES
  squareWrapper: { flex: 1, marginHorizontal: 8, marginBottom: 20 },
  squareCard: {
    backgroundColor: '#FFF',
    borderRadius: 38,
    padding: 22,
    height: 180,
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#3B2F2F', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.06, shadowRadius: 18 },
      android: { elevation: 6 },
    }),
  },
  indicatorGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  squareDate: { fontSize: 10, fontFamily: FONTS.medium, color: '#DBCAC0', letterSpacing: 0.5 },
  squareAmount: { fontSize: RFValue(28), fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', color: '#3B2F2F' },
  squareDecimals: { fontSize: RFValue(14), color: '#DBCAC0' },
  squareFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  squareMode: { fontSize: 10, fontFamily: FONTS.bold, color: '#DBCAC0', letterSpacing: 1.5 },

  // 📜 TIMELINE STYLES
  timelineItem: { flexDirection: 'row', marginBottom: 2 },
  timelineLeft: { width: 40, alignItems: 'center' },
  timelineLine: { position: 'absolute', top: 0, bottom: 0, width: 1.5, backgroundColor: 'rgba(59, 47, 47, 0.05)' },
  timelineNode: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFF',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    zIndex: 2,
  },
  timelineInner: { width: 4, height: 4, borderRadius: 2 },
  timelineContent: {
    flex: 1,
    paddingBottom: 25,
    paddingLeft: 10,
  },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  timelineTitle: { fontSize: 16, fontFamily: FONTS.bold, color: '#3B2F2F' },
  timelineValue: { fontSize: 18, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', color: '#3B2F2F' },
  timelineSub: { fontSize: 11, fontFamily: FONTS.medium, color: '#DBCAC0' },

  // RECEIPT MODAL
  masterReceipt: {
    backgroundColor: '#FFF',
    width: '94%',
    maxHeight: '85%',
    borderRadius: 40,
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.2, shadowRadius: 30 },
      android: { elevation: 20 },
    }),
  },
  receiptBranding: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    backgroundColor: '#FCF5F1',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 47, 47, 0.05)',
  },
  brandDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF8E72' },
  brandName: { fontSize: 9, fontFamily: FONTS.bold, color: '#3B2F2F', letterSpacing: 2.5 },
  receiptScroll: { padding: 25 },
  statusHub: { alignItems: 'center', marginBottom: 30 },
  statusGlow: { ...StyleSheet.absoluteFillObject, height: 150 },
  statusIconOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginBottom: 15,
  },
  statusMainTxt: { fontSize: 11, fontFamily: FONTS.bold, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 },
  txnDateHero: { fontSize: 12, fontFamily: FONTS.medium, color: '#A19188' },
  amountHero: {
    alignItems: 'center',
    backgroundColor: '#F8F4F1',
    paddingVertical: 25,
    borderRadius: 25,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(59, 47, 47, 0.02)',
  },
  amountHeroVal: { fontSize: RFValue(40), fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', color: '#3B2F2F' },
  amountHeroSymbol: { color: '#FF8E72', fontSize: 24 },
  amountHeroSub: { fontSize: 10, fontFamily: FONTS.bold, color: '#DBCAC0', letterSpacing: 1.5, marginTop: 4 },
  dataGrid: { gap: 20, marginBottom: 30 },
  dataGridRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dataPoint: { flex: 1 },
  dataLabel: { fontSize: 9, fontFamily: FONTS.bold, color: '#DBCAC0', letterSpacing: 1.5, marginBottom: 6 },
  dataValue: { fontSize: 14, fontFamily: FONTS.bold, color: '#3B2F2F' },
  idSection: { padding: 20, backgroundColor: '#FAF9F8', borderRadius: 20 },
  idLabel: { fontSize: 9, fontFamily: FONTS.bold, color: '#DBCAC0', letterSpacing: 1, marginBottom: 10, textAlign: 'center' },
  idBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  idValueTxt: { fontSize: 12, fontFamily: FONTS.medium, color: '#3B2F2F' },
  standardWrapper: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },

  // ULTRA-PREMIUM QUARTZ RECEIPT STYLES
  cinematicOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(30, 24, 24, 0.4)',
  },
  blurBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(59, 47, 47, 0.65)',
  },
  quartzContainer: {
    width: '100%',
    height: '96%',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    backgroundColor: '#FFF',
    overflow: 'hidden',
  },
  quartzAtmosphere: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  auraGlowTop: {
    position: 'absolute',
    top: -150,
    right: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  auraGlowBottom: {
    position: 'absolute',
    bottom: -100,
    left: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 142, 114, 0.08)',
  },
  quartzHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: 15,
  },
  circleGlassBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 47, 47, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  statusBadgeQuartz: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B2F2F',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    ...SHADOWS.shadow,
  },
  statusDotPulse: { width: 6, height: 6, borderRadius: 3 },
  statusBadgeTxt: { fontSize: 9, fontFamily: FONTS.bold, color: '#FFF', letterSpacing: 1.5 },
  quartzScroll: { flex: 1, paddingHorizontal: 25 },
  hyperStatusHub: { alignItems: 'center', marginTop: 15, marginBottom: 40 },
  auraVisualContainer: { width: 140, height: 140, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  auraRing1: { position: 'absolute', width: 130, height: 130, borderRadius: 65, borderWidth: 1, borderStyle: 'dotted' },
  auraRing2: { position: 'absolute', width: 110, height: 110, borderRadius: 55, borderWidth: 1.5, borderStyle: 'dashed' },
  auraCoreQuartz: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center', ...SHADOWS.shadow8 },
  auraTitleTxt: { fontSize: RFValue(30), fontFamily: FONTS.bold, letterSpacing: -1.5, textAlign: 'center' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: 'rgba(16, 185, 129, 0.06)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  verifiedTxt: { fontSize: 10, fontFamily: FONTS.bold, color: '#10B981', letterSpacing: 0.5 },
  heroAmountQuartz: {
    backgroundColor: '#FFF',
    borderRadius: 40,
    padding: 35,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(59, 47, 47, 0.03)',
    ...Platform.select({
      ios: { shadowColor: '#3B2F2F', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.08, shadowRadius: 30 },
      android: { elevation: 12 },
    }),
    marginBottom: 30,
  },
  heroLabelQuartz: { fontSize: 10, fontFamily: FONTS.bold, color: '#DBCAC0', letterSpacing: 2, marginBottom: 12 },
  heroValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  heroCurrQuartz: { fontSize: 26, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', color: '#FF8E72', marginRight: 5 },
  heroMainQuartz: { fontSize: RFValue(64), fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', color: '#3B2F2F', letterSpacing: -2 },
  heroDeciQuartz: { fontSize: 26, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', color: '#DBCAC0' },
  quartzDividerHero: { width: 40, height: 3, backgroundColor: '#FF8E72', borderRadius: 2, marginVertical: 20, opacity: 0.2 },
  heroStampQuartz: { fontSize: 10, fontFamily: FONTS.bold, color: '#A19188', letterSpacing: 1 },
  quartzDataGrid: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 35,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(59, 47, 47, 0.03)',
  },
  quartzDataRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  quartzItem: { flex: 1 },
  quartzLabel: { fontSize: 9, fontFamily: FONTS.bold, color: '#DBCAC0', letterSpacing: 1.5, marginBottom: 8 },
  quartzValMain: { fontSize: 15, fontFamily: FONTS.bold, color: '#3B2F2F' },
  quartzDestBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  quartzDividerSub: { height: 1, backgroundColor: 'rgba(59, 47, 47, 0.04)', marginVertical: 20 },
  quartzValSmall: { fontSize: 13, fontFamily: FONTS.semibold, color: '#3B2F2F' },
  referenceGlassBox: {
    marginTop: 30,
    borderRadius: 30,
    padding: 25,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(59, 47, 47, 0.04)',
  },
  refHeaderQuartz: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  refLabelQuartz: { fontSize: 9, fontFamily: FONTS.bold, color: '#A19188', letterSpacing: 1 },
  refCopyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  refCopyTxt: { fontSize: 9, fontFamily: FONTS.bold, color: '#FF8E72' },
  refIdQuartz: { fontSize: 18, fontFamily: FONTS.medium, color: '#3B2F2F', letterSpacing: 1 },
  receiptFooterQuartz: { marginTop: 40, alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20 },
  footerLegalQuartz: { fontSize: 11, color: '#A19188', textAlign: 'center', lineHeight: 18, fontFamily: FONTS.medium },
  footerBrandQuartz: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 25 },
  brandDotSmall: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#FF8E72' },
  brandTxtQuartz: { fontSize: 9, fontFamily: FONTS.bold, color: '#3B2F2F', letterSpacing: 2 },
  quartzActionDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 25,
    paddingTop: 15,
    paddingBottom: Platform.OS === 'ios' ? 45 : 30,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 47, 47, 0.05)',
  },
  quartzPrimaryBtn: {
    borderRadius: 24,
    overflow: 'hidden',
    height: 64,
    ...Platform.select({
      ios: { shadowColor: '#FF8E72', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
      android: { elevation: 12 },
    }),
  },
  primaryBtnGrad: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  quartzPrimaryBtnTxt: { fontSize: 17, fontFamily: FONTS.bold, color: '#FFF', letterSpacing: -0.2 },
  quartzSecondaryBtn: { alignSelf: 'center', marginTop: 18 },
  quartzSecondaryBtnTxt: { fontSize: 14, fontFamily: FONTS.bold, color: '#DBCAC0' }
});

export default TransactionItem;
