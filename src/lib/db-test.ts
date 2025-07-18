// To run this script, use: npm run db:test

import { prisma } from './prisma';

async function main() {
  console.log('--- Iniciando prueba de conexión a la base de datos ---');
  try {
    // Prisma Client is lazy-loaded, so this is the first real query.
    await prisma.$connect();
    console.log('✅ Conexión a la base de datos exitosa.');

    // Intenta obtener un recuento de usuarios.
    const userCount = await prisma.user.count();
    console.log(`✅ Encontrados ${userCount} usuarios en la base de datos.`);
    
    // Intenta obtener un recuento de duelos.
    const duelCount = await prisma.duel.count();
    console.log(`✅ Encontrados ${duelCount} duelos en la base de datos.`);

    console.log('\nCONFIRMADO: ¡La conexión a la base de datos está funcionando correctamente!');
  } catch (e) {
    console.error('❌ Error al conectar o consultar la base de datos:');
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('--- Prueba finalizada ---');
  }
}

main();
// Trigger redeploy after removing sslmode=require from .env.
// Trigger redeploy after removing duplicate prisma.ts.
// Trigger redeploy after adding @@map("users") to User model.
// Trigger redeploy after successful prisma generate

