import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const LoginScreen = () => {
  const { login }              = useAuth();
  const [email, setEmail]      = useState('');
  const [password, setPassword]= useState('');
  const [loading, setLoading]  = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Ingresa correo y contraseña'); return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e: any) {
      Alert.alert('Error de acceso', e.message ?? 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.card}>
        <Text style={s.logo}>🌾</Text>
        <Text style={s.titulo}>GeoRice</Text>
        <Text style={s.subtitulo}>Sistema de Georreferenciación Agrícola</Text>

        <TextInput
          style={s.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Correo electrónico"
          placeholderTextColor="#aaa"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
        <TextInput
          style={s.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Contraseña"
          placeholderTextColor="#aaa"
          secureTextEntry
          onSubmitEditing={handleLogin}
        />

        <TouchableOpacity
          style={[s.btn, (loading || !email || !password) && { opacity: 0.5 }]}
          onPress={handleLogin}
          disabled={loading || !email.trim() || !password.trim()}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnText}>Ingresar</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f0', justifyContent: 'center', padding: 24 },
  card:      { backgroundColor: '#fff', borderRadius: 16, padding: 28,
               shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
               shadowOpacity: 0.1, shadowRadius: 12, elevation: 8 },
  logo:      { fontSize: 52, textAlign: 'center', marginBottom: 4 },
  titulo:    { fontSize: 28, fontWeight: '800', color: '#1a5c2a', textAlign: 'center', marginBottom: 4 },
  subtitulo: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 28 },
  input:     { borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
               paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14,
               fontSize: 16, backgroundColor: '#fafafa' },
  btn:       { backgroundColor: '#1a5c2a', borderRadius: 10, paddingVertical: 14,
               alignItems: 'center', marginTop: 4 },
  btnText:   { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default LoginScreen;
