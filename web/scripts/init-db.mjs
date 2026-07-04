#!/usr/bin/env node

/**
 * Database initialization script.
 * Reads the SQL schema and executes it against the Supabase project.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/init-db.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("Initializing database...");

  const schemaPath = join(__dirname, "..", "supabase", "schema.sql");
  const sql = readFileSync(schemaPath, "utf-8");

  // Split into individual statements
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  let successCount = 0;
  let errorCount = 0;

  for (const stmt of statements) {
    try {
      // Use the management API — Supabase SQL endpoint
      const { error } = await supabase.rpc("exec_sql", {
        sql: stmt + ";",
      });

      if (error) {
        // Some statements may fail (e.g., "if not exists" variants), log but continue
        console.warn(`  ⚠ ${error.message.slice(0, 100)}`);
        errorCount++;
      } else {
        successCount++;
      }
    } catch (err) {
      console.warn(`  ⚠ ${(err as Error).message.slice(0, 100)}`);
      errorCount++;
    }
  }

  console.log(`\nDone. ${successCount} statements executed, ${errorCount} warnings.`);

  if (process.env.ADMIN_EMAIL) {
    console.log(`\nAdmin email configured: ${process.env.ADMIN_EMAIL}`);
    console.log("After a user signs up with this email, run:");
    console.log(`  UPDATE public.profiles SET role = 'admin' WHERE email = '${process.env.ADMIN_EMAIL}';`);
  }
}

main().catch(console.error);
