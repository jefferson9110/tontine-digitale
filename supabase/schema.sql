-- TontineDigitale - Schema Supabase
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  telephone TEXT,
  avatar_url TEXT,
  role_global TEXT NOT NULL DEFAULT 'membre' CHECK (role_global IN ('admin','organisateur','membre','tresorier')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- tontines
CREATE TABLE IF NOT EXISTS public.tontines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'rotatif' CHECK (type IN ('rotatif','fixe','encheres')),
  statut TEXT NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon','active','suspendue','terminee')),
  montant_cotisation NUMERIC(12,2) NOT NULL CHECK (montant_cotisation > 0),
  devise TEXT NOT NULL DEFAULT 'XAF' CHECK (devise IN ('XAF','EUR','USD')),
  frequence TEXT NOT NULL DEFAULT 'mensuel' CHECK (frequence IN ('hebdomadaire','bimensuel','mensuel','trimestriel')),
  date_debut DATE NOT NULL,
  date_fin_prevue DATE,
  nombre_membres_max INT NOT NULL DEFAULT 12,
  cycle_actuel INT NOT NULL DEFAULT 0,
  total_cycles INT NOT NULL DEFAULT 0,
  organisateur_id UUID NOT NULL REFERENCES public.profiles(id),
  tresorier_id UUID REFERENCES public.profiles(id),
  lien_invitation TEXT UNIQUE,
  penalite_retard NUMERIC(5,2) NOT NULL DEFAULT 5,
  delai_grace_jours INT NOT NULL DEFAULT 3,
  regles TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- membres_tontine
CREATE TABLE IF NOT EXISTS public.membres_tontine (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tontine_id UUID NOT NULL REFERENCES public.tontines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'membre' CHECK (role IN ('organisateur','tresorier','membre')),
  statut TEXT NOT NULL DEFAULT 'invite' CHECK (statut IN ('invite','en_attente','actif','suspendu','exclu')),
  ordre_beneficiaire INT,
  a_beneficie BOOLEAN NOT NULL DEFAULT FALSE,
  date_adhesion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tontine_id, user_id)
);

-- cotisations
CREATE TABLE IF NOT EXISTS public.cotisations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tontine_id UUID NOT NULL REFERENCES public.tontines(id) ON DELETE CASCADE,
  membre_id UUID NOT NULL REFERENCES public.membres_tontine(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  cycle_numero INT NOT NULL,
  montant_du NUMERIC(12,2) NOT NULL,
  montant_paye NUMERIC(12,2) NOT NULL DEFAULT 0,
  penalite NUMERIC(12,2) NOT NULL DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente','payee','en_retard','partiellement_payee')),
  date_echeance DATE NOT NULL,
  date_paiement TIMESTAMPTZ,
  reference TEXT,
  note TEXT,
  valide_par UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- tours_beneficiaires
CREATE TABLE IF NOT EXISTS public.tours_beneficiaires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tontine_id UUID NOT NULL REFERENCES public.tontines(id) ON DELETE CASCADE,
  membre_id UUID NOT NULL REFERENCES public.membres_tontine(id),
  cycle_numero INT NOT NULL,
  montant_total NUMERIC(12,2) NOT NULL,
  date_prevue DATE NOT NULL,
  date_versement TIMESTAMPTZ,
  statut TEXT NOT NULL DEFAULT 'planifie' CHECK (statut IN ('planifie','verse','reporte')),
  UNIQUE(tontine_id, cycle_numero)
);

-- notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  titre TEXT NOT NULL,
  message TEXT NOT NULL,
  lu BOOLEAN NOT NULL DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tontine_id UUID NOT NULL REFERENCES public.tontines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  contenu TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- votes
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tontine_id UUID NOT NULL REFERENCES public.tontines(id) ON DELETE CASCADE,
  votant_id UUID NOT NULL REFERENCES public.profiles(id),
  candidat_id UUID NOT NULL REFERENCES public.profiles(id),
  cycle_cible INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tontine_id, votant_id, cycle_cible)
);

-- Trigger: updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tontines_updated BEFORE UPDATE ON public.tontines FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nom, prenom, role_global)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nom', 'Utilisateur'),
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    COALESCE(NEW.raw_user_meta_data->>'role_global', 'membre')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tontines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membres_tontine ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tours_beneficiaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Policies de base
CREATE POLICY "own_profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "member_tontines" ON public.tontines FOR SELECT USING (id IN (SELECT tontine_id FROM public.membres_tontine WHERE user_id = auth.uid()) OR organisateur_id = auth.uid());
CREATE POLICY "own_tontine_insert" ON public.tontines FOR INSERT WITH CHECK (organisateur_id = auth.uid());
CREATE POLICY "own_tontine_update" ON public.tontines FOR UPDATE USING (organisateur_id = auth.uid());
CREATE POLICY "membre_see_members" ON public.membres_tontine FOR SELECT USING (tontine_id IN (SELECT tontine_id FROM public.membres_tontine WHERE user_id = auth.uid()));
CREATE POLICY "org_manage_members" ON public.membres_tontine FOR INSERT WITH CHECK (tontine_id IN (SELECT id FROM public.tontines WHERE organisateur_id = auth.uid()) OR user_id = auth.uid());
CREATE POLICY "own_notifications" ON public.notifications FOR ALL USING (user_id = auth.uid());
CREATE POLICY "member_cotisations" ON public.cotisations FOR SELECT USING (tontine_id IN (SELECT tontine_id FROM public.membres_tontine WHERE user_id = auth.uid()));
CREATE POLICY "org_cotisations_update" ON public.cotisations FOR UPDATE USING (tontine_id IN (SELECT id FROM public.tontines WHERE organisateur_id = auth.uid()));
CREATE POLICY "member_messages" ON public.messages FOR SELECT USING (tontine_id IN (SELECT tontine_id FROM public.membres_tontine WHERE user_id = auth.uid() AND statut='actif'));
CREATE POLICY "insert_messages" ON public.messages FOR INSERT WITH CHECK (user_id = auth.uid() AND tontine_id IN (SELECT tontine_id FROM public.membres_tontine WHERE user_id = auth.uid() AND statut='actif'));
CREATE POLICY "member_tours" ON public.tours_beneficiaires FOR SELECT USING (tontine_id IN (SELECT tontine_id FROM public.membres_tontine WHERE user_id = auth.uid()));
CREATE POLICY "own_votes" ON public.votes FOR ALL USING (votant_id = auth.uid());
