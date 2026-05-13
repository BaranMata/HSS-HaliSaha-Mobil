import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');
const BASE_URL = 'https://hss-halisaha.onrender.com';

// --- 1. ALT BİLEŞEN: HER VİDEO KENDİ DURUMUNU YÖNETİR ---
const VideoItem = ({ item, isPlaying, listHeight }) => {
  const [isManualPaused, setIsManualPaused] = useState(false);

  // Sosyal Etkileşim State'leri
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likes || 0);
  
  // Yorum Paneli State'leri
  const [showComments, setShowComments] = useState(false);
  const [commentList, setCommentList] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentCount, setCommentCount] = useState(item.comments || 0);

  // Video ekrandan çıkınca duraklatma durumunu sıfırla
  useEffect(() => {
    if (!isPlaying) {
      setIsManualPaused(false);
    }
  }, [isPlaying]);

  // -- BEĞENİ MOTORU --
  const handleLike = async () => {
    if (isLiked) return; // Zaten beğendiyse tekrar artırma
    
    // Optimistic UI: Sunucuyu beklemeden ekranı anında yeşil yap (hızlı hissettirir)
    setIsLiked(true);
    setLikeCount(prev => prev + 1);

    try {
      await fetch(`${BASE_URL}/api/media/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: item.id })
      });
    } catch (error) {
      console.error("Beğeni iletilemedi:", error);
    }
  };

  // -- YORUMLARI AÇ VE GETİR --
  const openComments = async () => {
    setShowComments(true);
    try {
      const response = await fetch(`${BASE_URL}/api/media/comments/${item.id}`);
      const data = await response.json();
      if (data.comments) setCommentList(data.comments);
    } catch (error) {
      console.error("Yorumlar alınamadı:", error);
    }
  };

  // -- YORUM GÖNDER --
  const submitComment = async () => {
    if (newComment.trim() === "") return;
    
    const commentText = newComment;
    setNewComment(""); // Kutuyu temizle
    setCommentCount(prev => prev + 1);
    
    // Eklediğimiz yorumu anında listeye koy (sunucuyu beklemeden)
    setCommentList(prev => [...prev, { username: "@baranasar", text: commentText }]);

    try {
      await fetch(`${BASE_URL}/api/media/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: item.id, username: "@baranasar", text: commentText })
      });
    } catch (error) {
      console.error("Yorum gönderilemedi:", error);
    }
  };

  // Ekrana tıklanınca oynat/durdur
  const togglePlayPause = () => {
    setIsManualPaused(!isManualPaused);
  };

  return (
    <>
      <TouchableWithoutFeedback onPress={togglePlayPause}>
        {/* Yükseklik artık dinamik olarak gelen listHeight ile ayarlanıyor */}
        <View style={[styles.videoContainer, { height: listHeight }]}>
          <Video
            source={{ uri: item.videoUrl }}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            shouldPlay={isPlaying && !isManualPaused} // Hem ekranda olmalı hem de kullanıcı durdurmamış olmalı
            isLooping
            isMuted={false}
          />

          {/* EĞER DURDURULDUYSA ORTADA DEV BİR PLAY İKONU ÇIKSIN */}
          {isManualPaused && (
            <View style={styles.pausedOverlay}>
              <Ionicons name="play" size={80} color="rgba(255, 255, 255, 0.7)" />
            </View>
          )}

          <View style={styles.overlay}>
            <View style={styles.textContainer}>
              <Text style={styles.username}>{item.username || '@oyuncu'}</Text>
              <Text style={styles.description}>{item.description || 'Yetenek videosu'}</Text>
            </View>

            <View style={styles.interactionContainer}>
              <TouchableOpacity style={styles.iconButton} onPress={handleLike}>
                <Ionicons name="heart" size={35} color={isLiked ? "#39FF14" : "#FFF"} />
                <Text style={styles.iconText}>{likeCount}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconButton} onPress={openComments}>
                <Ionicons name="chatbubble-ellipses" size={32} color="#FFF" />
                <Text style={styles.iconText}>{commentCount}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="share-social" size={32} color="#FFF" />
                <Text style={styles.iconText}>Paylaş</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>

      {/* YORUM PANELİ (MODAL) */}
      <Modal visible={showComments} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
          <View style={styles.commentSheet}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentTitle}>{commentCount} Yorum</Text>
              <TouchableOpacity onPress={() => setShowComments(false)}>
                <Ionicons name="close" size={28} color="#FFF" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={commentList}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.singleComment}>
                  <Text style={styles.commentUsername}>{item.username}</Text>
                  <Text style={styles.commentText}>{item.text}</Text>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyCommentText}>İlk yorumu sen yap!</Text>}
            />

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Muazzam bir gol..."
                placeholderTextColor="#888"
                value={newComment}
                onChangeText={setNewComment}
              />
              <TouchableOpacity style={styles.sendButton} onPress={submitComment}>
                <Ionicons name="send" size={20} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

// --- 2. ANA EKRAN BİLEŞENİ ---
export default function HomeEkrani() {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [gercekVideolar, setGercekVideolar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  
  // Tam ekran sorunu için dinamik yükseklik (varsayılan tahmini 85 çıkartıyoruz, sonra onLayout ile tam ölçecek)
  const [listHeight, setListHeight] = useState(height - 85);

  useEffect(() => {
    const videolariGetir = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/media/feed`, {
          method: 'GET',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        setGercekVideolar(data.videos || []);
        setYukleniyor(false);
      } catch (error) {
        console.error("Video çekme hatası:", error);
        setYukleniyor(false);
      }
    };

    videolariGetir();
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveVideoIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  if (yukleniyor) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#39FF14" />
        <Text style={{ color: '#39FF14', marginTop: 15, letterSpacing: 1 }}>Akış Yenileniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.uploadButton} onPress={() => router.push('/upload-video')}>
        <Ionicons name="camera" size={28} color="#000" />
      </TouchableOpacity>

      {gercekVideolar.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#888', fontSize: 16 }}>Henüz kimse yeteneklerini sergilemedi.</Text>
          <Text style={{ color: '#39FF14', marginTop: 10, fontWeight: 'bold' }}>İlk videoyu sen yükle!</Text>
        </View>
      ) : (
        <FlatList
          // EN KRİTİK KISIM: FlatList'in ekranda kapladığı NET alanı hesapla ve listHeight'a yaz!
          onLayout={(e) => setListHeight(e.nativeEvent.layout.height)}
          data={gercekVideolar}
          renderItem={({ item, index }) => (
            <VideoItem 
              item={item} 
              isPlaying={activeVideoIndex === index} 
              listHeight={listHeight} 
            />
          )}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  uploadButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#39FF14',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 5,
  },
  videoContainer: {
    width: width,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  pausedOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)', // Durduğunda hafif kararır
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    paddingRight: 20,
    marginBottom: 10,
  },
  username: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  description: {
    color: '#EEE',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  interactionContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  iconButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 5,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
  // --- YENİ EKLENEN YORUM PANELİ CSS'LERİ ---
  modalContainer: { 
    flex: 1, 
    justifyContent: 'flex-end', 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  commentSheet: { 
    backgroundColor: '#1A1A1A', 
    height: height * 0.6, 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    padding: 20 
  },
  commentHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  commentTitle: { 
    color: '#FFF', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  singleComment: { 
    marginBottom: 15 
  },
  commentUsername: { 
    color: '#888', 
    fontSize: 12, 
    marginBottom: 3 
  },
  commentText: { 
    color: '#FFF', 
    fontSize: 15 
  },
  emptyCommentText: { 
    color: '#888', 
    textAlign: 'center', 
    marginTop: 20 
  },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 10, 
    borderTopWidth: 1, 
    borderColor: '#333', 
    paddingTop: 15 
  },
  commentInput: { 
    flex: 1, 
    backgroundColor: '#333', 
    color: '#FFF', 
    borderRadius: 20, 
    paddingHorizontal: 15, 
    height: 40, 
    marginRight: 10 
  },
  sendButton: { 
    backgroundColor: '#39FF14', 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center' 
  }
});
