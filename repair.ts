import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const tables = [
      'camions',
      'chauffeurs',
      'carburants',
      'reparations',
      'pieces_changees',
      'cartes_carburant',
      'maintenances_planifiees',
      'users'
    ];
    
    console.log("Tentative de réparation des tables MySQL...");
    for (const table of tables) {
      console.log(`Réparation de ${table}...`);
      await prisma.$executeRawUnsafe(`REPAIR TABLE ${table};`);
    }
    console.log("Toutes les tables ont été réparées !");
  } catch (error) {
    console.error("Erreur lors de la réparation :", error);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
