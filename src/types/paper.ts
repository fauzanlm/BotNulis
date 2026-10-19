export interface HeaderFieldPosition {
  x: number;
  y: number;
  label?: string;
  enabled?: boolean;
}

export interface PaperTemplate {
  id: string;
  name: string;
  category: 'notebook' | 'folio' | 'bigboss' | 'hvs' | 'grid';
  imageUrl: string;
  width: number;
  height: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  lineHeight: number;
  baselineOffset: number;
  totalLines?: number;
  headerFields?: {
    name?: HeaderFieldPosition;
    date?: HeaderFieldPosition;
    subject?: HeaderFieldPosition;
    pageNumber?: HeaderFieldPosition;
  };
}
