import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { RegistrarUsuario } from '../application/usecases/usuarios/RegistrarUsuario';
import Icon from '../components/Icon';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Registro'>;

const RegistroScreen = () => {
  const navigation = useNavigation<Nav>();

  const [nombre, setNombre]     = useState('');
  const [apellido, setApellido] = useState('');
  const [cedula, setCedula]     = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleRegistro = async () => {
    if (!nombre.trim() || !apellido.trim() || !cedula.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Nombre, apellido, cédula y contraseña son obligatorios.');
      return;
    }
    if (password !== confirmar) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      await RegistrarUsuario({
        nombre:   nombre.trim(),
        apellido: apellido.trim(),
        cedula:   cedula.trim(),
        email:    email.trim() || undefined,
        password,
      });
      Alert.alert(
        'Registro exitoso',
        'Solicite al administrador habilitar su usuario.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }],
      );
    } catch (e: any) {
      Alert.alert('Error de registro', e.message ?? 'No se pudo completar el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <Text style={s.titulo}>Crear cuenta</Text>
          <Text style={s.subtitulo}>Completa tus datos para solicitar acceso</Text>

          <TextInput
            style={s.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Nombre *"
            placeholderTextColor="#aaa"
          />
          <TextInput
            style={s.input}
            value={apellido}
            onChangeText={setApellido}
            placeholder="Apellido *"
            placeholderTextColor="#aaa"
          />
          <TextInput
            style={s.input}
            value={cedula}
            onChangeText={setCedula}
            placeholder="Cédula *"
            placeholderTextColor="#aaa"
            keyboardType="numeric"
            maxLength={10}
          />
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
          <View style={s.passwordWrapper}>
            <TextInput
              style={s.passwordInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Contraseña *"
              placeholderTextColor="#aaa"
              secureTextEntry={!verPassword}
            />
            <TouchableOpacity
              style={s.eyeBtn}
              onPress={() => setVerPassword(v => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name={verPassword ? 'eye-off' : 'eye'} size={20} color="#888" />
            </TouchableOpacity>
          </View>
          <TextInput
            style={s.input}
            value={confirmar}
            onChangeText={setConfirmar}
            placeholder="Confirmar contraseña *"
            placeholderTextColor="#aaa"
            secureTextEntry={!verPassword}
            onSubmitEditing={handleRegistro}
          />

          <TouchableOpacity
            style={[s.btn, loading && { opacity: 0.5 }]}
            onPress={handleRegistro}
            disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Registrarse</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={s.volverBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={s.volverText}>¿Ya tienes cuenta? Inicia sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f0' },
  scroll:    { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card:      { backgroundColor: '#fff', borderRadius: 16, padding: 28,
               shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
               shadowOpacity: 0.1, shadowRadius: 12, elevation: 8 },
  titulo:    { fontSize: 24, fontWeight: '800', color: '#1a5c2a', textAlign: 'center', marginBottom: 4 },
  subtitulo: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 24 },
  input:     { borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
               paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14,
               fontSize: 16, backgroundColor: '#fafafa' },
  passwordWrapper: { justifyContent: 'center', marginBottom: 14 },
  passwordInput:   { borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
                     paddingHorizontal: 14, paddingRight: 44, paddingVertical: 12,
                     fontSize: 16, backgroundColor: '#fafafa' },
  eyeBtn:          { position: 'absolute', right: 12 },
  btn:       { backgroundColor: '#1a5c2a', borderRadius: 10, paddingVertical: 14,
               alignItems: 'center', marginTop: 4 },
  btnText:   { color: '#fff', fontWeight: '700', fontSize: 16 },
  volverBtn: { marginTop: 16, alignItems: 'center' },
  volverText: { color: '#1a5c2a', fontSize: 14, fontWeight: '600' },
});

export default RegistroScreen;
