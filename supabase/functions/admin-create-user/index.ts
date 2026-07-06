import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    // Admin client — SUPABASE_SERVICE_ROLE_KEY is auto-injected by Supabase
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // 1. Verify caller token
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return Response.json({ error: "Sin autorización" }, { status: 401, headers: CORS });
    }

    const { data: { user: caller }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !caller) {
      return Response.json({ error: "Token inválido" }, { status: 401, headers: CORS });
    }

    // 2. Verify caller is admin
    const { data: callerRoles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    const isAdmin = (callerRoles ?? []).some(
      (r: { role: string }) => r.role === "admin",
    );
    if (!isAdmin) {
      return Response.json(
        { error: "Acceso denegado: se requiere rol admin" },
        { status: 403, headers: CORS },
      );
    }

    // 3. Parse and validate body
    const { email, name, role, password } = await req.json() as {
      email: string;
      name?: string;
      role: string;
      password: string;
    };

    if (!email?.trim() || !role || !password) {
      return Response.json(
        { error: "email, role y password son requeridos" },
        { status: 400, headers: CORS },
      );
    }

    // 4. Create auth user
    // The on_auth_user_created trigger will auto-create profile + assign 'cliente' role
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: { name: name?.trim() || email.trim() },
    });
    if (createErr) {
      return Response.json({ error: createErr.message }, { status: 400, headers: CORS });
    }

    const uid = created.user.id;

    // 5. Update profile name if provided
    if (name?.trim()) {
      await admin.from("profiles").update({ name: name.trim() }).eq("id", uid);
    }

    // 6. Fix role — trigger assigns 'cliente' by default; override if different
    if (role !== "cliente") {
      await admin.from("user_roles").delete().eq("user_id", uid);
      await admin.from("user_roles").insert({ user_id: uid, role });
    }

    return Response.json({ ok: true, userId: uid }, { headers: CORS });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error inesperado";
    console.error("[admin-create-user]", msg);
    return Response.json({ error: msg }, { status: 500, headers: CORS });
  }
});
