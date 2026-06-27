param(
  [string]$Message = "Update Balls RPG"
)

$ErrorActionPreference = "Stop"

Set-Location -LiteralPath $PSScriptRoot

if (-not (Test-Path -LiteralPath ".git")) {
  git init
}

$branch = git branch --show-current
if (-not $branch) {
  git checkout -b main
} elseif ($branch -ne "main") {
  git branch -M main
}

$repoUrl = "https://github.com/Sandkar1/Balls-RPG.git"
$remoteUrl = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
  git remote add origin $repoUrl
} elseif ($remoteUrl -ne $repoUrl) {
  git remote set-url origin $repoUrl
}

git add -A

$status = git status --porcelain
if ($status) {
  git commit -m $Message
} else {
  Write-Host "No changes to commit."
}

git push -u origin main
