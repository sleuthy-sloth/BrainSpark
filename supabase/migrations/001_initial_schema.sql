-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_played_date DATE
);

-- Game sessions
CREATE TABLE public.game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL, -- 'math_sprint' | 'memory_match' | 'speed_tap' | 'word_twist'
  score INTEGER NOT NULL,
  duration_seconds INTEGER,
  difficulty TEXT, -- 'easy' | 'medium' | 'hard'
  is_daily_challenge BOOLEAN DEFAULT FALSE,
  played_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily challenges (one row per date)
CREATE TABLE public.daily_challenges (
  challenge_date DATE PRIMARY KEY,
  game_sequence JSONB NOT NULL, -- array of {game_type, seed, difficulty}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily challenge completions
CREATE TABLE public.daily_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_date DATE REFERENCES public.daily_challenges(challenge_date),
  total_score INTEGER,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_date)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only read/write their own data
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own sessions" ON public.game_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own sessions" ON public.game_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view daily challenges" ON public.daily_challenges
  FOR SELECT TO anon, authenticated USING (true);

-- Stats aggregation function
CREATE OR REPLACE FUNCTION public.get_user_stats(p_user_id UUID)
RETURNS TABLE (
  game_type TEXT,
  total_plays BIGINT,
  avg_score NUMERIC,
  best_score INT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    gs.game_type,
    COUNT(*)::BIGINT AS total_plays,
    ROUND(AVG(gs.score))::NUMERIC AS avg_score,
    MAX(gs.score)::INT AS best_score
  FROM public.game_sessions gs
  WHERE gs.user_id = p_user_id
  GROUP BY gs.game_type
  ORDER BY gs.game_type;
END;
$$;
