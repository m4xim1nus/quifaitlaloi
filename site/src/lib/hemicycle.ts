// Disposition d'un hémicycle : n sièges en rangées concentriques sur un demi-cercle de rayon 1,
// centré en (0, 0), y vers le haut. Les sièges sont rendus de gauche à droite (angle décroissant),
// pour être attribués aux groupes dans l'ordre des blocs, de la gauche vers la droite.

export interface Siege {
  x: number;
  y: number;
}

/** Nombre de rangées : environ 48 sièges par rangée (AN 577 → 12, Sénat 348 → 9). */
export function rangees(n: number): number {
  return Math.max(1, Math.round(Math.sqrt(n / 4)));
}

/** Rayon d'un siège, en unités du rayon extérieur. */
export function rayonSiege(n: number, interieur = 0.38): number {
  const r = rangees(n);
  return ((1 - interieur) / Math.max(r - 1, 1)) * 0.42;
}

export function sieges(n: number, interieur = 0.38): Siege[] {
  if (n <= 0) return [];
  const r = rangees(n);
  const rayons = Array.from({ length: r }, (_, i) =>
    r === 1 ? 1 : interieur + ((1 - interieur) * i) / (r - 1)
  );
  const somme = rayons.reduce((a, b) => a + b, 0);
  // Sièges par rangée proportionnels au rayon, arrondis puis ajustés pour tomber juste.
  const parRang = rayons.map((ra) => Math.floor((n * ra) / somme));
  let reste = n - parRang.reduce((a, b) => a + b, 0);
  for (let i = r - 1; reste > 0; i = (i - 1 + r) % r, reste--) parRang[i]++;
  const tous: (Siege & { angle: number; rayon: number })[] = [];
  rayons.forEach((ra, i) => {
    const k = parRang[i];
    for (let j = 0; j < k; j++) {
      const angle = k === 1 ? Math.PI / 2 : Math.PI - (Math.PI * j) / (k - 1);
      tous.push({ x: ra * Math.cos(angle), y: ra * Math.sin(angle), angle, rayon: ra });
    }
  });
  // Ordre de lecture : de gauche à droite, puis de l'intérieur vers l'extérieur.
  tous.sort((a, b) => b.angle - a.angle || a.rayon - b.rayon);
  return tous.map(({ x, y }) => ({ x, y }));
}
