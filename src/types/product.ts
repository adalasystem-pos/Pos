export type Portion = 'نەفەر' | 'نیو نەفەر' | 'کیلۆ';

export interface PortionOption {
  id: Portion;
  name: string;
  multiplier: number; // e.g. 1.0 for normal portion, 0.6 for half, 2.5 for kilo or calculated price
}

export interface CustomizationOption {
  id: string;
  name: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  iconName?: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  price: number; // Integer IQD for standard portion (نەفەر)
  active: boolean;
  allowPortions?: boolean;
  customPortions?: { [key in Portion]?: number }; // Specific integer override price per portion if non-standard
  availableCustomizations?: string[];
  imageUrl?: string;
}
