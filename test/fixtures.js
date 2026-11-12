'use strict';
// Builds real PDF / DOCX / TXT resume files in memory so the parser is tested against actual file formats.
const zlib = require('node:zlib');

const RESUME = `Asha Rao
Full Stack Developer | React, Node.js
asha.rao@example.com | +91 98765 43210 | Coimbatore, Tamil Nadu
linkedin.com/in/asha-rao | github.com/asharao | https://asha.dev

SUMMARY
Final-year engineering student who loves building useful products end to end. Shipped three web apps with real users.

SKILLS
JavaScript, TypeScript, React, Node.js, SQL, PostgreSQL, Git, Docker, REST APIs, Figma, Communication

EXPERIENCE
Software Engineering Intern at Acme Labs
Jun 2025 - Aug 2025
- Built REST APIs in Node.js and PostgreSQL serving 5k users
- Cut page load time by 40% with React code splitting

Web Developer - Freelance
Jan 2024 - Present
- Delivered 6 client websites using React and Tailwind CSS

EDUCATION
B.E. Computer Science and Engineering
PSG College of Technology, Coimbatore  2022 - 2026
CGPA: 8.7

PROJECTS
Job Portal
- Full stack job board with resume parsing and auto apply
`;
const esc = (s) => s.replace(/([\()])/g, '\$1');

function pdf(text, { compress = false } = {}) {
  let content = 'BT\n/F1 11 Tf\n14 TL\n50 780 Td\n' + text.split('\n').map((l) => `(${esc(l)}) Tj T*`).join('\n') + '\nET';
  let body = Buffer.from(content, 'latin1'), filter = '';
  if (compress) { body = zlib.deflateSync(body); filter = ' /Filter /FlateDecode'; }
  const parts = ['%PDF-1.4\n', '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n', '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n'];
  const bufs = [Buffer.from(parts.join('')), Buffer.from(`4 0 obj\n<< /Length ${body.length}${filter} >>\nstream\n`), body, Buffer.from('\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF')];
  return Buffer.concat(bufs);
}

function crc32(buf) { let c, crc = 0xffffffff; for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return (crc ^ 0xffffffff) >>> 0; }
function zip(files) {
  const locals = [], centrals = []; let off = 0;
  for (const [name, data] of Object.entries(files)) {
    const nameB = Buffer.from(name), raw = Buffer.from(data), comp = zlib.deflateRawSync(raw), crc = crc32(raw);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(8, 8); lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(raw.length, 22); lh.writeUInt16LE(nameB.length, 26);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(8, 10); ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(raw.length, 24); ch.writeUInt16LE(nameB.length, 28); ch.writeUInt32LE(off, 42);
    locals.push(lh, nameB, comp); centrals.push(ch, nameB); off += 30 + nameB.length + comp.length;
  }
  const cd = Buffer.concat(centrals), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(Object.keys(files).length, 8); end.writeUInt16LE(Object.keys(files).length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16);
  return Buffer.concat([...locals, cd, end]);
}
function docx(text) {
  const x = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const xml = `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${text.split('\n').map((l) => `<w:p><w:r><w:t xml:space="preserve">${x(l)}</w:t></w:r></w:p>`).join('')}</w:body></w:document>`;
  return zip({ '[Content_Types].xml': '<Types/>', 'word/document.xml': xml });
}
module.exports = { RESUME, pdf, docx, txt: (t) => Buffer.from(t) };
