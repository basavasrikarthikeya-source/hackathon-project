import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in environment");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadMock() {
  try {
    const fileData = readFileSync("public/mock/marked_sample.png");
    console.log("Uploading public/mock/marked_sample.png to Supabase Storage images bucket using service role key...");
    const { data, error } = await supabase.storage
      .from("images")
      .upload("mock/marked_sample.png", fileData, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) {
      console.log("Supabase storage response:", error.message);
    } else {
      console.log("SUCCESS! Uploaded marked sample to Supabase Storage:", data.path);
      const { data: pubUrl } = supabase.storage
        .from("images")
        .getPublicUrl("mock/marked_sample.png");
      console.log("Public URL:", pubUrl.publicUrl);
    }
  } catch (err) {
    console.error("Failed:", err);
  }
}

uploadMock();
