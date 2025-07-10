# PowerShell script to kill any process using port 5000
$port = 5000
$processes = netstat -ano | Select-String ":$port" | ForEach-Object {
    $_.ToString().Split()[-1]
} | Select-Object -Unique

foreach ($pid in $processes) {
    if ($pid -match '^\d+$') {
        try {
            Write-Host "Killing process on port $port with PID $pid..."
            Stop-Process -Id $pid -Force
        } catch {
            Write-Host "Could not kill PID $pid: $_"
        }
    }
}
Write-Host "Done. Port $port should now be free." 