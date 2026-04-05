#!/bin/bash

# Install receipt generation packages
echo "📦 Installing receipt generation packages..."

cd frontend
npm install jspdf jspdf-autotable

echo "✅ Receipt packages installed!"
echo ""
echo "You can now use the receipt download feature."
