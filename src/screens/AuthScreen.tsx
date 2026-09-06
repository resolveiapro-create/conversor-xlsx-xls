import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormField } from '../components/FormField';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing } from '../theme';

type Mode = 'login' | 'register';

export function AuthScreen(): React.JSX.Element {
  const { login, register, resetPassword, configured } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';

  function validate(): string | null {
    if (!email.trim() || !email.includes('@')) return 'Digite um e-mail válido.';
    if (password.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.';
    if (isRegister && !name.trim()) return 'Digite seu nome.';
    if (isRegister && password !== confirmPassword) return 'As senhas não coincidem.';
    return null;
  }

  async function handleSubmit(): Promise<void> {
    const validationError = validate();
    if (validationError) {
      Alert.alert('Verifique os dados', validationError);
      return;
    }
    setSubmitting(true);
    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
    } catch (error) {
      Alert.alert(isRegister ? 'Não foi possível cadastrar' : 'Não foi possível entrar', (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleForgotPassword(): void {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Digite seu e-mail', 'Preencha o campo de e-mail para receber o link de redefinição de senha.');
      return;
    }
    Alert.alert(
      'Redefinir senha',
      `Enviaremos um link de redefinição para ${email.trim()}.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: () => {
            void resetPassword(email)
              .then(() => Alert.alert('Pronto', 'Verifique sua caixa de e-mail para redefinir a senha.'))
              .catch((error: Error) => Alert.alert('Erro', error.message));
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <LinearGradient colors={[colors.red, colors.orange]} end={{ x: 1, y: 0 }} start={{ x: 0, y: 0 }} style={styles.header}>
        <Image source={require('../../assets/icon.png')} style={styles.logo} />
        <Text style={styles.title}>R2 PRO</Text>
        <Text style={styles.subtitle}>Relatório de Aceite de Ativação de Dados</Text>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.content}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {!configured ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                O login ainda não foi configurado. Peça ao responsável pelo projeto para preencher as chaves do
                Firebase (veja docs/AUTENTICACAO.md) e gerar um novo build.
              </Text>
            </View>
          ) : null}

          <View style={styles.tabs}>
            <Pressable
              onPress={() => setMode('login')}
              style={[styles.tab, mode === 'login' && styles.tabActive]}
            >
              <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Entrar</Text>
            </Pressable>
            <Pressable
              onPress={() => setMode('register')}
              style={[styles.tab, mode === 'register' && styles.tabActive]}
            >
              <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>Criar conta</Text>
            </Pressable>
          </View>

          {isRegister ? (
            <FormField
              autoCapitalize="words"
              label="Nome"
              onChangeText={setName}
              placeholder="Seu nome completo"
              value={name}
            />
          ) : null}

          <FormField
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            label="E-mail"
            onChangeText={setEmail}
            placeholder="seuemail@exemplo.com"
            value={email}
          />

          <FormField
            autoCapitalize="none"
            label="Senha"
            onChangeText={setPassword}
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
            value={password}
          />

          {isRegister ? (
            <FormField
              autoCapitalize="none"
              label="Confirmar senha"
              onChangeText={setConfirmPassword}
              placeholder="Repita a senha"
              secureTextEntry
              value={confirmPassword}
            />
          ) : null}

          {!isRegister ? (
            <Pressable onPress={handleForgotPassword} style={styles.forgotLink}>
              <Text style={styles.forgotText}>Esqueci minha senha</Text>
            </Pressable>
          ) : null}

          <Pressable
            disabled={submitting || !configured}
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.submitButton,
              (pressed || submitting) && styles.pressed,
              !configured && styles.disabled,
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitText}>{isRegister ? 'Criar conta' : 'Entrar'}</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  header: { alignItems: 'center', paddingBottom: spacing.xl, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  logo: { borderRadius: radius.md, height: 64, marginBottom: spacing.md, width: 64 },
  title: { color: colors.white, fontSize: 22, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.88)', fontSize: 12, marginTop: spacing.xs, textAlign: 'center' },
  content: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  warningBox: {
    backgroundColor: '#FFF3E0',
    borderColor: colors.warning,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  warningText: { color: colors.warning, fontSize: 12, lineHeight: 18 },
  tabs: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: spacing.lg,
    padding: 4,
  },
  tab: { alignItems: 'center', borderRadius: radius.pill, flex: 1, paddingVertical: spacing.sm },
  tabActive: { backgroundColor: colors.navy },
  tabText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: colors.white },
  forgotLink: { alignSelf: 'flex-end', marginBottom: spacing.lg, marginTop: -spacing.xs },
  forgotText: { color: colors.red, fontSize: 13, fontWeight: '700' },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.red,
    borderRadius: radius.md,
    justifyContent: 'center',
    minHeight: 50,
    marginTop: spacing.sm,
  },
  submitText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.8 },
  disabled: { backgroundColor: colors.placeholder },
});
