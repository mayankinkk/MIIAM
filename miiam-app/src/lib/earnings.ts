export function calculateEarnings(
  distance: number,
  baseFare: number = 40,
  perKm: number = 8,
  peakMultiplier: number = 1
): number {
  return Math.round((baseFare + distance * perKm) * peakMultiplier);
}
