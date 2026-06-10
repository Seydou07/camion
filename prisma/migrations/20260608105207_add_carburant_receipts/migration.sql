-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'admin',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `camions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `immatriculation` VARCHAR(191) NOT NULL,
    `marque` VARCHAR(191) NOT NULL,
    `modele` VARCHAR(191) NULL,
    `capacite_tonnes` DOUBLE NOT NULL,
    `statut` VARCHAR(191) NOT NULL DEFAULT 'en_service',
    `date_mise_service` DATETIME(3) NOT NULL,
    `prochaine_visite` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `chauffeur_id` INTEGER NULL,
    `kilometrage_actuel` INTEGER NOT NULL DEFAULT 0,
    `annee` INTEGER NULL,
    `capacite_reservoir` INTEGER NULL,
    `carburant` VARCHAR(191) NOT NULL DEFAULT 'Diesel',
    `compagnie_assurance` VARCHAR(191) NULL,
    `couleur` VARCHAR(191) NULL,
    `dotation_annuelle` DOUBLE NULL,
    `echeance_assurance` DATETIME(3) NULL,
    `frequence_vidange` INTEGER NULL,
    `notes` TEXT NULL,
    `numero_chassis` VARCHAR(191) NULL,
    `numero_police_assurance` VARCHAR(191) NULL,
    `transmission` VARCHAR(191) NULL DEFAULT 'Manuelle',
    `dernier_kilometrage_vidange` INTEGER NOT NULL DEFAULT 0,
    `budget_consomme` DOUBLE NOT NULL DEFAULT 0,
    `budget_restant` DOUBLE NOT NULL DEFAULT 0,

    UNIQUE INDEX `camions_immatriculation_key`(`immatriculation`),
    UNIQUE INDEX `camions_chauffeur_id_key`(`chauffeur_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chauffeurs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `prenom` VARCHAR(191) NULL,
    `telephone` VARCHAR(191) NULL,
    `numero_permis` VARCHAR(191) NULL,
    `statut` VARCHAR(191) NOT NULL DEFAULT 'actif',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `carburants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `voyage_id` INTEGER NULL,
    `camion_id` INTEGER NOT NULL,
    `chauffeur_id` INTEGER NULL,
    `montant_prevision` DOUBLE NOT NULL DEFAULT 0,
    `total_complements` DOUBLE NOT NULL DEFAULT 0,
    `total_depenses` DOUBLE NOT NULL DEFAULT 0,
    `total_recu_valide` DOUBLE NOT NULL DEFAULT 0,
    `statut` VARCHAR(191) NOT NULL DEFAULT 'EN_COURS',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `carburants_voyage_id_key`(`voyage_id`),
    INDEX `carburants_camion_id_fkey`(`camion_id`),
    INDEX `carburants_chauffeur_id_fkey`(`chauffeur_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mouvements_carburant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `carburant_id` INTEGER NOT NULL,
    `date_operation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `type_operation` VARCHAR(191) NOT NULL,
    `montant` DOUBLE NOT NULL,
    `station_service` VARCHAR(191) NULL,
    `numero_ticket` VARCHAR(191) NULL,
    `kilometrage` INTEGER NULL,
    `litres` DOUBLE NULL,
    `prix_litre` DOUBLE NULL,
    `commentaire` TEXT NULL,
    `utilisateur_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `mouvements_carburant_carburant_id_fkey`(`carburant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recu_carburants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mouvement_id` INTEGER NOT NULL,
    `chemin_image` VARCHAR(191) NOT NULL,
    `nom_fichier` VARCHAR(191) NULL,
    `mime_type` VARCHAR(191) NULL,
    `taille_octets` INTEGER NULL,
    `montant_recu` DOUBLE NOT NULL,
    `date_recu` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `commentaire` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `recu_carburants_mouvement_id_fkey`(`mouvement_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `voyages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numero_voyage` VARCHAR(191) NOT NULL,
    `camion_id` INTEGER NOT NULL,
    `chauffeur_id` INTEGER NULL,
    `date_debut` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `date_fin` DATETIME(3) NULL,
    `kilometrage_depart` INTEGER NOT NULL,
    `kilometrage_arrivee` INTEGER NULL,
    `montant_prevision_carburant` DOUBLE NOT NULL DEFAULT 0,
    `observations` TEXT NULL,
    `statut` VARCHAR(191) NOT NULL DEFAULT 'EN_COURS',
    `destination` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `voyages_numero_voyage_key`(`numero_voyage`),
    INDEX `voyages_camion_id_fkey`(`camion_id`),
    INDEX `voyages_chauffeur_id_fkey`(`chauffeur_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reparations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `camion_id` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `type` VARCHAR(191) NOT NULL,
    `garage` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `cout` DOUBLE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `kilometrage` INTEGER NOT NULL DEFAULT 0,
    `carte_carburant_id` INTEGER NULL,
    `date_fin` DATETIME(3) NULL,
    `main_oeuvre_cout` DOUBLE NOT NULL DEFAULT 0,
    `main_oeuvre_source` VARCHAR(191) NULL,
    `reference` VARCHAR(191) NULL,
    `statut` VARCHAR(191) NOT NULL DEFAULT 'terminee',

    INDEX `reparations_camion_id_fkey`(`camion_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pieces_changees` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reparation_id` INTEGER NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `quantite` INTEGER NOT NULL,
    `prix_unitaire` DOUBLE NOT NULL,
    `source_paiement` VARCHAR(191) NULL,

    INDEX `pieces_changees_reparation_id_fkey`(`reparation_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cartes_carburant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numero_carte` VARCHAR(191) NOT NULL,
    `solde` DOUBLE NOT NULL DEFAULT 0,
    `statut` VARCHAR(191) NOT NULL DEFAULT 'actif',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `cartes_carburant_numero_carte_key`(`numero_carte`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `maintenances_planifiees` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `camion_id` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `frequence_kilometrage` INTEGER NULL,
    `kilometrage_dernier` INTEGER NOT NULL DEFAULT 0,
    `kilometrage_cible` INTEGER NOT NULL,
    `date_limite` DATETIME(3) NULL,
    `statut` VARCHAR(191) NOT NULL DEFAULT 'planifie',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `maintenances_planifiees_camion_id_fkey`(`camion_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `parametres_globaux` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cle` VARCHAR(191) NOT NULL,
    `valeur` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `parametres_globaux_cle_key`(`cle`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `camions` ADD CONSTRAINT `camions_chauffeur_id_fkey` FOREIGN KEY (`chauffeur_id`) REFERENCES `chauffeurs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `carburants` ADD CONSTRAINT `carburants_voyage_id_fkey` FOREIGN KEY (`voyage_id`) REFERENCES `voyages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `carburants` ADD CONSTRAINT `carburants_camion_id_fkey` FOREIGN KEY (`camion_id`) REFERENCES `camions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `carburants` ADD CONSTRAINT `carburants_chauffeur_id_fkey` FOREIGN KEY (`chauffeur_id`) REFERENCES `chauffeurs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mouvements_carburant` ADD CONSTRAINT `mouvements_carburant_carburant_id_fkey` FOREIGN KEY (`carburant_id`) REFERENCES `carburants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recu_carburants` ADD CONSTRAINT `recu_carburants_mouvement_id_fkey` FOREIGN KEY (`mouvement_id`) REFERENCES `mouvements_carburant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `voyages` ADD CONSTRAINT `voyages_camion_id_fkey` FOREIGN KEY (`camion_id`) REFERENCES `camions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `voyages` ADD CONSTRAINT `voyages_chauffeur_id_fkey` FOREIGN KEY (`chauffeur_id`) REFERENCES `chauffeurs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reparations` ADD CONSTRAINT `reparations_camion_id_fkey` FOREIGN KEY (`camion_id`) REFERENCES `camions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pieces_changees` ADD CONSTRAINT `pieces_changees_reparation_id_fkey` FOREIGN KEY (`reparation_id`) REFERENCES `reparations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `maintenances_planifiees` ADD CONSTRAINT `maintenances_planifiees_camion_id_fkey` FOREIGN KEY (`camion_id`) REFERENCES `camions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
