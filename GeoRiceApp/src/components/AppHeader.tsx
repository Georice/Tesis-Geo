import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

interface Props {
  onMenuPress: () => void;
}

const AppHeader: React.FC<Props> = ({ onMenuPress }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 10) }]}>
      <TouchableOpacity onPress={onMenuPress} style={styles.menuBtn} activeOpacity={0.7}>
        <Text style={styles.menuIcon}>☰</Text>
      </TouchableOpacity>
      <Text style={styles.title}>GeoRice</Text>
      <View style={styles.end} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.verde,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    zIndex: 10,
  },
  menuBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  menuIcon: {
    fontSize: 22,
    color: Colors.blanco,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: Colors.blanco,
    letterSpacing: 0.5,
  },
  end: { width: 44 },
});

export default AppHeader;