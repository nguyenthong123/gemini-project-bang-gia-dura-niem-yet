export interface Product {
  id: string;
  code?: string;
  name: string;
  spec: string;
  thickness: string;
  unit: string;
  oldPrice: number;
  newPrice: number;
  diff: number;
  increaseRate: string;
  category: string;
}

export interface Category {
  id: string;
  title: string;
  description?: string;
  products: Product[];
}
