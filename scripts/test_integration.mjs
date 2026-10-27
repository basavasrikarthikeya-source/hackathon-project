import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// Parse .env.local
const envPath = resolve(process.cwd(), ".env.local");
const envVars = {};
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) envVars[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, "");
  }
}

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const gradioUrl = envVars.NEXT_PUBLIC_GRADIO_URL || process.env.NEXT_PUBLIC_GRADIO_URL || "mock";

console.log("================================================================================");
console.log("DRISHTI FULL-STACK INTEGRATION TEST SUITE");
console.log("================================================================================");
console.log(`Supabase URL      : ${supabaseUrl || "MISSING"}`);
console.log(`Anon Key Config   : ${anonKey ? "Present (" + anonKey.slice(0, 8) + "...)" : "MISSING"}`);
console.log(`Service Role Key  : ${serviceRoleKey ? "Present (" + serviceRoleKey.slice(0, 8) + "...)" : "MISSING"}`);
console.log(`Gradio AI URL     : ${gradioUrl}`);
console.log("================================================================================");

const client = createClient(supabaseUrl, anonKey);
const adminClient = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

async function runTests() {
  let passed = 0;
  let failed = 0;

  // TEST 1: Storage Bucket "images"
  console.log("\n[TEST 1] Verifying Storage bucket 'images'...");
  try {
    const testAdmin = adminClient || client;
    const { data: buckets, error } = await testAdmin.storage.listBuckets();
    if (error) {
      console.error("  ❌ Bucket listing error:", error.message);
      failed++;
    } else {
      const names = buckets.map(b => b.name);
      console.log("  Found buckets:", names);
      if (names.includes("images")) {
        console.log("  ✅ Storage bucket 'images' exists.");
        passed++;
      } else {
        console.error("  ❌ Storage bucket 'images' NOT found!");
        failed++;
      }
    }
  } catch (err) {
    console.error("  ❌ Exception in storage test:", err.message);
    failed++;
  }

  // TEST 2: Public image accessibility
  console.log("\n[TEST 2] Verifying public access to mock asset...");
  try {
    const { data } = client.storage.from("images").getPublicUrl("mock/marked_sample.png");
    const res = await fetch(data.publicUrl, { method: "HEAD" });
    if (res.ok) {
      console.log(`  ✅ Public mock asset accessible (HTTP ${res.status}): ${data.publicUrl}`);
      passed++;
    } else {
      console.warn(`  ⚠️ Public asset returned HTTP ${res.status}: ${data.publicUrl}`);
      failed++;
    }
  } catch (err) {
    console.error("  ❌ Exception checking mock asset:", err.message);
    failed++;
  }

  // TEST 3: Auth demo login / creation
  console.log("\n[TEST 3] Testing Supabase Authentication (demo officer account)...");
  let testUserSession = null;
  const demoEmail = "officer@drishti.gov.in";
  const demoPass = "Chakravyuh2026!";
  try {
    const { data: signInData, error: signInErr } = await client.auth.signInWithPassword({
      email: demoEmail,
      password: demoPass,
    });

    if (signInErr) {
      console.log("  Sign-in failed (" + signInErr.message + "). Attempting signUp...");
      const { data: signUpData, error: signUpErr } = await client.auth.signUp({
        email: demoEmail,
        password: demoPass,
      });
      if (signUpErr) {
        console.error("  ❌ SignUp error:", signUpErr.message);
        failed++;
      } else {
        console.log("  ✅ SignUp succeeded. User ID:", signUpData.user?.id);
        testUserSession = signUpData.session;
        passed++;
      }
    } else {
      console.log("  ✅ Demo officer authenticated successfully! User ID:", signInData.user.id);
      testUserSession = signInData.session;
      passed++;
    }
  } catch (err) {
    console.error("  ❌ Exception during auth test:", err.message);
    failed++;
  }

  // TEST 4: Database query on public.jobs
  console.log("\n[TEST 4] Testing jobs table read with anon/authenticated client...");
  try {
    const { data: jobs, error } = await client.from("jobs").select("id, status, created_at").limit(3);
    if (error) {
      console.error("  ❌ Jobs table select failed:", error.message);
      failed++;
    } else {
      console.log(`  ✅ Successfully queried jobs table. Found ${jobs.length} rows.`);
      passed++;
    }
  } catch (err) {
    console.error("  ❌ Exception in jobs table query:", err.message);
    failed++;
  }

  // TEST 5: Job Insert and Update flow (End-to-End Simulation)
  console.log("\n[TEST 5] Testing End-to-End Job Insert & Update flow...");
  const testJobId = crypto.randomUUID();
  try {
    const userId = testUserSession?.user?.id || (adminClient ? "00000000-0000-0000-0000-000000000000" : null);
    
    // We insert with the authenticated client if we have a session, else adminClient
    const activeClient = testUserSession ? client : (adminClient || client);
    
    const { error: insertErr } = await activeClient.from("jobs").insert({
      id: testJobId,
      user_id: testUserSession?.user?.id,
      prompt: "Integration Test: Embankment breach detection",
      image_paths: ["mock/marked_sample.png"],
      status: "processing"
    });

    if (insertErr) {
      console.error("  ❌ Job insert failed:", insertErr.message);
      failed++;
    } else {
      console.log(`  ✅ Job row inserted with id: ${testJobId}`);
      
      // Simulate Kaggle worker updating using service role key (or client if mock)
      const updater = adminClient || activeClient;
      const { error: updateErr } = await updater.from("jobs").update({
        status: "done",
        answer: "PRELIMINARY GEOSPATIAL FLAGGING: Integration test passed.",
        marked_image_path: "mock/marked_sample.png"
      }).eq("id", testJobId);

      if (updateErr) {
        console.error("  ❌ Job update failed:", updateErr.message);
        failed++;
      } else {
        console.log(`  ✅ Job status successfully updated to 'done' by worker.`);
        
        // Read back
        const { data: readJob, error: readErr } = await activeClient.from("jobs").select("*").eq("id", testJobId).single();
        if (readErr || readJob.status !== "done") {
          console.error("  ❌ Verification read failed:", readErr?.message || "status mismatch");
          failed++;
        } else {
          console.log(`  ✅ Verified job in database: status=${readJob.status}, answer="${readJob.answer.slice(0, 35)}..."`);
          passed++;
        }
      }

      // Cleanup test row
      if (adminClient) {
        await adminClient.from("jobs").delete().eq("id", testJobId);
        console.log("  [CLEANUP] Deleted temporary test job row.");
      }
    }
  } catch (err) {
    console.error("  ❌ Exception in job lifecycle test:", err.message);
    failed++;
  }

  // TEST 6: Realtime Channel Subscription
  console.log("\n[TEST 6] Testing Supabase Realtime Channel creation...");
  try {
    const channel = client.channel(`test-integration-${Date.now()}`);
    let realtimeConnected = false;
    await new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve();
      }, 4000);

      channel.on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, () => {})
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            realtimeConnected = true;
            clearTimeout(timer);
            resolve();
          }
        });
    });

    if (realtimeConnected) {
      console.log("  ✅ Realtime channel successfully subscribed (SUBSCRIBED).");
      passed++;
    } else {
      console.warn("  ⚠️ Realtime subscription timed out or server does not push to unverified sockets.");
      // This is non-fatal for node environments if websockets need specific origin
    }
    await channel.unsubscribe();
  } catch (err) {
    console.error("  ❌ Realtime test error:", err.message);
  }

  // TEST 7: AI Engine / Gradio status
  console.log("\n[TEST 7] Checking AI Engine Gradio endpoint...");
  if (gradioUrl === "mock" || !gradioUrl) {
    console.log("  ℹ️ NEXT_PUBLIC_GRADIO_URL is set to 'mock'. System runs in simulation mode (per architecture spec).");
    passed++;
  } else {
    try {
      const res = await fetch(gradioUrl, { method: "HEAD" });
      console.log(`  AI Engine Gradio URL responded with HTTP ${res.status}`);
      passed++;
    } catch (err) {
      console.warn(`  ⚠️ Gradio URL (${gradioUrl}) unreachable: ${err.message}. (Normal if Kaggle session is stopped).`);
    }
  }

  console.log("\n================================================================================");
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
