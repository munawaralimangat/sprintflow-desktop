Add-Type -AssemblyName System.Drawing

$root = Resolve-Path "$PSScriptRoot\.."
$assetsDir = Join-Path $root "assets"
if (-not (Test-Path $assetsDir)) {
    New-Item -ItemType Directory -Path $assetsDir -Force | Out-Null
}

$size = 256
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

# Linear background
$brushBg = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(0, 0)),
    (New-Object System.Drawing.Point($size, $size)),
    ([System.Drawing.ColorTranslator]::FromHtml("#1a1d28")),
    ([System.Drawing.ColorTranslator]::FromHtml("#0e1017"))
)

$rect = New-Object System.Drawing.Rectangle(8, 8, ($size - 16), ($size - 16))
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$d = 64
$path.AddArc($rect.X, $rect.Y, $d, $d, 180, 90)
$path.AddArc(($rect.Right - $d), $rect.Y, $d, $d, 270, 90)
$path.AddArc(($rect.Right - $d), ($rect.Bottom - $d), $d, $d, 0, 90)
$path.AddArc($rect.X, ($rect.Bottom - $d), $d, $d, 90, 90)
$path.CloseFigure()

$g.FillPath($brushBg, $path)

$penBorder = New-Object System.Drawing.Pen(([System.Drawing.ColorTranslator]::FromHtml("#2d3345")), 5)
$g.DrawPath($penBorder, $path)

# Sprint S-Curve
$penAccent = New-Object System.Drawing.Pen(([System.Drawing.ColorTranslator]::FromHtml("#3b82f6")), 20)
$penAccent.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$penAccent.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

$pts = @(
    (New-Object System.Drawing.Point(74, 90)),
    (New-Object System.Drawing.Point(128, 58)),
    (New-Object System.Drawing.Point(182, 90)),
    (New-Object System.Drawing.Point(128, 128)),
    (New-Object System.Drawing.Point(74, 166)),
    (New-Object System.Drawing.Point(128, 198)),
    (New-Object System.Drawing.Point(182, 166))
)
$g.DrawCurve($penAccent, $pts, 0.6)

# Status indicators
$g.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#38bdf8"))), 172, 80, 20, 20)
$g.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#818cf8"))), 118, 118, 20, 20)
$g.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#10b981"))), 64, 156, 20, 20)

$pngPath = Join-Path $assetsDir "icon.png"
$bmp.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)

# Generate .ico
$icoPath = Join-Path $assetsDir "icon.ico"
$icon = [System.Drawing.Icon]::FromHandle($bmp.GetHicon())
$fileStream = [System.IO.File]::OpenWrite($icoPath)
$icon.Save($fileStream)
$fileStream.Close()

# Create Windows shortcut SprintFlow.lnk with the custom icon
$batPath = Join-Path $root "TaskFlow.bat"
$lnkPath = Join-Path $root "SprintFlow.lnk"

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($lnkPath)
$Shortcut.TargetPath = "$batPath"
$Shortcut.WorkingDirectory = "$root"
$Shortcut.IconLocation = "$icoPath,0"
$Shortcut.Description = "SprintFlow Scrum Sprint Manager"
$Shortcut.Save()

Write-Host "SUCCESS: Generated icon.png, icon.ico, and SprintFlow.lnk shortcut!"
