<#
  setup.ps1 - Soko la Mtandaoni
  Husakinisha kila kitu kinachohitajika (Node.js, maktaba za mradi) na kuanzisha mfumo.

  JINSI YA KUENDESHA:
  1. Bofya kulia juu ya faili hii -> "Run with PowerShell"
     (Ikiwa hilo halionekani, fungua PowerShell kwenye folda hii kisha andika: .\setup.ps1 )
  2. Ikiwa utaona ujumbe kuhusu "execution policy", fungua PowerShell KAMA ADMIN na andika
     hii mara moja tu, kisha ujaribu tena:
         Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
#>

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

function Write-Step {
    param([string]$msg)
    Write-Host ""
    Write-Host ("==> " + $msg) -ForegroundColor Cyan
}

Write-Host "================================================" -ForegroundColor DarkGray
Write-Host "  SOKO LA MTANDAONI - Usakinishaji wa Mfumo" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor DarkGray

# ---------- 1. Angalia / Sakinisha Node.js ----------
Write-Step "Inaangalia kama Node.js ipo..."
$node = Get-Command node -ErrorAction SilentlyContinue

if (-not $node) {
    Write-Host "Node.js haijasakinishwa." -ForegroundColor Yellow
    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if ($winget) {
        Write-Step "Inasakinisha Node.js LTS kupitia winget, subiri (hii inaweza kuchukua dakika chache)"
        winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
        Write-Host ""
        Write-Host "Node.js imesakinishwa. TAFADHALI FUNGA DIRISHA HILI, FUNGUA UPYA POWERSHELL," -ForegroundColor Green
        Write-Host "kisha uendeshe tena setup.ps1 ili mabadiliko yaonekane." -ForegroundColor Green
        Read-Host "Bonyeza Enter kufunga"
        exit
    } else {
        Write-Host "Sijaweza kusakinisha Node.js kiotomatiki (winget haipo kwenye kompyuta hii)." -ForegroundColor Red
        Write-Host "Tafadhali sakinisha mwenyewe kutoka: https://nodejs.org (chagua toleo la LTS)" -ForegroundColor Red
        Write-Host "Baada ya kusakinisha, fungua PowerShell upya kisha uendeshe setup.ps1 tena." -ForegroundColor Red
        Read-Host "Bonyeza Enter kufunga"
        exit 1
    }
} else {
    $v = node -v
    Write-Host ("Node.js ipo: " + $v) -ForegroundColor Green
}

# ---------- 2. Tengeneza .env kama haipo ----------
Write-Step "Inaangalia faili ya .env ..."
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Faili ya .env imetengenezwa kutoka .env.example." -ForegroundColor Green
    Write-Host "MUHIMU: Baadaye, fungua .env kwa Notepad ubadilishe ADMIN_EMAIL, ADMIN_PASSWORD," -ForegroundColor Yellow
    Write-Host "na SESSION_SECRET kabla ya kuweka tovuti kuwa live." -ForegroundColor Yellow
} else {
    Write-Host ".env tayari ipo, haitabadilishwa." -ForegroundColor Green
}

# ---------- 3. Sakinisha maktaba (npm install) ----------
Write-Step "Inasakinisha maktaba za mradi (npm install)..."
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Usakinishaji wa maktaba umeshindwa. Angalia ujumbe wa hitilafu hapo juu." -ForegroundColor Red
    Read-Host "Bonyeza Enter kufunga"
    exit 1
}

# ---------- 4. Tengeneza Database + Admin (mara ya kwanza tu) ----------
Write-Step "Inaandaa database na akaunti ya Admin (ikiwa bado haipo)..."
npm run seed

# ---------- 5. Anzisha Mfumo ----------
Write-Step "Kila kitu kiko tayari. Inaanzisha Soko la Mtandaoni..."
Write-Host ""
Write-Host "Tovuti itapatikana kwenye: http://localhost:3000" -ForegroundColor Green
Write-Host "Paneli ya Admin:          http://localhost:3000/admin/ingia" -ForegroundColor Green
Write-Host ""
Write-Host "Bonyeza CTRL+C kusimamisha mfumo wakati wowote." -ForegroundColor DarkGray
Write-Host ""

npm start
