#! /bin/bash
find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.*" | \
  xargs wc -l | sort -rn