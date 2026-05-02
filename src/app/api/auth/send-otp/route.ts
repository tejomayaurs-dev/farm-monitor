import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();
    if (!phone) return NextResponse.json({ error: "Phone required" }, { status: 400 });

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({ phone });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
