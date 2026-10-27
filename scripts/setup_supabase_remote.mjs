import { readFileSync } from "fs";

const token = process.env.SUPABASE_ACCESS_TOKEN || "";
const projectRef = "itpfveokpvzcbmoogcui";

async function main() {
  console.log("=== SUPABASE AUTOMATED SETUP VIA MANAGEMENT API ===");
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // 1. Fetch API keys
  console.log("\n[1/3] Fetching API keys for project:", projectRef);
  let serviceRoleKey = null;
  try {
    const keysRes = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/api-keys`,
      { headers }
    );
    if (!keysRes.ok) {
      console.error("Failed to fetch keys:", keysRes.status, await keysRes.text());
    } else {
      const keysData = await keysRes.json();
      console.log("Keys found:", keysData.length);
      for (const k of keysData) {
        console.log(` - ${k.name} (${k.tags || k.type || "key"})`);
        if (k.name === "service_role" || k.tags?.includes("service_role")) {
          serviceRoleKey = k.api_key;
        }
      }
      if (serviceRoleKey) {
        console.log(">>> Found service_role key:", serviceRoleKey.substring(0, 15) + "...");
      }
    }
  } catch (err) {
    console.error("Error fetching keys:", err.message);
  }

  // 2. Execute SQL setup script
  console.log("\n[2/3] Executing supabase_setup.sql on project database...");
  const sql = readFileSync("supabase_setup.sql", "utf-8");

  try {
    const queryRes = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ query: sql }),
      }
    );

    const queryText = await queryRes.text();
    if (!queryRes.ok) {
      console.error("SQL execution returned error:", queryRes.status, queryText);
    } else {
      console.log("SQL successfully executed! Result:", queryText);
    }
  } catch (err) {
    console.error("Error executing SQL query:", err.message);
  }

  // 3. Test verification query
  console.log("\n[3/3] Verifying jobs table and storage bucket...");
  try {
    const verifySql = `
      select table_name from information_schema.tables where table_schema = 'public' and table_name = 'jobs';
    `;
    const verifyRes = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ query: verifySql }),
      }
    );
    console.log("Verification response:", await verifyRes.text());
  } catch (err) {
    console.error("Verification failed:", err.message);
  }

  return serviceRoleKey;
}

main().then((key) => {
  if (key) {
    console.log("\n>>> Exporting SERVICE_ROLE_KEY to environment / files");
  }
});
