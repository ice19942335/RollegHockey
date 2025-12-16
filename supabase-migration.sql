-- Миграция базы данных для RollegHockey
-- Выполнить в Supabase Dashboard -> SQL Editor

-- 1. Создание таблицы rolleg_tournaments
CREATE TABLE IF NOT EXISTS public.rolleg_tournaments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "startDate" DATE,
    "endDate" DATE,
    description TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Создание таблицы rolleg_teams
CREATE TABLE IF NOT EXISTS public.rolleg_teams (
    id TEXT PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    name TEXT NOT NULL,
    logo TEXT DEFAULT '🏒',
    color TEXT DEFAULT '#1e3c72',
    CONSTRAINT fk_rolleg_teams_tournament 
        FOREIGN KEY ("tournamentId") 
        REFERENCES public.rolleg_tournaments(id) 
        ON DELETE CASCADE
);

-- 3. Создание таблицы rolleg_games
CREATE TABLE IF NOT EXISTS public.rolleg_games (
    id TEXT PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "homeScore" INTEGER DEFAULT 0,
    "awayScore" INTEGER DEFAULT 0,
    "gameType" TEXT DEFAULT 'regular',
    date TEXT,
    pending BOOLEAN DEFAULT false,
    CONSTRAINT fk_rolleg_games_tournament 
        FOREIGN KEY ("tournamentId") 
        REFERENCES public.rolleg_tournaments(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_rolleg_games_home_team 
        FOREIGN KEY ("homeTeamId") 
        REFERENCES public.rolleg_teams(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_rolleg_games_away_team 
        FOREIGN KEY ("awayTeamId") 
        REFERENCES public.rolleg_teams(id) 
        ON DELETE CASCADE
);

-- 4. Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_rolleg_teams_tournament_id ON public.rolleg_teams("tournamentId");
CREATE INDEX IF NOT EXISTS idx_rolleg_games_tournament_id ON public.rolleg_games("tournamentId");
CREATE INDEX IF NOT EXISTS idx_rolleg_games_home_team_id ON public.rolleg_games("homeTeamId");
CREATE INDEX IF NOT EXISTS idx_rolleg_games_away_team_id ON public.rolleg_games("awayTeamId");

-- 5. Включение Row Level Security (RLS)
ALTER TABLE public.rolleg_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rolleg_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rolleg_games ENABLE ROW LEVEL SECURITY;

-- 6. Создание RLS политик для публичного доступа (anon)
-- Политики для rolleg_tournaments
CREATE POLICY "Allow public SELECT on rolleg_tournaments" 
    ON public.rolleg_tournaments FOR SELECT 
    TO anon 
    USING (true);

CREATE POLICY "Allow public INSERT on rolleg_tournaments" 
    ON public.rolleg_tournaments FOR INSERT 
    TO anon 
    WITH CHECK (true);

CREATE POLICY "Allow public UPDATE on rolleg_tournaments" 
    ON public.rolleg_tournaments FOR UPDATE 
    TO anon 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Allow public DELETE on rolleg_tournaments" 
    ON public.rolleg_tournaments FOR DELETE 
    TO anon 
    USING (true);

-- Политики для rolleg_teams
CREATE POLICY "Allow public SELECT on rolleg_teams" 
    ON public.rolleg_teams FOR SELECT 
    TO anon 
    USING (true);

CREATE POLICY "Allow public INSERT on rolleg_teams" 
    ON public.rolleg_teams FOR INSERT 
    TO anon 
    WITH CHECK (true);

CREATE POLICY "Allow public UPDATE on rolleg_teams" 
    ON public.rolleg_teams FOR UPDATE 
    TO anon 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Allow public DELETE on rolleg_teams" 
    ON public.rolleg_teams FOR DELETE 
    TO anon 
    USING (true);

-- Политики для rolleg_games
CREATE POLICY "Allow public SELECT on rolleg_games" 
    ON public.rolleg_games FOR SELECT 
    TO anon 
    USING (true);

CREATE POLICY "Allow public INSERT on rolleg_games" 
    ON public.rolleg_games FOR INSERT 
    TO anon 
    WITH CHECK (true);

CREATE POLICY "Allow public UPDATE on rolleg_games" 
    ON public.rolleg_games FOR UPDATE 
    TO anon 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Allow public DELETE on rolleg_games" 
    ON public.rolleg_games FOR DELETE 
    TO anon 
    USING (true);
