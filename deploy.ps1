<#
.SYNOPSIS
    Deploy TradingLens AI to the Oracle Cloud VPS (170.9.42.34).
    Builds locally to avoid OOM on the 954MB RAM server, then uploads
    the .next build output and restarts PM2 services.

.PARAMETER SkipBuild
    Skip the local build step (use existing .next directory).

.PARAMETER SkipClassroom
    Skip deploying the OpenMAIC classroom app.

.EXAMPLE
    .\deploy.ps1
    .\deploy.ps1 -SkipBuild
#>

param(
    [switch]$SkipBuild,
    [switch]$SkipClassroom
)

# ── Configuration ──────────────────────────────────────────────────────────
$ErrorActionPreference = "Stop"

$VPS_HOST      = "170.9.42.34"
$VPS_USER      = "ubuntu"
$SSH_KEY       = "$env:USERPROFILE\.ssh\ssh-key-2026-09-21.key"
$REMOTE_DIR    = "/var/www/tradinglens-ai"
$ARCHIVE_NAME  = ".next-deploy.tar.gz"
$CLASSROOM_ARCHIVE = ".classroom-deploy.tar.gz"

# ── Helper functions ───────────────────────────────────────────────────────
function Write-Step($step, $message) {
    Write-Host "`n[$step] $message" -ForegroundColor Cyan
}

function Write-Success($message) {
    Write-Host "  ✓ $message" -ForegroundColor Green
}

function Write-Fail($message) {
    Write-Host "  ✗ $message" -ForegroundColor Red
}

function Invoke-SSH($command) {
    $result = & ssh -i $SSH_KEY -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" $command 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "SSH command failed: $command"
        Write-Host $result -ForegroundColor Yellow
        throw "SSH command failed with exit code $LASTEXITCODE"
    }
    return $result
}

function Invoke-SCP($local, $remote) {
    & scp -i $SSH_KEY -o StrictHostKeyChecking=no $local "${VPS_USER}@${VPS_HOST}:${remote}" 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "SCP upload failed"
    }
}

# ── Pre-flight checks ─────────────────────────────────────────────────────
Write-Host "`n╔══════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║     TradingLens AI — Production Deployment       ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Magenta

Write-Step "0/6" "Pre-flight checks"

if (-not (Test-Path $SSH_KEY)) {
    Write-Fail "SSH key not found at $SSH_KEY"
    exit 1
}
Write-Success "SSH key found"

try {
    $sshTest = Invoke-SSH "echo ok"
    Write-Success "SSH connection to $VPS_HOST successful"
} catch {
    Write-Fail "Cannot connect to VPS at $VPS_HOST"
    exit 1
}

# ── Step 1: Build locally ─────────────────────────────────────────────────
Write-Step "1/6" "Building Next.js app locally"

if ($SkipBuild) {
    Write-Host "  ⏭ Skipping build (using existing .next directory)" -ForegroundColor Yellow
    if (-not (Test-Path ".next\BUILD_ID")) {
        Write-Fail "No valid .next build found. Run without -SkipBuild."
        exit 1
    }
} else {
    # Set production-critical NEXT_PUBLIC_ env vars for the build
    if (-not $env:NEXT_PUBLIC_OPENMAIC_URL) { $env:NEXT_PUBLIC_OPENMAIC_URL = "https://classroom.tradinglensai.com" }
    if (-not $env:NEXT_PUBLIC_LIVEKIT_URL) { $env:NEXT_PUBLIC_LIVEKIT_URL = "wss://trade-kvdgigav.livekit.cloud" }


    Write-Host "  Building with NEXT_PUBLIC_OPENMAIC_URL=$env:NEXT_PUBLIC_OPENMAIC_URL"

    & npx next build 2>&1 | ForEach-Object { Write-Host "  $_" }

    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Build failed!"
        exit 1
    }

    if (-not (Test-Path ".next\BUILD_ID")) {
        Write-Fail "Build completed but BUILD_ID not found — build may be corrupt."
        exit 1
    }
}

$buildId = Get-Content ".next\BUILD_ID" -Raw
Write-Success "Build complete (BUILD_ID: $($buildId.Trim()))"

# ── Step 2: Compress build output ─────────────────────────────────────────
Write-Step "2/6" "Compressing build output"

if (Test-Path $ARCHIVE_NAME) { Remove-Item $ARCHIVE_NAME }

& tar -czf $ARCHIVE_NAME .next
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Failed to compress .next directory"
    exit 1
}

$archiveSize = [math]::Round((Get-Item $ARCHIVE_NAME).Length / 1MB, 1)
Write-Success "Archive created: $ARCHIVE_NAME ($archiveSize MB)"

# ── Step 3: Upload to server ─────────────────────────────────────────────
Write-Step "3/6" "Uploading build to VPS ($VPS_HOST)"

Write-Host "  Uploading $archiveSize MB..."

Invoke-SCP $ARCHIVE_NAME "$REMOTE_DIR/$ARCHIVE_NAME"
Write-Success "Upload complete"

# ── Step 4: Deploy on server ─────────────────────────────────────────────
Write-Step "4/6" "Deploying on server"

$deployScript = "cd $REMOTE_DIR && pm2 stop tradinglens-web && rm -rf .next && tar -xzf $ARCHIVE_NAME && rm $ARCHIVE_NAME && pm2 restart tradinglens-web && pm2 reset tradinglens-web && pm2 save"

$result = Invoke-SSH $deployScript
Write-Success "Build extracted and PM2 restarted"

# ── Step 5: Deploy OpenMAIC Classroom (optional) ──────────────────────────
if (-not $SkipClassroom -and (Test-Path "openmaic\.next\standalone")) {
    Write-Step "5/6" "Deploying OpenMAIC Classroom"

    try {
        if (Test-Path $CLASSROOM_ARCHIVE) { Remove-Item $CLASSROOM_ARCHIVE }

        Push-Location openmaic
        & tar -czf "..\$CLASSROOM_ARCHIVE" ".next\standalone" ".next\static"
        Pop-Location

        if ($LASTEXITCODE -eq 0 -and (Test-Path $CLASSROOM_ARCHIVE)) {
            $classroomSize = [math]::Round((Get-Item $CLASSROOM_ARCHIVE).Length / 1MB, 1)
            Write-Host "  Uploading classroom ($classroomSize MB)..."

            Invoke-SCP $CLASSROOM_ARCHIVE "$REMOTE_DIR/openmaic/$CLASSROOM_ARCHIVE"

            $classroomDeploy = "cd $REMOTE_DIR/openmaic && pm2 stop openmaic-classroom && rm -rf .next && tar -xzf $CLASSROOM_ARCHIVE && rm $CLASSROOM_ARCHIVE && pm2 restart openmaic-classroom && pm2 save"
            Invoke-SSH $classroomDeploy
            Write-Success "Classroom deployed"

            if (Test-Path $CLASSROOM_ARCHIVE) { Remove-Item $CLASSROOM_ARCHIVE }
        } else {
            Write-Host "  ⏭ Skipping classroom (tar failed)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ⚠ Classroom deploy failed: $_" -ForegroundColor Yellow
    }
} else {
    Write-Step "5/6" "Skipping OpenMAIC Classroom"
    Write-Host "  ⏭ No standalone build or -SkipClassroom flag" -ForegroundColor Yellow
}

# ── Step 6: Verify deployment ─────────────────────────────────────────────
Write-Step "6/6" "Verifying deployment"

Start-Sleep -Seconds 5

$httpCode = (& curl -s -o /dev/null -w "%{http_code}" https://tradinglensai.com 2>&1)
if ($httpCode -eq "200") {
    Write-Success "https://tradinglensai.com → HTTP $httpCode"
} else {
    Write-Fail "https://tradinglensai.com → HTTP $httpCode"
}

# Show final PM2 table
$pm2List = Invoke-SSH "pm2 list"
Write-Host "`n$($pm2List -join "`n")"

# ── Cleanup ───────────────────────────────────────────────────────────────
if (Test-Path $ARCHIVE_NAME) { Remove-Item $ARCHIVE_NAME }

Write-Host "`n╔══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║          ✓ Deployment Complete!                   ║" -ForegroundColor Green
Write-Host "║   https://tradinglensai.com is live               ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════╝`n" -ForegroundColor Green
