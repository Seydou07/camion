import { prisma } from "./prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";

export async function logHistory(
  action: "create" | "update" | "delete",
  entity: string,
  entityId?: number,
  details?: string
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? parseInt(session.user.id as string) : null;

    await prisma.historyLog.create({
      data: {
        action,
        entity,
        entityId,
        details,
        userId,
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'historisation :", error);
  }
}

export async function checkRole(requiredRole: "admin" | "gestionnaire" = "gestionnaire") {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { authorized: false, user: null };
  }

  const userRole = (session.user as any).role;
  const authorized = requiredRole === "gestionnaire" ? true : userRole === "admin";

  return { authorized, user: session.user, role: userRole };
}