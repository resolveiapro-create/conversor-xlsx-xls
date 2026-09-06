import React from 'react';

import { ChoiceField } from '../components/ChoiceField';
import { SectionCard } from '../components/SectionCard';
import { StepIntro } from '../components/StepIntro';
import { useReport } from '../context/ReportContext';
import type { VoiceResult } from '../types';

const RESULTS: readonly VoiceResult[] = ['OK', 'FALHA', 'N/A'];

export function VoiceScreen(): React.JSX.Element {
  const { draft, dispatch } = useReport();
  const sections = ['Originadas pelo PABX', 'Destinadas ao PABX'] as const;
  return (
    <>
      <StepIntro title="Ativação de Voz" description="Todos os testes começam como OK. Altere somente os resultados necessários." />
      {sections.map((section) => (
        <SectionCard key={section} title={section}>
          {draft.voiceTests.filter((test) => test.section === section).map((test) => (
            <ChoiceField
              key={test.id}
              label={test.label}
              value={test.result}
              options={RESULTS}
              onChange={(result) => dispatch({ type: 'SET_VOICE_RESULT', id: test.id, result })}
            />
          ))}
        </SectionCard>
      ))}
    </>
  );
}
