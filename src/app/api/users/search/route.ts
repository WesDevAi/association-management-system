import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { searchUsersForLinking } from "@/server/services/user-service";

export async function GET(request: NextRequest) {
  try {
    const context = await requirePermission(PERMISSIONS.MEMBERS_MANAGE);
    const associationId = context.membership.associationId;

    const q = request.nextUrl.searchParams.get("q") ?? "";
    const users = await searchUsersForLinking(associationId, q);

    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
