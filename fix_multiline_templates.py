#!/usr/bin/env python3

with open('src/App.jsx', 'r') as f:
    lines = f.readlines()

# Fix line 704 - add closing backtick at the end
if '704' in 'check':
    # Line 704 should end with a backtick before the closing brace
    lines[703] = lines[703].rstrip().rstrip("'") + "'\n"
    if not lines[703].rstrip().endswith('`'):
        lines[703] = lines[703].rstrip() + "`\n"

# Fix line 1279 - add closing backtick at the end  
if '1279' in 'check':
    lines[1278] = lines[1278].rstrip().rstrip("'") + "'\n"
    if not lines[1278].rstrip().endswith('`'):
        lines[1278] = lines[1278].rstrip() + "`\n"

with open('src/App.jsx', 'w') as f:
    f.writelines(lines)

print("Fixed multiline template literals")
