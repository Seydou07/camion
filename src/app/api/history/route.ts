import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET history logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");

    const logs = await prisma.historyLog.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit ? parseInt(limit) : 100,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Erreur GET /api/history:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'historique" },
      { status: 500 }
    );
  }
}

// POST history log (internal use)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, entity, entityId, details, userId } = body;

    const log = await prisma.historyLog.create({
      data: {
        action,
        entity,
        entityId,
        details,
        userId,
      },
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error("Erreur POST /api/history:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du log" },
      { status: 500 }
    );
  }
}