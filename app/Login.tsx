import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { NetworkDiagnostics } from "@/components/NetworkDiagnostics";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(true);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const { signInWithEmail, signInAnonymously } = useAuth();
  const { theme, isDark } = useTheme();
  const colors = isDark ? theme.colors.dark : theme.colors.light;
  const insets = useSafeAreaInsets();

  const siteKey = process.env.EXPO_PUBLIC_HCAPTCHA_SITE_KEY;

  console.log(
    "Using hCaptcha sitekey:",
    siteKey ? `${siteKey.substring(0, 8)}...` : "No sitekey configured"
  );

  const handleSignIn = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    setIsLoading(true);
    const { error } = await signInWithEmail(email);
    setIsLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setIsEmailSent(true);
    }
  };

  const handleGuestLogin = async () => {
    // Skip captcha in development if no valid sitekey
    if (!process.env.EXPO_PUBLIC_HCAPTCHA_SITE_KEY) {
      setIsGuestLoading(true);
      const { error } = await signInAnonymously();
      setIsGuestLoading(false);

      if (error) {
        Alert.alert("Error", error.message);
      }
      return;
    }

    // Show captcha if sitekey is configured
    setCaptchaLoading(true);
    setShowCaptcha(true);
  };

  const onVerify = async (token: string) => {
    console.log("hCaptcha verified with token:", token);
    setShowCaptcha(false);

    // Proceed with guest login
    setIsGuestLoading(true);
    const { error } = await signInAnonymously();
    setIsGuestLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
    }
  };

  const onExpire = () => {
    console.log("hCaptcha expired");
    setShowCaptcha(false);
  };

  return (
    <ThemedView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={[styles.content, { paddingTop: insets.top + 100 }]}>
          <LinearGradient
            colors={colors.gradientColors as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.titleContainer,
              {
                borderColor: colors.border,
                borderRadius: theme.styles.borderRadius,
                borderWidth: theme.styles.borderWidth,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.title,
                {
                  fontFamily: theme.fonts.title,
                  color: isDark ? "#111" : "#111",
                },
              ]}
            >
              ✨ DreamFairy 🧚
            </ThemedText>
          </LinearGradient>

          <ThemedText
            style={[
              styles.subtitle,
              {
                fontFamily: theme.fonts.body,
                color: colors.text,
              },
            ]}
          >
            Enter your email to start your journey
          </ThemedText>

          {!isEmailSent ? (
            <>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? "#333" : colors.secondary,
                    borderColor: colors.border,
                    color: colors.text,
                    fontFamily: theme.fonts.body,
                    borderRadius: theme.styles.borderRadius,
                    borderWidth: theme.styles.borderWidth,
                  },
                ]}
                placeholder="your@email.com"
                placeholderTextColor={isDark ? "#999" : "#666"}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: colors.accent,
                    borderColor: colors.border,
                    borderRadius: theme.styles.borderRadius,
                    borderWidth: theme.styles.borderWidth,
                    shadowColor: colors.border,
                    shadowOffset: theme.styles.shadowOffset,
                    shadowOpacity: theme.styles.shadowOpacity,
                    shadowRadius: theme.styles.shadowRadius,
                  },
                  isLoading && styles.buttonDisabled,
                ]}
                onPress={handleSignIn}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={isDark ? "#000" : "#000"} />
                ) : (
                  <ThemedText
                    style={[
                      styles.buttonText,
                      {
                        fontFamily: theme.fonts.button,
                        color: isDark ? "#000" : "#000",
                      },
                    ]}
                  >
                    Send Magic Link
                  </ThemedText>
                )}
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View
                  style={[styles.divider, { backgroundColor: colors.border }]}
                />
                <ThemedText
                  style={[
                    styles.dividerText,
                    { fontFamily: theme.fonts.body, color: colors.text },
                  ]}
                >
                  or
                </ThemedText>
                <View
                  style={[styles.divider, { backgroundColor: colors.border }]}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.guestButton,
                  {
                    backgroundColor: colors.secondary,
                    borderColor: colors.border,
                    borderRadius: theme.styles.borderRadius,
                    borderWidth: theme.styles.borderWidth,
                  },
                  isGuestLoading && styles.buttonDisabled,
                ]}
                onPress={handleGuestLogin}
                disabled={isGuestLoading}
              >
                {isGuestLoading ? (
                  <ActivityIndicator color={colors.text} />
                ) : (
                  <ThemedText
                    style={[
                      styles.guestButtonText,
                      {
                        fontFamily: theme.fonts.button,
                        color: colors.text,
                      },
                    ]}
                  >
                    Continue as Guest
                  </ThemedText>
                )}
              </TouchableOpacity>

              {__DEV__ && (
                <TouchableOpacity
                  style={[
                    styles.debugButton,
                    {
                      backgroundColor: '#FF6B6B',
                      borderColor: colors.border,
                      borderRadius: theme.styles.borderRadius,
                      borderWidth: theme.styles.borderWidth,
                    }
                  ]}
                  onPress={() => setShowDiagnostics(true)}
                >
                  <Ionicons 
                    name="bug-outline" 
                    size={20} 
                    color="#FFF" 
                    style={{ marginRight: 8 }}
                  />
                  <ThemedText
                    style={[
                      styles.debugText,
                      {
                        fontFamily: theme.fonts.button,
                        color: '#FFF',
                      },
                    ]}
                  >
                    Network Diagnostics
                  </ThemedText>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.successContainer}>
              <ThemedText
                style={[
                  styles.successTitle,
                  {
                    fontFamily: theme.fonts.title,
                    color: colors.accent,
                  },
                ]}
              >
                Check your email!
              </ThemedText>
              <ThemedText
                style={[
                  styles.successText,
                  {
                    fontFamily: theme.fonts.body,
                    color: colors.text,
                  },
                ]}
              >
                We've sent a magic link to {email}
              </ThemedText>
              <ThemedText
                style={[
                  styles.successSubtext,
                  {
                    fontFamily: theme.fonts.body,
                    color: colors.text,
                    opacity: 0.7,
                  },
                ]}
              >
                Click the link in your email to sign in
              </ThemedText>

              <TouchableOpacity
                style={[
                  styles.resendButton,
                  {
                    borderColor: colors.border,
                    borderRadius: theme.styles.borderRadius,
                    borderWidth: theme.styles.borderWidth,
                  },
                ]}
                onPress={() => {
                  setIsEmailSent(false);
                  setEmail("");
                }}
              >
                <ThemedText
                  style={[
                    styles.resendButtonText,
                    {
                      fontFamily: theme.fonts.button,
                      color: colors.text,
                    },
                  ]}
                >
                  Try a different email
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showCaptcha}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCaptcha(false)}
      >
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.captchaContainer,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                borderRadius: theme.styles.borderRadius,
                borderWidth: theme.styles.borderWidth,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.captchaTitle,
                {
                  fontFamily: theme.fonts.title,
                  color: colors.text,
                  marginBottom: 20,
                },
              ]}
            >
              Verify you're human
            </ThemedText>

            {captchaLoading && (
              <ActivityIndicator
                size="large"
                color={colors.text}
                style={{ marginVertical: 20 }}
              />
            )}

            <View
              style={[
                styles.captchaWrapper,
                captchaLoading && { height: 0, opacity: 0 },
              ]}
            >
              <WebView
                source={{
                  html: `
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
                        <style>
                          body {
                            margin: 0;
                            padding: 20px;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 260px;
                            background: transparent;
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                          }
                          #hcaptcha-container {
                            transform: scale(0.85);
                            transform-origin: center;
                          }
                          #error-message {
                            color: #ff0000;
                            text-align: center;
                            padding: 20px;
                            display: none;
                          }
                        </style>
                      </head>
                      <body>
                        <div id="hcaptcha-container"></div>
                        <div id="error-message"></div>

                        <script src="https://js.hcaptcha.com/1/api.js?onload=onloadCallback&render=explicit" async defer></script>
                        <script>
                          window.hcaptchaLoaded = false;
                          window.widgetId = null;

                          function log(message) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                              type: 'log',
                              message: message
                            }));
                          }

                          function showError(message) {
                            document.getElementById('error-message').style.display = 'block';
                            document.getElementById('error-message').innerText = message;
                            log('Error: ' + message);
                          }

                          function onloadCallback() {
                            log('hCaptcha loaded, rendering widget...');
                            try {
                              window.widgetId = hcaptcha.render('hcaptcha-container', {
                                sitekey: '${siteKey}',
                                callback: onSuccess,
                                'error-callback': onError,
                                'close-callback': onClose,
                                'expired-callback': onExpire,
                                theme: '${isDark ? "dark" : "light"}',
                                size: 'normal'
                              });
                              log('Widget rendered successfully');
                            } catch (e) {
                              showError('Failed to render hCaptcha: ' + e.message);
                              window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'error',
                                error: 'render-failed',
                                message: e.message
                              }));
                            }
                          }

                          function onSuccess(token) {
                            log('Success! Token: ' + token.substring(0, 20) + '...');
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                              type: 'success',
                              token: token
                            }));
                          }

                          function onError(error) {
                            log('Error: ' + error);
                            showError('hCaptcha error: ' + error);
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                              type: 'error',
                              error: error || 'unknown'
                            }));
                          }

                          function onClose() {
                            log('Closed');
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                              type: 'close'
                            }));
                          }

                          function onExpire() {
                            log('Expired');
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                              type: 'expire'
                            }));
                          }

                          // Check if hCaptcha loaded after timeout
                          setTimeout(function() {
                            if (!window.hcaptcha) {
                              showError('hCaptcha failed to load. Please check your internet connection.');
                              window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'error',
                                error: 'load-timeout'
                              }));
                            }
                          }, 5000);
                        </script>
                      </body>
                    </html>
                  `,
                }}
                onMessage={(event) => {
                  try {
                    const message = event.nativeEvent.data;
                    console.log("WebView message:", message);

                    // Check if it's our JSON message
                    if (message.startsWith("{")) {
                      const data = JSON.parse(message);
                      if (data.type === "log") {
                        console.log("[hCaptcha]", data.message);
                      } else if (data.type === "success") {
                        onVerify(data.token);
                      } else if (data.type === "error") {
                        console.log(
                          "hCaptcha error:",
                          data.error,
                          data.message || ""
                        );
                        if (
                          data.error === "invalid-data" ||
                          data.error === "render-failed"
                        ) {
                          Alert.alert(
                            "Configuration Error",
                            data.message ||
                              "The hCaptcha site key appears to be invalid. Please check your configuration.",
                            [
                              {
                                text: "OK",
                                onPress: () => setShowCaptcha(false),
                              },
                            ]
                          );
                        } else if (data.error === "load-timeout") {
                          Alert.alert(
                            "Loading Error",
                            "Failed to load hCaptcha. Please check your internet connection.",
                            [
                              {
                                text: "OK",
                                onPress: () => setShowCaptcha(false),
                              },
                            ]
                          );
                        } else {
                          Alert.alert(
                            "Verification Error",
                            "Failed to verify captcha. Please try again.",
                            [
                              {
                                text: "OK",
                                onPress: () => setShowCaptcha(false),
                              },
                            ]
                          );
                        }
                      } else if (data.type === "close") {
                        setShowCaptcha(false);
                      } else if (data.type === "expire") {
                        Alert.alert(
                          "Session Expired",
                          "The captcha session has expired. Please try again.",
                          [{ text: "OK", onPress: () => setShowCaptcha(false) }]
                        );
                      }
                    } else {
                      // Handle non-JSON messages from hCaptcha
                      console.log("Non-JSON message from WebView:", message);
                    }
                  } catch (e) {
                    console.log("Error parsing WebView message:", e);
                  }
                }}
                onLoad={() => setCaptchaLoading(false)}
                onError={(error) => {
                  console.log("WebView error:", error);
                  setCaptchaLoading(false);
                  Alert.alert(
                    "Error",
                    "Failed to load captcha. Please try again."
                  );
                  setShowCaptcha(false);
                }}
                style={styles.hcaptcha}
                scrollEnabled={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                sharedCookiesEnabled={true}
                originWhitelist={[
                  "https://js.hcaptcha.com",
                  "https://*.hcaptcha.com",
                ]}
                mixedContentMode="compatibility"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.cancelButton,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                  borderRadius: theme.styles.borderRadius,
                  borderWidth: theme.styles.borderWidth,
                },
              ]}
              onPress={() => setShowCaptcha(false)}
            >
              <ThemedText
                style={[
                  styles.cancelButtonText,
                  {
                    fontFamily: theme.fonts.button,
                    color: colors.text,
                  },
                ]}
              >
                Cancel
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {__DEV__ && (
        <Modal
          visible={showDiagnostics}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowDiagnostics(false)}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalHeader, { backgroundColor: colors.primary }]}>
              <ThemedText style={[styles.modalTitle, { fontFamily: theme.fonts.title, color: colors.text }]}>
                Network Diagnostics
              </ThemedText>
              <TouchableOpacity onPress={() => setShowDiagnostics(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <NetworkDiagnostics />
          </View>
        </Modal>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  titleContainer: {
    paddingVertical: 30,
    paddingHorizontal: 40,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 48,
    opacity: 0.8,
  },
  input: {
    width: "100%",
    maxWidth: 400,
    height: 60,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    width: "100%",
    maxWidth: 400,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  successContainer: {
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
  },
  successTitle: {
    fontSize: 24,
    marginBottom: 16,
  },
  successText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 32,
  },
  resendButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  resendButtonText: {
    fontSize: 14,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    width: "100%",
    maxWidth: 400,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    opacity: 0.6,
  },
  guestButton: {
    width: "100%",
    maxWidth: 400,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  captchaContainer: {
    margin: 20,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
  },
  captchaTitle: {
    fontSize: 20,
    textAlign: "center",
  },
  captchaWrapper: {
    width: 300,
    height: 300,
    marginBottom: 20,
  },
  hcaptcha: {
    width: 300,
    height: 300,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 10,
  },
  cancelButtonText: {
    fontSize: 14,
  },
  debugButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 20,
  },
  debugText: {
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
