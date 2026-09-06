export interface ExtractedImage {
  name: string;
  extension: string;
  sizeBytes: number;
  dataUrl: string; // base64 preview
  sheetName?: string;
  cellLocation?: string;
}

export interface SheetInfo {
  name: string;
  rowCount: number;
  colCount: number;
  hasFormulas: boolean;
  hasMergedCells: boolean;
  imagesCount: number;
  previewRows?: (string | number | boolean | null)[][];
}

export interface AnalysisResult {
  fileName: string;
  fileSizeBytes: number;
  sheets: SheetInfo[];
  totalImages: number;
  images: ExtractedImage[];
  detectedFormats: string[];
}

export interface ConvertedItem {
  id: string;
  originalName: string;
  originalSizeBytes: number;
  convertedName: string;
  convertedSizeBytes: number;
  convertedAt: string;
  status: 'idle' | 'analyzing' | 'converting' | 'success' | 'error';
  progress: number;
  statusMessage: string;
  downloadUrl?: string;
  analysis?: AnalysisResult;
  errorMessage?: string;
}
