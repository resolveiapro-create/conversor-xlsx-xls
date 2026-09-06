import React from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { AppHeader } from './src/components/AppHeader';
import { FooterNavigation } from './src/components/FooterNavigation';
import { StepTabs } from './src/components/StepTabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ReportProvider, useReport } from './src/context/ReportContext';
import { ActivationDataScreen } from './src/screens/ActivationDataScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { EquipmentScreen } from './src/screens/EquipmentScreen';
import { GeneralPhotosScreen } from './src/screens/GeneralPhotosScreen';
import { MaterialsScreen } from './src/screens/MaterialsScreen';
import { PreviewScreen } from './src/screens/PreviewScreen';
import { RvoScreen } from './src/screens/RvoScreen';
import { VoiceScreen } from './src/screens/VoiceScreen';
import { removeReportFiles } from './src/services/photoService';
import { colors, spacing } from './src/theme';

function CurrentStep(): React.JSX.Element {
  const { draft } = useReport();
  switch (draft.currentStep) {
    case 0: return <ActivationDataScreen />;
    case 1: return <GeneralPhotosScreen />;
    case 2: return <EquipmentScreen />;
    case 3: return <RvoScreen />;
    case 4: return <MaterialsScreen />;
    case 5: return <VoiceScreen />;
    case 6: return <PreviewScreen />;
    default: return <ActivationDataScreen />;
  }
}

function Workspace(): React.JSX.Element {
  const { draft, dispatch, ready } = useReport();
  const { logout } = useAuth();

  function handleLogout(): void {
    Alert.alert('Sair da conta?', 'Você poderá entrar novamente com seu e-mail e senha.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => void logout() },
    ]);
  }

  function newReport(): void {
    Alert.alert(
      'Iniciar novo relatório?',
      'O rascunho atual e suas fotos serão apagados do aplicativo. Relatórios XLSX já exportados serão mantidos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Novo relatório',
          style: 'destructive',
          onPress: () => {
            void removeReportFiles(draft.id).finally(() => dispatch({ type: 'RESET_DRAFT' }));
          },
        },
      ],
    );
  }

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.red} size="large" />
        <Text style={styles.loadingText}>Abrindo seu rascunho…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <StatusBar style="light" />
      <AppHeader onLogout={handleLogout} onNewReport={newReport} />
      <StepTabs step={draft.currentStep} onChange={(step) => dispatch({ type: 'SET_STEP', step })} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.content}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <CurrentStep />
        </ScrollView>
      </KeyboardAvoidingView>
      <FooterNavigation
        step={draft.currentStep}
        onBack={() => dispatch({ type: 'SET_STEP', step: draft.currentStep - 1 })}
        onNext={() => dispatch({ type: 'SET_STEP', step: draft.currentStep + 1 })}
      />
    </SafeAreaView>
  );
}

function Gate(): React.JSX.Element {
  const { user, ready } = useAuth();

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.red} size="large" />
        <Text style={styles.loadingText}>Verificando sua conta…</Text>
      </View>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <ReportProvider>
      <Workspace />
    </ReportProvider>
  );
}

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  loading: { alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center' },
  loadingText: { color: colors.muted, fontSize: 14, marginTop: spacing.md },
});
