#!/bin/bash

FILE="src/App.jsx"
cp "$FILE" "${FILE}.broken2"

# Fix line 743: missing closing backtick
sed -i '743s/`${monster.count}× ${monster.name`/`${monster.count}× ${monster.name}`/' "$FILE"

# Fix line 791: missing closing backtick
sed -i '791s/`+${m`/`+${m}`/' "$FILE"

# Fix line 810: missing closing backtick  
sed -i '810s/`${stat.toUpperCase()} Chec`/`${stat.toUpperCase()} Check`/' "$FILE"

# Fix line 817: missing closing backtick
sed -i '817s/`${stat.toUpperCase()} Sav`/`${stat.toUpperCase()} Save`/' "$FILE"

# Fix line 830: missing closing backtick
sed -i '830s/`${skillName} Chec`/`${skillName} Check`/' "$FILE"

# Fix line 839: missing closing backtick
sed -i '839s/`Attack (${weaponName}`/`Attack (${weaponName})`/' "$FILE"

# Fix line 844 & 846: missing closing backtick
sed -i 's/`Cast ${spellName`/`Cast ${spellName}`/g' "$FILE"

# Fix line 856: missing closing backtick
sed -i '856s/`Defending with AC ${localChar.ac`/`Defending with AC ${localChar.ac}`/' "$FILE"

# Fix line 876: missing closing backtick
sed -i '876s/`+${val`/`+${val}`/' "$FILE"

# Fix line 1926: wrong syntax
sed -i '1926s/showNotification`/showNotification(`/g' "$FILE"
sed -i '1926s/trait}`/trait}`)/g' "$FILE"

echo "Fixed all truncated backticks"
