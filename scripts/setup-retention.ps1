param([string]$ProjectPath = (Get-Location).Path)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$project = [System.IO.Path]::GetFullPath($ProjectPath)
$envPath = Join-Path $project '.env.local'
if (!(Test-Path -LiteralPath $envPath -PathType Leaf)) {
  throw 'Jalankan dari folder proyek Fivora yang memiliki .env.local.'
}
$projectUrl = $null
foreach ($line in [System.IO.File]::ReadAllLines($envPath)) {
  if ($line -match '^\s*NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*?)\s*$') {
    $projectUrl = $Matches[1].Trim().Trim([char[]]@('"', "'"))
  }
}
if (!$projectUrl) { throw 'NEXT_PUBLIC_SUPABASE_URL tidak ditemukan di .env.local.' }
$url = [uri]$projectUrl
$referenceMatch = [regex]::Match($url.Host, '^([a-z0-9]{20})\.supabase\.co$')
if ($url.Scheme -ne 'https' -or !$referenceMatch.Success) {
  throw 'URL proyek Supabase tidak dikenali. Kirim pesannya, tanpa isi .env.local.'
}
$projectRef = $referenceMatch.Groups[1].Value
$folder = Join-Path $env:TEMP 'fivora-retention-setup'
[System.IO.Directory]::CreateDirectory($folder) | Out-Null
$tokenPath = Join-Path $folder ('token-' + $projectRef + '.txt')
# Memakai token yang sama pada pengulangan agar Vault dan Edge Function tetap cocok.
if (Test-Path -LiteralPath $tokenPath -PathType Leaf) {
  $token = [System.IO.File]::ReadAllText($tokenPath).Trim()
} else {
  $bytes = New-Object byte[] 32
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
  $token = [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
  [System.IO.File]::WriteAllText($tokenPath, $token, (New-Object System.Text.UTF8Encoding($false)))
}
if ($token -notmatch '^[A-Za-z0-9_-]{43}$') { throw 'Token pemasangan tidak valid.' }
$secretFile = Join-Path $folder ('secrets-' + [guid]::NewGuid().ToString('N') + '.env')
$activationFile = Join-Path $folder 'activate-retention.sql'
$encoding = New-Object System.Text.UTF8Encoding($false)
try {
  [System.IO.File]::WriteAllText($secretFile, "FIVORA_RETENTION_TOKEN=$token`n", $encoding)
  Push-Location $project
  try {
    & npx --yes supabase secrets set --env-file $secretFile --project-ref $projectRef
    if ($LASTEXITCODE -ne 0) { throw 'Gagal memasang secret. Jalankan npx supabase login terlebih dahulu.' }
    & npx --yes supabase functions deploy cleanup-retention --project-ref $projectRef --no-verify-jwt --use-api
    if ($LASTEXITCODE -ne 0) { throw 'Deploy cleanup-retention gagal. Belum membuat jadwal penghapusan.' }
  } finally { Pop-Location }

  # Hanya membaca jumlah data. Pemeriksaan ini tidak menghapus apa pun.
  $endpoint = 'https://' + $projectRef + '.supabase.co/functions/v1/cleanup-retention'
  $preview = Invoke-RestMethod -Method Post -Uri $endpoint -ContentType 'application/json' `
    -Headers @{ 'x-fivora-retention-token' = $token } -Body '{"dry_run":true}' -TimeoutSec 60
  if ($preview.dry_run -ne $true) { throw 'Pemeriksaan worker tidak mengembalikan dry_run.' }
  $template = [System.IO.File]::ReadAllText((Join-Path $project 'supabase/retention/activate-retention.template.sql'))
  $activation = $template.Replace('__FIVORA_ENDPOINT__', $endpoint).Replace('__FIVORA_TOKEN__', $token)
  [System.IO.File]::WriteAllText($activationFile, $activation, $encoding)
  Write-Host 'Worker berhasil dipasang dan diperiksa tanpa menghapus data.'
  Write-Host "Laporan yang sudah kedaluwarsa: $($preview.reports_due)"
  Write-Host "Reservasi yang sudah kedaluwarsa: $($preview.reservations_due)"
  Write-Host "Foto dalam antrean: $($preview.photos_waiting)"
  Write-Host "Laporan lama dengan perbaikan terbuka: $($preview.blocked_open_maintenance)"
  Write-Host "Buka file ini, salin seluruh isinya ke Supabase SQL Editor, lalu Run: $activationFile"
  Write-Host 'Nama query: Aktifkan Retensi Data 3 Bulan. File berisi token; jangan commit atau kirim isinya ke chat.'
  Start-Process notepad.exe -ArgumentList ('"' + $activationFile + '"')
} finally {
  if (Test-Path -LiteralPath $secretFile) { Remove-Item -LiteralPath $secretFile -Force }
}
