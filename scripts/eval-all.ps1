# eval-all.ps1 - Run evaluation and open browser
# Shared database with Docker container
$env:PROMPTFOO_CONFIG_DIR = "./promptfoo_data"
$env:PROMPTFOO_DISABLE_SHARING = "true"

# Load .env file
if (Test-Path ".env") {
    Write-Host "Loading .env file..." -ForegroundColor Gray
    Get-Content .env -Encoding UTF8 | Where-Object { $_ -match "^[^#].+=.+" } | ForEach-Object {
        $line = $_.Trim()
        if ($line -match "^([^=]+)=(.*)$") {
            $name = $Matches[1].Trim()
            $value = $Matches[2].Trim()
            # Remove optional quotes
            if ($value -match "^`"(.*)`"$") { $value = $Matches[1] }
            if ($value -match "^'(.*)'$") { $value = $Matches[1] }
            
            # Set for the current process so child processes (npm run) can see it
            [System.Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

if (-not [System.Environment]::GetEnvironmentVariable("OPENAI_API_KEY", "Process")) {
    Write-Host "WARNING: OPENAI_API_KEY is not set! Evaluation will likely fail." -ForegroundColor Red
}
else {
    Write-Host "OPENAI_API_KEY is set." -ForegroundColor Green
}

Write-Host "`nStep 1/2: Running evaluation..." -ForegroundColor Cyan
npm run eval
$evalExitCode = $LASTEXITCODE

Write-Host "`nStep 2/2: Opening browser..." -ForegroundColor Cyan
npm run eval:view
$viewExitCode = $LASTEXITCODE

Write-Host "`n=== Summary ===" -ForegroundColor Green
Write-Host "Evaluation: $(if ($evalExitCode -eq 0) { 'Success' } else { 'Completed with errors' })" -ForegroundColor $(if ($evalExitCode -eq 0) { 'Green' } else { 'Yellow' })
Write-Host "View: $(if ($viewExitCode -eq 0) { 'Success' } else { 'Failed' })" -ForegroundColor $(if ($viewExitCode -eq 0) { 'Green' } else { 'Red' })
Write-Host "`nResults available at: http://localhost:3210" -ForegroundColor Cyan
Write-Host "Results file: ./promptfoo_data/output/latest.json" -ForegroundColor Cyan

# Exit with 0 to not fail the npm script
exit 0
