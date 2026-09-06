import React from 'react';

import { PhotoInput } from '../components/PhotoInput';
import { SectionCard } from '../components/SectionCard';
import { StepIntro } from '../components/StepIntro';
import { useReport } from '../context/ReportContext';
import { pickAndStorePhoto, removeStoredPhoto, type PhotoSource } from '../services/photoService';

export function RvoScreen(): React.JSX.Element {
  const { draft, dispatch } = useReport();

  async function pick(source: PhotoSource): Promise<void> {
    const photo = await pickAndStorePhoto(draft.id, 'rvo', source);
    if (!photo) return;
    await removeStoredPhoto(draft.rvoPhoto);
    dispatch({ type: 'SET_RVO_PHOTO', photo });
  }

  async function remove(): Promise<void> {
    await removeStoredPhoto(draft.rvoPhoto);
    dispatch({ type: 'SET_RVO_PHOTO', photo: undefined });
  }

  return (
    <>
      <StepIntro title="RVO" description="A imagem será inserida em RVO!A1, dentro da área oficial de 12,60 × 14,45 cm." />
      <SectionCard>
        <PhotoInput title="Imagem do RVO" subtitle="Célula A1" photo={draft.rvoPhoto} onPick={pick} onRemove={remove} />
      </SectionCard>
    </>
  );
}
