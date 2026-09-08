import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/session";
import { getRecentNotifications, getUnreadCount } from "@/server/services/notification-service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const associationId = request.nextUrl.searchParams.get("associationId") ?? undefined;

    const [notifications, unreadCount] = await Promise.all([
      getRecentNotifications(user.id, 5),
      getUnreadCount(user.id, associationId ?? undefined),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch {
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }
}
