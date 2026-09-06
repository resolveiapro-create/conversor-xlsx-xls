import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme';
import type { StoredPhoto } from '../types';
import type { PhotoSource } from '../services/photoService';

interface Props {
  title: string;
  subtitle?: string;
  photo?: StoredPhoto;
  onPick: (source: PhotoSource) => Promise<void>;
  onRemove: () => Promise<void> | void;
}

export function PhotoInput({ title, subtitle, photo, onPick, onRemove }: Props): React.JSX.Element {
  const [busy, setBusy] = useState(false);

  async function run(source: PhotoSource): Promise<void> {
    try {
      setBusy(true);
      await onPick(source);
    } catch (error) {
      Alert.alert('Não foi possível adicionar a foto', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.preview}>
        {photo ? (
          <Image source={{ uri: photo.uri }} resizeMode="contain" style={styles.image} />
        ) : (
          <Text style={styles.empty}>Sem foto</Text>
        )}
        {busy ? <View style={styles.busy}><ActivityIndicator color={colors.white} /></View> : null}
      </View>
      <View style={styles.actions}>
        <Pressable disabled={busy} onPress={() => void run('camera')} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
          <Text style={styles.primaryText}>Tirar foto</Text>
        </Pressable>
        <Pressable disabled={busy} onPress={() => void run('library')} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
          <Text style={styles.secondaryText}>Galeria</Text>
        </Pressable>
        {photo ? (
          <Pressable disabled={busy} onPress={() => void onRemove()} style={({ pressed }) => [styles.remove, pressed && styles.pressed]}>
            <Text style={styles.removeText}>Remover</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.xl },
  title: { color: colors.text, fontSize: 14, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 12, marginBottom: spacing.sm, marginTop: 2 },
  preview: {
    alignItems: 'center',
    aspectRatio: 4 / 3,
    backgroundColor: '#EDF1F6',
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  image: { height: '100%', width: '100%' },
  empty: { color: colors.muted, fontSize: 13 },
  busy: { alignItems: 'center', backgroundColor: 'rgba(7,26,46,0.55)', bottom: 0, justifyContent: 'center', left: 0, position: 'absolute', right: 0, top: 0 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  primary: { backgroundColor: colors.red, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  primaryText: { color: colors.white, fontSize: 13, fontWeight: '800' },
  secondary: { borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  secondaryText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  remove: { paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  removeText: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.7 },
});
