import AsyncStorage from '@react-native-async-storage/async-storage';

// Kullanıcı oturum bilgilerini telefona kaydet
export const saveUser = async (userData: { uid: string; username: string; fullName: string; position: string }) => {
  await AsyncStorage.setItem('currentUser', JSON.stringify(userData));
};

// Kaydedilmiş kullanıcıyı oku
export const getUser = async () => {
  const data = await AsyncStorage.getItem('currentUser');
  if (data) return JSON.parse(data);
  return null;
};

// Çıkış yap
export const clearUser = async () => {
  await AsyncStorage.removeItem('currentUser');
};
