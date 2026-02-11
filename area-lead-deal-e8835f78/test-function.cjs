
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://zbztgavixjazldcuwdwq.supabase.co";
// From .env
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpienRnYXZpeGphemxkY3V3ZHdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNjYyNTcsImV4cCI6MjA4NTk0MjI1N30.5u5H2hlZnULI0Ph_1yno3PpYdIQ1ZPsAg4aPQzYmig0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFunction() {
    console.log("Testing verify-lead-content...");
    const { data, error } = await supabase.functions.invoke('verify-lead-content', {
        body: {
            description: "Test description for plumbing",
            category: "Plumbing",
            location: "Test Location",
            price: 100
        }
    });

    if (error) {
        console.error("Function Error:", error);
    } else {
        console.log("Function Success:", data);
    }
}

testFunction();
