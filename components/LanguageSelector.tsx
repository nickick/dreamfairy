import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useLanguage, LANGUAGES, LanguageCode } from '@/contexts/LanguageContext';
import { ThemedText } from './ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'icon');

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Choose Language</ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {Object.entries(LANGUAGES).map(([code, info]) => {
          const isSelected = language === code;
          return (
            <TouchableOpacity
              key={code}
              style={[
                styles.languageButton,
                {
                  backgroundColor: isSelected ? tintColor : backgroundColor,
                  borderColor: isSelected ? tintColor : borderColor,
                },
              ]}
              onPress={() => setLanguage(code as LanguageCode)}
            >
              {isSelected && (
                <Ionicons 
                  name="checkmark-circle" 
                  size={20} 
                  color={backgroundColor} 
                  style={styles.checkIcon}
                />
              )}
              <Text style={[
                styles.languageName,
                { color: isSelected ? backgroundColor : tintColor }
              ]}>
                {info.name}
              </Text>
              <Text style={[
                styles.nativeName,
                { color: isSelected ? backgroundColor : tintColor, opacity: 0.8 }
              ]}>
                {info.nativeName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  languageButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 25,
    borderWidth: 2,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
  },
  nativeName: {
    fontSize: 14,
    marginTop: 2,
  },
});