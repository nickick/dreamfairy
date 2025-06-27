import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LanguageCode = "en" | "tl" | "zh" | "yue";

interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
}

export const LANGUAGES: Record<LanguageCode, LanguageInfo> = {
  en: { code: "en", name: "English", nativeName: "English" },
  tl: { code: "tl", name: "Tagalog", nativeName: "Tagalog" },
  zh: { code: "zh", name: "Mandarin", nativeName: "中文" },
  yue: { code: "yue", name: "Cantonese", nativeName: "廣東話" },
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  languageInfo: LanguageInfo;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = '@dreamfairy/language';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  // Load saved language preference
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLanguage && savedLanguage in LANGUAGES) {
          setLanguageState(savedLanguage as LanguageCode);
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      }
    };
    loadLanguage();
  }, []);

  // Save language preference
  const setLanguage = async (newLanguage: LanguageCode) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
      setLanguageState(newLanguage);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  const value = {
    language,
    setLanguage,
    languageInfo: LANGUAGES[language],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}