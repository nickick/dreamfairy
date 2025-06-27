import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { useLanguage, LANGUAGES, LanguageCode } from '@/contexts/LanguageContext';
import { ThemedText } from './ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';

export function LanguageDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage, languageInfo } = useLanguage();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'icon');

  const handleLanguageSelect = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.dropdownButton, { borderColor }]}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={[styles.languageCode, { color: textColor }]}>
          {language.toUpperCase()}
        </Text>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={12} 
          color={textColor} 
        />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={[
            styles.dropdown,
            { 
              backgroundColor,
              borderColor,
              shadowColor: '#000',
            }
          ]}>
            {Object.entries(LANGUAGES).map(([code, info]) => {
              const isSelected = language === code;
              return (
                <TouchableOpacity
                  key={code}
                  style={[
                    styles.option,
                    isSelected && { backgroundColor: tintColor + '20' }
                  ]}
                  onPress={() => handleLanguageSelect(code as LanguageCode)}
                >
                  <View style={styles.optionContent}>
                    <Text style={[
                      styles.optionText,
                      { color: isSelected ? tintColor : textColor }
                    ]}>
                      {info.name}
                    </Text>
                    <Text style={[
                      styles.nativeText,
                      { color: isSelected ? tintColor : textColor, opacity: 0.7 }
                    ]}>
                      {info.nativeName}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons 
                      name="checkmark" 
                      size={16} 
                      color={tintColor} 
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: 4,
    gap: 4,
  },
  languageCode: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  dropdown: {
    position: 'absolute',
    top: 100,
    right: 20,
    width: 200,
    borderRadius: 8,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  nativeText: {
    fontSize: 12,
    marginTop: 2,
  },
});