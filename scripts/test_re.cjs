const sampleLines = [
  " 2026-Nov-15 00:00 *   314.426181   1.731359",
  " 2026-Nov-15 00:00 *i  114.477644  -0.100084",
  " 2026-Nov-15 01:00      312.326265  -3.436453",
  " 2026-Nov-15 02:00 *m   113.464824   0.035439",
  " 2026-Nov-15 03:00 /A   112.958442  -0.002931"
];

const re = /^\s*(\d{4}-[A-Za-z]{3}-\d{2}\s+\d{2}:\d{2})\s+([A-Za-z*\/]*)\s+([+-]?\d+\.?\d*)\s+([+-]?\d+\.?\d*)/;

for (const line of sampleLines) {
  const m = line.match(re);
  if (m) {
    console.log('MATCH:', m[1], 'flag:', JSON.stringify(m[2]), 'az:', m[3], 'el:', m[4]);
  } else {
    console.log('FAILED:', line);
  }
}

