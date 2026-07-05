#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const fixPath = join(__dirname, "..", "supabase", "fix-permissions.sql");
  const sql = readFileSync(fixPath, "utf-8");

  console.log("Running fix-permissions.sql...");
  
  const statements = sql
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith("--"));

  let success = 0;
  let failed = 0;

  for (const stmt of statements) {
    try {
      const { error } = await supabase.rpc("exec_sql", { sql: stmt + ";" });
      if (error) {
        // Try direct REST API approach
        const resp = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": serviceRoleKey,
            "Authorization": `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ query: stmt + ";" }),
        });
        if (!resp.ok) {
          const text = await resp.text();
          console.warn(`  ⚠ Statement failed: ${text.slice(0, 200)}`);
          failed++;
        } else {
          console.log(`  ✓ ${stmt.slice(0, 80)}...`);
          success++;
        }
      } else {
        console.log(`  ✓ ${stmt.slice(0, 80)}...`);
        success++;
      }
    } catch (err) {
      console.warn(`  ⚠ ${(err as Error).message.slice(0, 200)}`);
      failed++;
    }
  }

  console.log(`\nDone. ${success} succeeded, ${failed} failed.`);

  if (failed > 0) {
    console.log("\n⚠  Some statements failed. You may need to run fix-permissions.sql manually in the Supabase SQL Editor.");
    console.log("   Go to: https://supabase.com/dashboard/project/seklpfkhpvmwrtfmisjf/sql/new");
    console.log("   Copy the contents of supabase/fix-permissions.sql and paste it there.");
  }
}

main().catch(console.error);
