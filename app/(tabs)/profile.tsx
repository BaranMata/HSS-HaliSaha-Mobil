import { StyleSheet, Text, View } from 'react-native';

export default function ProfileEkrani() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>OYUNCU KARTI</Text>
      <Text style={styles.subtitle}>İstatistikler ve geçmiş maçlar burada olacak.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  title: { color: '#39FF14', fontSize: 24, fontWeight: 'bold', letterSpacing: 2 },
  subtitle: { color: '#888', marginTop: 10 }
});