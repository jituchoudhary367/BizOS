/**
 * BizOS — Combined Migration Runner
 * Pushes the complete schema to Supabase via REST API
 */
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://wjdyyiuanbptcubetrdu.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqZHl5aXVhbmJwdGN1YmV0cmR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQyMDkzOCwiZXhwIjoyMDk0OTk2OTM4fQ.3So43hsXp2MW6NPJSoFfDmZTGKgLBvgRJFmEkbLOyeE';

async function runSQL(sql, label) {
  console.log(`\n⏳ Running: ${label}...`);
  const startTime = Date.now();
  
  try {
    // Use the Supabase Management API / SQL endpoint via pg-meta
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({})
    });
    
    // If the RPC approach doesn't work, try the SQL endpoint directly
    // Supabase exposes a raw SQL execution endpoint for service role
  } catch (e) {
    // Ignore RPC errors, try direct approach
  }

  // Try using the pg-meta SQL endpoint
  try {
    const response = await fetch(`${SUPABASE_URL}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (response.ok) {
      const elapsed = Date.now() - startTime;
      console.log(`✅ ${label} (${elapsed}ms)`);
      return true;
    }
    
    const text = await response.text();
    console.log(`   Response status: ${response.status}`);
    
    // If 404, this endpoint isn't available; we'll guide the user
    if (response.status === 404) {
      return 'not_available';
    }
    
    console.log(`   Response: ${text.substring(0, 200)}`);
    return false;
  } catch (error) {
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function splitAndRun(sql) {
  // Split SQL into individual statement blocks at section boundaries
  const blocks = [];
  let current = '';
  
  for (const line of sql.split('\n')) {
    if (line.startsWith('-- ═══') && current.trim()) {
      blocks.push(current.trim());
      current = '';
    }
    current += line + '\n';
  }
  if (current.trim()) blocks.push(current.trim());
  
  return blocks;
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  BizOS — Supabase Migration Runner');
  console.log('═══════════════════════════════════════════════════');
  console.log(`Target: ${SUPABASE_URL}`);
  
  const sqlFile = path.join(__dirname, 'supabase', 'migrations', 'combined_migration.sql');
  
  if (!fs.existsSync(sqlFile)) {
    console.error('❌ combined_migration.sql not found');
    process.exit(1);
  }
  
  const fullSQL = fs.readFileSync(sqlFile, 'utf-8');
  console.log(`\n📄 Loaded SQL: ${fullSQL.length} bytes`);
  
  // Try running the full SQL
  const result = await runSQL(fullSQL, 'Combined Migration');
  
  if (result === 'not_available') {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║  ⚠️  Direct SQL execution not available via REST API          ║
║                                                                ║
║  Please run the migration manually:                            ║
║                                                                ║
║  1. Go to: https://supabase.com/dashboard/project/             ║
║     wjdyyiuanbptcubetrdu/sql/new                               ║
║                                                                ║
║  2. Open: supabase/migrations/combined_migration.sql           ║
║                                                                ║
║  3. Copy ALL the SQL content                                   ║
║                                                                ║
║  4. Paste into the SQL Editor and click "Run"                  ║
║                                                                ║
║  The migration creates: 22 tables, 60+ RLS policies,          ║
║  6 trigger functions, 2 storage buckets, and enables           ║
║  realtime on 13 tables.                                        ║
╚════════════════════════════════════════════════════════════════╝
`);
  } else if (result) {
    console.log('\n🎉 Migration complete!');
    
    // Verify by listing tables
    try {
      const verify = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        }
      });
      if (verify.ok) {
        const data = await verify.json();
        console.log(`\n📊 Tables available via API: ${JSON.stringify(data).substring(0, 300)}...`);
      }
    } catch (e) {
      console.log('Could not verify tables:', e.message);
    }
  } else {
    console.log('\n⚠️  Migration may have partially failed. Check Supabase dashboard.');
  }
}

main().catch(console.error);
