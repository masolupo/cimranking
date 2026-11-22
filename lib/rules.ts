export const RULES = {
  win: { points: 5, coins: 10 },
  participation: { points: 1, coins: 1 },
  deleteWindowHours: 24,
  /** percentuale del prezzo restituita quando si rivende un oggetto (vedi sell_item in SQL) */
  sellPercent: 70,
} as const;

/** Monete ricevute vendendo un oggetto: stesso calcolo intero del database. */
export function sellPrice(price: number) {
  return Math.floor((price * RULES.sellPercent) / 100);
}
