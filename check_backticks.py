#!/usr/bin/env python3

with open('src/App.jsx', 'r') as f:
    lines = f.readlines()

in_template = False
template_start = 0

for i, line in enumerate(lines[:1586], 1):  # Check only lines before 1586
    backticks = line.count('`')
    if backticks % 2 != 0:
        print(f"Line {i}: Unbalanced backticks ({backticks} backticks)")
        print(f"  {line.rstrip()}")
