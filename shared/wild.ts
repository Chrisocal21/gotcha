// "Wild" means a wild species: not a pet or farm animal and not a statue. It's what the daily Wild ring, the
// outdoor badges and the Wild board count, so people have a reason to go and find real animals.
// The species facts already say "Domestic" for domesticated animals, so nothing new is asked of the AI.

export function isWildSpecies(status: string | null | undefined, isStatue: boolean, isSample = false): boolean {
  if (isStatue || isSample || !status) return false;
  return !/domestic/i.test(status);
}
