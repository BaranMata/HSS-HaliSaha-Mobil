import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { router } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getUser } from '../userSession';

const { width } = Dimensions.get('window');
const BASE_URL = 'https://hss-halisaha.onrender.com';

export default function ProfileEkrani() {
  const [userProfile, setUserProfile] = useState({
    name: '', username: '', position: '',
    rating: 0, matchesPlayed: 0, goals: 0, assists: 0,
  });
  const [yukleniyor, setYukleniyor] = useState(true);
  const [videolarim, setVideolarim] = useState([]);
  const [videoYukleniyor, setVideoYukleniyor] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUsername, setCurrentUsername] = useState('');

  // Video Detay Modal
  const [videoModal, setVideoModal] = useState(false);
  const [secilenVideo, setSecilenVideo] = useState(null);
  const [yorumlar, setYorumlar] = useState([]);
  const [yeniYorum, setYeniYorum] = useState('');
  const [yorumYukleniyor, setYorumYukleniyor] = useState(false);
  const videoRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      const hepsiniGetir = async () => {
        setYukleniyor(true);
        setVideoYukleniyor(true);

        const user = await getUser();
        if (!user) {
          setYukleniyor(false);
          setVideoYukleniyor(false);
          return;
        }
        setCurrentUserId(user.uid);
        setCurrentUsername(user.username);

        // Profili API'den çek
        try {
          const response = await fetch(`${BASE_URL}/api/users/${user.uid}`);
          const data = await response.json();
          if (data.user) {
            setUserProfile({
              name: data.user.fullName || data.user.Username || 'İsim Belirtilmedi',
              username: data.user.Username ? `@${data.user.Username}` : '@kullanici',
              position: data.user.Position || 'Mevki Belirtilmedi',
              rating: data.user.Skill_Rating || 0,
              matchesPlayed: data.user.matchesPlayed || 0,
              goals: data.user.goals || 0,
              assists: data.user.assists || 0,
            });
          } else {
            setUserProfile({
              name: user.fullName || 'İsim Belirtilmedi',
              username: `@${user.username}`,
              position: user.position || 'Mevki Belirtilmedi',
              rating: 0, matchesPlayed: 0, goals: 0, assists: 0,
            });
          }
        } catch {
          setUserProfile({
            name: user.fullName || 'İsim Belirtilmedi',
            username: `@${user.username}`,
            position: user.position || 'Mevki Belirtilmedi',
            rating: 0, matchesPlayed: 0, goals: 0, assists: 0,
          });
        } finally {
          setYukleniyor(false);
        }

        // Videoları feed'den çekip kendi username'ine göre filtrele
        try {
          const vRes = await fetch(`${BASE_URL}/api/media/feed`);
          const vData = await vRes.json();
          if (vData.videos) {
            const benimVideolarim = vData.videos.filter(
              v => v.username === user.username || v.ownerId === user.uid
            );
            setVideolarim(benimVideolarim);
          }
        } catch {
          console.log("Videolar çekilemedi.");
        } finally {
          setVideoYukleniyor(false);
        }
      };
      hepsiniGetir();
    }, [])
  );

  // Video detayını aç
  const videoDetayAc = async (video) => {
    setSecilenVideo(video);
    setVideoModal(true);
    setYorumlar([]);
    setYorumYukleniyor(true);

    // Yorumları çek
    try {
      const res = await fetch(`${BASE_URL}/api/media/${video.id}/comments`);
      const data = await res.json();
      if (data.comments) setYorumlar(data.comments);
    } catch {
      console.log("Yorumlar çekilemedi.");
    } finally {
      setYorumYukleniyor(false);
    }
  };

  // Yorum gönder
  const yorumGonder = async () => {
    if (!yeniYorum.trim() || !secilenVideo) return;
    const yorumMetni = yeniYorum.trim();
    setYeniYorum('');

    // Anında göster
    setYorumlar(prev => [...prev, { username: currentUsername, text: yorumMetni }]);

    try {
      await fetch(`${BASE_URL}/api/media/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: secilenVideo.id, username: currentUsername, text: yorumMetni })
      });
    } catch {
      console.log("Yorum gönderilemedi.");
    }
  };

  // Video sil
  const videoSil = (video) => {
    Alert.alert(
      "Videoyu Sil",
      `"${video.description || 'Bu video'}" silinsin mi?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await fetch(`${BASE_URL}/api/media/${video.id}`, { method: 'DELETE' });
              setVideolarim(prev => prev.filter(v => v.id !== video.id));
              setVideoModal(false);
              Alert.alert("Silindi", "Video başarıyla silindi.");
            } catch {
              Alert.alert("Hata", "Video silinemedi.");
            }
          }
        }
      ]
    );
  };

  if (yukleniyor) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#39FF14" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle-outline" size={110} color="#39FF14" />
          </View>
          <Text style={styles.name}>{userProfile.name}</Text>
          <Text style={styles.username}>{userProfile.username}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{userProfile.position}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{userProfile.matchesPlayed}</Text>
            <Text style={styles.statLabel}>Maç</Text>
          </View>
          <View style={[styles.statBox, styles.statBorder]}>
            <Text style={styles.statValue}>{userProfile.goals}</Text>
            <Text style={styles.statLabel}>Gol</Text>
          </View>
          <View style={[styles.statBox, styles.statBorder]}>
            <Text style={styles.statValue}>{userProfile.assists}</Text>
            <Text style={styles.statLabel}>Asist</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#39FF14', textShadowColor: '#39FF14', textShadowRadius: 10 }]}>
              {userProfile.rating}
            </Text>
            <Text style={styles.statLabel}>Puan</Text>
          </View>
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.editButton} onPress={() => router.push('/edit-profile')}>
            <Ionicons name="settings-outline" size={20} color="#000" style={{ marginRight: 8 }} />
            <Text style={styles.editButtonText}>KARTINI GÜNCELLE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.editButton, { marginTop: 12, backgroundColor: '#121212', borderWidth: 1, borderColor: '#39FF14' }]}
            onPress={() => router.push('/team')}
          >
            <Ionicons name="shield" size={20} color="#39FF14" style={{ marginRight: 8 }} />
            <Text style={[styles.editButtonText, { color: '#39FF14' }]}>TAKIMIM</Text>
          </TouchableOpacity>
        </View>

        {/* VİDEOLARIM */}
        <View style={styles.galleryContainer}>
          <View style={styles.galleryHeader}>
            <Text style={styles.sectionTitle}>VİDEOLARIM ({videolarim.length})</Text>
            <TouchableOpacity onPress={() => router.push('/upload-video')}>
              <Ionicons name="add-circle" size={28} color="#39FF14" />
            </TouchableOpacity>
          </View>

          {videoYukleniyor ? (
            <ActivityIndicator color="#39FF14" style={{ marginTop: 20 }} />
          ) : videolarim.length === 0 ? (
            <View style={styles.emptyVideoContainer}>
              <Ionicons name="videocam-off" size={50} color="#555" />
              <Text style={styles.emptyVideoText}>Henüz video yüklemedin</Text>
              <TouchableOpacity style={styles.uploadFirstButton} onPress={() => router.push('/upload-video')}>
                <Ionicons name="add" size={20} color="#000" style={{ marginRight: 5 }} />
                <Text style={styles.uploadFirstText}>İLK VİDEONU YÜKLE</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.grid}>
              {videolarim.map((video) => (
                <TouchableOpacity
                  key={video.id}
                  style={styles.gridItem}
                  onPress={() => videoDetayAc(video)}
                  onLongPress={() => videoSil(video)}
                >
                  <Ionicons name="play-circle" size={40} color="rgba(57,255,20,0.8)" />
                  <Text style={styles.videoDesc} numberOfLines={2}>{video.description || ''}</Text>
                  <View style={styles.videoStats}>
                    <View style={styles.videoStatItem}>
                      <Ionicons name="heart" size={12} color="#39FF14" />
                      <Text style={styles.videoStatText}>{video.likes || 0}</Text>
                    </View>
                    <View style={styles.videoStatItem}>
                      <Ionicons name="chatbubble" size={12} color="#888" />
                      <Text style={styles.videoStatText}>{video.comments || 0}</Text>
                    </View>
                  </View>
                  <View style={styles.deleteHint}>
                    <Ionicons name="trash" size={14} color="#FF4444" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* === VİDEO DETAY MODALI === */}
      <Modal visible={videoModal} animationType="slide" transparent>
        <View style={styles.videoModalOverlay}>
          <View style={styles.videoModalContent}>
            {/* Üst Bar */}
            <View style={styles.videoModalHeader}>
              <Text style={styles.videoModalTitle}>Video Detay</Text>
              <TouchableOpacity onPress={() => { setVideoModal(false); if (videoRef.current) videoRef.current.pauseAsync(); }}>
                <Ionicons name="close-circle" size={32} color="#888" />
              </TouchableOpacity>
            </View>

            {secilenVideo && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Video Oynatıcı */}
                <View style={styles.videoPlayerContainer}>
                  <Video
                    ref={videoRef}
                    source={{ uri: secilenVideo.videoUrl }}
                    style={styles.videoPlayer}
                    resizeMode={ResizeMode.CONTAIN}
                    useNativeControls
                    shouldPlay
                    isLooping
                  />
                </View>

                {/* Açıklama */}
                <Text style={styles.videoDetailDesc}>{secilenVideo.description}</Text>
                <Text style={styles.videoDetailMeta}>
                  ❤️ {secilenVideo.likes || 0} beğeni  •  💬 {secilenVideo.comments || 0} yorum
                </Text>

                {/* Sil Butonu */}
                <TouchableOpacity style={styles.silButton} onPress={() => videoSil(secilenVideo)}>
                  <Ionicons name="trash" size={18} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.silButtonText}>VİDEOYU SİL</Text>
                </TouchableOpacity>

                {/* Yorumlar */}
                <Text style={styles.yorumBaslik}>Yorumlar</Text>
                {yorumYukleniyor ? (
                  <ActivityIndicator color="#39FF14" style={{ marginTop: 10 }} />
                ) : yorumlar.length === 0 ? (
                  <Text style={styles.yorumBos}>Henüz yorum yok.</Text>
                ) : (
                  yorumlar.map((yorum, idx) => (
                    <View key={idx} style={styles.yorumSatir}>
                      <Text style={styles.yorumUsername}>{yorum.username}</Text>
                      <Text style={styles.yorumText}>{yorum.text}</Text>
                    </View>
                  ))
                )}

                {/* Yorum Yaz */}
                <View style={styles.yorumInputContainer}>
                  <TextInput
                    style={styles.yorumInput}
                    placeholder="Yorum yaz..."
                    placeholderTextColor="#666"
                    value={yeniYorum}
                    onChangeText={setYeniYorum}
                  />
                  <TouchableOpacity onPress={yorumGonder} style={styles.yorumGonderBtn}>
                    <Ionicons name="send" size={20} color="#39FF14" />
                  </TouchableOpacity>
                </View>

                <View style={{ height: 30 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  header: { alignItems: 'center', paddingTop: 40, paddingBottom: 20 },
  avatarContainer: { marginBottom: 10, shadowColor: '#39FF14', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 10 },
  name: { fontSize: 26, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 1 },
  username: { fontSize: 16, color: '#888888', marginBottom: 15 },
  badge: { backgroundColor: '#121212', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#39FF14' },
  badgeText: { color: '#39FF14', fontSize: 14, fontWeight: '600', letterSpacing: 1 },
  statsContainer: { flexDirection: 'row', backgroundColor: '#121212', marginHorizontal: 20, borderRadius: 15, paddingVertical: 20, marginBottom: 25, borderWidth: 1, borderColor: '#222' },
  statBox: { flex: 1, alignItems: 'center' },
  statBorder: { borderLeftWidth: 1, borderLeftColor: '#333' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 5 },
  statLabel: { fontSize: 12, color: '#888888', textTransform: 'uppercase', letterSpacing: 1 },
  actionContainer: { paddingHorizontal: 20, marginBottom: 30 },
  editButton: { backgroundColor: '#39FF14', flexDirection: 'row', padding: 15, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  editButtonText: { color: '#000000', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  galleryContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  galleryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: (width - 50) / 2, height: 200, backgroundColor: '#1A1A1A', borderRadius: 12, marginBottom: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333', padding: 10 },
  videoDesc: { color: '#CCC', fontSize: 11, position: 'absolute', bottom: 30, left: 10, right: 10 },
  videoStats: { position: 'absolute', bottom: 8, left: 10, flexDirection: 'row' },
  videoStatItem: { flexDirection: 'row', alignItems: 'center', marginRight: 10 },
  videoStatText: { color: '#FFF', fontSize: 10, marginLeft: 3 },
  deleteHint: { position: 'absolute', top: 8, right: 8, opacity: 0.5 },
  emptyVideoContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyVideoText: { color: '#888', fontSize: 14, marginTop: 10, marginBottom: 20 },
  uploadFirstButton: { flexDirection: 'row', backgroundColor: '#39FF14', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  uploadFirstText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  // Video Detay Modal
  videoModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  videoModalContent: { flex: 1, paddingTop: 50, paddingHorizontal: 15 },
  videoModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  videoModalTitle: { color: '#39FF14', fontSize: 22, fontWeight: 'bold' },
  videoPlayerContainer: { width: '100%', height: 300, backgroundColor: '#111', borderRadius: 15, overflow: 'hidden', marginBottom: 15 },
  videoPlayer: { width: '100%', height: '100%' },
  videoDetailDesc: { color: '#FFF', fontSize: 16, marginBottom: 8 },
  videoDetailMeta: { color: '#888', fontSize: 13, marginBottom: 15 },
  silButton: { flexDirection: 'row', backgroundColor: '#FF4444', padding: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  silButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  yorumBaslik: { color: '#39FF14', fontSize: 16, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 },
  yorumBos: { color: '#666', fontSize: 13, fontStyle: 'italic', marginBottom: 15 },
  yorumSatir: { backgroundColor: '#1A1A1A', padding: 12, borderRadius: 10, marginBottom: 6 },
  yorumUsername: { color: '#39FF14', fontSize: 13, fontWeight: 'bold', marginBottom: 3 },
  yorumText: { color: '#DDD', fontSize: 14 },
  yorumInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 12, marginTop: 10, paddingHorizontal: 12 },
  yorumInput: { flex: 1, color: '#FFF', padding: 12, fontSize: 14 },
  yorumGonderBtn: { padding: 8 },
});
