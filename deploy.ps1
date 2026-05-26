# PSS-NICU V5 — deploy.ps1
# Usage:
#   .\deploy.ps1                              # deploy as-is
#   .\deploy.ps1 -Kcmh "https://...exec"     # update KCMH GAS URL + deploy
#   .\deploy.ps1 -Spr  "https://...exec"     # update SPR GAS URL + deploy
#   .\deploy.ps1 -Kcmh "url1" -Spr "url2"   # update both + deploy
#   .\deploy.ps1 -Kcmh "url1" -m "fix: xyz" # custom message

param(
    [string]$Kcmh = "",
    [string]$Spr  = "",
    [string]$m    = ""
)

$root      = "C:\Users\USER\Desktop\pss-nicu"
$kcmhFile  = "$root\index.html"
$sprFile   = "$root\index_spr.html"

# --- show current URLs ---
$curK = (Select-String -Path $kcmhFile -Pattern "PSS_API_URL\s*=\s*'([^']+)'").Matches[0].Groups[1].Value
$curS = (Select-String -Path $sprFile  -Pattern "PSS_API_URL\s*=\s*'([^']+)'").Matches[0].Groups[1].Value
Write-Host "KCMH: $curK"
Write-Host "SPR : $curS"

# --- update KCMH ---
if ($Kcmh) {
    $c = Get-Content $kcmhFile -Raw
    $c = $c -replace "(window\.PSS_API_URL\s*=\s*')[^']*", "`${1}$Kcmh"
    Set-Content $kcmhFile $c -NoNewline
    Write-Host "[OK] KCMH PSS_API_URL → $Kcmh"
}

# --- update SPR ---
if ($Spr) {
    $c = Get-Content $sprFile -Raw
    $c = $c -replace "(window\.PSS_API_URL\s*=\s*')[^']*", "`${1}$Spr"
    Set-Content $sprFile $c -NoNewline
    Write-Host "[OK] SPR  PSS_API_URL → $Spr"
}

# --- git ---
$changed = @()
if ($Kcmh -or (git -C $root diff --name-only -- index.html))     { $changed += "index.html" }
if ($Spr  -or (git -C $root diff --name-only -- index_spr.html)) { $changed += "index_spr.html" }
if (-not $changed) { Write-Host "[INFO] No changes to commit"; exit 0 }

$who = @()
if ($Kcmh) { $who += "KCMH" }
if ($Spr)  { $who += "SPR" }
$msg = if ($m) { $m } elseif ($who) { "deploy: update GAS URL ($($who -join '+'))" } else { "deploy: sync" }

git -C $root add $changed
git -C $root diff --cached --stat
git -C $root commit -m $msg
git -C $root push
Write-Host "[DONE] Pushed → valhalla-health/pss-nicu"
