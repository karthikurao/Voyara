const BASE_PACKING_ITEMS = [
  { item: 'Passport / ID', reason: 'Required for travel checkpoints and accommodation check-ins.' },
  { item: 'Comfortable walking shoes', reason: 'Daily itineraries include sustained exploration on foot.' },
  { item: 'Reusable water bottle', reason: 'Stay hydrated throughout activities.' },
  { item: 'Power bank', reason: 'Keep devices charged for navigation and photos.' },
];

const WEATHER_ITEMS = {
  winter: [{ item: 'Insulated jacket', reason: 'Colder conditions expected during the chosen travel period.' }],
  summer: [{ item: 'Sunscreen & hat', reason: 'Protection from strong sun during outdoor activities.' }],
  rainy: [{ item: 'Compact umbrella', reason: 'Quick showers are common this season.' }],
};

const VIBE_ITEMS = {
  Adventure: [{ item: 'Quick-dry clothing', reason: 'Adventure activities often involve changing conditions.' }],
  Relaxing: [{ item: 'Light reading / entertainment', reason: 'Enhance downtime moments.' }],
  Foodie: [{ item: 'Stain remover wipes', reason: 'Handle accidental spills during food tours.' }],
  Culture: [{ item: 'Respectful attire', reason: 'Certain cultural sites expect covered shoulders/knees.' }],
  Artsy: [{ item: 'Sketchbook or camera gear', reason: 'Capture inspiration from creative venues.' }],
  Party: [{ item: 'Evening wear', reason: 'Prepared for nightlife venues with dress codes.' }],
};

const PERIOD_KEYWORDS = {
  winter: ['december', 'january', 'february', 'winter'],
  summer: ['june', 'july', 'august', 'summer'],
  rainy: ['monsoon', 'rainy', 'september'],
};

function inferSeason(travelPeriod = '') {
  const lower = travelPeriod.toLowerCase();
  for (const [season, keywords] of Object.entries(PERIOD_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return season;
  }
  return null;
}

function estimateBudget(days, vibes = []) {
  const basePerDay = 90; // baseline for accommodation + food
  const vibeMultiplier = vibes.includes('Adventure') || vibes.includes('Party') ? 1.2 : 1;
  const foodieMultiplier = vibes.includes('Foodie') ? 1.1 : 1;
  const totalPerDay = Math.round(basePerDay * vibeMultiplier * foodieMultiplier);
  return {
    perDay: totalPerDay,
    total: totalPerDay * days,
    currency: 'USD',
  };
}

function buildPackingList(context = {}) {
  const vibes = context.vibes || [];
  const travelPeriod = context.travelPeriod || '';
  const season = inferSeason(travelPeriod);
  const items = [...BASE_PACKING_ITEMS];

  if (season && WEATHER_ITEMS[season]) {
    items.push(...WEATHER_ITEMS[season]);
  }

  vibes.forEach((vibe) => {
    if (VIBE_ITEMS[vibe]) {
      items.push(...VIBE_ITEMS[vibe]);
    }
  });

  if (context.transportMode === 'Car') {
    items.push({ item: 'Vehicle documents / rental agreement', reason: 'Required for highway checkpoints and rentals.' });
  }

  return items.map((entry) => ({ ...entry, checked: false }));
}

function buildPrepChecklist(context = {}) {
  const tasks = [
    { task: 'Confirm accommodation bookings', reason: 'Avoid last-minute scrambling on arrival.' },
    { task: 'Download offline maps', reason: 'Ensure navigation even without cell coverage.' },
    { task: 'Share itinerary with trusted contact', reason: 'Improves personal safety during travel.' },
  ];

  if (context.transportMode === 'Train') {
    tasks.push({ task: 'Reserve train seats in advance', reason: 'Popular routes sell out quickly.' });
  }

  if (context.transportMode === 'Bus') {
    tasks.push({ task: 'Arrive early at bus terminals', reason: 'Secures preferred seating and avoids overbooking issues.' });
  }

  if (context.transportMode === 'Airways') {
    tasks.push({ task: 'Check airline baggage limits', reason: 'Prevent unexpected airport fees.' });
  }

  return tasks.map((entry) => ({ ...entry, done: false }));
}

function extractHighlights(itinerary = []) {
  const highlights = [];
  itinerary.forEach((day) => {
    (day.timeline || []).slice(0, 2).forEach((slot) => {
      if (slot?.activity) {
        highlights.push(`${day.day}: ${slot.activity}`);
      }
    });
  });
  return highlights.slice(0, 5);
}

export function buildItineraryInsights(itineraryData = {}, context = {}) {
  const itinerary = itineraryData.itinerary || [];
  const days = itinerary.length || context.numDays || 1;
  const vibes = context.vibes || itineraryData.vibes || [];

  const summary = `A ${days}-day getaway in ${context.destination || itineraryData.destination || 'your chosen city'} focusing on ${
    vibes.length ? vibes.join(', ') : 'a balanced mix of experiences'
  }.`;

  return {
    summary,
    travelContext: {
      destination: context.destination || itineraryData.destination || '',
      sourceCity: context.sourceCity || '',
      numDays: days,
      transportMode: context.transportMode || 'Any',
      travelPeriod: context.travelPeriod || 'Any',
      vibes,
    },
    highlights: extractHighlights(itinerary),
    estimatedBudget: estimateBudget(days, vibes),
    packingList: buildPackingList(context),
    prepChecklist: buildPrepChecklist(context),
    generatedAt: new Date().toISOString(),
  };
}

export function mergeChecklistState(existing = {}, fresh = {}) {
  const merged = { ...fresh };

  if (existing.packingList && fresh.packingList) {
    merged.packingList = fresh.packingList.map((item) => {
      const match = existing.packingList.find((old) => old.item === item.item);
      return match ? { ...item, checked: match.checked } : item;
    });
  }

  if (existing.prepChecklist && fresh.prepChecklist) {
    merged.prepChecklist = fresh.prepChecklist.map((item) => {
      const match = existing.prepChecklist.find((old) => old.task === item.task);
      return match ? { ...item, done: match.done } : item;
    });
  }

  return merged;
}
