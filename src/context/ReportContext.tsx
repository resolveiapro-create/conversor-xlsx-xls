import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';

import { createEmptyDraft } from '../constants';
import type { ReportAction, ReportDraft } from '../types';

const STORAGE_KEY = '@r2pro/current-draft-v1';

interface ReportContextValue {
  draft: ReportDraft;
  dispatch: React.Dispatch<ReportAction>;
  ready: boolean;
}

const ReportContext = createContext<ReportContextValue | undefined>(undefined);

function withUpdatedTime(draft: ReportDraft): ReportDraft {
  return { ...draft, updatedAt: new Date().toISOString() };
}

function reducer(draft: ReportDraft, action: ReportAction): ReportDraft {
  switch (action.type) {
    case 'SET_STEP':
      return withUpdatedTime({ ...draft, currentStep: Math.max(0, Math.min(6, action.step)) });
    case 'UPDATE_ACTIVATION':
      return withUpdatedTime({ ...draft, activation: { ...draft.activation, ...action.patch } });
    case 'SET_GENERAL_PHOTO':
      return withUpdatedTime({
        ...draft,
        generalPhotos: draft.generalPhotos.map((item) => (
          item.id === action.id ? { ...item, photo: action.photo } : item
        )),
      });
    case 'UPDATE_EQUIPMENT':
      return withUpdatedTime({
        ...draft,
        equipment: draft.equipment.map((item) => (
          item.id === action.id ? { ...item, ...action.patch } : item
        )),
      });
    case 'SET_EQUIPMENT_PHOTO':
      return withUpdatedTime({
        ...draft,
        equipment: draft.equipment.map((item) => (
          item.id === action.id ? { ...item, photo: action.photo } : item
        )),
      });
    case 'SET_RVO_PHOTO':
      return withUpdatedTime({ ...draft, rvoPhoto: action.photo });
    case 'SET_MATERIAL_QUANTITY':
      return withUpdatedTime({
        ...draft,
        materials: draft.materials.map((item) => (
          item.id === action.id ? { ...item, quantity: Math.max(0, action.quantity) } : item
        )),
      });
    case 'SET_VOICE_RESULT':
      return withUpdatedTime({
        ...draft,
        voiceTests: draft.voiceTests.map((item) => (
          item.id === action.id ? { ...item, result: action.result } : item
        )),
      });
    case 'REPLACE_DRAFT':
      return withUpdatedTime(action.draft);
    case 'RESET_DRAFT':
      return createEmptyDraft();
    default:
      return draft;
  }
}

export function ReportProvider({ children }: React.PropsWithChildren): React.JSX.Element {
  const [draft, dispatch] = useReducer(reducer, undefined, createEmptyDraft);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) dispatch({ type: 'REPLACE_DRAFT', draft: JSON.parse(saved) as ReportDraft });
      } catch {
        // Um rascunho corrompido não deve impedir o aplicativo de abrir.
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    }, 350);
    return () => clearTimeout(timer);
  }, [draft, ready]);

  const value = useMemo(() => ({ draft, dispatch, ready }), [draft, ready]);
  return <ReportContext.Provider value={value}>{children}</ReportContext.Provider>;
}

export function useReport(): ReportContextValue {
  const value = useContext(ReportContext);
  if (!value) throw new Error('useReport deve ser usado dentro de ReportProvider.');
  return value;
}
