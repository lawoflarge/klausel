import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyTimedToken } from "@/lib/auth/tokens";
import { deleteUserData } from "@/lib/orders/delete-user-data";

const Body = z.object({
  email: z.string().email(),
  token: z.string().min(10).max(200),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { email, token } = parsed.data;

  if (!verifyTimedToken(email, token, "DELETE_TOKEN_SECRET")) {
    return NextResponse.json({ error: "invalid_or_expired_token" }, { status: 403 });
  }

  await deleteUserData(email);
  return NextResponse.json({ deleted: true });
}
