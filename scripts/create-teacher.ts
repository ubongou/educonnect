import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import type { Database } from "../src/types/db";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
}

const email = process.argv[2] ?? "teacher.demo@joineduconnect.com";
const fullName = process.argv[3] ?? "Demo Teacher";
const password =
  process.argv[4] ??
  randomBytes(9).toString("base64").replace(/[^a-zA-Z0-9]/g, "") + "A1!";

const admin = createClient<Database>(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: created, error: createErr } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName },
});
if (createErr || !created.user) {
  console.error("createUser failed:", createErr?.message);
  process.exit(1);
}

const { error: roleErr } = await admin
  .from("profiles")
  .update({ role: "teacher", full_name: fullName })
  .eq("id", created.user.id);
if (roleErr) {
  await admin.auth.admin.deleteUser(created.user.id).catch(() => undefined);
  console.error("profile update failed:", roleErr.message);
  process.exit(1);
}

console.log("\n  ✔ Teacher account created");
console.log("  ─────────────────────────────");
console.log(`  Email:    ${email}`);
console.log(`  Password: ${password}`);
console.log(`  Name:     ${fullName}`);
console.log("  ─────────────────────────────");
console.log("  Login at: http://localhost:3000/login\n");
