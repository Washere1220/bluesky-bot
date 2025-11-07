/**
 * Generate username variations from a base word
 * Rules: NO numbers, max double letters
 * @param {string} baseWord - Base username (e.g., "Mary")
 * @param {number} count - Number of variations needed
 * @returns {string[]} - Array of username variations (3x count for buffer)
 */
export function generateUsernameVariations(baseWord, count) {
  const suffixes = [
    'Cutie', 'Bby', 'Angel', 'Luv', 'Doll', 'Vibes', 'Soft', 'Baby',
    'Girl', 'Boy', 'Love', 'Heart', 'Star', 'Moon', 'Sun', 'Sky',
    'Dream', 'Sweet', 'Pure', 'Real', 'Official', 'Main', 'Aesthetic',
    'Core', 'Mode', 'Energy', 'Aura', 'Vibe', 'Mood', 'Era'
  ];

  const prefixes = [
    'Cutie', 'Sweet', 'Little', 'Soft', 'Real', 'Official', 'The',
    'Lil', 'Big', 'Baby', 'Tiny', 'Smol', 'Pure', 'True', 'Only',
    'Just', 'Your', 'Pretty', 'Lovely', 'Angel', 'Star', 'Moon'
  ];

  const doubleLetters = ['xx', 'yy', 'zz', 'ii', 'ee', 'oo'];

  const variations = new Set();

  // Helper to capitalize first letter
  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  const baseCapitalized = capitalize(baseWord);

  // Pattern 1: Base + double letters
  doubleLetters.forEach(letters => {
    variations.add(baseCapitalized + letters);
    variations.add(letters + baseCapitalized);
    variations.add(letters + baseCapitalized + letters);
  });

  // Pattern 2: Base + suffix
  suffixes.forEach(suffix => {
    variations.add(baseCapitalized + suffix);
    variations.add(baseCapitalized + capitalize(suffix));
  });

  // Pattern 3: Prefix + base
  prefixes.forEach(prefix => {
    variations.add(prefix + baseCapitalized);
    variations.add(capitalize(prefix) + baseCapitalized);
  });

  // Pattern 4: Prefix + base + double
  prefixes.slice(0, 10).forEach(prefix => {
    doubleLetters.slice(0, 3).forEach(letters => {
      variations.add(capitalize(prefix) + baseCapitalized + letters);
      variations.add(prefix.toLowerCase() + baseCapitalized + letters);
    });
  });

  // Pattern 5: Base + suffix + double
  suffixes.slice(0, 10).forEach(suffix => {
    doubleLetters.slice(0, 3).forEach(letters => {
      variations.add(baseCapitalized + suffix + letters);
      variations.add(baseCapitalized + capitalize(suffix) + letters);
    });
  });

  // Pattern 6: Double + base + suffix
  doubleLetters.slice(0, 3).forEach(letters => {
    suffixes.slice(0, 10).forEach(suffix => {
      variations.add(letters + baseCapitalized + suffix);
      variations.add(letters + baseCapitalized + capitalize(suffix));
    });
  });

  // Pattern 7: Combined variations
  const combined = [
    `${baseCapitalized}BbyCutie`,
    `${baseCapitalized}AngelVibes`,
    `${baseCapitalized}SoftAura`,
    `Cutie${baseCapitalized}xx`,
    `Sweet${baseCapitalized}yy`,
    `Lil${baseCapitalized}Doll`,
    `Real${baseCapitalized}Official`,
    `The${baseCapitalized}`,
    `${baseCapitalized}Mode`,
    `${baseCapitalized}Era`,
    `${baseCapitalized}Core`,
    `${baseCapitalized}Energy`,
    `Soft${baseCapitalized}Vibes`,
    `Pure${baseCapitalized}Angel`
  ];

  combined.forEach(v => variations.add(v));

  // Convert to array and shuffle
  const variationsArray = Array.from(variations);

  // Fisher-Yates shuffle
  for (let i = variationsArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [variationsArray[i], variationsArray[j]] = [variationsArray[j], variationsArray[i]];
  }

  // Return 3x the requested count for buffer
  const targetCount = count * 3;

  // If we don't have enough, generate more by combining existing patterns
  while (variationsArray.length < targetCount) {
    const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomDouble = doubleLetters[Math.floor(Math.random() * doubleLetters.length)];

    const extraVariations = [
      `${randomPrefix}${baseCapitalized}${randomSuffix}`,
      `${baseCapitalized}${randomSuffix}${randomDouble}`,
      `${randomDouble}${randomPrefix}${baseCapitalized}`,
      `${randomPrefix}${baseCapitalized}${randomDouble}${randomSuffix}`
    ];

    extraVariations.forEach(v => {
      if (variationsArray.length < targetCount && !variationsArray.includes(v)) {
        variationsArray.push(v);
      }
    });
  }

  return variationsArray.slice(0, targetCount);
}
