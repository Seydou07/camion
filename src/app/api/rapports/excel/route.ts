import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mois = searchParams.get("mois");
    const anneeStr = searchParams.get("annee") || String(new Date().getFullYear());
    const annee = parseInt(anneeStr);
    const camionIdsRaw = searchParams.get("camionIds");
    const camionIds = camionIdsRaw ? camionIdsRaw.split(",").map(Number).filter((n) => !isNaN(n)) : [];
    const typesRaw = searchParams.get("types");
    const types = typesRaw ? typesRaw.split(",").map((t) => t.trim().toLowerCase()) : ["carburant", "maintenance"];
    const inclureCarburant = types.includes("carburant");
    const inclureMaintenance = types.includes("maintenance");

    const dateFilter: any = {};
    if (mois) {
      const m = parseInt(mois);
      dateFilter.gte = new Date(annee, m - 1, 1);
      dateFilter.lt = new Date(annee, m, 1);
    } else {
      dateFilter.gte = new Date(annee, 0, 1);
      dateFilter.lt = new Date(annee + 1, 0, 1);
    }

    const camionFilter = camionIds.length > 0 ? { id: { in: camionIds } } : {};

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "FleetGuardian";
    workbook.lastModifiedBy = "FleetGuardian";
    workbook.created = new Date();
    workbook.modified = new Date();

    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: "thin", color: { argb: "FFE2E8F0" } },
      left: { style: "thin", color: { argb: "FFE2E8F0" } },
      bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
      right: { style: "thin", color: { argb: "FFE2E8F0" } },
    };

    const headerFill: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F172A" },
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
      fgColor: { argb: "FFF8FAFC" },
    };

    // -------------------------------------------------------------
    // SHEET 1 : Synthèse Flotte
    // -------------------------------------------------------------
    const sheetSynthese = workbook.addWorksheet("Synthèse Flotte");
    sheetSynthese.views = [{ showGridLines: true }];

    const camions = await prisma.camion.findMany({
      where: camionFilter,
      include: {
        chauffeur: true,
        reparations: {
          where: { date: dateFilter },
        },
        carburants: {
          include: {
            mouvements: {
              where: { dateOperation: dateFilter },
            },
          },
        },
      },
    });

    const moisLabel = mois
      ? `${["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"][parseInt(mois) - 1]} ${annee}`
      : `Année ${annee}`;

    sheetSynthese.mergeCells("A2:I2");
    const titleCell = sheetSynthese.getCell("A2");
    titleCell.value = `RAPPORT D'EXPLOITATION FLOTTE - ${moisLabel.toUpperCase()}`;
    titleCell.font = { name: "Segoe UI", size: 16, bold: true, color: { argb: "FF1E3A8A" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    sheetSynthese.getRow(2).height = 40;

    sheetSynthese.getCell("A3").value = `Généré le : ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`;
    sheetSynthese.getCell("A3").font = { name: "Segoe UI", size: 9, italic: true, color: { argb: "FF64748B" } };

    const tableHeaders = [
      "Immatriculation",
      "Chauffeur",
      "Kilométrage",
      "Carburant (F)",
      "Litres",
      "Maintenance (F)",
      "Exploitation (F)",
      "Dotation Annuelle (F)",
      "Budget Consommé (F)",
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
    let sumCarburant = 0;
    let sumMaintenance = 0;
    let sumExploitation = 0;
    let sumBudgetConsomme = 0;

    for (const camion of camions) {
      const row = sheetSynthese.getRow(currentRow);
      row.height = 22;

      let totalCarburant = 0;
      let totalLitres = 0;
      for (const dossier of camion.carburants) {
        for (const m of dossier.mouvements) {
          totalCarburant += m.montant;
        }
      }

      const totalMaintenance = camion.reparations.reduce((sum, r) => sum + r.cout, 0);
      const totalExploitation = totalCarburant + totalMaintenance;

      let budgetConsomme = totalCarburant + totalMaintenance;

      const chauffeurNom = camion.chauffeur
        ? `${camion.chauffeur.prenom || ""} ${camion.chauffeur.nom}`
        : "Non assigné";

      row.getCell(1).value = camion.immatriculation;
      row.getCell(2).value = chauffeurNom;
      row.getCell(3).value = camion.kilometrageActuel;
      row.getCell(4).value = totalCarburant;
      row.getCell(5).value = totalLitres;
      row.getCell(6).value = totalMaintenance;
      row.getCell(7).value = totalExploitation;
      row.getCell(8).value = camion.dotationAnnuelle || 0;
      row.getCell(9).value = budgetConsomme;

      row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
      row.getCell(3).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(3).numFmt = '#,##0" km"';
      row.getCell(4).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(4).numFmt = '#,##0" F"';
      row.getCell(5).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(6).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(6).numFmt = '#,##0" F"';
      row.getCell(7).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(7).numFmt = '#,##0" F"';
      row.getCell(8).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(8).numFmt = '#,##0" F"';
      row.getCell(9).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(9).numFmt = '#,##0" F"';

      for (let c = 1; c <= 9; c++) {
        const cell = row.getCell(c);
        cell.border = borderStyle;
        cell.font = { name: "Segoe UI", size: 10 };
        if (currentRow % 2 === 0) {
          cell.fill = zebraFill;
        }
      }

      sumCarburant += totalCarburant;
      sumMaintenance += totalMaintenance;
      sumExploitation += totalExploitation;
      sumBudgetConsomme += budgetConsomme;
      currentRow++;
    }

    const totalRow = sheetSynthese.getRow(currentRow);
    totalRow.height = 26;
    totalRow.getCell(1).value = "TOTAL FLOTTE";
    totalRow.getCell(1).font = { name: "Segoe UI", size: 10, bold: true };
    totalRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    totalRow.getCell(4).value = sumCarburant;
    totalRow.getCell(4).numFmt = '#,##0" F"';
    totalRow.getCell(6).value = sumMaintenance;
    totalRow.getCell(6).numFmt = '#,##0" F"';
    totalRow.getCell(7).value = sumExploitation;
    totalRow.getCell(7).numFmt = '#,##0" F"';
    totalRow.getCell(9).value = sumBudgetConsomme;
    totalRow.getCell(9).numFmt = '#,##0" F"';

    for (let c = 1; c <= 9; c++) {
      const cell = totalRow.getCell(c);
      cell.border = borderStyle;
      cell.font = { name: "Segoe UI", size: 10, bold: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
    }

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
    if (inclureCarburant) {
      const sheetCarburant = workbook.addWorksheet("Détails Carburant");
      sheetCarburant.views = [{ showGridLines: true }];

      const carbHeaders = [
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

      const whereCarb: any = { dateOperation: dateFilter };
      if (camionIds.length > 0) {
        whereCarb.carburant = { camionId: { in: camionIds } };
      }

      const mouvementsRaw = await prisma.mouvementCarburant.findMany({
        where: whereCarb,
        orderBy: { dateOperation: "desc" },
        include: {
          carburant: {
            include: {
              camion: true,
              chauffeur: true,
              voyage: true,
            },
          },
        },
      });

      let carbRowIdx = 2;
      mouvementsRaw.forEach((m) => {
        const row = sheetCarburant.getRow(carbRowIdx);
        row.height = 20;

        const typesMap: Record<string, string> = {
          COMPLEMENT: "Complément",
          DEPENSE: "Dépense / Plein",
          AJUSTEMENT: "Ajustement",
          PREVISION: "Prévision",
        };

        const c = m.carburant;

        row.getCell(1).value = m.dateOperation;
        row.getCell(2).value = typesMap[m.typeOperation] || m.typeOperation;
        row.getCell(3).value = m.montant;
        row.getCell(4).value = m.commentaire || "-";
        row.getCell(5).value = c.voyage?.numeroVoyage || "-";
        row.getCell(6).value = c.camion?.immatriculation || "-";
        row.getCell(7).value = c.chauffeur ? `${c.chauffeur.prenom || ""} ${c.chauffeur.nom}` : "Non assigné";

        row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
        row.getCell(1).numFmt = "yyyy-mm-dd hh:mm";
        row.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
        row.getCell(3).alignment = { horizontal: "right", vertical: "middle" };
        row.getCell(3).numFmt = '#,##0" F"';
        row.getCell(4).alignment = { horizontal: "left", vertical: "middle" };
        row.getCell(5).alignment = { horizontal: "center", vertical: "middle" };
        row.getCell(6).alignment = { horizontal: "center", vertical: "middle" };
        row.getCell(7).alignment = { horizontal: "left", vertical: "middle" };

        for (let col = 1; col <= 7; col++) {
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
    }

    // -------------------------------------------------------------
    // SHEET 3 : Maintenance & Réparations
    // -------------------------------------------------------------
    if (inclureMaintenance) {
      const sheetMaintenance = workbook.addWorksheet("Maintenance & Réparations");
      sheetMaintenance.views = [{ showGridLines: true }];

      const maintHeaders = [
        "Référence",
        "Camion",
        "Type",
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

      const whereRep: any = { date: dateFilter };
      if (camionIds.length > 0) {
        whereRep.camionId = { in: camionIds };
      }

      const reparationsRaw = await prisma.reparation.findMany({
        where: whereRep,
        orderBy: { date: "desc" },
      });

      const repCamionIds = [...new Set(reparationsRaw.map((r) => r.camionId))];
      const camionsRep = repCamionIds.length > 0
        ? await prisma.camion.findMany({ where: { id: { in: repCamionIds } } })
        : [];
      const camionMapRep = new Map(camionsRep.map((c) => [c.id, c]));

      let maintRowIdx = 2;
      reparationsRaw.forEach((r) => {
        const row = sheetMaintenance.getRow(maintRowIdx);
        row.height = 20;
        const camion = camionMapRep.get(r.camionId);

        row.getCell(1).value = r.reference || `REP-${r.id.toString().padStart(4, "0")}`;
        row.getCell(2).value = camion?.immatriculation || "-";
        row.getCell(3).value = r.type;
        row.getCell(4).value = r.date;
        row.getCell(5).value = r.garage;
        row.getCell(6).value = r.description;
        row.getCell(7).value = r.mainOeuvreCout || 0;
        row.getCell(8).value = r.cout;

        row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
        row.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
        row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
        row.getCell(4).alignment = { horizontal: "center", vertical: "middle" };
        row.getCell(4).numFmt = "yyyy-mm-dd";
        row.getCell(5).alignment = { horizontal: "left", vertical: "middle" };
        row.getCell(6).alignment = { horizontal: "left", vertical: "middle" };
        row.getCell(7).alignment = { horizontal: "right", vertical: "middle" };
        row.getCell(7).numFmt = '#,##0" F"';
        row.getCell(8).alignment = { horizontal: "right", vertical: "middle" };
        row.getCell(8).numFmt = '#,##0" F"';

        for (let col = 1; col <= 8; col++) {
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
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Rapport_Flotte_${annee}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Erreur génération Excel:", error);
    return NextResponse.json({ error: "Erreur lors de la génération du fichier Excel" }, { status: 500 });
  }
}
