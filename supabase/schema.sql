-- Utilizadores (gerido pelo Supabase Auth)
-- tabela auth.users já existe

-- Perfis públicos
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  total_points INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partidas
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,           -- ID da PandaScore API
  game TEXT NOT NULL,                -- 'cs2' | 'valorant' | 'lol'
  tournament TEXT NOT NULL,
  team_a TEXT NOT NULL,
  team_b TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'upcoming',    -- 'upcoming' | 'live' | 'finished'
  winner TEXT,                       -- 'team_a' | 'team_b' | 'draw'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Previsões
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  match_id UUID REFERENCES matches(id) NOT NULL,
  predicted_winner TEXT NOT NULL,    -- 'team_a' | 'team_b'
  points_earned INT,                 -- null até resultado confirmado
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)          -- um voto por utilizador por partida
);

-- Índices para performance
CREATE INDEX idx_predictions_match ON predictions(match_id);
CREATE INDEX idx_predictions_user ON predictions(user_id);
CREATE INDEX idx_matches_status ON matches(status);
