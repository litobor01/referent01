$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:3000"
$articleUrl = "https://en.wikipedia.org/wiki/Artificial_intelligence"

function Invoke-Api {
  param(
    [string]$Path,
    [object]$Body
  )

  $json = $Body | ConvertTo-Json -Depth 6
  return Invoke-RestMethod -Uri "$baseUrl$Path" -Method POST -Body $json -ContentType "application/json" -TimeoutSec 180
}

Write-Host "Step 6: API verification"

Write-Host "[1/7] Home page..."
$homeStatus = (Invoke-WebRequest -Uri $baseUrl -UseBasicParsing).StatusCode
if ($homeStatus -ne 200) { throw "Home page returned $homeStatus" }
Write-Host "OK: GET / -> 200"

Write-Host "[2/7] Error: empty URL..."
try {
  Invoke-Api -Path "/api/process" -Body @{ url = ""; action = "summary" }
  throw "Expected error for empty URL"
} catch {
  Write-Host "OK: empty URL rejected"
}

Write-Host "[3/7] Error: invalid URL..."
try {
  Invoke-Api -Path "/api/process" -Body @{ url = "not-a-url"; action = "summary" }
  throw "Expected error for invalid URL"
} catch {
  Write-Host "OK: invalid URL rejected"
}

Write-Host "[4/7] Parse article..."
$parsed = Invoke-Api -Path "/api/parse" -Body @{ url = $articleUrl }
if (-not $parsed.title -or -not $parsed.content) { throw "Parse did not return title/content" }
Write-Host "OK: parse -> title length=$($parsed.title.Length), content=$($parsed.content.Length) chars"

Write-Host "[5/7] Summary..."
$summary = Invoke-Api -Path "/api/process" -Body @{ url = $articleUrl; action = "summary" }
if (-not $summary.result) { throw "summary returned empty result" }
Write-Host "OK: summary length=$($summary.result.Length)"

Write-Host "[6/7] Theses with cached article..."
$theses = Invoke-Api -Path "/api/process" -Body @{
  url = $articleUrl
  action = "theses"
  article = $summary.article
}
if ($theses.result -notmatch "1\.|^- ") { throw "theses does not look like a list" }
Write-Host "OK: theses length=$($theses.result.Length)"

Write-Host "[7/7] Telegram post with cached article..."
$telegram = Invoke-Api -Path "/api/process" -Body @{
  url = $articleUrl
  action = "telegram"
  article = $summary.article
}
if ($telegram.result -notmatch $articleUrl) { throw "telegram does not contain source URL" }
Write-Host "OK: telegram length=$($telegram.result.Length)"

Write-Host ""
Write-Host "All step 6 checks passed."
