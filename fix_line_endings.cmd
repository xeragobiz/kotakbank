@echo off
setlocal
powershell -NoProfile -Command "$allowed = @('.js','.css','.html','.json','.md','.yaml','.yml','.txt'); Get-ChildItem -Path . -Recurse -File | Where-Object { $_.Extension.ToLower() -in $allowed -and $_.FullName -notmatch '[\\/](node_modules|\.git|dist)[\\/]' } | ForEach-Object { $text = [System.IO.File]::ReadAllText($_.FullName); if ($text -match \"`r`n\") { [System.IO.File]::WriteAllText($_.FullName, $text -replace \"`r`n\", \"`n\", [System.Text.UTF8Encoding]::new($false)) } }"
