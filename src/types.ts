export type AccessType = '' | 'EDD' | 'FIBRA' | 'GPON' | 'BSOD' | 'Terceiro';
export type ActivityType = '' | 'Ativação' | 'Pré ativação' | 'Vistoria' | 'Alteração de Facilidade' | 'Alteração de Velocidade' | 'Insucesso';
export type VoiceResult = 'OK' | 'FALHA' | 'N/A';
export type IdentifierType = 'SGP' | 'SN';

export interface StoredPhoto {
  uri: string;
  width: number;
  height: number;
  mimeType: 'image/jpeg';
}

export interface ActivationData {
  client: string;
  itemWf: string;
  address: string;
  circuitCode: string;
  city: string;
  speed: string;
  contact: string;
  designation: string;
  phone: string;
  accessType: AccessType;
  activity: ActivityType;
  date: string;
  ratNumber: string;
  validatedBy: string;
  sourcePdfName: string;
  sourcePdfUri: string;
}

export interface GeneralPhotoSlot {
  id: string;
  number: number;
  label: string;
  cell: string;
  photo?: StoredPhoto;
}

export interface EquipmentItem {
  id: string;
  number: number;
  photoNumber: number;
  photoCell: string;
  description: string;
  identifierType: IdentifierType;
  identifier: string;
  quantity: number;
  photo?: StoredPhoto;
}

export interface MaterialItem {
  id: string;
  description: string;
  sapCode: string;
  quantity: number;
}

export interface VoiceTestItem {
  id: string;
  section: 'Originadas pelo PABX' | 'Destinadas ao PABX';
  label: string;
  result: VoiceResult;
}

export interface ReportDraft {
  id: string;
  updatedAt: string;
  currentStep: number;
  activation: ActivationData;
  generalPhotos: GeneralPhotoSlot[];
  equipment: EquipmentItem[];
  rvoPhoto?: StoredPhoto;
  materials: MaterialItem[];
  voiceTests: VoiceTestItem[];
}

export type ReportAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'UPDATE_ACTIVATION'; patch: Partial<ActivationData> }
  | { type: 'SET_GENERAL_PHOTO'; id: string; photo?: StoredPhoto }
  | { type: 'UPDATE_EQUIPMENT'; id: string; patch: Partial<EquipmentItem> }
  | { type: 'SET_EQUIPMENT_PHOTO'; id: string; photo?: StoredPhoto }
  | { type: 'SET_RVO_PHOTO'; photo?: StoredPhoto }
  | { type: 'SET_MATERIAL_QUANTITY'; id: string; quantity: number }
  | { type: 'SET_VOICE_RESULT'; id: string; result: VoiceResult }
  | { type: 'REPLACE_DRAFT'; draft: ReportDraft }
  | { type: 'RESET_DRAFT' };
