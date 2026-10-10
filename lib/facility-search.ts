export function matchesFacilityLocation(location: string | null, query: string) {
  const text = (location ?? '').toLocaleLowerCase('id-ID');
  const tokens = text.split(/[^\p{L}\p{N}]+/u);
  const words = query
    .toLocaleLowerCase('id-ID')
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean);

  return words.every((word) =>
    word.length === 1 ? tokens.includes(word) : text.includes(word)
  );
}
