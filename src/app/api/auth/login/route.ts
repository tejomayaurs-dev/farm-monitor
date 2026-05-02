import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createJSClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  let username = "";
  let password = "";
  try {
    const body = await request.json();
    username = body.email || "";
    password = body.password || "";

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    // Format username to dummy email if it doesn't already look like an email
    const email = username.includes("@") 
      ? username.toLowerCase() 
      : `${username.toLowerCase()}@farm.local`;
    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      // In demo mode gracefully mock a success if Supabase lookup fails/timeouts
      if (process.env.NEXT_PUBLIC_AUTH_MODE === "demo") {
        return NextResponse.json({
          success: true,
          profile: {
            id: `demo-${username}`,
            role: username.toLowerCase() === "admin" ? "admin" : "user",
            full_name: `Demo ${username}`,
          },
        });
      }
      throw new Error(authError?.message || "Invalid credentials");
    }

    // Fetch user profile from profiles table
    // Must use manual JS client since Next.js cookie boundary doesn't expose the set cookie immediately
    const manualClient = createJSClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${authData.session?.access_token}` },
        },
      }
    );

    const { data: profile, error: profileErr } = await manualClient
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    let userProfile = profile;
    if (profileErr || !profile) {
      console.log("Profile missing, creating default profile for user:", authData.user.id);
      const { data: newProfile, error: createErr } = await manualClient
        .from("profiles")
        .insert({
          id: authData.user.id,
          role: "user",
          full_name: authData.user.user_metadata?.full_name || username.split("@")[0],
        })
        .select()
        .single();
      
      if (!createErr) {
        userProfile = newProfile;
      } else {
        console.error("Failed to auto-create profile:", createErr.message);
      }
    }

    return NextResponse.json({ success: true, profile: userProfile || authData.user });
  } catch (e: any) {
    if (process.env.NEXT_PUBLIC_AUTH_MODE === "demo" && username) {
      return NextResponse.json({
        success: true,
        profile: {
          id: `demo-${username}`,
          role: username.toLowerCase() === "admin" ? "admin" : "user",
          full_name: `Demo ${username}`,
        },
      });
    }
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
