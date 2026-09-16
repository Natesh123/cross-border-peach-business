import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import Modal from 'react-native-modal';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { FONTS } from "app/constants/Assets";
import { useRecoilValue } from 'recoil';
import { ProfileState } from 'app/atoms';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

const DeactivateAccountModal: React.FC<Props> = ({ isVisible, onClose, onSubmit }) => {
  const profile = useRecoilValue(ProfileState);
  const [reason, setReason] = useState('');
  
  const handleSubmit = () => {
    onSubmit(reason);
    setReason('');
  };

  return (
    <Modal 
      isVisible={isVisible} 
      onBackdropPress={onClose} 
      style={styles.modal}
      avoidKeyboard={true}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#EF4444" />
            <Text style={styles.title}>Deactivate Account</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.noticeBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#EAB308" style={styles.noticeIcon} />
            <View style={{flex: 1}}>
              <Text style={styles.noticeTitle}>Important Notice</Text>
              <Text style={styles.noticeText}>
                Submitting this request will initiate an account deactivation workflow. 
                Your request will be reviewed by CRM Maker and Checker teams. 
                Your account will remain ACTIVE until final Checker approval.
              </Text>
            </View>
          </View>

          <View style={styles.remitterIdContainer}>
            <Text style={styles.remitterLabel}>Remitter ID: </Text>
            <View style={styles.remitterBadge}>
              <Text style={styles.remitterBadgeText}>{profile?.remitterId || 'N/A'}</Text>
            </View>
          </View>

          <Text style={styles.reasonLabel}>Reason for Deactivation <Text style={{color: '#EF4444'}}>*</Text>:</Text>
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={4}
            placeholder="Please specify why you want to deactivate your account (e.g. Relocating, No longer using service)..."
            placeholderTextColor="#9CA3AF"
            value={reason}
            onChangeText={setReason}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.characterCount}>{reason.length} / 500</Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit Request</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 20,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: '#EF4444',
    marginLeft: 8,
  },
  content: {
    padding: 16,
  },
  noticeBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE047',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  noticeIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  noticeTitle: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#1F2937',
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#374151',
    lineHeight: 18,
  },
  remitterIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  remitterLabel: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#111827',
  },
  remitterBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  remitterBadgeText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#374151',
  },
  reasonLabel: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#111827',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#60A5FA', // Light blue border matching screenshot
    borderRadius: 8,
    padding: 12,
    height: 100,
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  characterCount: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    marginRight: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#374151',
  },
  submitButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
  submitButtonText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#FFFFFF',
  }
});

export default DeactivateAccountModal;
