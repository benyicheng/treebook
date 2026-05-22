$ErrorActionPreference = "Stop"

param(
  [string]$BaseUrl = "http://localhost:3001/api",
  [string]$AdminToken = $env:ADMIN_TOKEN
)

if (-not $AdminToken) {
  Write-Host "Missing ADMIN_TOKEN"
  exit 1
}

$headers = @{
  "Authorization" = "Bearer $AdminToken"
  "Content-Type" = "application/json"
}

$body = @{
  moderationConfig = (@{
    mode = "off"
    rollout = @{ enabled = $false; percent = 0; userIds = @(); businessLines = @() }
  } | ConvertTo-Json -Compress)
} | ConvertTo-Json -Compress

Invoke-RestMethod -Method Put -Uri "$BaseUrl/cms" -Headers $headers -Body $body | Out-Null

Write-Host "Moderation rollback applied: mode=off"

