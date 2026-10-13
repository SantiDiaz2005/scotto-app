import { supabase } from '../config/supabase';
import type { Product } from '../models/product.model';

export const productService = {
  
  // TRAER PRODUCTOS
  async fetchProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      // Solo dejamos el orden por nombre (A a la Z)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // CREAR PRODUCTO (Usamos Partial para que TS no pida created_at ni id)
  async createProduct(product: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // CREAR MULTIPLES PRODUCTOS (EXCEL)
  async createProductsBulk(products: Partial<Product>[]): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .insert(products)
      .select();

    if (error) throw error;
    return data || [];
  },

  // ACTUALIZAR PRODUCTO
  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // SUBIR IMAGEN A SUPABASE
  async uploadImage(file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('productos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (uploadError) {
        console.error("Error detallado de Supabase:", uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('productos')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      return null;
    }
  }
};