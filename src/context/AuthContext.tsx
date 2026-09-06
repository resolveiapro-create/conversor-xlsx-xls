import {
  type User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { auth, isFirebaseConfigured } from '../services/firebase';

interface AuthContextValue {
  user: User | null;
  ready: boolean;
  configured: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
  'auth/invalid-email': 'Digite um e-mail válido.',
  'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
  'auth/user-not-found': 'Usuário não encontrado.',
  'auth/wrong-password': 'Senha incorreta.',
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente novamente.',
  'auth/network-request-failed': 'Sem conexão com a internet. Verifique sua rede.',
};

function friendlyError(error: unknown): Error {
  const code = (error as { code?: string })?.code ?? '';
  return new Error(ERROR_MESSAGES[code] ?? 'Não foi possível concluir. Tente novamente.');
}

export function AuthProvider({ children }: React.PropsWithChildren): React.JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!isFirebaseConfigured);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (current) => {
      setUser(current);
      setReady(true);
    });
    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    ready,
    configured: isFirebaseConfigured,
    async login(email, password) {
      if (!auth) throw new Error('Login ainda não configurado. Veja docs/AUTENTICACAO.md.');
      try {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } catch (error) {
        throw friendlyError(error);
      }
    },
    async register(name, email, password) {
      if (!auth) throw new Error('Login ainda não configurado. Veja docs/AUTENTICACAO.md.');
      try {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) {
          await updateProfile(credential.user, { displayName: name.trim() });
        }
      } catch (error) {
        throw friendlyError(error);
      }
    },
    async logout() {
      if (!auth) return;
      await signOut(auth);
    },
    async resetPassword(email) {
      if (!auth) throw new Error('Login ainda não configurado. Veja docs/AUTENTICACAO.md.');
      try {
        await sendPasswordResetEmail(auth, email.trim());
      } catch (error) {
        throw friendlyError(error);
      }
    },
  }), [user, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return value;
}
