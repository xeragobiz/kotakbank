from pathlib import Path

root = Path('.')
exclude_dirs = {'.git', 'node_modules', 'dist'}
text_extensions = {'.js', '.css', '.html', '.json', '.md', '.yaml', '.yml', '.txt'}

for path in root.rglob('*'):
    if not path.is_file():
        continue
    if any(part in exclude_dirs for part in path.parts):
        continue
    if path.suffix.lower() not in text_extensions:
        continue
    try:
        text = path.read_text(encoding='utf-8')
    except Exception:
        continue
    if '\r\n' in text:
        path.write_text(text.replace('\r\n', '\n'), encoding='utf-8', newline='\n')
