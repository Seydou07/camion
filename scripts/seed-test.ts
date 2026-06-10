import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Nettoyage avant insertion...')
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;')
  await prisma.$executeRawUnsafe('TRUNCATE TABLE camions;')
  await prisma.$executeRawUnsafe('TRUNCATE TABLE chauffeurs;')
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;')

  console.log('Insertion des données de test détaillées...')

  // 10 Chauffeurs
  const chauffeursData = [
    { nom: 'Sow', prenom: 'Moussa', telephone: '771234567', numeroPermis: 'DK-12345', statut: 'actif' },
    { nom: 'Diallo', prenom: 'Abdoulaye', telephone: '781234567', numeroPermis: 'DK-23456', statut: 'actif' },
    { nom: 'Ndiaye', prenom: 'Fatou', telephone: '701234567', numeroPermis: 'DK-34567', statut: 'actif' },
    { nom: 'Gaye', prenom: 'Ibrahima', telephone: '761234567', numeroPermis: 'DK-45678', statut: 'actif' },
    { nom: 'Kane', prenom: 'Ousmane', telephone: '779876543', numeroPermis: 'DK-56789', statut: 'actif' },
    { nom: 'Ba', prenom: 'Amadou', telephone: '789876543', numeroPermis: 'DK-67890', statut: 'actif' },
    { nom: 'Fall', prenom: 'Cheikh', telephone: '709876543', numeroPermis: 'DK-78901', statut: 'actif' },
    { nom: 'Diop', prenom: 'Modou', telephone: '769876543', numeroPermis: 'DK-89012', statut: 'actif' },
    { nom: 'Sarr', prenom: 'Pape', telephone: '775554433', numeroPermis: 'DK-90123', statut: 'actif' },
    { nom: 'Cisse', prenom: 'Aliou', telephone: '785554433', numeroPermis: 'DK-01234', statut: 'actif' },
  ]

  for (const c of chauffeursData) {
    await prisma.chauffeur.create({ data: c })
  }

  // Paramètre global du budget
  await prisma.parametreGlobal.upsert({
    where: { cle: 'budget_annuel_global' },
    update: { valeur: '20000000' },
    create: { cle: 'budget_annuel_global', valeur: '20000000', description: 'Budget annuel total pour la flotte' }
  })
  console.log('Budget global de 20.000.000 inséré.')

  // 10 Camions avec tous les champs remplis, kilométrage à 0 et dotation à 1.000.000
  const camionsData = [
    {
      immatriculation: 'AA-123-BB',
      marque: 'Mercedes-Benz',
      modele: 'Actros',
      annee: 2023,
      couleur: 'Blanc',
      numeroChassis: 'WDB9630011L123456',
      dateMiseService: new Date('2023-05-01'),
      prochaineVisite: new Date('2026-05-01'),
      echeanceAssurance: new Date('2026-12-31'),
      compagnieAssurance: 'AXA Assurance',
      numeroPoliceAssurance: 'POL-998877',
      capaciteReservoir: 400,
      capaciteTonnes: 20,
      kilometrageActuel: 0,
      dotationAnnuelle: 1000000,
      frequenceVidange: 1000,
      statut: 'en_service'
    },
    {
      immatriculation: 'CC-456-DD',
      marque: 'Volvo',
      modele: 'FH16',
      annee: 2022,
      couleur: 'Bleu Nuit',
      numeroChassis: 'YV2RT40A1LA654321',
      dateMiseService: new Date('2022-10-15'),
      prochaineVisite: new Date('2025-10-15'),
      echeanceAssurance: new Date('2026-10-15'),
      compagnieAssurance: 'NSIA Assurance',
      numeroPoliceAssurance: 'POL-112233',
      capaciteReservoir: 600,
      capaciteTonnes: 25,
      kilometrageActuel: 0,
      dotationAnnuelle: 1000000,
      frequenceVidange: 1000,
      statut: 'en_service'
    },
    {
      immatriculation: 'EE-789-FF',
      marque: 'Scania',
      modele: 'R500',
      annee: 2024,
      couleur: 'Rouge',
      numeroChassis: 'XLE12345678901234',
      dateMiseService: new Date('2024-01-20'),
      prochaineVisite: new Date('2027-01-20'),
      echeanceAssurance: new Date('2027-01-20'),
      compagnieAssurance: 'Allianz',
      numeroPoliceAssurance: 'POL-445566',
      capaciteReservoir: 500,
      capaciteTonnes: 18,
      kilometrageActuel: 0,
      dotationAnnuelle: 1000000,
      frequenceVidange: 1000,
      statut: 'en_service'
    },
    {
      immatriculation: 'GG-012-HH',
      marque: 'MAN',
      modele: 'TGX',
      annee: 2021,
      couleur: 'Gris Métallisé',
      numeroChassis: 'WMA12345678901234',
      dateMiseService: new Date('2021-03-12'),
      prochaineVisite: new Date('2026-03-12'),
      echeanceAssurance: new Date('2026-03-12'),
      compagnieAssurance: 'SAHAM',
      numeroPoliceAssurance: 'POL-778899',
      capaciteReservoir: 450,
      capaciteTonnes: 22,
      kilometrageActuel: 0,
      dotationAnnuelle: 1000000,
      frequenceVidange: 1000,
      statut: 'en_service'
    },
    {
      immatriculation: 'II-345-JJ',
      marque: 'DAF',
      modele: 'XF',
      annee: 2023,
      couleur: 'Jaune',
      numeroChassis: 'XLR12345678901234',
      dateMiseService: new Date('2023-08-05'),
      prochaineVisite: new Date('2026-08-05'),
      echeanceAssurance: new Date('2026-08-05'),
      compagnieAssurance: 'SUNU Assurance',
      numeroPoliceAssurance: 'POL-334455',
      capaciteReservoir: 550,
      capaciteTonnes: 20,
      kilometrageActuel: 0,
      dotationAnnuelle: 1000000,
      frequenceVidange: 1000,
      statut: 'en_service'
    },
    {
      immatriculation: 'KK-678-LL',
      marque: 'Renault',
      modele: 'Range T',
      annee: 2022,
      couleur: 'Blanc Arctique',
      numeroChassis: 'VF612345678901234',
      dateMiseService: new Date('2022-11-30'),
      prochaineVisite: new Date('2025-11-30'),
      echeanceAssurance: new Date('2026-11-30'),
      compagnieAssurance: 'AXA',
      numeroPoliceAssurance: 'POL-223344',
      capaciteReservoir: 480,
      capaciteTonnes: 19,
      kilometrageActuel: 0,
      dotationAnnuelle: 1000000,
      frequenceVidange: 1000,
      statut: 'en_service'
    },
    {
      immatriculation: 'MM-901-NN',
      marque: 'Iveco',
      modele: 'S-Way',
      annee: 2023,
      couleur: 'Bleu Azur',
      numeroChassis: 'WJM12345678901234',
      dateMiseService: new Date('2023-04-18'),
      prochaineVisite: new Date('2026-04-18'),
      echeanceAssurance: new Date('2026-04-18'),
      compagnieAssurance: 'CNART',
      numeroPoliceAssurance: 'POL-556677',
      capaciteReservoir: 520,
      capaciteTonnes: 21,
      kilometrageActuel: 0,
      dotationAnnuelle: 1000000,
      frequenceVidange: 1000,
      statut: 'en_service'
    },
    {
      immatriculation: 'OO-234-PP',
      marque: 'Mercedes-Benz',
      modele: 'Arocs',
      annee: 2020,
      couleur: 'Orange',
      numeroChassis: 'WDB9630011L998877',
      dateMiseService: new Date('2020-09-22'),
      prochaineVisite: new Date('2026-09-22'),
      echeanceAssurance: new Date('2026-09-22'),
      compagnieAssurance: 'ASKIA',
      numeroPoliceAssurance: 'POL-667788',
      capaciteReservoir: 380,
      capaciteTonnes: 26,
      kilometrageActuel: 0,
      dotationAnnuelle: 1000000,
      frequenceVidange: 1000,
      statut: 'en_service'
    },
    {
      immatriculation: 'QQ-567-RR',
      marque: 'Volvo',
      modele: 'FMX',
      annee: 2021,
      couleur: 'Noir',
      numeroChassis: 'YV2RT40A1LA001122',
      dateMiseService: new Date('2021-12-05'),
      prochaineVisite: new Date('2026-12-05'),
      echeanceAssurance: new Date('2026-12-05'),
      compagnieAssurance: 'AXA',
      numeroPoliceAssurance: 'POL-889900',
      capaciteReservoir: 580,
      capaciteTonnes: 24,
      kilometrageActuel: 0,
      dotationAnnuelle: 1000000,
      frequenceVidange: 1000,
      statut: 'en_service'
    },
    {
      immatriculation: 'SS-890-TT',
      marque: 'Scania',
      modele: 'G450',
      annee: 2022,
      couleur: 'Vert Forêt',
      numeroChassis: 'XLE12345678909988',
      dateMiseService: new Date('2022-02-14'),
      prochaineVisite: new Date('2027-02-14'),
      echeanceAssurance: new Date('2027-02-14'),
      compagnieAssurance: 'SUNU',
      numeroPoliceAssurance: 'POL-443322',
      capaciteReservoir: 490,
      capaciteTonnes: 20,
      kilometrageActuel: 0,
      dotationAnnuelle: 1000000,
      frequenceVidange: 1000,
      statut: 'en_service'
    }
  ]

  for (const c of camionsData) {
    await prisma.camion.create({ data: c })
  }

  await prisma.$disconnect()
  console.log('Données de test détaillées insérées avec succès !')
}

main()
