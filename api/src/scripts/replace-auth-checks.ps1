$controllerDir = "H:\xs\api\src\controllers"

Get-ChildItem -Path $controllerDir -Filter "*.ts" | ForEach-Object {
    $file = $_.FullName
    $original = Get-Content -Path $file -Raw
    
    $text = $original
    
    # ── Pattern B: id + role (single line) ──
    $text = $text -replace '(?m)^  const (\w+) = req\.user\?\.id;\r?\n  const (\w+) = req\.user\?\.role;\r?\n  if \(!\1 \|\| !\2\) throw new AppError\(401, ''UNAUTHORIZED'', ''Unauthorized''\);',
        '  const { id: $1, role: $2 } = getCurrentUser(req);'
    
    # ── Pattern A: id only (single line) ──
    $text = $text -replace '(?m)^  const (\w+) = req\.user\?\.id;\r?\n  if \(!\1\) throw new AppError\(401, ''UNAUTHORIZED'', ''Unauthorized''\);',
        '  const { id: $1 } = getCurrentUser(req);'

    # ── Pattern C: id only (multiline, authController style) ──
    #   const X = req.user?.id;
    #   if (!X) {
    #     throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');
    #   }
    $text = $text -replace '(?m)^  const (\w+) = req\.user\?\.id;\r?\n\r?\n  if \(!\1\) \{\r?\n    throw new AppError\(401, ''UNAUTHORIZED'', ''Unauthorized''\);\r?\n  \}',
        "  const { id: `$1 } = getCurrentUser(req);"

    # ── Add import if getCurrentUser is now used ──
    if ($text -match 'getCurrentUser\(req\)') {
        if ($text -notmatch "from '../utils/authHelpers'") {
            # Add import after the AppError import line (most common pattern)
            if ($text -match "import \{ AppError \} from '\.\./utils/http';") {
                $text = $text -replace "(import \{ AppError \} from '\.\./utils/http';)",
                    "`$1`r`nimport { getCurrentUser } from '../utils/authHelpers';"
            } else {
                # Fallback: add before the first import
                $text = "import { getCurrentUser } from '../utils/authHelpers';`r`n" + $text
            }
        }
    }
    
    if ($text -ne $original) {
        Set-Content -Path $file -Value $text -NoNewline -Encoding UTF8
        Write-Host "Updated: $($_.Name)"
    }
}
