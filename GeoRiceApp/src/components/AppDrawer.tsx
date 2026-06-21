import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Animated, Modal,
  StyleSheet, Dimensions, ScrollView, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { MenuItem } from '../domain/entities/MenuItem';

const DRAWER_WIDTH = Math.min(Dimensions.get('window').width * 0.78, 300);
const PILL_WIDTH   = 40;

const logoGeoRice = require('../assets/logo_georice.png');

interface Props {
  visible: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  userName: string;
  userRole: string;
  onAction: (action: MenuItem['action']) => void;
}

const AppDrawer: React.FC<Props> = ({
  visible, onClose, menuItems, userName, userRole, onAction,
}) => {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const translateX     = useRef(new Animated.Value(-(DRAWER_WIDTH + PILL_WIDTH))).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.parallel([
        Animated.timing(translateX,     { toValue: 0,             duration: 250, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 1,             duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX,     { toValue: -(DRAWER_WIDTH + PILL_WIDTH), duration: 200, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 0,             duration: 200, useNativeDriver: true }),
      ]).start(() => setModalVisible(false));
    }
  }, [visible, translateX, overlayOpacity]);

  const handleItemPress = (action: MenuItem['action']) => {
    onClose();
    setTimeout(() => onAction(action), 60);
  };

  const roleLabel = userRole.charAt(0).toUpperCase() + userRole.slice(1);

  return (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={false}
      onRequestClose={onClose}>

      <View style={styles.root}>

        {/* Overlay oscuro: solo visual */}
        <Animated.View
          style={[styles.overlay, { opacity: overlayOpacity }]}
          pointerEvents="none"
        />

        <View style={styles.row}>

          {/* Wrapper animado: drawer + pill se trasladan juntos.
              translateX va de -(DRAWER_WIDTH + PILL_WIDTH) a 0,
              así el pill también entra/sale de pantalla con el drawer. */}
          <Animated.View style={[styles.drawerWrapper, { transform: [{ translateX }] }]}>

            {/* Panel del drawer */}
            <View style={[styles.drawer, { paddingBottom: insets.bottom }]}>

              {/* Encabezado verde */}
              <View style={[styles.userHeader, { paddingTop: insets.top + 24 }]}>
                <Image
                  source={logoGeoRice}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.userName} numberOfLines={2}>{userName}</Text>
                <Text style={styles.userRoleLabel}>{roleLabel}</Text>
              </View>

              <View style={styles.divider} />

              {/* Ítems del menú */}
              <ScrollView
                style={styles.menuScroll}
                showsVerticalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={styles.menuContent}>
                {menuItems.map(item => (
                  <React.Fragment key={item.id}>
                    {item.action === 'logout' && (
                      <View style={[styles.divider, { marginTop: 8 }]} />
                    )}
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => handleItemPress(item.action)}
                      activeOpacity={0.7}>
                      <Text style={styles.menuItemIcon}>{item.icon}</Text>
                      <Text style={[
                        styles.menuItemLabel,
                        item.action === 'logout' && styles.menuItemLabelLogout,
                      ]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </ScrollView>

            </View>

            {/* Pill: hermano del drawer dentro del mismo wrapper animado.
                Se desplaza exactamente igual que el drawer panel. */}
            <TouchableOpacity
              style={styles.pillTouch}
              onPress={onClose}
              activeOpacity={1}>
              <View style={styles.closePill}>
                <Text style={styles.closePillIcon}>‹</Text>
              </View>
            </TouchableOpacity>

          </Animated.View>

          {/* Zona derecha restante: también cierra al tocar */}
          <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },

  /* Contenedor animado: drawer + pill, se trasladan juntos.
     flexDirection:'row' pone drawer y pill en fila horizontal.
     Altura via alignItems:'stretch' del row padre. */
  drawerWrapper: {
    flexDirection: 'row',
  },

  /* Panel de contenido: ancho fijo, altura via alignItems:'stretch' del wrapper. */
  drawer: {
    width: DRAWER_WIDTH,
    backgroundColor: Colors.blanco,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },

  /* Zona de toque del pill: ancho fijo = PILL_WIDTH, centra el pill verticalmente. */
  pillTouch: {
    width: PILL_WIDTH,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  /* Verde: cubre desde el tope del drawer hasta debajo del divider.
     paddingTop se pasa dinámicamente en el render para respetar safe area. */
  userHeader: {
    backgroundColor: Colors.verde,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.blanco,
    textAlign: 'center',
    marginBottom: 4,
  },
  userRoleLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },

  divider: {
    height: 1,
    backgroundColor: Colors.grisBorde,
    marginBottom: 8,
  },
  menuScroll: {
    flex: 1,
  },
  menuContent: {
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  menuItemIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 28,
    textAlign: 'center',
  },
  menuItemLabel: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  menuItemLabelLogout: {
    color: Colors.rojo,
  },

  /* Pill blanco que indica "puedes cerrar el menú" */
  closePill: {
    backgroundColor: Colors.blanco,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    paddingVertical: 20,
    paddingLeft: 6,
    paddingRight: 12,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
  },
  closePillIcon: {
    fontSize: 22,
    color: Colors.verde,
    fontWeight: '700',
    lineHeight: 24,
  },
});

export default AppDrawer;