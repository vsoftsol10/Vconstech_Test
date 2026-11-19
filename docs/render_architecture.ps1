Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot ''
$blue = [System.Drawing.Color]::FromArgb(230, 244, 255)
$border = [System.Drawing.Color]::FromArgb(135, 184, 224)
$ink = [System.Drawing.Color]::FromArgb(22, 72, 128)
$gray = [System.Drawing.Color]::FromArgb(135, 135, 135)
$white = [System.Drawing.Color]::White
$titleFont = New-Object System.Drawing.Font('Arial', 30, [System.Drawing.FontStyle]::Bold)
$groupFont = New-Object System.Drawing.Font('Arial', 21, [System.Drawing.FontStyle]::Bold)
$nodeFont = New-Object System.Drawing.Font('Arial', 15, [System.Drawing.FontStyle]::Regular)
$smallFont = New-Object System.Drawing.Font('Arial', 12, [System.Drawing.FontStyle]::Regular)

function New-Canvas([int]$width, [int]$height, [string]$title) {
  $bmp = New-Object System.Drawing.Bitmap($width, $height)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.Clear($white)
  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Alignment = [System.Drawing.StringAlignment]::Center
  $fmt.LineAlignment = [System.Drawing.StringAlignment]::Center
  $g.DrawString($title, $titleFont, [System.Drawing.Brushes]::MidnightBlue, (New-Object System.Drawing.RectangleF(20, 18, ($width - 40), 48)), $fmt)
  return @{ Bitmap = $bmp; Graphics = $g; Format = $fmt }
}

function Draw-Group($ctx, [int]$x, [int]$y, [int]$w, [int]$h, [string]$label) {
  $g = $ctx.Graphics
  $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(195, 218, 240), 2)
  $g.DrawRectangle($pen, $x, $y, $w, $h)
  $g.DrawString($label, $groupFont, [System.Drawing.Brushes]::MidnightBlue, (New-Object System.Drawing.RectangleF(($x + 12), ($y + 8), ($w - 24), 34)), $ctx.Format)
}

function Draw-Node($ctx, [int]$x, [int]$y, [int]$w, [int]$h, [string]$label, [bool]$store = $false) {
  $g = $ctx.Graphics
  $fill = New-Object System.Drawing.SolidBrush($(if ($store) { [System.Drawing.Color]::FromArgb(217, 236, 247) } else { $blue }))
  $pen = New-Object System.Drawing.Pen($border, 2)
  $g.FillRectangle($fill, $x, $y, $w, $h)
  $g.DrawRectangle($pen, $x, $y, $w, $h)
  $g.DrawString($label, $nodeFont, (New-Object System.Drawing.SolidBrush($ink)), (New-Object System.Drawing.RectangleF(($x + 8), ($y + 5), ($w - 16), ($h - 10))), $ctx.Format)
}

function Draw-Arrow($ctx, [int]$x1, [int]$y1, [int]$x2, [int]$y2, [string]$label = '') {
  $pen = New-Object System.Drawing.Pen($gray, 2)
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::ArrowAnchor
  $ctx.Graphics.DrawLine($pen, $x1, $y1, $x2, $y2)
  if ($label) { $ctx.Graphics.DrawString($label, $smallFont, [System.Drawing.Brushes]::DimGray, (($x1 + $x2) / 2 + 6), (($y1 + $y2) / 2 - 20)) }
}

function Draw-Line($ctx, [int]$x1, [int]$y1, [int]$x2, [int]$y2) {
  $pen = New-Object System.Drawing.Pen($gray, 2)
  $ctx.Graphics.DrawLine($pen, $x1, $y1, $x2, $y2)
}

function Save-Canvas($ctx, [string]$name) {
  $path = Join-Path $outDir $name
  $ctx.Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $ctx.Graphics.Dispose(); $ctx.Bitmap.Dispose()
}

$s = New-Canvas 1800 1240 'VCONSTECH - SYSTEM ARCHITECTURE'
Draw-Node $s 670 90 460 90 "Backend API\nand application core`nExpress 5 / Node.js"
Draw-Node $s 35 325 300 100 "Users`nAdministrator / Employee`nSuper administrator"
Draw-Node $s 35 500 300 100 "Web frontend`nReact 18 / Vite / React Router`nAdmin and employee interfaces"
Draw-Arrow $s 185 425 185 500
Draw-Node $s 35 680 300 100 "Dashboard and work areas`nProjects / materials / finance`nlabour / files / reports"
Draw-Arrow $s 185 600 185 680
Draw-Arrow $s 335 550 670 150 'API requests / JSON responses'
Draw-Arrow $s 670 170 335 525 'responses'

Draw-Group $s 390 250 1360 310 'BACKEND API MODULES'
Draw-Node $s 425 315 250 95 "Authentication and access`nJWT / roles / project access"
Draw-Node $s 700 315 250 95 "Company and account`nregistration / invitations / users"
Draw-Node $s 975 315 250 95 "Project delivery`nprojects / clients / engineers`ndaily progress"
Draw-Node $s 1250 315 250 95 "Operations`nmaterials / labour / contracts`nfiles / requests"
Draw-Node $s 700 440 250 88 "Finance and reports`nbilling / notifications"
Draw-Node $s 975 440 250 88 "Subscriptions`nplan limits / trial expiry"
Draw-Node $s 1250 440 250 88 "Integrations`nCRM / payment callbacks`nsubscription sync"
Draw-Line $s 900 180 900 260
Draw-Line $s 550 260 1375 260
Draw-Arrow $s 550 260 550 315
Draw-Arrow $s 825 260 825 315
Draw-Arrow $s 1100 260 1100 315
Draw-Arrow $s 1375 260 1375 315
Draw-Arrow $s 825 260 825 440
Draw-Arrow $s 1100 260 1100 440
Draw-Arrow $s 1375 260 1375 440

Draw-Group $s 390 605 1360 260 'DATA AND FILE STORAGE'
Draw-Node $s 530 690 490 105 "Prisma ORM`nData access layer"
Draw-Node $s 1110 675 510 115 "PostgreSQL database`nCompany / users / projects`nmaterials / labour / billing" $true
Draw-Node $s 1110 805 510 45 "Backend uploads directory / engineer images / project files" $true
Draw-Arrow $s 825 535 750 690
Draw-Arrow $s 1100 535 800 690
Draw-Arrow $s 1375 535 900 690
Draw-Arrow $s 1020 740 1110 730
Draw-Arrow $s 1500 410 1390 805 'upload / serve'
Draw-Arrow $s 1500 730 1500 805

Draw-Group $s 390 915 1360 230 'EXTERNAL SERVICES (WHEN CONFIGURED)'
Draw-Node $s 510 990 330 95 "CRM service`nIntegration endpoints"
Draw-Node $s 920 990 330 95 "Payment provider`npayment notifications"
Draw-Node $s 1330 990 330 95 "Subscription sync`nexternal status updates"
Draw-Arrow $s 1375 535 675 990
Draw-Arrow $s 1375 535 1085 990
Draw-Arrow $s 1375 535 1495 990
Draw-Arrow $s 675 990 1375 535
Draw-Arrow $s 1085 990 1375 535
$s.Graphics.DrawString('Configured VITE_API_URL connects the frontend to the API. The API defaults to port 5001.', $smallFont, [System.Drawing.Brushes]::DimGray, 440, 1160)
Save-Canvas $s 'VCONSTECH_SYSTEM_ARCHITECTURE.png'

$b = New-Canvas 1900 1720 'VCONSTECH - BUSINESS FLOW ARCHITECTURE'
Draw-Group $b 55 85 1790 230 'ACCOUNT ACCESS AND SETUP'
Draw-Node $b 100 165 360 95 "Super administrator`nmanages company accounts"
Draw-Node $b 550 165 360 95 "Company registration`nor invitation"
Draw-Node $b 1000 165 330 95 "Administrator signs in`nand sets up workspace"
Draw-Node $b 1420 165 360 95 "Employees sign in`nwith assigned access"
Draw-Arrow $b 460 210 550 210
Draw-Arrow $b 910 210 1000 210
Draw-Arrow $b 1330 210 1420 210

Draw-Group $b 55 355 1790 250 'SUBSCRIPTION AND PROJECT START'
Draw-Node $b 115 445 400 100 "Subscription / trial status`nplan and usage limits"
Draw-Node $b 650 445 420 100 "Dashboard and project list`nselect or create project"
Draw-Node $b 1210 445 530 100 "Project setup`nclient / location / schedule`nbudget / status"
Draw-Arrow $b 515 495 650 495
Draw-Arrow $b 1070 495 1210 495

Draw-Group $b 55 650 1790 600 'PROJECT DELIVERY AND DAILY OPERATIONS'
Draw-Node $b 95 745 370 100 "Assign engineers and`nproject team"
Draw-Node $b 525 745 370 100 "Maintain contracts and`nproject files"
Draw-Node $b 955 745 370 100 "Plan materials and`nproject requirements"
Draw-Node $b 1385 745 390 100 "Submit and process`nmaterial requests"
Draw-Line $b 1475 545 1815 545
Draw-Line $b 1815 545 1815 700
Draw-Line $b 280 700 1580 700
Draw-Arrow $b 280 700 280 745
Draw-Arrow $b 710 700 710 745
Draw-Arrow $b 1140 700 1140 745
Draw-Arrow $b 1580 700 1580 745
Draw-Arrow $b 1325 795 1385 795
Draw-Node $b 1385 910 390 100 "Record material allocation`nand usage"
Draw-Node $b 955 910 370 100 "Record daily progress`nand project updates"
Draw-Node $b 525 910 370 100 "Record labour attendance`nand labour details"
Draw-Arrow $b 1580 845 1580 910
Draw-Arrow $b 280 845 1140 910
Draw-Arrow $b 710 845 710 910
Draw-Node $b 665 1080 520 105 "Review project status and reports`nprogress / materials / labour / files"
Draw-Arrow $b 1580 1010 1120 1080
Draw-Arrow $b 1140 1010 1000 1080
Draw-Arrow $b 710 1010 790 1080

Draw-Group $b 55 1290 1790 340 'FINANCE AND PROJECT CLOSEOUT'
Draw-Node $b 115 1380 430 100 "Track project financial`ninformation"
Draw-Node $b 680 1380 430 100 "Prepare and manage bills`nreview financial reports"
Draw-Node $b 1260 1380 480 100 "Review work and outstanding items`ncomplete / close project"
Draw-Arrow $b 925 1185 330 1380
Draw-Arrow $b 545 1430 680 1430
Draw-Arrow $b 1110 1430 1260 1430
$b.Graphics.DrawString('Project task order varies by company. Arrows show common dependencies; payment and CRM behavior depends on configuration.', $smallFont, [System.Drawing.Brushes]::DimGray, 390, 1640)
Save-Canvas $b 'VCONSTECH_BUSINESS_FLOW_ARCHITECTURE.png'

Write-Output 'Created VCONSTECH_SYSTEM_ARCHITECTURE.png and VCONSTECH_BUSINESS_FLOW_ARCHITECTURE.png'

