
export interface TextBoxType {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  fontSize: number;
  color: string;
  borderWidth: number;
  borderColor: string;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderlined?: boolean;
  fontFamily?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  // font?: {
  //   en?: string;
  //   th?: string;
  // };
  font?: { [lang: string]: string }; 
}

export interface ImageType {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  type?: 'background' | 'foreground';
}

export interface EditorState {
  backgroundImage: string | null;
  textBoxes: TextBoxType[];
  images: ImageType[];
}

export interface Page {
  id: string;
  name: string;
  baseImage: string | null;
  backgroundImage: string | null;
  foregroundImage: string | null;
  textBoxes: TextBoxType[];
}

export interface ImageState {
  x: number;
  y: number;
  width: number;
  height: number;
  dragging: boolean;
  resizing: boolean;
  offsetX: number;
  offsetY: number;
  locked: boolean;
}

