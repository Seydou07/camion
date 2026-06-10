import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET(request: NextRequest) {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "FleetGuardian";
    workbook.lastModifiedBy = "FleetGuardian";
    workbook.created = new Date();
    workbook.modified = new Date();

    // Styles réutilisables
    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: "thin", color: { argb: "FFE2E8F0" } },
      left: { style: "thin", color: { argb: "FFE2E8F0" } },
      bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
      right: { style: "thin", color: { argb: "FFE2E8F0" } },
    };

    const headerFill: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F172A" }, // Slate 900
    };

    const headerFont: Partial<ExcelJS.Font> = {
      name: "Segoe UI",
      size: 11,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };

    const zebraFill: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF8FAFC" }, // Slate 50
    };

    // -------------------------------------------------------------
    // SHEET 1 : Synthèse Flotte
    // -------------------------------------------------------------
    const sheetSynthese = workbook.addWorksheet("Synthèse Flotte");
    sheetSynthese.views = [{ showGridLines: true }];

    // Récupération des données camions
    const camions = await prisma.camion.findMany({
      include: {
        chauffeur: true,
        reparations: true,
        carburants: {
          include: {
            mouvements: true
          }
        }
      },
    });

    // Titre
    sheetSynthese.mergeCells("A2:H2");
    const titleCell = sheetSynthese.getCell("A2");
    titleCell.value = "RAPPORT SYNTHÉTIQUE DE LA FLOTTE - FLEETGUARDIAN";
    titleCell.font = { name: "Segoe UI", size: 16, bold: true, color: { argb: "FF1E3A8A" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    sheetSynthese.getRow(2).height = 40;

    // Date du rapport
    sheetSynthese.getCell("A3").value = `Généré le : ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`;
    sheetSynthese.getCell("A3").font = { name: "Segoe UI", size: 9, italic: true, color: { argb: "FF64748B" } };

    // Tableau de synthèse par Camion
    const tableHeaders = [
      "Immatriculation",
      "Marque",
      "Modèle",
      "Chauffeur",
      "Statut",
      "Kilométrage Actuel",
      "Coût Carburant",
      "Coût Maintenance",
      "Coût Exploitation Total",
    ];

    const startRow = 6;
    const headerRow = sheetSynthese.getRow(startRow);
    headerRow.height = 28;

    tableHeaders.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = borderStyle;
    });

    let currentRow = startRow + 1;
    camions.forEach((camion) => {
      const row = sheetSynthese.getRow(currentRow);
      row.height = 22;

      let totalCarburantCout = 0;
      camion.carburants.forEach(dossier => {
        dossier.mouvements.forEach(m => {
          totalCarburantCout += m.montant;
        });
      });

      const totalMaintenanceCout = camion.reparations.reduce((sum, r) => sum + r.cout, 0);

      const chauffeurNom = camion.chauffeur
        ? `${camion.chauffeur.prenom || ""} ${camion.chauffeur.nom}`
        : "Non assigné";

      row.getCell(1).value = camion.immatriculation;
      row.getCell(2).value = camion.marque;
      row.getCell(3).value = camion.modele || "-";
      row.getCell(4).value = chauffeurNom;
      row.getCell(5).value = camion.statut === "en_service" ? "En service" : "Hors service / Autre";
      row.getCell(6).value = camion.kilometrageActuel;
      row.getCell(7).value = totalCarburantCout;
      row.getCell(8).value = totalMaintenanceCout;
      
      // Formule pour Coût Exploitation (Col I = Col G + Col H)
      row.getCell(9).value = { formula: `=G${currentRow}+H${currentRow}` };

      // Alignements & Formats
      row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
      row.getCell(3).alignment = { horizontal: "left", vertical: "middle" };
      row.getCell(4).alignment = { horizontal: "left", vertical: "middle" };
      row.getCell(5).alignment = { horizontal: "center", vertical: "middle" };
      
      row.getCell(6).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(6).numFmt = '#,##0" km"';
      
      row.getCell(7).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(7).numFmt = '#,##0" F"';
      
      row.getCell(8).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(8).numFmt = '#,##0" F"';
      
      row.getCell(9).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(9).numFmt = '#,##0" F"';

      // Appliquer les bordures et le zèbre
      for (let c = 1; c <= 9; c++) {
        const cell = row.getCell(c);
        cell.border = borderStyle;
        cell.font = { name: "Segoe UI", size: 10 };
        if (currentRow % 2 === 0) {
          cell.fill = zebraFill;
        }
      }

      currentRow++;
    });

    // Ligne Totaux
    const totalRow = sheetSynthese.getRow(currentRow);
    totalRow.height = 26;
    totalRow.getCell(1).value = "TOTAL FLOTTE";
    totalRow.getCell(1).font = { name: "Segoe UI", size: 10, bold: true };
    totalRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };

    // Formules Excel pour les totaux
    totalRow.getCell(6).value = { formula: `=MAX(F${startRow + 1}:F${currentRow - 1})` }; // Max km
    totalRow.getCell(6).numFmt = '#,##0" km"';

    totalRow.getCell(7).value = { formula: `=SUM(G${startRow + 1}:G${currentRow - 1})` };
    totalRow.getCell(7).numFmt = '#,##0" F"';

    totalRow.getCell(8).value = { formula: `=SUM(H${startRow + 1}:H${currentRow - 1})` };
    totalRow.getCell(8).numFmt = '#,##0" F"';

    totalRow.getCell(9).value = { formula: `=SUM(I${startRow + 1}:I${currentRow - 1})` };
    totalRow.getCell(9).numFmt = '#,##0" F"';


    for (let c = 1; c <= 9; c++) {
      const cell = totalRow.getCell(c);
      cell.border = borderStyle;
      cell.font = { name: "Segoe UI", size: 10, bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE2E8F0" }, // Slate 200
      };
    }

    // Auto-ajuster les colonnes
    sheetSynthese.columns.forEach((col) => {
      let maxLen = 0;
      col.eachCell!((cell) => {
        if (Number(cell.row) > 4 && cell.value) {
          const len = String(cell.value).length;
          if (len > maxLen) maxLen = len;
        }
      });
      col.width = Math.max(maxLen + 4, 12);
    });

    // -------------------------------------------------------------
    // SHEET 2 : Détails Carburant
    // -------------------------------------------------------------
    const sheetCarburant = workbook.addWorksheet("Détails Carburant");
    sheetCarburant.views = [{ showGridLines: true }];

    const carbHeaders = [
      "ID Mouvement",
      "Date",
      "Type Opération",
      "Montant (F)",
      "Commentaire",
      "N° Voyage",
      "Camion",
      "Chauffeur",
    ];

    const carbHeaderRow = sheetCarburant.getRow(1);
    carbHeaderRow.height = 28;
    carbHeaders.forEach((h, idx) => {
      const cell = carbHeaderRow.getCell(idx + 1);
      cell.value = h;
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = borderStyle;
    });

    const mouvementsRaw = await prisma.mouvementCarburant.findMany({
      orderBy: { dateOperation: "desc" },
      include: {
        carburant: {
          include: {
            camion: true,
            chauffeur: true,
            voyage: true
          }
        }
      }
    });

    let carbRowIdx = 2;
    mouvementsRaw.forEach((m) => {
      const row = sheetCarburant.getRow(carbRowIdx);
      row.height = 20;

      const types: Record<string, string> = {
        COMPLEMENT: "Complément",
        DEPENSE: "Dépense / Plein",
        AJUSTEMENT: "Ajustement",
        PREVISION: "Prévision"
      };

      const c = m.carburant;

      row.getCell(1).value = m.id;
      row.getCell(2).value = m.dateOperation;
      row.getCell(3).value = types[m.typeOperation] || m.typeOperation;
      row.getCell(4).value = m.montant;
      row.getCell(5).value = m.commentaire || "-";
      row.getCell(6).value = c.voyage?.numeroVoyage || "-";
      row.getCell(7).value = c.camion?.immatriculation || "-";
      row.getCell(8).value = c.chauffeur ? `${c.chauffeur.prenom || ""} ${c.chauffeur.nom}` : "Non assigné";

      row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(2).numFmt = "yyyy-mm-dd hh:mm";
      
      row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
      
      row.getCell(4).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(4).numFmt = '#,##0" F"';

      row.getCell(5).alignment = { horizontal: "left", vertical: "middle" };
      row.getCell(6).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(7).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(8).alignment = { horizontal: "left", vertical: "middle" };

      for (let col = 1; col <= 8; col++) {
        const cell = row.getCell(col);
        cell.border = borderStyle;
        cell.font = { name: "Segoe UI", size: 10 };
        if (carbRowIdx % 2 === 0) {
          cell.fill = zebraFill;
        }
      }

      carbRowIdx++;
    });

    sheetCarburant.columns.forEach((col) => {
      let maxLen = 0;
      col.eachCell!((cell) => {
        if (cell.value) {
          const len = String(cell.value).length;
          if (len > maxLen) maxLen = len;
        }
      });
      col.width = Math.max(maxLen + 4, 12);
    });

    // -------------------------------------------------------------
    // SHEET 3 : Maintenance & Réparations
    // -------------------------------------------------------------
    const sheetMaintenance = workbook.addWorksheet("Maintenance & Réparations");
    sheetMaintenance.views = [{ showGridLines: true }];

    const maintHeaders = [
      "ID Réparation",
      "Référence",
      "Camion",
      "Type",
      "Statut",
      "Date Intervention",
      "Garage",
      "Description",
      "Coût Main d'Œuvre (F)",
      "Coût Total (F)",
    ];

    const maintHeaderRow = sheetMaintenance.getRow(1);
    maintHeaderRow.height = 28;
    maintHeaders.forEach((h, idx) => {
      const cell = maintHeaderRow.getCell(idx + 1);
      cell.value = h;
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = borderStyle;
    });

    const reparationsRaw = await prisma.reparation.findMany({
      orderBy: { date: "desc" },
    });

    const camionIdsRep = [...new Set(reparationsRaw.map((r) => r.camionId))];
    const camionsRep = await prisma.camion.findMany({
      where: { id: { in: camionIdsRep } },
    });
    const camionMapRep = new Map(camionsRep.map((c) => [c.id, c]));

    const reparations = reparationsRaw.map((r) => ({
      ...r,
      camion: camionMapRep.get(r.camionId) || null,
    }));

    let maintRowIdx = 2;
    reparations.forEach((r) => {
      const row = sheetMaintenance.getRow(maintRowIdx);
      row.height = 20;

      row.getCell(1).value = r.id;
      row.getCell(2).value = r.reference || `REP-${r.id.toString().padStart(4, "0")}`;
      row.getCell(3).value = r.camion?.immatriculation || "-";
      row.getCell(4).value = r.type;
      row.getCell(5).value = r.statut;
      row.getCell(6).value = r.date;
      row.getCell(7).value = r.garage;
      row.getCell(8).value = r.description;
      row.getCell(9).value = r.mainOeuvreCout || 0;
      row.getCell(10).value = r.cout; // Coût global

      row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(4).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(5).alignment = { horizontal: "center", vertical: "middle" };
      
      row.getCell(6).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(6).numFmt = "yyyy-mm-dd";
      
      row.getCell(7).alignment = { horizontal: "left", vertical: "middle" };
      row.getCell(8).alignment = { horizontal: "left", vertical: "middle" };
      
      row.getCell(9).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(9).numFmt = '#,##0" F"';
      
      row.getCell(10).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(10).numFmt = '#,##0" F"';

      for (let col = 1; col <= 10; col++) {
        const cell = row.getCell(col);
        cell.border = borderStyle;
        cell.font = { name: "Segoe UI", size: 10 };
        if (maintRowIdx % 2 === 0) {
          cell.fill = zebraFill;
        }
      }

      maintRowIdx++;
    });

    sheetMaintenance.columns.forEach((col) => {
      let maxLen = 0;
      col.eachCell!((cell) => {
        if (cell.value) {
          const len = String(cell.value).length;
          if (len > maxLen) maxLen = len;
        }
      });
      col.width = Math.max(maxLen + 4, 12);
    });

    // Génération du buffer Excel
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=Rapport_Flotte_Premium.xlsx",
      },
    });

  } catch (error) {
    console.error("Erreur génération Excel:", error);
    return NextResponse.json({ error: "Erreur lors de la génération du fichier Excel" }, { status: 500 });
  }
}

