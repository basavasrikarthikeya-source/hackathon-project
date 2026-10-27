import { readFileSync, writeFileSync } from "fs";

const token = process.env.SUPABASE_ACCESS_TOKEN || "";
const projectRef = "itpfveokpvzcbmoogcui";

async function configureKeys() {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const keysRes = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/api-keys`,
    { headers }
  );
  const keysData = await keysRes.json();
  let serviceRoleKey = null;
  let anonKey = null;

  for (const k of keysData) {
    if (k.name === "service_role" || k.tags?.includes("service_role")) {
      serviceRoleKey = k.api_key;
    }
    if (k.name === "anon" || k.tags?.includes("anon")) {
      anonKey = k.api_key;
    }
  }

  console.log("Service role key found:", serviceRoleKey ? "YES" : "NO");
  console.log("Anon key found:", anonKey ? "YES" : "NO");

  if (!serviceRoleKey) return;

  // 1. Update .env.local
  let envContent = readFileSync(".env.local", "utf-8");
  if (!envContent.includes("SUPABASE_SERVICE_ROLE_KEY=")) {
    envContent += `\nSUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}\n`;
  } else {
    envContent = envContent.replace(
      /SUPABASE_SERVICE_ROLE_KEY=.*/,
      `SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}`
    );
  }
  writeFileSync(".env.local", envContent);
  console.log("Updated .env.local with SUPABASE_SERVICE_ROLE_KEY");

  // 2. Update backend/kaggle_worker.py
  let pyWorker = readFileSync("backend/kaggle_worker.py", "utf-8");
  pyWorker = pyWorker.replace(
    'SB_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "YOUR_SERVICE_ROLE_KEY_HERE")',
    `SB_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "${serviceRoleKey}")`
  );
  writeFileSync("backend/kaggle_worker.py", pyWorker);
  console.log("Updated backend/kaggle_worker.py with service_role key");

  // 3. Update backend/satquery_kaggle_worker.ipynb
  let nbContent = readFileSync("backend/satquery_kaggle_worker.ipynb", "utf-8");
  nbContent = nbContent.replace(
    'SB_KEY = "PASTE_YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE"',
    `SB_KEY = "${serviceRoleKey}"`
  );
  writeFileSync("backend/satquery_kaggle_worker.ipynb", nbContent);
  console.log("Updated backend/satquery_kaggle_worker.ipynb with service_role key");
}

configureKeys();
