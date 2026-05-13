import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const BASE_URL = 'https://hss-halisaha.onrender.com';

export default function TeamEkrani() {
  const [takimim, setTakimim] = useState(null);
  const [tumTakimlar, setTumTakimlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  
  // Takım Oluşturma Modal State'leri
  const [modalGorunur, setModalGorunur] = useState(false);
  const [takimAdi, setTakimAdi] = useState('');
  const [olusturmaYukleniyor, setOlusturmaYukleniyor] = useState(false);

  // Meydan Okuma Modal State'leri
  const [challengeModal, setChallengeModal] = useState(false);
  const [hedefTakim, setHedefTakim] = useState(null);
  const [macSaati, setMacSaati] = useState('');

  // Meydan okumalar
  const [challenges, setChallenges] = useState([]);

  useEffect(() => {
    takimlariGetir();
  }, []);

  const takimlariGetir = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/teams`);
      const data = await response.json();
      if (data.teams) {
        setTumTakimlar(data.teams);
        // Kendi takımımızı bul (simülasyon: kaptan ID'ye göre)
        const benimTakimim = data.teams.find(t => t.captain_uid === 'user_baran_123');
        if (benimTakimim) setTakimim(benimTakimim);
      }
      setYukleniyor(false);
    } catch (error) {
      console.error("Takımlar çekilemedi:", error);
      setYukleniyor(false);
    }
  };

  const takimOlustur = async () => {
    if (!takimAdi.trim()) {
      Alert.alert("Hata", "Takım adı boş bırakılamaz!");
      return;
    }

    setOlusturmaYukleniyor(true);
    try {
      const response = await fetch(`${BASE_URL}/api/teams/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          captainId: 'user_baran_123',
          teamName: takimAdi,
          members: ['user_baran_123']
        })
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert("Başarılı!", `${takimAdi} takımı kuruldu!`);
        setTakimim(data.team);
        setModalGorunur(false);
        setTakimAdi('');
        takimlariGetir();
      } else {
        Alert.alert("Hata", data.error);
      }
    } catch (error) {
      Alert.alert("Bağlantı Hatası", "Sunucuya ulaşılamadı.");
    } finally {
      setOlusturmaYukleniyor(false);
    }
  };

  const meydanOku = async () => {
    if (!macSaati.trim() || !hedefTakim) {
      Alert.alert("Hata", "Maç saati bilgisi gerekli!");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/teams/challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengerTeamId: takimim.team_id,
          targetTeamId: hedefTakim.team_id,
          matchTime: macSaati
        })
      });

      if (response.ok) {
        Alert.alert("Meydan Okuma Gönderildi!", `${hedefTakim.team_name} takımına meydan okudunuz!`);
        setChallengeModal(false);
        setMacSaati('');
        setHedefTakim(null);
      }
    } catch (error) {
      Alert.alert("Hata", "Meydan okuma gönderilemedi.");
    }
  };

  if (yukleniyor) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#39FF14" />
        <Text style={styles.loadingText}>Takımlar Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Üst Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#39FF14" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TAKIMIM</Text>
      </View>

      {/* Takım Kartı veya Takım Kur Butonu */}
      {takimim ? (
        <View style={styles.teamCard}>
          <View style={styles.teamIconContainer}>
            <Ionicons name="shield" size={60} color="#39FF14" />
          </View>
          <Text style={styles.teamName}>{takimim.team_name}</Text>
          <Text style={styles.teamCaptain}>Kaptan: Sen</Text>
          
          <View style={styles.teamStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{takimim.members?.length || 1}</Text>
              <Text style={styles.statLabel}>Oyuncu</Text>
            </View>
            <View style={[styles.statItem, styles.statBorder]}>
              <Text style={styles.statValue}>{takimim.wins || 0}</Text>
              <Text style={styles.statLabel}>Galibiyet</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{takimim.losses || 0}</Text>
              <Text style={styles.statLabel}>Mağlubiyet</Text>
            </View>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.createTeamButton} onPress={() => setModalGorunur(true)}>
          <Ionicons name="add-circle" size={50} color="#39FF14" />
          <Text style={styles.createTeamText}>TAKIMINI KUR</Text>
          <Text style={styles.createTeamSubtext}>Kemik kadronla sahaya çık!</Text>
        </TouchableOpacity>
      )}

      {/* Diğer Takımlar - Meydan Okuma Listesi */}
      <View style={styles.otherTeamsSection}>
        <Text style={styles.sectionTitle}>RAKİP TAKIMLAR</Text>
        {tumTakimlar.filter(t => t.team_id !== takimim?.team_id).length === 0 ? (
          <Text style={styles.emptyText}>Henüz başka takım yok. İlk rakibini bekle!</Text>
        ) : (
          <FlatList
            data={tumTakimlar.filter(t => t.team_id !== takimim?.team_id)}
            keyExtractor={(item) => item.team_id}
            renderItem={({ item }) => (
              <View style={styles.rivalCard}>
                <View style={styles.rivalInfo}>
                  <Ionicons name="shield-half" size={35} color="#888" />
                  <View style={styles.rivalTextContainer}>
                    <Text style={styles.rivalName}>{item.team_name}</Text>
                    <Text style={styles.rivalMembers}>{item.members?.length || 0} Oyuncu</Text>
                  </View>
                </View>
                {takimim && (
                  <TouchableOpacity
                    style={styles.challengeButton}
                    onPress={() => {
                      setHedefTakim(item);
                      setChallengeModal(true);
                    }}
                  >
                    <Ionicons name="flash" size={18} color="#000" />
                    <Text style={styles.challengeButtonText}>MEYDAN OKU</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Takım Oluşturma Modal */}
      <Modal visible={modalGorunur} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Takım Kur</Text>
              <TouchableOpacity onPress={() => setModalGorunur(false)}>
                <Ionicons name="close-circle" size={32} color="#888" />
              </TouchableOpacity>
            </View>

            <Ionicons name="shield" size={80} color="#39FF14" style={{ alignSelf: 'center', marginBottom: 20 }} />

            <Text style={styles.label}>Takım Adı</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: FC Yenilmezler"
              placeholderTextColor="#666"
              value={takimAdi}
              onChangeText={setTakimAdi}
            />

            <TouchableOpacity style={styles.publishButton} onPress={takimOlustur}>
              {olusturmaYukleniyor ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.publishButtonText}>TAKIMI KUR</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Meydan Okuma Modal */}
      <Modal visible={challengeModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Meydan Oku</Text>
              <TouchableOpacity onPress={() => setChallengeModal(false)}>
                <Ionicons name="close-circle" size={32} color="#888" />
              </TouchableOpacity>
            </View>

            <View style={styles.challengeInfo}>
              <Text style={styles.challengeVs}>
                {takimim?.team_name} ⚔️ {hedefTakim?.team_name}
              </Text>
            </View>

            <Text style={styles.label}>Maç Saati</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Bugün 21:00 - 22:00"
              placeholderTextColor="#666"
              value={macSaati}
              onChangeText={setMacSaati}
            />

            <TouchableOpacity style={styles.publishButton} onPress={meydanOku}>
              <Text style={styles.publishButtonText}>MEYDAN OKUMAYI GÖNDER</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#39FF14',
    marginTop: 10,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    color: '#39FF14',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  // --- Takım Kartı ---
  teamCard: {
    backgroundColor: '#121212',
    margin: 20,
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#39FF14',
  },
  teamIconContainer: {
    marginBottom: 10,
    shadowColor: '#39FF14',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  teamName: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 5,
  },
  teamCaptain: {
    color: '#39FF14',
    fontSize: 14,
    marginBottom: 20,
  },
  teamStats: {
    flexDirection: 'row',
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#333',
  },
  statValue: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 5,
    textTransform: 'uppercase',
  },
  // --- Takım Kur Butonu ---
  createTeamButton: {
    backgroundColor: '#121212',
    margin: 20,
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  createTeamText: {
    color: '#39FF14',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 15,
  },
  createTeamSubtext: {
    color: '#888',
    fontSize: 14,
    marginTop: 5,
  },
  // --- Rakip Takımlar ---
  otherTeamsSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 15,
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  rivalCard: {
    backgroundColor: '#121212',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#222',
  },
  rivalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rivalTextContainer: {
    marginLeft: 12,
  },
  rivalName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rivalMembers: {
    color: '#888',
    fontSize: 12,
    marginTop: 3,
  },
  challengeButton: {
    backgroundColor: '#39FF14',
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  challengeButtonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
    letterSpacing: 1,
  },
  // --- Modal ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 25,
    padding: 25,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#39FF14',
    fontSize: 22,
    fontWeight: 'bold',
  },
  label: {
    color: '#FFF',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#222',
    color: '#FFF',
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  publishButton: {
    backgroundColor: '#39FF14',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  publishButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  challengeInfo: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#121212',
    borderRadius: 12,
  },
  challengeVs: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
