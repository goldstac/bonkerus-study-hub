CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Anonymous scholar',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.dumps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  author_name TEXT NOT NULL DEFAULT 'Anonymous scholar',
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  link TEXT,
  subject TEXT NOT NULL DEFAULT 'General',
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.dumps TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dumps TO authenticated;
GRANT ALL ON public.dumps TO service_role;
ALTER TABLE public.dumps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dumps are viewable by everyone" ON public.dumps FOR SELECT USING (true);
CREATE POLICY "Users can create own dumps" ON public.dumps FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dumps" ON public.dumps FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own dumps" ON public.dumps FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX dumps_created_at_idx ON public.dumps (created_at DESC);

CREATE TABLE public.saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  dump_id UUID NOT NULL REFERENCES public.dumps ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, dump_id)
);
GRANT SELECT, INSERT, DELETE ON public.saves TO authenticated;
GRANT ALL ON public.saves TO service_role;
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own saves" ON public.saves FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own saves" ON public.saves FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saves" ON public.saves FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER update_dumps_updated_at BEFORE UPDATE ON public.dumps
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'Anonymous scholar'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.dumps (author_name, title, body, link, subject, tags) VALUES
('Mara K.', 'Standing waves in a pipe', 'Open-open pipes fit n·λ/2, open-closed fit odd multiples of λ/4. Draw the pressure node first — the displacement antinode always sits where pressure is flat. Four worked boundary-condition examples plus a cheat-sheet table.', 'https://openstax.org/books/university-physics-volume-1/pages/17-4-normal-modes-of-a-standing-sound-wave', 'Physics', ARRAY['waves','acoustics','exam']),
('Theo R.', 'Linked lists without tears', 'Draw the pointers before you write a line of code. Insert-at-head is three steps: new node, new.next = head, head = new. The off-by-one trap is always the tail sentinel — keep a dummy head and half your edge cases vanish.', 'https://visualgo.net/en/list', 'CS', ARRAY['data structures','pointers']),
('Priya N.', 'Photosynthesis at a glance', 'Light reactions live in the thylakoid membrane and make ATP + NADPH. The Calvin cycle lives in the stroma and spends them fixing CO2 into G3P. Six turns per glucose. If you can draw one diagram, draw that split.', 'https://www.khanacademy.org/science/biology/photosynthesis-in-plants', 'Bio', ARRAY['cells','calvin cycle']),
('Devk', 'Rust ownership in five rules', '1) One owner per value. 2) Move is not copy unless the type is Copy. 3) &T borrows shared, &mut T borrows exclusive. 4) A lifetime lasts as long as the borrow, not the value. 5) When in doubt, .clone() and refactor once it compiles.', 'https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html', 'CS', ARRAY['rust','memory']),
('Lumen', 'The dichotomy of control', 'Epictetus: some things are up to us, some are not. Before a stressful day write two columns — left is my effort, right is the outcome. Act only on the left. Marcus Aurelius Book 2 is the whole idea in one page.', 'https://standardebooks.org/ebooks/marcus-aurelius/meditations', 'Philosophy', ARRAY['stoicism','mindset']),
('Rxn', 'Krebs cycle, eight steps no mercy', 'Runs in the mitochondrial matrix. Acetyl-CoA (2C) + oxaloacetate (4C) becomes citrate (6C). Per turn: 3 NADH, 1 FADH2, 1 GTP, 2 CO2. Double everything per glucose. Oxaloacetate is regenerated, that is why it is a cycle.', NULL, 'Bio', ARRAY['biochem','metabolism','exam']),
('Ines V.', 'Eigenvalues finally clicked', 'Av = λv means the vector only stretches along its own axis. For 2x2 solve det(A − λI) = 0 for the characteristic polynomial, then plug each λ back to find the null space. The geometry sells it long before the algebra does.', 'https://www.3blue1brown.com/lessons/eigenvalues', 'Math', ARRAY['linear algebra','matrices']),
('Sam O.', 'Big-O without the hand-waving', 'Big-O is an upper bound on growth, not a stopwatch. Drop constants and lower-order terms. Nested loop over the same n is O(n²); halving each step is O(log n); doing that n times is O(n log n) — that is why good sorts land there.', NULL, 'CS', ARRAY['algorithms','complexity']);