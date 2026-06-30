$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:3000"
$articleUrl = "https://en.wikipedia.org/wiki/Artificial_intelligence"

function Invoke-ProcessStream {
  param(
    [object]$Body
  )

  $json = $Body | ConvertTo-Json -Depth 6
  $response = Invoke-WebRequest -Uri "$baseUrl/api/process" -Method POST -Body $json -ContentType "application/json" -TimeoutSec 180
  return $response.Content
}

Write-Host "Step 6: API verification"

Write-Host "[1/7] Home page..."
$homeStatus = (Invoke-WebRequest -Uri $baseUrl -UseBasicParsing).StatusCode
if ($homeStatus -ne 200) { throw "Home page returned $homeStatus" }
Write-Host "OK: GET / -> 200"

Write-Host "[2/7] Error: empty URL..."
try {
  Invoke-WebRequest -Uri "$baseUrl/api/process" -Method POST -Body (@{ url = ""; action = "summary" } | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 30 | Out-Null
  throw "Expected error for empty URL"
} catch {
  Write-Host "OK: empty URL rejected"
}

Write-Host "[3/7] Error: invalid URL..."
try {
  Invoke-WebRequest -Uri "$baseUrl/api/process" -Method POST -Body (@{ url = "not-a-url"; action = "summary" } | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 30 | Out-Null
  throw "Expected error for invalid URL"
} catch {
  Write-Host "OK: invalid URL rejected"
}

Write-Host "[4/7] Parse article..."
$parsed = Invoke-RestMethod -Uri "$baseUrl/api/parse" -Method POST -Body (@{ url = $articleUrl } | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 60
if (-not $parsed.title -or -not $parsed.content) { throw "Parse did not return title/content" }
Write-Host "OK: parse -> title length=$($parsed.title.Length), content=$($parsed.content.Length) chars"

Write-Host "[5/7] Summary..."
$summary = Invoke-ProcessStream -Body @{ url = $articleUrl; action = "summary" }
if (-not $summary) { throw "summary returned empty result" }
Write-Host "OK: summary length=$($summary.Length)"

Write-Host "[6/7] Theses with cached article..."
$theses = Invoke-ProcessStream -Body @{
  url = $articleUrl
  action = "theses"
  article = $parsed
}
if ($theses -notmatch "1\.|^- ") { throw "theses does not look like a list" }
Write-Host "OK: theses length=$($theses.Length)"

Write-Host "[7/7] Telegram post with cached article..."
$telegram = Invoke-ProcessStream -Body @{
  url = $articleUrl
  action = "telegram"
  article = $parsed
}
if ($telegram -notmatch $articleUrl) { throw "telegram does not contain source URL" }
Write-Host "OK: telegram length=$($telegram.Length)"

Write-Host ""
Write-Host "All step 6 checks passed."
