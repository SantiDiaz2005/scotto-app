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
  // Subir imagen a Supabase Storage
  async uploadImage(file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('productos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('productos')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      return null;
    }
  }
}