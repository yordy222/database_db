import { Router } from 'express';
import Product from '../models/product.model.js';

const router = Router();

// GET /api/products → lista productos [cite: 54]
router.get('/', async (_req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error('Error in GET /api/products:', err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// POST /api/products → crea producto [cite: 63]
// POST /api/products → crea producto
router.post('/', async (req, res) => {
  try {
    // 1. RECIBE LOS DATOS
    const { name, category, price, stock } = req.body || {};
    
    // 2. VALIDA LOS DATOS
    if (!name || !category || price == null || stock == null) {
      return res.status(400).json({ error: 'Nombre, categoría, precio y stock son requeridos' });
    }
    
    // 3. GUARDA EN LA BASE DE DATOS
    const created = await Product.create({ name, category, price, stock });
    
    // 4. RESPONDE AL FRONTEND
    res.status(201).json(created);
    
  } catch (err) {
    // 5. MANEJO DE ERRORES
    console.error('Error in POST /api/products:', err);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// PUT /api/products/:id → actualiza producto [cite: 76]
router.put('/:id', async (req, res) => {
  try {
    const { name, category, price, stock } = req.body || {};
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { name, category, price, stock },
      { new: true, runValidators: true } // [cite: 86]
    );
    if (!updated) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(updated);
  } catch (err) {
    console.error('Error in PUT /api/products/:id:', err);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// DELETE /api/products/:id → borra producto [cite: 94]
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    console.error('Error in DELETE /api/products/:id:', err);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

export default router;