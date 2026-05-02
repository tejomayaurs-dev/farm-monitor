import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json();
    if (!phone || !otp) return NextResponse.json({ error: "Phone and OTP required" }, { status: 400 });

    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user!.id)
      .single();

    return NextResponse.json({ success: true, profile });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
