import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logHistory, checkRole } from "@/lib/history";

// GET user by id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error("Erreur GET /api/users/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'utilisateur" },
      { status: 500 }
    );
  }
}

// PUT update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { authorized } = await checkRole();
    if (!authorized) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    const updateData: any = { name, email, role };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    await logHistory("update", "user", user.id, `Modification de l'utilisateur ${name}`);

    return NextResponse.json(user);
  } catch (error) {
    console.error("Erreur PUT /api/users/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification de l'utilisateur" },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { authorized, role } = await checkRole("admin");
    if (!authorized) {
      return NextResponse.json(
        { error: "Seul un administrateur peut supprimer des utilisateurs" },
        { status: 403 }
      );
    }

    const userToDelete = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    await logHistory("delete", "user", parseInt(id), `Suppression de l'utilisateur ${userToDelete?.name}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/users/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'utilisateur" },
      { status: 500 }
    );
  }
}