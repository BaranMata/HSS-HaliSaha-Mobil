import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const BASE_URL = 'https://hss-halisaha.onrender.com';

export default function RadarEkrani() {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [ilanlar, setIlanlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  
  // İlan Oluşturma State'leri
  const [modalGorunur, setModalGorunur] = useState(false);
  const [secilenSahaKonumu, setSecilenSahaKonumu] = useState(null);
  const [arananMevki, setArananMevki] = useState('');
  const [macSaati, setMacSaati] = useState('');
  const [ilanYukleniyor, setIlanYukleniyor] = useState(false);
  const [konumSecimi, setKonumSecimi] = useState('mevcut'); // 'mevcut' veya 'harita'

  // İlan Detay Modal State'leri
  const [detayModal, setDetayModal] = useState(false);
  const [secilenIlan, setSecilenIlan] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Hata', 'Konum izni reddedildi.');
        setYukleniyor(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      const region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setCurrentLocation(region);
      setSecilenSahaKonumu(region);
      ilanlariGetir();
    })();
  }, []);

  const ilanlariGetir = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/matches/nearby`);
      const data = await response.json();
      if (data.matches) setIlanlar(data.matches);
      setYukleniyor(false);
    } catch (error) {
      setYukleniyor(false);
    }
  };

  // Haritaya dokunulduğunda sahanın yerini belirle
  const sahaKonumuSec = (e) => {
    if (modalGorunur && konumSecimi === 'harita') {
      setSecilenSahaKonumu(e.nativeEvent.coordinate);
    }
  };

  // İlana tıklandığında detay modalı aç
  const ilanDetayGoster = (ilan) => {
    setSecilenIlan(ilan);
    setDetayModal(true);
  };

  // İlan sahibine mesaj at
  const mesajAt = (ilan) => {
    setDetayModal(false);
    // Sohbet odasına yönlendir
    const chatRoomId = ['user_baran_123', ilan.OrganizerID].sort().join('_');
    router.push({
      pathname: '/chat',
      params: {
        chatRoomId: chatRoomId,
        title: `İlan Sahibi`
      }
    });
  };

  // Maça başvur
  const macaBasvur = async (ilan) => {
    try {
      const response = await fetch(`${BASE_URL}/api/applications/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: ilan.MatchID,
          applicantId: 'user_baran_123'
        })
      });

      if (response.ok) {
        Alert.alert('Başarılı!', 'Başvurun iletildi! İlan sahibi sana mesaj atabilir.');
        setDetayModal(false);
      }
    } catch (error) {
      Alert.alert('Hata', 'Başvuru gönderilemedi.');
    }
  };

  const ilanOlustur = async () => {
    if (!arananMevki || !macSaati) {
      Alert.alert('Eksik Bilgi', 'Lütfen mevki ve saat bilgilerini girin.');
      return;
    }

    const konum = konumSecimi === 'mevcut' ? currentLocation : secilenSahaKonumu;

    setIlanYukleniyor(true);
    try {
      const response = await fetch(`${BASE_URL}/api/matches/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizerId: 'user_baran_123',
          latitude: konum.latitude,
          longitude: konum.longitude,
          requiredPosition: arananMevki,
          matchTime: macSaati
        })
      });

      if (response.ok) {
        Alert.alert('Başarılı!', 'Maç ilanı yayımlandı.');
        setModalGorunur(false);
        setArananMevki('');
        setMacSaati('');
        setKonumSecimi('mevcut');
        ilanlariGetir();
      }
    } catch (error) {
      Alert.alert('Hata', 'İlan gönderilemedi.');
    } finally {
      setIlanYukleniyor(false);
    }
  };

  if (yukleniyor || !currentLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#39FF14" />
        <Text style={styles.loadingText}>Radar Taranıyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map} 
        provider={PROVIDER_GOOGLE}
        initialRegion={currentLocation}
        showsUserLocation={true}
        onPress={sahaKonumuSec}
      >
        {/* Canlı İlanlar */}
        {ilanlar.map((ilan, index) => (
          <Marker
            key={index}
            coordinate={{ latitude: parseFloat(ilan.Latitude), longitude: parseFloat(ilan.Longitude) }}
            pinColor="#39FF14"
            onPress={() => ilanDetayGoster(ilan)}
          >
            <Callout tooltip onPress={() => ilanDetayGoster(ilan)}>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{ilan.Required_Position} Aranıyor</Text>
                <Text style={styles.calloutTime}>⏰ {ilan.matchTime || 'Belirtilmedi'}</Text>
                <Text style={styles.calloutHint}>Detaylar için dokun →</Text>
              </View>
            </Callout>
          </Marker>
        ))}

        {/* İlan Oluştururken Seçilen Sahanın Geçici Pini */}
        {modalGorunur && konumSecimi === 'harita' && secilenSahaKonumu && (
          <Marker 
            coordinate={secilenSahaKonumu} 
            draggable 
            pinColor="blue" 
            title="Maçın Yapılacağı Saha"
            description="Bu pini sahanın üzerine sürükle"
            onDragEnd={(e) => setSecilenSahaKonumu(e.nativeEvent.coordinate)}
          />
        )}
      </MapView>

      <TouchableOpacity style={styles.addButton} onPress={() => setModalGorunur(true)}>
        <Ionicons name="add" size={30} color="#000" />
      </TouchableOpacity>

      {/* === İLAN DETAY MODALI (YENİ) === */}
      <Modal visible={detayModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.detayContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Maç Detayları</Text>
              <TouchableOpacity onPress={() => setDetayModal(false)}>
                <Ionicons name="close-circle" size={32} color="#888" />
              </TouchableOpacity>
            </View>

            {secilenIlan && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Mevki Bilgisi */}
                <View style={styles.detayRow}>
                  <Ionicons name="football" size={24} color="#39FF14" />
                  <View style={styles.detayTextContainer}>
                    <Text style={styles.detayLabel}>Aranan Mevki</Text>
                    <Text style={styles.detayValue}>{secilenIlan.Required_Position}</Text>
                  </View>
                </View>

                {/* Saat Bilgisi */}
                <View style={styles.detayRow}>
                  <Ionicons name="time" size={24} color="#39FF14" />
                  <View style={styles.detayTextContainer}>
                    <Text style={styles.detayLabel}>Maç Saati</Text>
                    <Text style={styles.detayValue}>{secilenIlan.matchTime || 'Belirtilmedi'}</Text>
                  </View>
                </View>

                {/* Durum Bilgisi */}
                <View style={styles.detayRow}>
                  <Ionicons name="radio-button-on" size={24} color={secilenIlan.Status === 'Aktif' ? '#39FF14' : '#FF4444'} />
                  <View style={styles.detayTextContainer}>
                    <Text style={styles.detayLabel}>Durum</Text>
                    <Text style={styles.detayValue}>{secilenIlan.Status}</Text>
                  </View>
                </View>

                {/* Aksiyon Butonları */}
                <TouchableOpacity style={styles.publishButton} onPress={() => macaBasvur(secilenIlan)}>
                  <Ionicons name="hand-left" size={20} color="#000" style={{ marginRight: 8 }} />
                  <Text style={styles.publishButtonText}>BAŞVUR</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.publishButton, { backgroundColor: '#121212', borderWidth: 1, borderColor: '#39FF14', marginTop: 10 }]} 
                  onPress={() => mesajAt(secilenIlan)}
                >
                  <Ionicons name="chatbubble" size={20} color="#39FF14" style={{ marginRight: 8 }} />
                  <Text style={[styles.publishButtonText, { color: '#39FF14' }]}>MESAJ AT</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* === İLAN OLUŞTURMA MODALI === */}
      <Modal visible={modalGorunur} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior="padding" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni İlan</Text>
              <TouchableOpacity onPress={() => setModalGorunur(false)}>
                <Ionicons name="close-circle" size={32} color="#888" />
              </TouchableOpacity>
            </View>

            {/* Konum Seçimi */}
            <Text style={styles.label}>Konum Tercihi</Text>
            <View style={styles.konumSecimContainer}>
              <TouchableOpacity 
                style={[styles.konumSecimButton, konumSecimi === 'mevcut' && styles.konumSecimAktif]} 
                onPress={() => setKonumSecimi('mevcut')}
              >
                <Ionicons name="navigate" size={18} color={konumSecimi === 'mevcut' ? '#000' : '#39FF14'} />
                <Text style={[styles.konumSecimText, konumSecimi === 'mevcut' && styles.konumSecimTextAktif]}>Mevcut Konumum</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.konumSecimButton, konumSecimi === 'harita' && styles.konumSecimAktif]} 
                onPress={() => setKonumSecimi('harita')}
              >
                <Ionicons name="map" size={18} color={konumSecimi === 'harita' ? '#000' : '#39FF14'} />
                <Text style={[styles.konumSecimText, konumSecimi === 'harita' && styles.konumSecimTextAktif]}>Haritadan Seç</Text>
              </TouchableOpacity>
            </View>

            {konumSecimi === 'harita' && (
              <Text style={styles.helperText}>Modalı kapat, haritada bir noktaya dokun, sonra tekrar ilan oluştur.</Text>
            )}

            <Text style={styles.label}>Aranan Mevki</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Kaleci"
              placeholderTextColor="#666"
              value={arananMevki}
              onChangeText={setArananMevki}
            />

            <Text style={styles.label}>Maç Saati</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Bugün 21:00 - 22:00"
              placeholderTextColor="#666"
              value={macSaati}
              onChangeText={setMacSaati}
            />

            <TouchableOpacity style={styles.publishButton} onPress={ilanOlustur}>
              {ilanYukleniyor ? <ActivityIndicator color="#000" /> : <Text style={styles.publishButtonText}>İLANI YAYIMLA</Text>}
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  loadingText: { color: '#39FF14', marginTop: 10, fontWeight: 'bold' },
  calloutContainer: { width: 180, padding: 8, backgroundColor: '#FFF', borderRadius: 8 },
  calloutTitle: { fontWeight: 'bold', fontSize: 14, color: '#000' },
  calloutTime: { fontSize: 12, color: '#666', marginVertical: 4 },
  calloutHint: { fontSize: 11, color: '#39FF14', fontWeight: '600' },
  addButton: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#39FF14', width: 65, height: 65, borderRadius: 35, justifyContent: 'center', alignItems: 'center', elevation: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1A1A1A', borderRadius: 25, padding: 25, borderWidth: 1, borderColor: '#333' },
  detayContent: { backgroundColor: '#1A1A1A', borderRadius: 25, padding: 25, borderWidth: 1, borderColor: '#39FF14', maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#39FF14', fontSize: 22, fontWeight: 'bold' },
  helperText: { color: '#888', fontSize: 12, marginBottom: 15, fontStyle: 'italic' },
  label: { color: '#FFF', fontSize: 14, marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: '#222', color: '#FFF', padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 20 },
  publishButton: { backgroundColor: '#39FF14', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10, flexDirection: 'row', justifyContent: 'center' },
  publishButtonText: { color: '#000', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  // İlan Detay Satırları
  detayRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#121212', padding: 15, borderRadius: 12, marginBottom: 10 },
  detayTextContainer: { marginLeft: 15 },
  detayLabel: { color: '#888', fontSize: 12 },
  detayValue: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  // Konum Seçim Butonları
  konumSecimContainer: { flexDirection: 'row', marginBottom: 20 },
  konumSecimButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#39FF14', marginHorizontal: 4 },
  konumSecimAktif: { backgroundColor: '#39FF14' },
  konumSecimText: { color: '#39FF14', fontSize: 13, fontWeight: 'bold', marginLeft: 6 },
  konumSecimTextAktif: { color: '#000' },
});
