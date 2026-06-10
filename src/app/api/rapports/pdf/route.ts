import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mois = searchParams.get("mois");
    const annee = searchParams.get("annee") || String(new Date().getFullYear());
    const camionIds = searchParams.get("camionIds") || "";

    const query = new URLSearchParams();
    if (mois) query.append("mois", mois);
    query.append("annee", annee);
    if (camionIds) query.append("camionIds", camionIds);

    const baseUrl = request.nextUrl.origin;
    const rapportRes = await fetch(`${baseUrl}/api/rapports?${query.toString()}`);
    const data = await rapportRes.json();

    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 500 });
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("RAPPORT D'EXPLOITATION FLOTTE", 14, 14);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const periode = mois
      ? `${["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Aoû","Sep","Oct","Nov","Déc"][parseInt(mois) - 1]} ${annee}`
      : `Année ${annee}`;
    doc.text(`Période : ${periode}  |  Généré le ${new Date().toLocaleDateString("fr-FR")}`, 14, 22);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Synthèse financière", 14, 38);

    autoTable(doc, {
      startY: 42,
      head: [["Indicateur", "Montant (FCFA)"]],
      body: [
        ["Dépenses carburant", Math.round(data.coutCarburant).toLocaleString("fr-FR")],
        ["Dépenses maintenance", Math.round(data.coutReparations).toLocaleString("fr-FR")],
        ["Total exploitation", Math.round(data.coutTotalExploitation).toLocaleString("fr-FR")],
        ["Dotation totale véhicules", Math.round(data.dotationTotale || 0).toLocaleString("fr-FR")],
      ],
      theme: "grid",
      headStyles: { fillColor: [14, 165, 233], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    const afterSynth = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Performance par véhicule", 14, afterSynth);

    autoTable(doc, {
      startY: afterSynth + 4,
      head: [["Camion", "Chauffeur", "Km", "Carburant", "Maint.", "Total", "Conso L/100"]],
      body: (data.comparatifCamions || []).map((c: {
        immatriculation: string;
        chauffeurNom: string;
        kilometrage: number;
        carburant: number;
        reparation: number;
        coutTotal: number;
        consoMoyenne: number;
      }) => [
        c.immatriculation,
        c.chauffeurNom,
        c.kilometrage.toLocaleString("fr-FR"),
        Math.round(c.carburant).toLocaleString("fr-FR"),
        Math.round(c.reparation).toLocaleString("fr-FR"),
        Math.round(c.coutTotal).toLocaleString("fr-FR"),
        c.consoMoyenne ? `${c.consoMoyenne}` : "-",
      ]),
      theme: "striped",
      headStyles: { fillColor: [15, 23, 42], fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 2 },
    });

    const afterTable = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

    if (afterTable > 240 && (data.budgetParVehicule || []).length > 0) {
      doc.addPage();
    }

    const budgetY = afterTable > 240 ? 20 : afterTable + 10;

    if ((data.budgetParVehicule || []).length > 0) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Suivi budgétaire véhicules", 14, budgetY);

      autoTable(doc, {
        startY: budgetY + 4,
        head: [["Véhicule", "Dotation", "Consommé (budget)", "Taux"]],
        body: data.budgetParVehicule.map((b: {
          immatriculation: string;
          dotation: number;
          consomme: number;
        }) => [
          b.immatriculation,
          Math.round(b.dotation).toLocaleString("fr-FR"),
          Math.round(b.consomme).toLocaleString("fr-FR"),
          b.dotation > 0
            ? `${Math.round((b.consomme / b.dotation) * 100)}%`
            : "-",
        ]),
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241], fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2 },
      });
    }

    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      "Document généré automatiquement par FleetGuardian — Données indicatives d'exploitation.",
      14,
      290
    );

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Rapport_Flotte_${annee}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/rapports/pdf:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du PDF" },
      { status: 500 }
    );
  }
}
