import { supabase } from '../config/supabase'
import type { Product } from '../models/product.model'
import { productRepository } from '../repositories/product.repository'

export const productService = {
  async fetchProducts(): Promise<Product[]> {
    try {
      const products = await productRepository.getActiveProducts()
      const productsWithImages = products.map(product => {
        if (product.image_url) {
          const { data } = supabase.storage.from('products').getPublicUrl(product.image_url)
          product.image_url = data.publicUrl
        }
        return product;
      });
      return productsWithImages;
    } catch (error) {
      console.error("Error en productService:", error)
      throw error 
    }
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    try {
      await productRepository.updateProduct(id, updates);
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      throw error;
    }
  },

  async createProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<void> {
    await productRepository.createProduct(product);
  },

  async createProductsBulk(products: Omit<Product, 'id' | 'created_at'>[]): Promise<void> {
    await productRepository.createProductsBulk(products);
  },
  // Subir imagen a Supabase Storage (VERSIÓN MEJORADA)
  async uploadImage(file: File): Promise<string | null> {
    try {
      // 1. Usamos la fecha exacta (Date.now) en vez de números al azar para evitar errores en el link
      // 2. Forzamos la extensión a minúsculas (ej: .PNG pasa a .png)
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}.${fileExt}`;

      // 3. Subimos el archivo avisándole explícitamente a Supabase qué tipo de archivo es
      const { error: uploadError } = await supabase.storage
        .from('productos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type // MUY IMPORTANTE: Le avisa al navegador que es una imagen real
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
  
}