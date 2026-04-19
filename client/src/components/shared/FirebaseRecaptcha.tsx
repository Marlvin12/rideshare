import React, { useRef, useImperativeHandle, forwardRef, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

const FIREBASE_CDN_VERSION = "12.7.0";

const firebaseConfigFromEnv = () => ({
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "",
});

const buildRecaptchaHTML = (): string => {
  const config = firebaseConfigFromEnv();
  const configJson = JSON.stringify(config).replace(/</g, "\\u003c");
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
</head>
<body>
  <div id="recaptcha-container"></div>
  <script src="https://www.gstatic.com/firebasejs/${FIREBASE_CDN_VERSION}/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/${FIREBASE_CDN_VERSION}/firebase-auth-compat.js"></script>
  <script>
    (function() {
      var config = ${configJson};
      if (!config.apiKey) {
        if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: 'Firebase config missing' }));
        return;
      }
      firebase.initializeApp(config);
      var container = document.getElementById('recaptcha-container');
      var verifier = new firebase.auth.RecaptchaVerifier(container, { size: 'invisible' }, function() {});
      verifier.render().then(function() {
        window.recaptchaVerifier = verifier;
        window.recaptchaReady = true;
        if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
      }).catch(function(err) {
        if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: err.message || 'recaptcha init failed' }));
      });
      window.getRecaptchaToken = function() {
        if (!window.recaptchaVerifier) {
          if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: 'Recaptcha not ready' }));
          return Promise.reject(new Error('Recaptcha not ready'));
        }
        return window.recaptchaVerifier.verify().then(function(token) {
          if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'token', token: token }));
          return token;
        }).catch(function(err) {
          if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: err.message || 'verify failed' }));
          throw err;
        });
      };
    })();
  </script>
</body>
</html>
`;
};

export type ApplicationVerifier = {
  type: string;
  verify(): Promise<string>;
};

export type FirebaseRecaptchaRef = {
  getToken(): Promise<string>;
  getVerifier(): ApplicationVerifier | null;
};

const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "";
const baseUrl = authDomain ? `https://${authDomain}` : "https://localhost";

const FirebaseRecaptcha = forwardRef<FirebaseRecaptchaRef, {}>(function FirebaseRecaptcha(_, ref) {
  const webViewRef = useRef<WebView>(null);
  const pendingResolve = useRef<{ resolve: (t: string) => void; reject: (e: Error) => void } | null>(null);
  const verifierRef = useRef<ApplicationVerifier | null>(null);

  const getToken = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      pendingResolve.current = { resolve, reject };
      webViewRef.current?.injectJavaScript(
        "typeof window.getRecaptchaToken === 'function' ? window.getRecaptchaToken() : (window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: 'not ready' }))); true;"
      );
    });
  }, []);

  const getVerifier = useCallback((): ApplicationVerifier | null => {
    if (verifierRef.current) return verifierRef.current;
    verifierRef.current = {
      type: "recaptcha",
      verify: getToken,
    };
    return verifierRef.current;
  }, [getToken]);

  useImperativeHandle(ref, () => ({
    getToken,
    getVerifier,
  }), [getToken, getVerifier]);

  const handleMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload.type === "token" && payload.token && pendingResolve.current) {
        pendingResolve.current.resolve(payload.token);
        pendingResolve.current = null;
      } else if (payload.type === "error" && pendingResolve.current) {
        pendingResolve.current.reject(new Error(payload.error ?? "reCAPTCHA error"));
        pendingResolve.current = null;
      }
    } catch {
      if (pendingResolve.current) {
        pendingResolve.current.reject(new Error("Invalid reCAPTCHA response"));
        pendingResolve.current = null;
      }
    }
  }, []);

  if (!authDomain) {
    return null;
  }

  return (
    <View style={styles.hidden} pointerEvents="none" collapsable>
      <WebView
        ref={webViewRef}
        source={{ html: buildRecaptchaHTML(), baseUrl }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        style={styles.webView}
        scrollEnabled={false}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  hidden: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
    overflow: "hidden",
    left: -9999,
  },
  webView: {
    width: 1,
    height: 1,
    backgroundColor: "transparent",
  },
});

export default FirebaseRecaptcha;
