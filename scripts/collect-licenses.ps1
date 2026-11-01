$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$outputDirectory = Join-Path $projectRoot 'release-support'
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
$sections = [System.Collections.Generic.List[string]]::new()
$sections.Add("诗笺第三方软件声明 / Third-party software notices`nGenerated from installed and locked dependencies. Includes build dependencies where available.`nEach dependency remains under its own license.")
$npmNames = @('react','react-dom','scheduler','lunar-typescript','@tauri-apps/api','@tauri-apps/plugin-store')
foreach ($packageName in $npmNames) {
    $packageDirectory = Join-Path (Join-Path $projectRoot 'node_modules') $packageName
    $packageInfo = Get-Content -LiteralPath (Join-Path $packageDirectory 'package.json') -Raw | ConvertFrom-Json
    $sections.Add("`n===== npm: $packageName $($packageInfo.version) =====")
    foreach ($licenseFile in (Get-ChildItem -LiteralPath $packageDirectory -File | Where-Object Name -Match '^(LICENSE|COPYING|NOTICE)')) {
        $sections.Add("--- $($licenseFile.Name) ---`n" + (Get-Content -LiteralPath $licenseFile.FullName -Raw -Encoding UTF8))
    }
}
$cargoJson = & cargo metadata --manifest-path (Join-Path $projectRoot 'src-tauri/Cargo.toml') --format-version 1 --locked --offline --filter-platform x86_64-pc-windows-msvc
if ($LASTEXITCODE -ne 0) { throw 'Cargo metadata failed' }
$cargoMetadata = $cargoJson | ConvertFrom-Json
foreach ($packageInfo in ($cargoMetadata.packages | Sort-Object name,version)) {
    if ($packageInfo.name -eq 'shijian') { continue }
    $sections.Add("`n===== Rust: $($packageInfo.name) $($packageInfo.version) | SPDX: $($packageInfo.license) =====")
    $packageDirectory = Split-Path -Parent $packageInfo.manifest_path
    $licenseFiles = @(Get-ChildItem -LiteralPath $packageDirectory -File | Where-Object Name -Match '^(LICENSE|COPYING|NOTICE)')
    if ($packageInfo.license_file) {
        $specifiedLicense = Join-Path $packageDirectory $packageInfo.license_file
        if (Test-Path -LiteralPath $specifiedLicense -PathType Leaf) { $licenseFiles += Get-Item -LiteralPath $specifiedLicense }
    }
    foreach ($licenseFile in ($licenseFiles | Sort-Object FullName -Unique)) {
        $sections.Add("--- $($licenseFile.Name) ---`n" + (Get-Content -LiteralPath $licenseFile.FullName -Raw -Encoding UTF8))
    }
}
$sections.Add("`n===== Zhi Mang Xing =====`n" + (Get-Content -LiteralPath (Join-Path $projectRoot 'public/fonts/ZhiMangXing-OFL.txt') -Raw -Encoding UTF8))
$sections.Add("`n===== chinese-poetry / chinese-poetry =====`n" + (Get-Content -LiteralPath (Join-Path $projectRoot 'public/licenses/chinese-poetry-MIT.txt') -Raw -Encoding UTF8))
$sections.Add("`n===== open-chinese / poetry-collection =====`n" + (Get-Content -LiteralPath (Join-Path $projectRoot 'public/licenses/poetry-collection-MIT.txt') -Raw -Encoding UTF8))
$outputPath = Join-Path $outputDirectory 'THIRD-PARTY-LICENSES.txt'
[System.IO.File]::WriteAllText($outputPath, ($sections -join "`n"), [System.Text.UTF8Encoding]::new($false))
Write-Output "Notices written: $outputPath"
