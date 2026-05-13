import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RatingEkrani() {
  const [puan, setPuan] = useState(0);
  const [yorum, setYorum] = useState('');

  const gonder = () => {
    if (puan === 0) {
      alert("Lütfen oyuncuya bir puan verin!");
      return;
    }
    
    // İleride Backend Software Flow'a gidecek veri
    console.log("Verilen Puan:", puan, "Yorum:", yorum);
    
    alert("Değerlendirme başarıyla gönderildi!");
    router.back(); // İşlem bitince önceki ekrana dön
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
        
        {/* Kapatma Butonu */}
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={30} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>MAÇ BİTTİ!</Text>
          <Text style={styles.subtitle}>Takım arkadaşını değerlendir</Text>
        </View>

        {/* Değerlendirilen Oyuncu Kartı */}
        <View style={styles.playerCard}>
          <Ionicons name="person-circle" size={80} color="#39FF14" />
          <Text style={styles.playerName}>Enes İnanç</Text>
          <Text style={styles.playerPosition}>Defans</Text>
        </View>

        {/* Yıldızlar (1-10 arası yapabiliriz ama UI için 5 yıldız idealdir) */}
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setPuan(star)}>
              <Ionicons 
                name={puan >= star ? "star" : "star-outline"} 
                size={45} 
                color={puan >= star ? "#39FF14" : "#555"} 
                style={styles.star}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.ratingText}>
          {puan === 0 ? "Puan Ver" : `${puan} / 5 Yıldız`}
        </Text>

        {/* Yorum Alanı */}
        <TextInput
          style={styles.input}
          placeholder="Maçtaki performansı nasıldı? (İsteğe bağlı)"
          placeholderTextColor="#888"
          multiline
          value={yorum}
          onChangeText={setYorum}
        />

        {/* Gönder Butonu */}
        <TouchableOpacity style={styles.submitButton} onPress={gonder}>
          <Text style={styles.submitButtonText}>DEĞERLENDİRMEYİ TAMAMLA</Text>
        </TouchableOpacity>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  inner: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    color: '#39FF14',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },
  subtitle: {
    color: '#AAA',
    fontSize: 16,
    marginTop: 5,
  },
  playerCard: {
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 30,
  },
  playerName: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
  },
  playerPosition: {
    color: '#888',
    fontSize: 14,
    marginTop: 5,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  star: {
    marginHorizontal: 5,
  },
  ratingText: {
    color: '#39FF14',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#1A1A1A',
    color: '#FFF',
    padding: 15,
    borderRadius: 10,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 30,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#39FF14',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#39FF14',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  }
});
