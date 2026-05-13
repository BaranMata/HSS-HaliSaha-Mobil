import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { FlatList, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function MessagesEkrani() {
  // Test için DM Kutusu Verileri
  const dmListesi = [
    { 
      id: '1', 
      kullanici: 'FC Yenilmezler (Kaptan)', 
      sonMesaj: 'Kramponlarını al gel, kadrodasın! 🟢', 
      saat: '20:47', 
      okunmamis: 0 
    },
    { 
      id: '2', 
      kullanici: 'Enes İnanç', 
      sonMesaj: 'Dostum yarınki maç için sağ bek lazım mı?', 
      saat: '18:30', 
      okunmamis: 2 
    },
    { 
      id: '3', 
      kullanici: 'Sistem Bildirimi', 
      sonMesaj: 'İlanın radarda yayınlandı!', 
      saat: 'Dün', 
      okunmamis: 0 
    },
  ];

  const sohbeteGit = () => {
    // Tıklanan mesaja göre chat ekranına yönlendiriyoruz
    router.push('/chat');
  };

  const renderMesaj = ({ item }) => (
    <TouchableOpacity style={styles.mesajKutusu} onPress={sohbeteGit}>
      <View style={styles.avatar}>
        <Ionicons name="person-circle" size={50} color="#555" />
      </View>
      
      <View style={styles.mesajIcerik}>
        <View style={styles.mesajUst}>
          <Text style={styles.kullaniciAdi}>{item.kullanici}</Text>
          <Text style={styles.saat}>{item.saat}</Text>
        </View>
        <View style={styles.mesajAlt}>
          <Text style={[styles.sonMesaj, item.okunmamis > 0 && styles.okunmamisMesaj]} numberOfLines={1}>
            {item.sonMesaj}
          </Text>
          {item.okunmamis > 0 && (
            <View style={styles.bildirimBalonu}>
              <Text style={styles.bildirimMetni}>{item.okunmamis}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MESAJLAR</Text>
        <TouchableOpacity>
          <Ionicons name="create-outline" size={26} color="#39FF14" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={dmListesi}
        keyExtractor={(item) => item.id}
        renderItem={renderMesaj}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: {
    color: '#39FF14',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  mesajKutusu: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#111',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 15,
  },
  mesajIcerik: {
    flex: 1,
  },
  mesajUst: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  kullaniciAdi: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saat: {
    color: '#888',
    fontSize: 12,
  },
  mesajAlt: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sonMesaj: {
    color: '#AAA',
    fontSize: 14,
    flex: 1,
    marginRight: 10,
  },
  okunmamisMesaj: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  bildirimBalonu: {
    backgroundColor: '#39FF14',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  bildirimMetni: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  }
});
