import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

function calculateTruckConsumption(carburants: any[]) {
  const sorted = [...carburants].sort((a, b) => a.kilometrage - b.kilometrage);
  let totalLitresInterval = 0;
  let startKm = -1;
  const intervalConsos: number[] = [];

  for (const c of sorted) {
    if (startKm === -1) {
      if (c.estPlein) {
        startKm = c.kilometrage;
        totalLitresInterval = 0;
      }
      continue;
    }

    totalLitresInterval += c.litres;

    if (c.estPlein) {
      const distance = c.kilometrage - startKm;
      if (distance > 0) {
        intervalConsos.push((totalLitresInterval / distance) * 100);
      }
      startKm = c.kilometrage;
      totalLitresInterval = 0;
    }
  }

  if (intervalConsos.length === 0) return null;
  return intervalConsos.reduce((sum, val) => sum + val, 0) / intervalConsos.length;
}

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
        carburants: true,
        reparations: true,
      },
    });

    // Titre
    sheetSynthese.mergeCells("A2:K2");
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
      "Plein Route (Litres)",
      "Coût Carburant",
      "Coût Maintenance",
      "Coût Exploitation Total",
      "Consommation Moyenne (L/100)",
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

      const totalLitres = camion.carburants.reduce((sum, c) => sum + c.litres, 0);
      const totalCarburantCout = camion.carburants.reduce((sum, c) => sum + c.coutTotal, 0);
      const totalMaintenanceCout = camion.reparations.reduce((sum, r) => sum + r.cout, 0);
      const consoMoyenne = calculateTruckConsumption(camion.carburants);

      const chauffeurNom = camion.chauffeur
        ? `${camion.chauffeur.prenom || ""} ${camion.chauffeur.nom}`
        : "Non assigné";

      row.getCell(1).value = camion.immatriculation;
      row.getCell(2).value = camion.marque;
      row.getCell(3).value = camion.modele || "-";
      row.getCell(4).value = chauffeurNom;
      row.getCell(5).value = camion.statut === "en_service" ? "En service" : "Hors service / Autre";
      row.getCell(6).value = camion.kilometrageActuel;
      row.getCell(7).value = totalLitres;
      row.getCell(8).value = totalCarburantCout;
      row.getCell(9).value = totalMaintenanceCout;
      
      // Formule pour Coût Exploitation (Col J = Col H + Col I)
      row.getCell(10).value = { formula: `=H${currentRow}+I${currentRow}` };
      
      row.getCell(11).value = consoMoyenne !== null ? Math.round(consoMoyenne * 10) / 10 : null;

      // Alignements & Formats
      row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
      row.getCell(3).alignment = { horizontal: "left", vertical: "middle" };
      row.getCell(4).alignment = { horizontal: "left", vertical: "middle" };
      row.getCell(5).alignment = { horizontal: "center", vertical: "middle" };
      
      row.getCell(6).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(6).numFmt = '#,##0" km"';
      
      row.getCell(7).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(7).numFmt = '#,##0.0" L"';
      
      row.getCell(8).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(8).numFmt = '#,##0" F"';
      
      row.getCell(9).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(9).numFmt = '#,##0" F"';
      
      row.getCell(10).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(10).numFmt = '#,##0" F"';
      
      row.getCell(11).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(11).numFmt = '0.0" L/100km"';

      // Appliquer les bordures et le zèbre
      for (let c = 1; c <= 11; c++) {
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
    totalRow.getCell(7).numFmt = '#,##0.0" L"';

    totalRow.getCell(8).value = { formula: `=SUM(H${startRow + 1}:H${currentRow - 1})` };
    totalRow.getCell(8).numFmt = '#,##0" F"';

    totalRow.getCell(9).value = { formula: `=SUM(I${startRow + 1}:I${currentRow - 1})` };
    totalRow.getCell(9).numFmt = '#,##0" F"';

    totalRow.getCell(10).value = { formula: `=SUM(J${startRow + 1}:J${currentRow - 1})` };
    totalRow.getCell(10).numFmt = '#,##0" F"';

    totalRow.getCell(11).value = { formula: `=AVERAGE(K${startRow + 1}:K${currentRow - 1})` };
    totalRow.getCell(11).numFmt = '0.0" L/100km"';

    for (let c = 1; c <= 11; c++) {
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
      "ID Plein",
      "Camion",
      "Chauffeur",
      "Date du Plein",
      "Kilométrage (km)",
      "Litres (L)",
      "Prix du Litre (F)",
      "Coût Total (F)",
      "Type Opération",
      "Plein Complet ?",
      "N° Ticket",
      "Station Service",
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

    const carburantsRaw = await prisma.carburant.findMany({
      orderBy: { date: "desc" },
    });

    const camionIdsCarb = [...new Set(carburantsRaw.map((c) => c.camionId))];
    const chauffeurIdsCarb = [
      ...new Set(
        carburantsRaw.map((c) => c.chauffeurId).filter((id): id is number => id != null)
      ),
    ];

    const [camionsCarb, chauffeursCarb] = await Promise.all([
      prisma.camion.findMany({ where: { id: { in: camionIdsCarb } } }),
      chauffeurIdsCarb.length
        ? prisma.chauffeur.findMany({ where: { id: { in: chauffeurIdsCarb } } })
        : Promise.resolve([]),
    ]);

    const camionMapCarb = new Map(camionsCarb.map((c) => [c.id, c]));
    const chauffeurMapCarb = new Map(chauffeursCarb.map((ch) => [ch.id, ch]));

    const carburants = carburantsRaw.map((c) => ({
      ...c,
      camion: camionMapCarb.get(c.camionId) || null,
      chauffeur: c.chauffeurId
        ? chauffeurMapCarb.get(c.chauffeurId) || null
        : null,
    }));

    let carbRowIdx = 2;
    carburants.forEach((c) => {
      const row = sheetCarburant.getRow(carbRowIdx);
      row.height = 20;

      const types: Record<string, string> = {
        plein_depot: "Plein Dépôt",
        appoint_route: "Appoint Route",
        plein_retour: "Plein Retour",
      };

      row.getCell(1).value = c.id;
      row.getCell(2).value = c.camion?.immatriculation || "-";
      row.getCell(3).value = c.chauffeur ? `${c.chauffeur.prenom || ""} ${c.chauffeur.nom}` : "Non assigné";
      row.getCell(4).value = c.date;
      row.getCell(5).value = c.kilometrage;
      row.getCell(6).value = c.litres;
      row.getCell(7).value = c.prixLitre;
      
      // Formule Excel (Coût Total = Litres * Prix)
      row.getCell(8).value = { formula: `=F${carbRowIdx}*G${carbRowIdx}` };
      
      row.getCell(9).value = types[c.typeOperation] || c.typeOperation || "Plein";
      row.getCell(10).value = c.estPlein ? "Oui (Complet)" : "Non (Partiel)";
      row.getCell(11).value = c.numeroTicket || "-";
      row.getCell(12).value = c.stationService || "-";

      row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(3).alignment = { horizontal: "left", vertical: "middle" };
      
      row.getCell(4).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(4).numFmt = "yyyy-mm-dd hh:mm";
      
      row.getCell(5).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(5).numFmt = '#,##0';
      
      row.getCell(6).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(6).numFmt = '#,##0.0';
      
      row.getCell(7).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(7).numFmt = '#,##0';

      row.getCell(8).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(8).numFmt = '#,##0" F"';

      row.getCell(9).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(10).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(11).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(12).alignment = { horizontal: "left", vertical: "middle" };

      for (let col = 1; col <= 12; col++) {
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
