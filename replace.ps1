$path = 'c:\Users\Najeeb\OneDrive\Desktop\Kayaaltrial\index.html'
$content = Get-Content $path -Raw
$content = [System.Text.RegularExpressions.Regex]::Replace($content, '<img src="data:image[^"]+" alt="Kayaal Beauty Lounge">', 'KAYAAL')
Set-Content $path -Value $content -Encoding UTF8
