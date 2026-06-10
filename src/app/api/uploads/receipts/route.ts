import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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

    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const buffer = await file.arrayBuffer();

    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from("receipts")
      .upload(safeName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Erreur Supabase Storage:", error);
      throw error;
    }

    // Récupérer l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from("receipts")
      .getPublicUrl(safeName);

    return NextResponse.json({
      url: publicUrl,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error("Erreur POST /api/uploads/receipts:", error);
    return NextResponse.json(
      { error: "Erreur lors du téléversement du reçu" },
      { status: 500 }
    );
  }
}
