$SUPABASE_URL = "https://wjdyyiuanbptcubetrdu.supabase.co"
$SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqZHl5aXVhbmJwdGN1YmV0cmR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQyMDkzOCwiZXhwIjoyMDk0OTk2OTM4fQ.3So43hsXp2MW6NPJSoFfDmZTGKgLBvgRJFmEkbLOyeE"

$headers = @{
    "apikey"        = $SERVICE_ROLE_KEY
    "Authorization" = "Bearer $SERVICE_ROLE_KEY"
    "Content-Type"  = "application/json"
    "Prefer"        = "return=minimal"
}

$migrationFiles = @(
    "001_auth_profiles.sql",
    "002_products.sql",
    "003_customers.sql",
    "004_orders.sql",
    "005_inventory.sql",
    "006_invoices.sql",
    "007_ledger.sql",
    "008_staff.sql",
    "009_collections.sql",
    "010_whatsapp_messages.sql",
    "011_ai_conversations.sql",
    "012_agent_logs.sql",
    "013_workflow_triggers.sql",
    "014_notifications.sql"
)

$baseDir = "c:\Users\Jitendra Chaudhary\OneDrive\Desktop\BizOS\supabase\migrations"

function Invoke-SupabaseSQL {
    param([string]$sql, [string]$label)
    
    $body = @{ query = $sql } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod `
            -Uri "$SUPABASE_URL/rest/v1/rpc/exec_sql" `
            -Method POST `
            -Headers $headers `
            -Body $body `
            -ErrorAction Stop
        Write-Host "✅ $label — OK" -ForegroundColor Green
        return $true
    } catch {
        # Try the SQL via Postgres REST (different endpoint)
        Write-Host "⚠️  $label — $($_.Exception.Message)" -ForegroundColor Yellow
        return $false
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  BizOS → Supabase Migration Runner" -ForegroundColor Cyan
Write-Host "  Project: wjdyyiuanbptcubetrdu" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

foreach ($file in $migrationFiles) {
    $path = Join-Path $baseDir $file
    if (Test-Path $path) {
        $sql = Get-Content $path -Raw
        Invoke-SupabaseSQL -sql $sql -label $file
    } else {
        Write-Host "❌ $file — not found" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Migration attempt complete." -ForegroundColor Cyan
