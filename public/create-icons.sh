#!/bin/bash

# Criar ícones SVG simples que podem ser usados como placeholders
# Cada tamanho será um SVG que pode ser renderizado

sizes=(72 96 128 144 152 192 384 512)

for size in "${sizes[@]}"; do
  cat > "icon-${size}x${size}.png.svg" << SVGEOF
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#ff6b9d" rx="15"/>
  <text x="50%" y="50%" font-size="${size/2}" text-anchor="middle" dy=".3em" fill="white">��</text>
</svg>
SVGEOF
done

echo "✅ Ícones SVG criados"
ls -lh icon-*.svg
