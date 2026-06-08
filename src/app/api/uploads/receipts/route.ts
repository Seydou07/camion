import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const upload = formData.get("file");

    if (!upload || typeof (upload as any).arrayBuffer !== "function") {
      return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
    }

    const file = upload as File;
    const supportedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!supportedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Format de fichier non pris en charge" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "receipts");
    await fs.mkdir(uploadsDir, { recursive: true });

    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filePath = path.join(uploadsDir, safeName);
    const buffer = Buffer.from(await file.arrayBuffer());

    await fs.writeFile(filePath, buffer);

    return NextResponse.json({
      url: `/uploads/receipts/${safeName}`,
      fileName: file.name,
      mimeType: file.type,
      size: buffer.byteLength,
    });
  } catch (error) {
    console.error("Erreur POST /api/uploads/receipts:", error);
    return NextResponse.json(
      { error: "Erreur lors du téléversement du reçu" },
      { status: 500 }
    );
  }
}
