// server/src/services/pandascore.ts
// Service for fetching match data from the PandaScore API

const PANDASCORE_BASE_URL = 'https://api.pandascore.co';
const SUPPORTED_GAMES = 'cs-2,valorant,lol';
const PER_PAGE = 50;

export interface PandaScoreMatch {
  id: number;
  name: string;
  scheduled_at: string | null;
  status: string;
  videogame: {
    slug: string;
    name: string;
  };
  league: {
    name: string;
  };
  serie: {
    full_name: string;
  };
  tournament: {
    name: string;
  };
  opponents: Array<{
    opponent: {
      id: number;
      name: string;
      acronym: string | null;
      image_url: string | null;
    };
    type: string;
  }>;
  winner: {
    id: number;
    name: string;
  } | null;
  results: Array<{
    team_id: number;
    score: number;
  }>;
}

export interface MappedMatch {
  external_id: string;
  game: string;
  tournament: string;
  team_a: string;
  team_b: string;
  scheduled_at: string | null;
  status: 'upcoming' | 'live' | 'finished';
  winner: string | null;
}

function mapStatus(pandaStatus: string): 'upcoming' | 'live' | 'finished' {
  switch (pandaStatus) {
    case 'not_started':
      return 'upcoming';
    case 'running':
      return 'live';
    case 'finished':
    case 'canceled':
      return 'finished';
    default:
      return 'upcoming';
  }
}

function mapGame(slug: string): string {
  switch (slug) {
    case 'cs-go':
    case 'cs-2':
      return 'cs2';
    case 'league-of-legends':
    case 'lol':
      return 'lol';
    case 'valorant':
      return 'valorant';
    default:
      return slug;
  }
}

function determineWinner(match: PandaScoreMatch): string | null {
  if (!match.winner) return null;
  // Find which opponent position the winner is
  if (match.opponents.length >= 2) {
    if (match.opponents[0]?.opponent.id === match.winner.id) return 'team_a';
    if (match.opponents[1]?.opponent.id === match.winner.id) return 'team_b';
  }
  return null;
}

function mapMatch(raw: PandaScoreMatch): MappedMatch | null {
  // Skip matches without two opponents
  if (!raw.opponents || raw.opponents.length < 2) return null;

  const teamA = raw.opponents[0]?.opponent;
  const teamB = raw.opponents[1]?.opponent;
  if (!teamA || !teamB) return null;

  return {
    external_id: String(raw.id),
    game: mapGame(raw.videogame?.slug ?? ''),
    tournament: raw.tournament?.name ?? raw.league?.name ?? 'Unknown Tournament',
    team_a: teamA.name,
    team_b: teamB.name,
    scheduled_at: raw.scheduled_at ?? null,
    status: mapStatus(raw.status),
    winner: determineWinner(raw),
  };
}

export async function fetchMatches(
  status: 'upcoming' | 'running' | 'past'
): Promise<MappedMatch[]> {
  const apiKey = process.env.PANDASCORE_API_KEY;
  if (!apiKey) {
    console.error('[PandaScore] PANDASCORE_API_KEY is not set');
    return [];
  }

  const url = `${PANDASCORE_BASE_URL}/matches/${status}?filter[videogame]=${SUPPORTED_GAMES}&per_page=${PER_PAGE}`;

  try {
    console.log(`[PandaScore] Fetching ${status} matches...`);
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.error(
        `[PandaScore] API returned ${response.status}: ${response.statusText}`
      );
      return [];
    }

    const rawMatches = (await response.json()) as PandaScoreMatch[];
    const mapped = rawMatches
      .map(mapMatch)
      .filter((m): m is MappedMatch => m !== null);

    console.log(
      `[PandaScore] Fetched ${rawMatches.length} raw, mapped ${mapped.length} ${status} matches`
    );
    return mapped;
  } catch (error) {
    console.error(`[PandaScore] Error fetching ${status} matches:`, error);
    return [];
  }
}
