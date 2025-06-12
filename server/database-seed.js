// Script para crear precios por defecto

require('dotenv').config();

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function seedDefaultPricing() {
  try {
    // Crear servicio de cerca
    await pool.query(
      'INSERT INTO service_pricing (id, name, service_type, unit_price, unit, labor_rate, labor_method, contractor_id) VALUES (, , , , , , , ) ON CONFLICT (id, contractor_id) DO UPDATE SET unit_price = , labor_rate =  RETURNING *',
      ['fence', 'Instalación de Cerca', 'fence', '65', 'ft', '35', 'by_length', 1]
    );

    console.log('✅ Servicio de cerca creado o actualizado');

    // Crear material de madera
    await pool.query(
      'INSERT INTO material_pricing (id, name, category, unit_price, unit, supplier, contractor_id) VALUES (, , , , , , ) ON CONFLICT (id, contractor_id) DO UPDATE SET unit_price =  RETURNING *',
      ['fence-wood', 'Madera para Cerca', 'fence', '25', 'ft', 'Lumber Yard', 1]
    );

    console.log('✅ Material de madera creado o actualizado');

    console.log('Precios configurados correctamente en la base de datos');
  } catch (error) {
    console.error('Error al configurar precios:', error);
  } finally {
    await pool.end();
  }
}

seedDefaultPricing();
