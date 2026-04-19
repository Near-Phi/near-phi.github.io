#!/bin/bash
# Create a new tool and add it to the index
# Usage: bash scripts/new_tool.sh tool_name "Display Name" "Category" "Description"
#
# Example: bash scripts/new_tool.sh prime_spiral "Prime Spiral" "Number Theory" "Ulam spiral and prime visualizations"
#
# This creates the HTML file and reminds you to update index.html

set -e
cd "$(dirname "$0")/.."

NAME="$1"
DISPLAY="$2"
CATEGORY="$3"
DESC="$4"

if [ -z "$NAME" ] || [ -z "$DISPLAY" ]; then
    echo "Usage: bash scripts/new_tool.sh tool_name \"Display Name\" \"Category\" \"Description\""
    exit 1
fi

FILE="${NAME}.html"

if [ -f "$FILE" ]; then
    echo "ERROR: $FILE already exists"
    exit 1
fi

cat > "$FILE" << HTMLEOF
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${DISPLAY} | near phi</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a0f;color:#c8c8d4;font-family:'Segoe UI',system-ui,sans-serif;overflow:hidden}
canvas{display:block;width:100vw;height:100vh}
.controls{position:fixed;top:16px;right:16px;background:rgba(18,18,26,.9);border:1px solid #1e1e2e;border-radius:8px;padding:16px;min-width:200px}
.controls h3{font-size:13px;color:#6c7ee1;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px}
.back{position:fixed;top:16px;left:16px;color:#555570;text-decoration:none;font-size:13px}
.back:hover{color:#6c7ee1}
</style>
</head>
<body>
<a href="index.html" class="back">&larr; back</a>
<canvas id="c"></canvas>
<div class="controls">
    <h3>${DISPLAY}</h3>
    <!-- Add controls here -->
</div>
<script>
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// TODO: implement ${NAME}

function draw() {
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Your rendering code here
    requestAnimationFrame(draw);
}
draw();

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
</script>
</body>
</html>
HTMLEOF

echo "Created $FILE"
echo ""
echo "TODO: Update index.html to add a card for ${DISPLAY}"
echo "TODO: Implement the visualization in ${FILE}"
echo ""
echo "When ready, deploy with: bash scripts/deploy.sh 'Add ${DISPLAY}'"
