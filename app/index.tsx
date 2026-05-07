import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Kendi canlı sunucu adresimiz
const BASE_URL = 'https://hss-halisaha.onrender.com';

export default function IndexEkrani() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [position, setPosition] = useState('');
  
  const [yukleniyor, setYukleniyor] = useState(false);
  const [isLogin, setIsLogin] = useState(true); // Giriş ekranından başlayalım

  const handleAuth = async () => {
    // Giriş/Kayıt kontrol mantığı aynı kalıyor
    if (!email || !password || (!isLogin && !username)) {
      Alert.alert("Eksik Kadro", "Lütfen tüm alanları doldurun.");
      return;
    }

    setYukleniyor(true);

    try {
      if (isLogin) {
        // GİRİŞ MANTIĞI
        Alert.alert("Başarılı", "Kadrodasın! Sahaya giriş yapılıyor...");
        if (isLogin) {
  Alert.alert("Başarılı", "Kadrodasın! Sahaya giriş yapılıyor...");
  router.push('/(tabs)/home'); // HARİTAYA GEÇİŞ KODU
}
      } else {
        // KAYİT MANTIĞI
        const simuleUid = "firebase_" + Math.floor(Math.random() * 100000); // Simülasyon

        const response = await fetch(`${BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: simuleUid,
            username: username,
            position: position || "Belirtilmedi"
          }),
        });

        const data = await response.json();

        if (response.ok) {
          Alert.alert("Hoş Geldin!", "Transfer başarıyla tamamlandı, " + username + "!");
          setIsLogin(true); 
        } else {
          Alert.alert("Transfer Hatası", data.error);
        }
      }
    } catch (error) {
      console.error("Auth Hatası:", error);
      Alert.alert("Bağlantı Kesildi", "Sunucuya ulaşılamadı. İnterneti kontrol et.");
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Telefonun üst barını siyah yapalım */}
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View style={styles.headerContainer}>
        {/* Neon Işıma Etkisi Verilen Başlık */}
        <Text style={styles.logo}>
          <Text style={styles.logoLight}>H</Text>S<Text style={styles.logoLight}>S</Text>
        </Text>
        <Text style={styles.slogan}>Match. Play. Dominate.</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>
          {isLogin ? 'SAHAYA GİRİŞ' : 'YENİ TRANSFER'}
        </Text>

        {!isLogin && (
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Takma Adın"
              placeholderTextColor="#555"
              value={username}
              onChangeText={setUsername}
            />
          </View>
        )}

        {!isLogin && (
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Mevkin (Örn: Kaleci)"
              placeholderTextColor="#555"
              value={position}
              onChangeText={setPosition}
            />
          </View>
        )}

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="E-posta"
            placeholderTextColor="#555"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Şifre"
            placeholderTextColor="#555"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/* Neon Buton */}
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleAuth} 
          disabled={yukleniyor}
        >
          {yukleniyor ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.buttonText}>{isLogin ? 'MAÇA ÇIK' : 'KADROYA KATIL'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchButton}>
          <Text style={styles.switchText}>
            {isLogin ? "Henüz lisansın yok mu? Kaydol!" : "Zaten kadrodasın. Giriş yap."}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Saf Siyah Gece Atmosferi
    justifyContent: 'center',
    paddingTop: StatusBar.currentHeight,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    fontSize: 70,
    fontWeight: '900',
    color: '#39FF14', // Gerçek Neon Yeşil (Cyberpunk)
    letterSpacing: -5,
    textShadowColor: 'rgba(57, 255, 20, 0.8)', // Neon Işıması
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  logoLight: {
    color: '#FFFFFF', // Logo içindeki beyaz vurgular
  },
  slogan: {
    fontSize: 14,
    color: '#888888',
    fontWeight: '300',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: -5,
  },
  formContainer: {
    backgroundColor: '#121212', // Çok koyu gri, derinlik hissi için
    marginHorizontal: 25,
    padding: 30,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222222', // Çok sönük border, formu belirginleştirmek için
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 30,
    textAlign: 'center',
    letterSpacing: 2,
  },
  inputWrapper: {
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#1A1A1A', // Input arka planı formdan biraz daha açık
    padding: 18,
    borderRadius: 10,
    color: '#FFFFFF', // Yazı rengi saf beyaz
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  button: {
    backgroundColor: '#39FF14', // Patlayan Neon Yeşil Buton
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    // Hafif ışıma gölgesi (Android'de elevation, iOS'ta shadow)
    elevation: 8,
    shadowColor: '#39FF14',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  buttonText: {
    color: '#000000', // Siyah yazı, neon üzerinde maksimum kontrast
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  switchButton: {
    marginTop: 25,
    alignItems: 'center',
  },
  switchText: {
    color: '#39FF14', // Neon yeşil link
    fontSize: 14,
    fontWeight: '400',
  }
});