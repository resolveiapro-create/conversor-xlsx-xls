import type { ReportDraft } from './types';

export const COMPANY = 'MULTIVALE';
export const TECHNICIAN = 'DIOGO L. OLIVERA';
export const UF = 'PARANÁ';
export const SGP_PREFIX = '(90)289110';

export const STEP_TITLES = [
  'Dados da Ativação',
  'Fotos Gerais',
  'Equipamentos',
  'RVO',
  'Materiais',
  'Ativação de Voz',
  'Pré-visualização',
] as const;

const generalPhotoDefinitions = [
  ['general-1', 1, 'FACHADA DO CLIENTE', 'A14'],
  ['general-2', 2, 'RACK', 'C14'],
  ['general-3', 3, 'AR CONDICIONADO', 'E14'],
  ['general-4', 4, 'CONEXAO PORTA 3 SWITCH A CLIENTE', 'A18'],
  ['general-5', 5, 'TESTE DE VELOCIDADE', 'C18'],
  ['general-6', 6, 'NOBREAK', 'E18'],
  ['general-7', 7, 'TESTE DE VELOCIDADE', 'A22'],
  ['general-8', 8, 'ACESSO PERMANECE O MESMO', 'C22'],
  ['general-9', 9, 'TESTE DE PING', 'E22'],
] as const;

const equipmentPhotoDefinitions = [
  ['equipment-1', 1, 10, 'A26'],
  ['equipment-2', 2, 11, 'C26'],
  ['equipment-3', 3, 12, 'E26'],
  ['equipment-4', 4, 13, 'A30'],
  ['equipment-5', 5, 14, 'C30'],
  ['equipment-6', 6, 15, 'E30'],
] as const;

const materials = [
  ['material-1', 'CAB CXL RF-75-0,4/2,5 INV (coaxial)', '70027722'],
  ['material-2', 'CAB UTP 24AWG 4P CAT5E 350MHZ CMR AZ INV', '70052771'],
  ['material-3', 'ADAPTDR V24/V35 TBR', '70047428'],
  ['material-4', 'ADAPTDR V24/V35 ISO 2110', '70047429'],
] as const;

const originVoiceTests = [
  'Realizar uma chamada Local para fixo',
  'Realizar uma chamada Local para celular',
  'Realizar uma chamada para 0800',
  'Realizar uma chamada para 0300',
  'Realizar uma chamada para numero não existente',
  'Realizar uma chamada DDD para fixo',
  'Realizar uma chamada DDD para celular',
  'Realizar uma chamada a cobrar para fixo',
  'Realizar uma chamada a cobrar para celular',
  'Realizar uma chamada para número especial (103;104)',
  'Realizar uma chamada de Fax',
  'Realizar uma chamada de Modem',
  'Realizar uma chamada DDI.',
];

const destinationVoiceTests = [
  'Realizar uma chamada local de fixo',
  'Realizar uma chamada local de celular',
  'Realizar uma chamada a cobrar de fixo',
  'Realizar uma chamada a cobrar de celular',
  'Realizar uma chamada de Modem',
  'Realizar uma chamada de Fax',
];

export function createEmptyDraft(): ReportDraft {
  return {
    id: `report-${Date.now().toString(36)}`,
    updatedAt: new Date().toISOString(),
    currentStep: 0,
    activation: {
      client: '',
      itemWf: '',
      address: '',
      circuitCode: '',
      city: '',
      speed: '',
      contact: '',
      designation: '',
      phone: '',
      accessType: '',
      activity: '',
      date: new Date().toLocaleDateString('pt-BR'),
      ratNumber: '',
      validatedBy: '',
      sourcePdfName: '',
      sourcePdfUri: '',
    },
    generalPhotos: generalPhotoDefinitions.map(([id, number, label, cell]) => ({ id, number, label, cell })),
    equipment: equipmentPhotoDefinitions.map(([id, number, photoNumber, photoCell]) => ({
      id,
      number,
      photoNumber,
      photoCell,
      description: '',
      identifierType: 'SGP',
      identifier: '',
      quantity: 1,
    })),
    materials: materials.map(([id, description, sapCode]) => ({ id, description, sapCode, quantity: 0 })),
    voiceTests: [
      ...originVoiceTests.map((label, index) => ({
        id: `voice-origin-${index + 1}`,
        section: 'Originadas pelo PABX' as const,
        label,
        result: 'OK' as const,
      })),
      ...destinationVoiceTests.map((label, index) => ({
        id: `voice-destination-${index + 1}`,
        section: 'Destinadas ao PABX' as const,
        label,
        result: 'OK' as const,
      })),
    ],
  };
}
