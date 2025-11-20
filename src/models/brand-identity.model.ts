
export interface BrandIdentity {
  colors: Color[];
  fonts: FontPair;
}

export interface Color {
  name: string;
  hex: string;
  usage: string;
}

export interface FontPair {
  header: Font;
  body: Font;
}

export interface Font {
  name: string;
  importUrl: string;
}
