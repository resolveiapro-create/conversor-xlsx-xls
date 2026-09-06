import React from 'react';

import { PhotoInput } from '../components/PhotoInput';
import { SectionCard } from '../components/SectionCard';
import { StepIntro } from '../components/StepIntro';
import { useReport } from '../context/ReportContext';
import { pickAndStorePhoto, removeStoredPhoto, type PhotoSource } from '../services/photoService';

export function GeneralPhotosScreen(): React.JSX.Element {
  const { draft, dispatch } = useReport();

  async function pick(id: string, source: PhotoSource): Promise<void> {
    const slot = draft.generalPhotos.find((item) => item.id === id);
    const photo = await pickAndStorePhoto(draft.id, id, source);
    if (!photo) return;
    await removeStoredPhoto(slot?.photo);
    dispatch({ type: 'SET_GENERAL_PHOTO', id, photo });
  }

  async function remove(id: string): Promise<void> {
    const slot = draft.generalPhotos.find((item) => item.id === id);
    await removeStoredPhoto(slot?.photo);
    dispatch({ type: 'SET_GENERAL_PHOTO', id, photo: undefined });
  }

  return (
    <>
      <StepIntro title="Fotos Gerais" description="As legendas são fixas. Nenhuma foto é obrigatória e o rascunho fica salvo no aparelho." />
      <SectionCard>
        {draft.generalPhotos.map((slot) => (
          <PhotoInput
            key={slot.id}
            title={`${slot.number}. ${slot.label}`}
            subtitle={`Célula ${slot.cell}`}
            photo={slot.photo}
            onPick={(source) => pick(slot.id, source)}
            onRemove={() => remove(slot.id)}
          />
        ))}
      </SectionCard>
    </>
  );
}
