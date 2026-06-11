import sharp from "sharp";

const svg192 = `<svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
  <rect width="192" height="192" rx="32" fill="#0077B6"/>
  <g transform="translate(16,16)" fill="white">
    <rect x="10" y="50" width="140" height="70" rx="10"/>
    <rect x="30" y="30" width="100" height="40" rx="8"/>
    <rect x="60" y="10" width="60" height="30" rx="8"/>
    <circle cx="46" cy="128" r="18" fill="#0077B6" stroke="white" stroke-width="4"/>
    <circle cx="126" cy="128" r="18" fill="#0077B6" stroke="white" stroke-width="4"/>
    <rect x="100" y="70" width="30" height="28" rx="4"/>
  </g>
</svg>`;

const svg512 = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="64" fill="#0077B6"/>
  <g transform="translate(40,40)" fill="white">
    <rect x="20" y="140" width="390" height="190" rx="24"/>
    <rect x="80" y="80" width="280" height="110" rx="20"/>
    <rect x="170" y="30" width="160" height="80" rx="16"/>
    <circle cx="120" cy="350" r="50" fill="#0077B6" stroke="white" stroke-width="10"/>
    <circle cx="340" cy="350" r="50" fill="#0077B6" stroke="white" stroke-width="10"/>
    <rect x="270" y="190" width="80" height="75" rx="10"/>
  </g>
</svg>`;

await Promise.all([
  sharp(Buffer.from(svg192)).png().toFile("public/icon-192.png"),
  sharp(Buffer.from(svg512)).png().toFile("public/icon-512.png"),
]);

console.log("Icons generated");
