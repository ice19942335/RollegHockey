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
    round INTEGER,
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
CREATE INDEX IF NOT EXISTS idx_rolleg_games_tournament_round ON public.rolleg_games("tournamentId", round);
CREATE INDEX IF NOT EXISTS idx_rolleg_games_home_team_id ON public.rolleg_games("homeTeamId");
CREATE INDEX IF NOT EXISTS idx_rolleg_games_away_team_id ON public.rolleg_games("awayTeamId");

-- 5. Включение Row Level Security (RLS)
ALTER TABLE public.rolleg_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rolleg_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rolleg_games ENABLE ROW LEVEL SECURITY;

-- 5.1 Realtime: чтобы DELETE-события содержали старую строку (нужно для фильтрации по tournamentId)
-- Без этого удаление команды может не приходить в подписку с filter: tournamentId=eq.<id>
ALTER TABLE public.rolleg_teams REPLICA IDENTITY FULL;
ALTER TABLE public.rolleg_games REPLICA IDENTITY FULL;

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

-- 7. RPC: атомарное изменение счёта (Realtime-friendly)
-- Использовать через supabase.rpc('rolleg_increment_game_score', ...)
CREATE OR REPLACE FUNCTION public.rolleg_increment_game_score(
    p_game_id TEXT,
    p_tournament_id TEXT,
    p_side TEXT,
    p_delta INTEGER
)
RETURNS TABLE (
    id TEXT,
    "tournamentId" TEXT,
    "homeTeamId" TEXT,
    "awayTeamId" TEXT,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "gameType" TEXT,
    round INTEGER,
    date TEXT,
    pending BOOLEAN
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    IF p_side IS NULL OR p_side NOT IN ('home', 'away') THEN
        RAISE EXCEPTION 'p_side must be ''home'' or ''away''' USING ERRCODE = '22023';
    END IF;

    IF p_delta IS NULL THEN
        p_delta := 0;
    END IF;

    RETURN QUERY
    UPDATE public.rolleg_games g
    SET
        "homeScore" = CASE
            WHEN p_side = 'home' THEN GREATEST(0, COALESCE(g."homeScore", 0) + p_delta)
            ELSE g."homeScore"
        END,
        "awayScore" = CASE
            WHEN p_side = 'away' THEN GREATEST(0, COALESCE(g."awayScore", 0) + p_delta)
            ELSE g."awayScore"
        END
    WHERE g.id = p_game_id
      AND g."tournamentId" = p_tournament_id
    RETURNING
        g.id,
        g."tournamentId",
        g."homeTeamId",
        g."awayTeamId",
        g."homeScore",
        g."awayScore",
        g."gameType",
        g.round,
        g.date,
        g.pending;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rolleg_increment_game_score(TEXT, TEXT, TEXT, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.rolleg_increment_game_score(TEXT, TEXT, TEXT, INTEGER) TO authenticated;
