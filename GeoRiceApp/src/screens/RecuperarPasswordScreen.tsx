import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { BASE_URL } from '../infrastructure/repositories/ApiClient';
import Icon from '../components/Icon';

type Nav = NativeStackNavigationProp<RootStackParamList, 'RecuperarPassword'>;
type Paso = 'solicitar' | 'cambiar';

const RecuperarPasswordScreen = () => {
  const navigation = useNavigation<Nav>();
  const [paso, setPaso] = useState<Paso>('solicitar');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [verPassword, setVerPassword] = useState(false);

  const leerError = async (res: Response, fallback: string) => {
    const body = await res.json().catch(() => ({}));
    return (body as any).error || (body as any).mensaje || fallback;
  };

  const solicitarCodigo = async () => {
    if (!email.trim()) {
      Alert.alert('Correo requerido', 'Ingresa el correo registrado en tu cuenta.');
      return;
    }

    setLoading(true);
    setMensaje('');
    try {
      const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        throw new Error(await leerError(res, 'No se pudo enviar el codigo.'));
      }
      const body = await res.json();
      setMensaje(body.mensaje || 'Si el correo existe, recibiras un codigo de recuperacion.');
      if (body.resetCode) setCodigo(String(body.resetCode));
      setPaso('cambiar');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo enviar el codigo.');
    } finally {
      setLoading(false);
    }
  };

  const cambiarPassword = async () => {
    if (!email.trim() || !codigo.trim()) {
      Alert.alert('Datos incompletos', 'Ingresa el correo y el codigo recibido.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Contrasena muy corta', 'La contrasena debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmar) {
      Alert.alert('Contrasenas diferentes', 'La nueva contrasena y la confirmacion no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), codigo: codigo.trim(), password }),
      });
      if (!res.ok) {
        throw new Error(await leerError(res, 'No se pudo cambiar la contrasena.'));
      }
      Alert.alert('Contrasena actualizada', 'Ya puedes ingresar con tu nueva contrasena.', [
        { text: 'Ir al login', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo cambiar la contrasena.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <View style={s.iconCircle}>
            <Icon name="lock-reset" size={38} color="#1a5c2a" />
          </View>
          <Text style={s.titulo}>Recuperar contrasena</Text>
          <Text style={s.subtitulo}>Usa el correo registrado en tu cuenta de GeoRice.</Text>

          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Correo electronico"
            placeholderTextColor="#aaa"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!loading}
          />

          {paso === 'solicitar' ? (
            <TouchableOpacity style={[s.btn, loading && s.disabled]} onPress={solicitarCodigo} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Enviar codigo</Text>}
            </TouchableOpacity>
          ) : (
            <>
              {mensaje ? <Text style={s.mensaje}>{mensaje}</Text> : null}
              <TextInput
                style={s.input}
                value={codigo}
                onChangeText={setCodigo}
                placeholder="Codigo de recuperacion"
                placeholderTextColor="#aaa"
                keyboardType="number-pad"
                editable={!loading}
              />
              <View style={s.passwordWrapper}>
                <TextInput
                  style={s.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Nueva contrasena"
                  placeholderTextColor="#aaa"
                  secureTextEntry={!verPassword}
                  editable={!loading}
                />
                <TouchableOpacity style={s.eyeBtn} onPress={() => setVerPassword(v => !v)}>
                  <Icon name={verPassword ? 'eye-off' : 'eye'} size={20} color="#888" />
                </TouchableOpacity>
              </View>
              <TextInput
                style={s.input}
                value={confirmar}
                onChangeText={setConfirmar}
                placeholder="Confirmar contrasena"
                placeholderTextColor="#aaa"
                secureTextEntry={!verPassword}
                editable={!loading}
              />
              <TouchableOpacity style={[s.btn, loading && s.disabled]} onPress={cambiarPassword} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Cambiar contrasena</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={s.linkBtn} onPress={solicitarCodigo} disabled={loading}>
                <Text style={s.linkText}>Reenviar codigo</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={s.backBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={s.backText}>Volver al login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f0' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 8,
  },
  iconCircle: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: '#dff5e7',
    alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  titulo: { fontSize: 25, fontWeight: '800', color: '#1a5c2a', textAlign: 'center', marginBottom: 6 },
  subtitulo: { fontSize: 13, color: '#777', textAlign: 'center', marginBottom: 24, lineHeight: 18 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14,
    fontSize: 16, backgroundColor: '#fafafa',
  },
  passwordWrapper: { justifyContent: 'center', marginBottom: 14 },
  passwordInput: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 14, paddingRight: 44, paddingVertical: 12,
    fontSize: 16, backgroundColor: '#fafafa',
  },
  eyeBtn: { position: 'absolute', right: 12 },
  btn: { backgroundColor: '#1a5c2a', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  disabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  mensaje: { color: '#1a5c2a', backgroundColor: '#ecf8ef', borderRadius: 10, padding: 12, marginBottom: 14, lineHeight: 18 },
  linkBtn: { alignSelf: 'center', marginTop: 14 },
  linkText: { color: '#1a5c2a', fontWeight: '700' },
  backBtn: { alignSelf: 'center', marginTop: 18 },
  backText: { color: '#666', fontWeight: '600' },
});

export default RecuperarPasswordScreen;