const fs = require('fs');

// Read the malformed CSV
const input = fs.readFileSync('afro_caribbean_inventory_1200_with_images.csv.csv', 'utf8');

// Split into lines
const lines = input.split('\n').filter(line => line.trim());

// Process each line - remove the outer quotes and split properly
const fixedLines = lines.map(line => {
  // Remove outer quotes
  const cleaned = line.replace(/^"|"$/g, '');
  
  // Split by comma and handle the fields
  const parts = cleaned.split(',');
  
  // The Image field (camera emoji or empty), Name, Category, Price, Stock, Description
  if (parts.length >= 6) {
    const image = parts[0] === '📷' ? '' : parts[0]; // Remove camera emoji
    const name = parts[1];
    const category = parts[2];
    const price = parts[3];
    const stock = parts[4];
    const description = parts.slice(5).join(','); // Join remaining parts as description
    
    return `${image},${name},${category},${price},${stock},${description}`;
  }
  
  return cleaned;
});

// Write the fixed CSV
fs.writeFileSync('afro_caribbean_inventory_fixed.csv', fixedLines.join('\n'), 'utf8');

console.log(`✅ Fixed CSV created: afro_caribbean_inventory_fixed.csv`);
console.log(`   Original lines: ${lines.length}`);
console.log(`   Fixed lines: ${fixedLines.length}`);
