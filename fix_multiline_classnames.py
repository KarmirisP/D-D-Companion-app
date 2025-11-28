#!/usr/bin/env python3

with open('src/App.jsx', 'r') as f:
    lines = f.readlines()

# Fix lines 704-705: merge them and fix the template literal
# Line 704 currently ends with: 'bg-slate-700 text-slate-400 hover:bg-slate-600'
# Line 705 is:                   `}
# Should be: className={`...text-slate-400 hover:bg-slate-600'`}

lines[703] = lines[703].rstrip() + '\n'  # Remove any trailing whitespace
lines[704] = lines[704].strip()  # Get line 705 content

# Merge: remove the split and fix the syntax
# Line 704 should end with '`}
merged_704 = "            className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${conditions.includes(c) ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'`}\n"
lines[703] = merged_704
lines[704] = "          >\n"  # This was line 706

# Fix lines 1279-1280: same issue
merged_1279 = "                className={`px-2 py-0.5 text-[9px] rounded border transition-colors ${localChar.conditions?.includes(c) ? 'bg-red-600 border-red-500 text-white' : 'bg-slate-900 border-slate-600 text-slate-400 hover:bg-slate-800'`}>\n"
lines[1278] = merged_1279
lines[1279] = "                {c}\n"  # This was line 1281

with open('src/App.jsx', 'w') as f:
    f.writelines(lines)

print("Fixed multiline className template literals")
