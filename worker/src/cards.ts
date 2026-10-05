// How a saved card becomes the JSON the app reads, shared by the catch, collection and public profile code.

// Every card query carries its collection number: 1 for the first card a user caught, and so on.
// Cards from one photo share a created time, so the id breaks the tie (they're numbered -0, -1, -2).
export const CARD_WITH_NUMBER = `SELECT c.*, (SELECT COUNT(*) FROM cards x WHERE x.user_id = c.user_id
    AND (x.created_at < c.created_at OR (x.created_at = c.created_at AND x.id <= c.id))) AS number
  FROM cards c WHERE c.id = ? AND c.user_id = ?`;

export function rowToCard(r: any) {
  return {
    id: r.id,
    number: r.number,
    name: r.name,
    species: r.species,
    isStatue: !!r.is_statue,
    isSample: !!r.is_sample,
    series: r.series ?? "founders",
    day: r.local_day ?? String(r.created_at).slice(0, 10), // the explorer's own calendar day for this catch
    wild: !!r.wild,
    animalClass: r.animal_class,
    rarity: r.rarity,
    description: r.description,
    traits: JSON.parse(r.traits),
    stats: JSON.parse(r.stats),
    special: { name: r.special_name, description: r.special_description },
    facts: r.facts && r.facts !== "{}" ? JSON.parse(r.facts) : null,
    artUrl: `/api/art/${r.art_key}`,
    createdAt: r.created_at,
  };
}
