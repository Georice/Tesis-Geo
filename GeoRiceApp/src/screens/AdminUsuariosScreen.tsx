import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert, ActivityIndicator, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Usuario, CreateUsuarioDto, UpdateUsuarioDto } from '../domain/entities/Usuario';
import { GetUsers }          from '../application/usecases/usuarios/GetUsers';
import { CreateUser }        from '../application/usecases/usuarios/CreateUser';
import { UpdateUser }        from '../application/usecases/usuarios/UpdateUser';
import { ToggleUserStatus }  from '../application/usecases/usuarios/ToggleUserStatus';

type FormMode = 'create' | 'edit';

interface FormState {
  nombres:   string;
  apellidos: string;
  email:     string;
  password:  string;
}

const EMPTY_FORM: FormState = {
  nombres: '', apellidos: '', email: '', password: '',
};

const AdminUsuariosScreen: React.FC = () => {
  const [usuarios,   setUsuarios]   = useState<Usuario[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving,     setSaving]     = useState(false);

  const [formVisible, setFormVisible] = useState(false);
  const [formMode,    setFormMode]    = useState<FormMode>('create');
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [form,        setForm]        = useState<FormState>(EMPTY_FORM);

  const loadUsuarios = useCallback(async () => {
    try {
      setUsuarios(await GetUsers());
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo cargar los usuarios');
    }
  }, []);

  useEffect(() => {
    loadUsuarios().finally(() => setLoading(false));
  }, [loadUsuarios]);

  const refresh = async () => {
    setRefreshing(true);
    await loadUsuarios();
    setRefreshing(false);
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormMode('create');
    setEditingId(null);
    setFormVisible(true);
  };

  const openEdit = (u: Usuario) => {
    setForm({
      nombres: u.nombres, apellidos: u.apellidos,
      email: u.email ?? '', password: '',
    });
    setFormMode('edit');
    setEditingId(u.id);
    setFormVisible(true);
  };

  const handleToggle = (u: Usuario) => {
    const estaActivo = u.estado === 'activo';
    const verb = estaActivo ? 'Desactivar' : 'Activar';
    Alert.alert(
      `¿${verb} usuario?`,
      `${u.nombres} ${u.apellidos} será ${verb.toLowerCase()}do.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: verb,
          style: estaActivo ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await ToggleUserStatus(u.id, u.estado);
              await loadUsuarios();
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'No se pudo cambiar el estado');
            }
          },
        },
      ],
    );
  };

  const handleSave = async () => {
    const { nombres, apellidos, email, password } = form;
    if (!nombres.trim() || !apellidos.trim() || !email.trim()) {
      Alert.alert('Campos requeridos', 'Nombres, apellidos y correo son obligatorios.');
      return;
    }
    if (formMode === 'create' && !password.trim()) {
      Alert.alert('Contraseña requerida', 'Ingresa una contraseña para el nuevo usuario.');
      return;
    }
    setSaving(true);
    try {
      if (formMode === 'create') {
        const dto: CreateUsuarioDto = {
          nombres: nombres.trim(), apellidos: apellidos.trim(),
          email: email.trim(), password: password.trim(),
        };
        await CreateUser(dto);
        Alert.alert('✅ Usuario creado');
      } else {
        const dto: UpdateUsuarioDto = {
          nombres: nombres.trim(), apellidos: apellidos.trim(),
          email: email.trim(),
        };
        await UpdateUser(editingId!, dto);
        Alert.alert('✅ Usuario actualizado');
      }
      setFormVisible(false);
      await loadUsuarios();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item: u }: { item: Usuario }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{u.nombres.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardNombre}>{u.nombres} {u.apellidos}</Text>
          <Text style={styles.cardEmail}>{u.email ?? '—'}</Text>
        </View>
        <View style={[styles.rolBadge, u.rol === 'administrador' && styles.rolBadgeAdmin]}>
          <Text style={[styles.rolBadgeText, u.rol === 'administrador' && styles.rolBadgeTextAdmin]}>
            {u.rol === 'administrador' ? 'Admin' : 'Socio'}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={[styles.statusBadge, u.estado !== 'activo' && styles.statusBadgeOff]}>
          <Text style={[styles.statusText, u.estado !== 'activo' && styles.statusTextOff]}>
            {u.estado === 'activo' ? 'Activo' : 'Inactivo'}
          </Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(u)} activeOpacity={0.7}>
            <Text style={styles.actionBtnText}>✏️ Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, u.estado === 'activo' ? styles.actionBtnDanger : styles.actionBtnSuccess]}
            onPress={() => handleToggle(u)}
            activeOpacity={0.7}>
            <Text style={[
              styles.actionBtnText,
              u.estado === 'activo' ? styles.actionTextDanger : styles.actionTextSuccess,
            ]}>
              {u.estado === 'activo' ? '🔒 Desactivar' : '🔓 Activar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.verde} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={usuarios}
        keyExtractor={u => u.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={refresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay usuarios registrados.</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openCreate} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Form modal */}
      <Modal
        visible={formVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFormVisible(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>
              {formMode === 'create' ? 'Nuevo usuario' : 'Editar usuario'}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <TextInput
                style={styles.input}
                placeholder="Nombres *"
                placeholderTextColor="#aaa"
                value={form.nombres}
                onChangeText={v => setForm(f => ({ ...f, nombres: v }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Apellidos *"
                placeholderTextColor="#aaa"
                value={form.apellidos}
                onChangeText={v => setForm(f => ({ ...f, apellidos: v }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico *"
                placeholderTextColor="#aaa"
                value={form.email}
                onChangeText={v => setForm(f => ({ ...f, email: v }))}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {formMode === 'create' && (
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña *"
                  placeholderTextColor="#aaa"
                  value={form.password}
                  onChangeText={v => setForm(f => ({ ...f, password: v }))}
                  secureTextEntry
                />
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnCancelar}
                onPress={() => setFormVisible(false)}
                disabled={saving}>
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnGuardar, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}>
                {saving
                  ? <ActivityIndicator size="small" color={Colors.blanco} />
                  : <Text style={styles.btnGuardarText}>Guardar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.grisFondo },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list:           { padding: 12, paddingBottom: 90 },
  card: {
    backgroundColor: Colors.blanco, borderRadius: 12,
    marginBottom: 10, padding: 14, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3,
  },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.verdeClaro, justifyContent: 'center',
    alignItems: 'center', marginRight: 10,
  },
  avatarText:     { fontSize: 16, fontWeight: '700', color: Colors.verde },
  cardNombre:     { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  cardEmail:      { fontSize: 12, color: Colors.grisTexto, marginTop: 1 },
  rolBadge: {
    backgroundColor: Colors.verdeClaro, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  rolBadgeAdmin:  { backgroundColor: Colors.doradoClaro },
  rolBadgeText:   { fontSize: 11, fontWeight: '600', color: Colors.verdeMedio },
  rolBadgeTextAdmin: { color: Colors.tierra },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  statusBadge: {
    backgroundColor: Colors.verdeClaro, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  statusBadgeOff: { backgroundColor: '#fef2f2' },
  statusText:     { fontSize: 11, fontWeight: '600', color: Colors.verdeMedio },
  statusTextOff:  { color: Colors.rojo },
  cardActions:    { flexDirection: 'row', gap: 6 },
  actionBtn: {
    borderWidth: 1, borderColor: Colors.grisBorde, borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  actionBtnDanger:   { borderColor: '#fca5a5' },
  actionBtnSuccess:  { borderColor: Colors.verdeBorder },
  actionBtnText:     { fontSize: 12, color: '#444' },
  actionTextDanger:  { color: Colors.rojo },
  actionTextSuccess: { color: Colors.verdeMedio },
  emptyContainer:    { flex: 1, alignItems: 'center', paddingTop: 60 },
  emptyText:         { fontSize: 15, color: Colors.grisTexto },
  fab: {
    position: 'absolute', right: 20, bottom: 20,
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: Colors.verde, justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 4,
  },
  fabText:       { fontSize: 28, color: Colors.blanco, lineHeight: 32 },
  modalOverlay:  { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: Colors.blanco, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingTop: 12, maxHeight: '90%',
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2,
    alignSelf: 'center', marginBottom: 16,
  },
  modalTitle:    { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 16 },
  input: {
    borderWidth: 1, borderColor: Colors.grisBorde, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10,
    fontSize: 15, color: '#1a1a1a',
  },
  modalActions:  { flexDirection: 'row', gap: 10, marginTop: 8, paddingBottom: 8 },
  btnCancelar: {
    flex: 1, borderWidth: 1, borderColor: Colors.grisBorde,
    borderRadius: 8, paddingVertical: 12, alignItems: 'center',
  },
  btnCancelarText: { fontSize: 15, color: '#444', fontWeight: '500' },
  btnGuardar: {
    flex: 2, backgroundColor: Colors.verde,
    borderRadius: 8, paddingVertical: 12, alignItems: 'center',
  },
  btnGuardarText: { fontSize: 15, color: Colors.blanco, fontWeight: '700' },
});

export default AdminUsuariosScreen;