# Fostern - Backup simples via Supabase REST (gratis, sem pg_dump)
# Uso:  powershell -ExecutionPolicy Bypass -File scripts/backup.ps1
# Vai pedir a SERVICE_ROLE key (Supabase -> Settings -> API Keys -> service_role)
# Salva um snapshot de todas as tabelas em backups/<data-hora>/

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $root ".env.local"

$url = $null
$key = $null
if (Test-Path $envPath) {
  Get-Content $envPath | ForEach-Object {
    if ($_ -match "^NEXT_PUBLIC_SUPABASE_URL=(.+)$") { $url = $matches[1].Trim() }
    if ($_ -match "^SUPABASE_SERVICE_ROLE_KEY=(.+)$") { $key = $matches[1].Trim() }
  }
}
if (-not $url) {
  $url = Read-Host "Project URL (https://xxxx.supabase.co)"
}
if (-not $key) {
  $key = (Read-Host "Cole a SERVICE_ROLE key (secret)").Trim()
}
if (-not $key) { Write-Error "Chave obrigatoria."; exit 1 }

$tables = @("perfis", "planos", "assinaturas", "pagamentos", "modulos", "aulas", "progresso_aulas", "mentorias", "documentos")

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$dir = Join-Path $root ("backups\" + $stamp)
New-Item -ItemType Directory -Path $dir -Force | Out-Null

$headers = @{ apikey = $key; Authorization = "Bearer $key" }

foreach ($table in $tables) {
  $out = Join-Path $dir "$table.json"
  try {
    $rows = Invoke-RestMethod -Uri "$url/rest/v1/$table`?select=*" -Headers $headers -Method Get
    if ($null -eq $rows) { $rows = @() }
    $rows | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $out -Encoding UTF8
    Write-Output "$table : $($rows.Count) registros"
  } catch {
    Write-Output "$table : FALHOU - $($_.Exception.Message)"
  }
}

Write-Output ""
Write-Output "Backup salvo em: $dir"
