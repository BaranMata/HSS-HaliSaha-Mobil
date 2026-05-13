import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { getUser } from '../userSession';

const BASE_URL = 'https://hss-halisaha.onrender.com';

const MEVKILER = [
  'Kaleci', 'Stoper', 'Sağ Bek', 'Sol Bek', 'Ön Libero',
  'Orta Saha', '10 Numara', 'Sağ Kanat', 'Sol Kanat', 'Forvet',
  'Bilmiyorum/Farketmez'
];

export default function RadarEkrani() {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [ilanlar, setIlanlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const mapRef = useRef(null);

  // İlan Oluşturma
  const [modalGorunur, setModalGorunur] = useState(false);
  const [secilenSahaKonumu, setSecilenSahaKonumu] = useState(null);
  const [secilenMevkiler, setSecilenMevkiler] = useState({}); // { "Kaleci": 1, "Stoper": 2 }
  const [macSaati, setMacSaati] = useState('');
  const [ilanYukleniyor, setIlanYukleniyor] = useState(false);

  // Konum Seçim Modu
  const [konumSecimModu, setKonumSecimModu] = useState(false);

  // İlan Detay
  const [detayModal, setDetayModal] = useState(false);
  const [secilenIlan, setSecilenIlan] = useState(null);

  useEffect(() => {
    (async () => {
      const user = await getUser();
      if (user) setCurrentUserId(user.uid);

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Hata', 'Konum izni reddedildi.');
        setYukleniyor(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
      ilanlariGetir();
    })();
  }, []);

  const ilanlariGetir = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/matches/nearby`);
      const data = await response.json();
      if (data.matches) setIlanlar(data.matches);
    } catch {} finally { setYukleniyor(false); }
  };

  // --- MEVKİ SEÇİM FONKSİYONLARI ---
  const mevkiEkle = (mevki) => {
    setSecilenMevkiler(prev => {
      const yeni = { ...prev };
      yeni[mevki] = (yeni[mevki] || 0) + 1;
      return yeni;
    });
  };

  const mevkiCikar = (mevki) => {
    setSecilenMevkiler(prev => {
      const yeni = { ...prev };
      if (yeni[mevki] > 1) {
        yeni[mevki] -= 1;
      } else {
        delete yeni[mevki];
      }
      return yeni;
    });
  };

  // --- HARİTA FONKSİYONLARI ---
  const haritayaTikla = (e) => {
    if (konumSecimModu) {
      setSecilenSahaKonumu(e.nativeEvent.coordinate);
    }
  };

  const konumuOnayla = () => {
    if (!secilenSahaKonumu) { Alert.alert('Uyarı', 'Haritada bir konuma dokunun.'); return; }
    setKonumSecimModu(false);
    setModalGorunur(true);
  };

  const ilanDetayGoster = (ilan) => { setSecilenIlan(ilan); setDetayModal(true); };

  const mesajAt = (ilan) => {
    setDetayModal(false);
    const chatRoomId = [currentUserId, ilan.OrganizerID].sort().join('_');
    router.push({ pathname: '/chat', params: { chatRoomId, title: 'İlan Sahibi' } });
  };

  // Belirli mevkiye başvur
  const mevkiyeBasvur = async (ilan, positionName) => {
    try {
      const response = await fetch(`${BASE_URL}/api/applications/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: ilan.MatchID, applicantId: currentUserId, positionName })
      });
      if (response.ok) {
        Alert.alert('Başarılı!', `${positionName} mevkisine başvurun iletildi!`);
        setDetayModal(false);
        ilanlariGetir(); // Listeyi yenile
      }
    } catch { Alert.alert('Hata', 'Başvuru gönderilemedi.'); }
  };

  const ilaniKaldir = async (ilan) => {
    Alert.alert('İlanı Kaldır', 'Bu ilanı silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive',
        onPress: async () => {
          try {
            const r = await fetch(`${BASE_URL}/api/matches/${ilan.MatchID}`, { method: 'DELETE' });
            if (r.ok) { setIlanlar(p => p.filter(i => i.MatchID !== ilan.MatchID)); setDetayModal(false); Alert.alert('Silindi', 'İlan kaldırıldı.'); }
          } catch { Alert.alert('Hata', 'İlan silinemedi.'); }
        }
      }
    ]);
  };

  const ilanOlustur = async () => {
    const mevkiListesi = Object.entries(secilenMevkiler);
    if (mevkiListesi.length === 0 || !macSaati) {
      Alert.alert('Eksik Bilgi', 'En az bir mevki seçin ve maç saatini girin.');
      return;
    }

    const konum = secilenSahaKonumu || currentLocation;
    const positions = mevkiListesi.map(([name, needed]) => ({ name, needed, filled: 0 }));

    setIlanYukleniyor(true);
    try {
      const response = await fetch(`${BASE_URL}/api/matches/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizerId: currentUserId,
          latitude: konum.latitude,
          longitude: konum.longitude,
          positions: positions,
          matchTime: macSaati
        })
      });
      if (response.ok) {
        Alert.alert('Başarılı!', 'Maç ilanı yayımlandı.');
        setModalGorunur(false);
        setSecilenMevkiler({});
        setMacSaati('');
        setSecilenSahaKonumu(null);
        ilanlariGetir();
      }
    } catch { Alert.alert('Hata', 'İlan gönderilemedi.'); }
    finally { setIlanYukleniyor(false); }
  };

  if (yukleniyor || !currentLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#39FF14" />
        <Text style={styles.loadingText}>Radar Taranıyor...</Text>
      </View>
    );
  }

  const secilenMevkiSayisi = Object.values(secilenMevkiler).reduce((a, b) => a + b, 0);

  return (
    <View style={styles.container}>
      <MapView ref={mapRef} style={styles.map} provider={PROVIDER_GOOGLE} initialRegion={currentLocation} showsUserLocation onPress={haritayaTikla}>
        {ilanlar.map((ilan, index) => (
          <Marker
            key={index}
            coordinate={{ latitude: parseFloat(ilan.Latitude), longitude: parseFloat(ilan.Longitude) }}
            pinColor={ilan.OrganizerID === currentUserId ? '#4A90D9' : '#39FF14'}
            onPress={() => ilanDetayGoster(ilan)}
          >
            <Callout tooltip onPress={() => ilanDetayGoster(ilan)}>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{ilan.Required_Position}</Text>
                <Text style={styles.calloutTime}>⏰ {ilan.matchTime || 'Belirtilmedi'}</Text>
                {ilan.OrganizerID === currentUserId && <Text style={styles.calloutOwner}>📌 Senin ilanın</Text>}
                <Text style={styles.calloutHint}>Detaylar için dokun →</Text>
              </View>
            </Callout>
          </Marker>
        ))}
        {konumSecimModu && secilenSahaKonumu && (
          <Marker coordinate={secilenSahaKonumu} draggable pinColor="blue" onDragEnd={(e) => setSecilenSahaKonumu(e.nativeEvent.coordinate)} />
        )}
      </MapView>

      {/* KONUM SEÇİM MODU */}
      {konumSecimModu && (
        <View style={styles.konumSecimOverlay}>
          <View style={styles.konumSecimBanner}>
            <Ionicons name="location" size={24} color="#39FF14" />
            <Text style={styles.konumBannerText}>Haritada maç yapılacak konuma dokunun</Text>
          </View>
          <View style={styles.konumSecimButtons}>
            <TouchableOpacity style={styles.konumIptalBtn} onPress={() => { setKonumSecimModu(false); setSecilenSahaKonumu(null); }}>
              <Text style={styles.konumIptalText}>İPTAL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.konumOnayBtn} onPress={konumuOnayla}>
              <Text style={styles.konumOnayText}>KONUMU ONAYLA</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* + BUTONU */}
      {!konumSecimModu && (
        <TouchableOpacity style={styles.addButton} onPress={() => { setSecilenSahaKonumu(null); setModalGorunur(true); }}>
          <Ionicons name="add" size={30} color="#000" />
        </TouchableOpacity>
      )}

      {/* === İLAN DETAY MODALI === */}
      <Modal visible={detayModal} animationType="slide" transparent>
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
                {/* Saat */}
                <View style={styles.detayRow}>
                  <Ionicons name="time" size={24} color="#39FF14" />
                  <View style={styles.detayTextBox}>
                    <Text style={styles.detayLabel}>Maç Saati</Text>
                    <Text style={styles.detayValue}>{secilenIlan.matchTime || 'Belirtilmedi'}</Text>
                  </View>
                </View>

                {/* Durum */}
                <View style={styles.detayRow}>
                  <Ionicons name="radio-button-on" size={24} color={secilenIlan.Status === 'Aktif' ? '#39FF14' : secilenIlan.Status === 'Tamamlandı' ? '#4A90D9' : '#FF4444'} />
                  <View style={styles.detayTextBox}>
                    <Text style={styles.detayLabel}>Durum</Text>
                    <Text style={styles.detayValue}>{secilenIlan.Status}</Text>
                  </View>
                </View>

                {/* Mevkiler — Her biri için ayrı satır */}
                <Text style={styles.mevkiBaslik}>Aranan Mevkiler</Text>
                {secilenIlan.positions && Array.isArray(secilenIlan.positions) ? (
                  secilenIlan.positions.map((pos, idx) => {
                    const kalan = pos.needed - pos.filled;
                    const dolduMu = kalan <= 0;
                    return (
                      <View key={idx} style={[styles.mevkiSatir, dolduMu && styles.mevkiDoldu]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.mevkiAdi, dolduMu && { color: '#666' }]}>{pos.name}</Text>
                          <Text style={styles.mevkiDurum}>
                            {dolduMu ? '✅ Kadro tamam' : `${kalan} kişi aranıyor`}
                          </Text>
                        </View>
                        {/* Başvur butonu — kendi ilanı değilse ve boşluk varsa göster */}
                        {!dolduMu && secilenIlan.OrganizerID !== currentUserId && (
                          <TouchableOpacity
                            style={styles.mevkiBasvurBtn}
                            onPress={() => mevkiyeBasvur(secilenIlan, pos.name)}
                          >
                            <Text style={styles.mevkiBasvurText}>BAŞVUR</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })
                ) : (
                  // Eski format (positions dizisi yok)
                  <View style={styles.detayRow}>
                    <Ionicons name="football" size={24} color="#39FF14" />
                    <View style={styles.detayTextBox}>
                      <Text style={styles.detayValue}>{secilenIlan.Required_Position}</Text>
                    </View>
                  </View>
                )}

                {/* Kendi ilanı mı? */}
                {secilenIlan.OrganizerID === currentUserId ? (
                  <TouchableOpacity style={[styles.publishBtn, { backgroundColor: '#FF4444' }]} onPress={() => ilaniKaldir(secilenIlan)}>
                    <Ionicons name="trash" size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={[styles.publishBtnText, { color: '#FFF' }]}>İLANI KALDIR</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.publishBtn, { backgroundColor: '#121212', borderWidth: 1, borderColor: '#39FF14', marginTop: 10 }]}
                    onPress={() => mesajAt(secilenIlan)}
                  >
                    <Ionicons name="chatbubble" size={20} color="#39FF14" style={{ marginRight: 8 }} />
                    <Text style={[styles.publishBtnText, { color: '#39FF14' }]}>MESAJ AT</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* === İLAN OLUŞTURMA MODALI === */}
      <Modal visible={modalGorunur} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni İlan</Text>
              <TouchableOpacity onPress={() => setModalGorunur(false)}>
                <Ionicons name="close-circle" size={32} color="#888" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '80%' }}>
              {/* Konum */}
              <TouchableOpacity style={styles.konumSecBtn} onPress={() => { setModalGorunur(false); setKonumSecimModu(true); }}>
                <Ionicons name="map" size={20} color="#39FF14" />
                <Text style={styles.konumSecBtnText}>
                  {secilenSahaKonumu ? '📍 Konum seçildi (Değiştir)' : '📍 Haritadan Konum Seç'}
                </Text>
              </TouchableOpacity>
              {!secilenSahaKonumu && <Text style={styles.helperText}>Seçmezsen mevcut konumun kullanılır.</Text>}

              {/* Mevki Seçimi */}
              <Text style={styles.label}>Aranan Mevkiler (Dokun → Ekle)</Text>

              {/* Seçilen Mevkiler */}
              {Object.keys(secilenMevkiler).length > 0 && (
                <View style={styles.secilenContainer}>
                  {Object.entries(secilenMevkiler).map(([mevki, sayi]) => (
                    <View key={mevki} style={styles.secilenChip}>
                      <Text style={styles.secilenChipText}>{mevki} × {sayi}</Text>
                      <View style={styles.chipButtons}>
                        <TouchableOpacity onPress={() => mevkiEkle(mevki)} style={styles.chipBtn}>
                          <Text style={styles.chipBtnText}>+</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => mevkiCikar(mevki)} style={[styles.chipBtn, { backgroundColor: '#FF4444' }]}>
                          <Text style={styles.chipBtnText}>−</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                  <Text style={styles.toplamText}>Toplam: {secilenMevkiSayisi} kişi aranıyor</Text>
                </View>
              )}

              {/* Mevki Listesi */}
              <View style={styles.mevkiGrid}>
                {MEVKILER.map((mevki) => {
                  const secildi = secilenMevkiler[mevki] > 0;
                  return (
                    <TouchableOpacity
                      key={mevki}
                      style={[styles.mevkiChip, secildi && styles.mevkiChipSecili]}
                      onPress={() => mevkiEkle(mevki)}
                    >
                      <Text style={[styles.mevkiChipText, secildi && styles.mevkiChipTextSecili]}>
                        {secildi ? `${mevki} (${secilenMevkiler[mevki]})` : mevki}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Saat */}
              <Text style={styles.label}>Maç Saati</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: Bugün 21:00 - 22:00"
                placeholderTextColor="#666"
                value={macSaati}
                onChangeText={setMacSaati}
              />

              <TouchableOpacity style={styles.publishBtn} onPress={ilanOlustur}>
                {ilanYukleniyor ? <ActivityIndicator color="#000" /> : <Text style={styles.publishBtnText}>İLANI YAYIMLA</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
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
  calloutContainer: { width: 200, padding: 10, backgroundColor: '#FFF', borderRadius: 10 },
  calloutTitle: { fontWeight: 'bold', fontSize: 13, color: '#000' },
  calloutTime: { fontSize: 12, color: '#666', marginVertical: 3 },
  calloutOwner: { fontSize: 11, color: '#4A90D9', fontWeight: 'bold' },
  calloutHint: { fontSize: 11, color: '#39FF14', fontWeight: '600' },
  addButton: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#39FF14', width: 65, height: 65, borderRadius: 35, justifyContent: 'center', alignItems: 'center', elevation: 10 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 15 },
  modalContent: { backgroundColor: '#1A1A1A', borderRadius: 25, padding: 20, borderWidth: 1, borderColor: '#333', maxHeight: '90%' },
  detayContent: { backgroundColor: '#1A1A1A', borderRadius: 25, padding: 20, borderWidth: 1, borderColor: '#39FF14', maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { color: '#39FF14', fontSize: 22, fontWeight: 'bold' },
  helperText: { color: '#888', fontSize: 12, marginBottom: 10, fontStyle: 'italic' },
  label: { color: '#FFF', fontSize: 14, marginBottom: 8, fontWeight: '600', marginTop: 10 },
  input: { backgroundColor: '#222', color: '#FFF', padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 10 },
  publishBtn: { backgroundColor: '#39FF14', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 15, flexDirection: 'row', justifyContent: 'center' },
  publishBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  // Detay
  detayRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#121212', padding: 15, borderRadius: 12, marginBottom: 8 },
  detayTextBox: { marginLeft: 15 },
  detayLabel: { color: '#888', fontSize: 12 },
  detayValue: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  // Mevki detay satırları
  mevkiBaslik: { color: '#39FF14', fontSize: 14, fontWeight: 'bold', marginTop: 10, marginBottom: 8, letterSpacing: 1 },
  mevkiSatir: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#121212', padding: 12, borderRadius: 10, marginBottom: 6, borderLeftWidth: 3, borderLeftColor: '#39FF14' },
  mevkiDoldu: { borderLeftColor: '#4A90D9', opacity: 0.6 },
  mevkiAdi: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  mevkiDurum: { color: '#888', fontSize: 12, marginTop: 2 },
  mevkiBasvurBtn: { backgroundColor: '#39FF14', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  mevkiBasvurText: { color: '#000', fontWeight: 'bold', fontSize: 12 },
  // Mevki seçim grid
  mevkiGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  mevkiChip: { backgroundColor: '#222', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, margin: 3, borderWidth: 1, borderColor: '#444' },
  mevkiChipSecili: { backgroundColor: '#39FF14', borderColor: '#39FF14' },
  mevkiChipText: { color: '#CCC', fontSize: 13, fontWeight: '600' },
  mevkiChipTextSecili: { color: '#000' },
  // Seçilen mevkiler
  secilenContainer: { backgroundColor: '#111', borderRadius: 12, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#39FF14' },
  secilenChip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#222' },
  secilenChipText: { color: '#39FF14', fontSize: 14, fontWeight: 'bold' },
  chipButtons: { flexDirection: 'row' },
  chipBtn: { backgroundColor: '#39FF14', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginLeft: 6 },
  chipBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  toplamText: { color: '#888', fontSize: 12, textAlign: 'center', marginTop: 8 },
  // Konum Seçim Modu
  konumSecimOverlay: { position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 50, paddingHorizontal: 15 },
  konumSecimBanner: { backgroundColor: 'rgba(0,0,0,0.85)', flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 15, marginBottom: 10 },
  konumBannerText: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginLeft: 10 },
  konumSecimButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  konumIptalBtn: { flex: 1, backgroundColor: '#333', padding: 15, borderRadius: 10, alignItems: 'center', marginRight: 5 },
  konumIptalText: { color: '#FFF', fontWeight: 'bold' },
  konumOnayBtn: { flex: 2, backgroundColor: '#39FF14', padding: 15, borderRadius: 10, alignItems: 'center', marginLeft: 5 },
  konumOnayText: { color: '#000', fontWeight: 'bold' },
  konumSecBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#222', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#39FF14' },
  konumSecBtnText: { color: '#FFF', fontSize: 14, marginLeft: 10 },
});
