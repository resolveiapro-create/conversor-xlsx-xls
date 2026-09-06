import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import type { StoredPhoto } from '../types';

export type PhotoSource = 'camera' | 'library';

function appDirectory(): string {
  if (!FileSystem.documentDirectory) {
    throw new Error('O armazenamento do aplicativo não está disponível neste aparelho.');
  }
  return `${FileSystem.documentDirectory}r2pro/`;
}

async function ensurePhotoDirectory(reportId: string): Promise<string> {
  const directory = `${appDirectory()}${reportId}/photos/`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  return directory;
}

async function requestSource(source: PhotoSource): Promise<ImagePicker.ImagePickerResult> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Autorize o acesso à câmera para tirar a foto.');
    }
    return ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.9,
      exif: false,
    });
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Autorize o acesso às fotos para selecionar uma imagem.');
  }
  return ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 0.9,
    exif: false,
  });
}

export async function pickAndStorePhoto(
  reportId: string,
  slotId: string,
  source: PhotoSource,
): Promise<StoredPhoto | undefined> {
  const picked = await requestSource(source);
  if (picked.canceled || !picked.assets[0]) {
    return undefined;
  }

  const sourceAsset = picked.assets[0];
  const actions: ImageManipulator.Action[] = sourceAsset.width > 1600
    ? [{ resize: { width: 1600 } }]
    : [];
  const optimized = await ImageManipulator.manipulateAsync(sourceAsset.uri, actions, {
    compress: 0.82,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  const directory = await ensurePhotoDirectory(reportId);
  const destination = `${directory}${slotId}-${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: optimized.uri, to: destination });

  return {
    uri: destination,
    width: optimized.width,
    height: optimized.height,
    mimeType: 'image/jpeg',
  };
}

export async function removeStoredPhoto(photo?: StoredPhoto): Promise<void> {
  if (!photo?.uri.startsWith(appDirectory())) return;
  await FileSystem.deleteAsync(photo.uri, { idempotent: true });
}

export async function removeReportFiles(reportId: string): Promise<void> {
  const directory = `${appDirectory()}${reportId}/`;
  await FileSystem.deleteAsync(directory, { idempotent: true });
}
