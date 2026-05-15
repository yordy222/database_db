import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import 'dotenv/config';

import productsRouter from './routes/products.routes.js'; // Importa las nuevas rutas

const app = express();

app.use(cors()); // Permitir peticiones del front 
app.use(express.json()); // Parsea JSON 
app.use(morgan('dev'));

// Rutas
app.use('/api/products', productsRouter);

const PORT = process.env.PORT || 4000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB conectado');
    app.listen(PORT, () => console.log(`API corriendo en el puerto ${PORT}`));
  })
  .catch(err => {
    console.error('Error MongoDB:', err.message);
    process.exit(1);
  });