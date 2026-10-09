import type { Product } from '../models/product.model'
import { supabase } from '../config/supabase'

export const productRepository = {
  async getActiveProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw new Error(error.message)
    return data as Product[]
  },

  // Función para actualizar datos (Precio, Stock, etc.)
  async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  },

  // NUEVA FUNCIÓN: Crear un solo producto (Carga Manual)
  async createProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<void> {
    const { error } = await supabase
      .from('products')
      .insert([product]);
      
    if (error) throw new Error(error.message);
  },

  // NUEVA FUNCIÓN: Crear muchos productos juntos (Carga masiva por Excel)
  async createProductsBulk(products: Omit<Product, 'id' | 'created_at'>[]): Promise<void> {
    const { error } = await supabase
      .from('products')
      .insert(products);
      
    if (error) throw new Error(error.message);
  }
}