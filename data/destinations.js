// Quick-travel destinations for the full map (v2.7.1). x/z = a point on (or next to) the carriageway in game metres;
// the map card shows its photo (assets/tp/<id>.webp), the direction and distance from you, and picking it offers the
// carriageway + direction choices (main.tpOptions). Names: Japanese + reading in the player's language via names.js.
export const DESTS = [
  { id: 'daikoku', name: '大黒PA', x: 120, z: -60, spawn: 'pa' },
  { id: 'baybridge', name: '横浜ベイブリッジ', x: -560, z: 760 },
  { id: 'honmoku', name: '本牧JCT', x: -1904, z: 2709 },
  { id: 'mm', name: 'みなとみらい', x: -3480, z: -60, spawn: 'mm' },
  { id: 'chinatown', name: '横浜中華街', x: -3080, z: 2045, spawn: 'chinatown' },
  { id: 'namamugi', name: '生麦JCT', x: -906, z: -3428 },
  { id: 'ukishima', name: '川崎浮島JCT', x: 9974, z: -6026 },
  { id: 'umihotaru', name: '海ほたるPA', x: 17681, z: -276, spawn: 'umi' },
  { id: 'haneda', name: '羽田空港', x: 9049, z: -9720 },
  { id: 'oi', name: '大井JCT', x: 6392, z: -15370 },
  { id: 'rainbow', name: 'レインボーブリッジ', x: 8115, z: -19170 },
  { id: 'c1', name: '首都高 都心環状線', x: 5810, z: -24414 },
  { id: 'hakone', name: '箱根ターンパイク', x: -57257, z: 30719 },
  { id: 'zama', name: '座間ひまわり畑', x: -26884, z: -2774, spawn: 'zama' },
];
