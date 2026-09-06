import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme';

interface Props {
  onNewReport: () => void;
  onLogout?: () => void;
}

export function AppHeader({ onNewReport, onLogout }: Props): React.JSX.Element {
  return (
    <LinearGradient colors={[colors.red, colors.orange]} end={{ x: 1, y: 0 }} start={{ x: 0, y: 0 }} style={styles.header}>
      <View style={styles.brand}>
        <Image source={require('../../assets/icon.png')} style={styles.logo} />
        <View style={styles.texts}>
          <Text style={styles.title}>Relatório de Aceite</Text>
          <Text numberOfLines={1} style={styles.subtitle}>MULTIVALE · DIOGO L. OLIVERA · PARANÁ</Text>
        </View>
      </View>
      <Pressable onPress={onNewReport} style={({ pressed }) => [styles.newButton, pressed && styles.pressed]}>
        <Text style={styles.newText}>Novo</Text>
      </Pressable>
      {onLogout ? (
        <Pressable onPress={onLogout} style={({ pressed }) => [styles.newButton, styles.logoutButton, pressed && styles.pressed]}>
          <Text style={styles.newText}>Sair</Text>
        </Pressable>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  brand: { alignItems: 'center', flex: 1, flexDirection: 'row' },
  logo: { borderRadius: radius.sm, height: 42, marginRight: spacing.md, width: 42 },
  texts: { flex: 1 },
  title: { color: colors.white, fontSize: 17, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.84)', fontSize: 10, marginTop: 2 },
  newButton: { backgroundColor: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.4)', borderRadius: radius.pill, borderWidth: 1, marginLeft: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  logoutButton: { backgroundColor: 'rgba(0,0,0,0.18)' },
  newText: { color: colors.white, fontSize: 12, fontWeight: '800' },
  pressed: { opacity: 0.7 },
});
