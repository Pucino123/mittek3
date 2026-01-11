CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'user'
);


--
-- Name: plan_tier; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.plan_tier AS ENUM (
    'basic',
    'plus',
    'pro'
);


--
-- Name: subscription_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.subscription_status AS ENUM (
    'active',
    'past_due',
    'canceled',
    'incomplete',
    'trialing'
);


--
-- Name: ticket_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ticket_status AS ENUM (
    'open',
    'in_progress',
    'resolved',
    'closed'
);


--
-- Name: check_admin_email(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_admin_email() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.email = 'kevin.therkildsen@icloud.com' THEN
    NEW.is_admin := TRUE;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: ensure_owner_access(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ensure_owner_access() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.email = 'kevin.therkildsen@icloud.com' THEN
    -- Ensure admin status
    NEW.is_admin := true;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: get_user_plan(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_plan(_user_id uuid) RETURNS public.plan_tier
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(
    (SELECT plan_tier FROM public.subscriptions 
     WHERE user_id = _user_id AND status = 'active'
     ORDER BY created_at DESC LIMIT 1),
    'basic'::plan_tier
  )
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  
  -- Also create a default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;


--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: is_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND is_admin = true
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: chat_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text DEFAULT 'Ny samtale'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chat_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text])))
);


--
-- Name: check_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.check_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    score integer NOT NULL,
    device_types text[] DEFAULT ARRAY['iphone'::text] NOT NULL,
    issues_found jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT check_history_score_check CHECK (((score >= 0) AND (score <= 100)))
);


--
-- Name: checkins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.checkins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    storage_free_gb numeric,
    has_pending_update boolean,
    sees_annoying_popups boolean,
    unsure_about_messages boolean,
    score integer,
    recommendations jsonb DEFAULT '[]'::jsonb,
    completed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT checkins_score_check CHECK (((score >= 0) AND (score <= 100)))
);


--
-- Name: glossary_terms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.glossary_terms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    term text NOT NULL,
    definition text NOT NULL,
    example text,
    category text DEFAULT 'generelt'::text,
    related_guide_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: guide_steps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guide_steps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    guide_id uuid NOT NULL,
    step_number integer NOT NULL,
    title text NOT NULL,
    instruction text NOT NULL,
    image_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    video_url text,
    device_type text[] DEFAULT ARRAY['universal'::text],
    tip_text text,
    warning_text text,
    animated_gif_url text,
    CONSTRAINT guide_steps_device_type_check CHECK ((device_type <@ ARRAY['iphone'::text, 'ipad'::text, 'mac'::text, 'universal'::text]))
);


--
-- Name: guides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guides (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    min_plan public.plan_tier DEFAULT 'basic'::public.plan_tier,
    is_published boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    category text DEFAULT 'hverdag'::text
);


--
-- Name: hardware_issues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hardware_issues (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    device_type text NOT NULL,
    problem_title text NOT NULL,
    problem_description text,
    solution_text text NOT NULL,
    category text DEFAULT 'troubleshooting'::text,
    severity text DEFAULT 'medium'::text,
    related_guide_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: panic_cases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.panic_cases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    incident_type text NOT NULL,
    money_risk text,
    clicked_or_shared text,
    action_plan jsonb DEFAULT '[]'::jsonb,
    notify_helper boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pending_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pending_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    checkout_session_id text NOT NULL,
    purchaser_email text NOT NULL,
    plan_tier public.plan_tier NOT NULL,
    stripe_customer_id text,
    stripe_subscription_id text,
    claimed boolean DEFAULT false,
    claimed_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email text,
    display_name text,
    is_admin boolean DEFAULT false,
    senior_mode_enabled boolean DEFAULT false,
    onboarding_completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    device_preference text DEFAULT 'iphone'::text,
    emergency_bank_phone text,
    emergency_helper_phone text,
    emergency_helper_name text,
    owned_devices text[] DEFAULT ARRAY['iphone'::text]
);


--
-- Name: quiz_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question text NOT NULL,
    scenario_description text,
    answer_is_scam boolean NOT NULL,
    explanation text NOT NULL,
    difficulty integer DEFAULT 1,
    category text DEFAULT 'generelt'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    stripe_customer_id text,
    stripe_subscription_id text,
    plan_tier public.plan_tier DEFAULT 'basic'::public.plan_tier,
    status public.subscription_status DEFAULT 'incomplete'::public.subscription_status,
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    cancel_at_period_end boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    trial_start timestamp with time zone,
    trial_end timestamp with time zone
);


--
-- Name: support_credits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_credits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credits_remaining integer DEFAULT 0,
    credits_used_this_month integer DEFAULT 0,
    last_reset_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: support_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    message text NOT NULL,
    is_admin_reply boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    category text NOT NULL,
    subject text NOT NULL,
    status public.ticket_status DEFAULT 'open'::public.ticket_status,
    priority integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: trusted_helpers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trusted_helpers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    helper_email text NOT NULL,
    helper_user_id uuid,
    invitation_accepted boolean DEFAULT false,
    can_view_dashboard boolean DEFAULT true,
    can_view_checkins boolean DEFAULT true,
    can_view_tickets boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    invitation_token text,
    permissions jsonb DEFAULT '{"can_view_tickets": false, "can_view_checkins": true, "can_view_dashboard": true}'::jsonb,
    can_view_notes boolean DEFAULT false,
    medical_id_verified boolean DEFAULT false,
    medical_id_verified_at timestamp with time zone
);


--
-- Name: user_achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_achievements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    guides_read text[] DEFAULT '{}'::text[],
    tools_used text[] DEFAULT '{}'::text[],
    checkins_completed integer DEFAULT 0,
    total_xp integer DEFAULT 0,
    current_level text DEFAULT 'Ny i Tech'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    content text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_wishlist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_wishlist (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    item_key text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vault_folders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vault_folders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name_encrypted text NOT NULL,
    iv text NOT NULL,
    icon text DEFAULT 'folder'::text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vault_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vault_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    folder_id uuid,
    title_encrypted text NOT NULL,
    secret_encrypted text NOT NULL,
    note_encrypted text,
    iv text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vault_password_resets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vault_password_resets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vault_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vault_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    salt text NOT NULL,
    kdf_iterations integer DEFAULT 100000,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: chat_conversations chat_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: check_history check_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.check_history
    ADD CONSTRAINT check_history_pkey PRIMARY KEY (id);


--
-- Name: checkins checkins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checkins
    ADD CONSTRAINT checkins_pkey PRIMARY KEY (id);


--
-- Name: glossary_terms glossary_terms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.glossary_terms
    ADD CONSTRAINT glossary_terms_pkey PRIMARY KEY (id);


--
-- Name: glossary_terms glossary_terms_term_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.glossary_terms
    ADD CONSTRAINT glossary_terms_term_key UNIQUE (term);


--
-- Name: guide_steps guide_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_steps
    ADD CONSTRAINT guide_steps_pkey PRIMARY KEY (id);


--
-- Name: guides guides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guides
    ADD CONSTRAINT guides_pkey PRIMARY KEY (id);


--
-- Name: hardware_issues hardware_issues_device_type_problem_title_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hardware_issues
    ADD CONSTRAINT hardware_issues_device_type_problem_title_key UNIQUE (device_type, problem_title);


--
-- Name: hardware_issues hardware_issues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hardware_issues
    ADD CONSTRAINT hardware_issues_pkey PRIMARY KEY (id);


--
-- Name: panic_cases panic_cases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.panic_cases
    ADD CONSTRAINT panic_cases_pkey PRIMARY KEY (id);


--
-- Name: pending_subscriptions pending_subscriptions_checkout_session_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_subscriptions
    ADD CONSTRAINT pending_subscriptions_checkout_session_id_key UNIQUE (checkout_session_id);


--
-- Name: pending_subscriptions pending_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_subscriptions
    ADD CONSTRAINT pending_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: quiz_questions quiz_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_stripe_subscription_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id);


--
-- Name: support_credits support_credits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_credits
    ADD CONSTRAINT support_credits_pkey PRIMARY KEY (id);


--
-- Name: support_credits support_credits_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_credits
    ADD CONSTRAINT support_credits_user_id_key UNIQUE (user_id);


--
-- Name: support_messages support_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: trusted_helpers trusted_helpers_invitation_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trusted_helpers
    ADD CONSTRAINT trusted_helpers_invitation_token_key UNIQUE (invitation_token);


--
-- Name: trusted_helpers trusted_helpers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trusted_helpers
    ADD CONSTRAINT trusted_helpers_pkey PRIMARY KEY (id);


--
-- Name: user_achievements user_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_pkey PRIMARY KEY (id);


--
-- Name: user_achievements user_achievements_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_user_id_key UNIQUE (user_id);


--
-- Name: user_notes user_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_notes
    ADD CONSTRAINT user_notes_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: user_wishlist user_wishlist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_wishlist
    ADD CONSTRAINT user_wishlist_pkey PRIMARY KEY (id);


--
-- Name: user_wishlist user_wishlist_user_id_item_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_wishlist
    ADD CONSTRAINT user_wishlist_user_id_item_key_key UNIQUE (user_id, item_key);


--
-- Name: vault_folders vault_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vault_folders
    ADD CONSTRAINT vault_folders_pkey PRIMARY KEY (id);


--
-- Name: vault_items vault_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vault_items
    ADD CONSTRAINT vault_items_pkey PRIMARY KEY (id);


--
-- Name: vault_password_resets vault_password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vault_password_resets
    ADD CONSTRAINT vault_password_resets_pkey PRIMARY KEY (id);


--
-- Name: vault_password_resets vault_password_resets_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vault_password_resets
    ADD CONSTRAINT vault_password_resets_token_key UNIQUE (token);


--
-- Name: vault_settings vault_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vault_settings
    ADD CONSTRAINT vault_settings_pkey PRIMARY KEY (id);


--
-- Name: vault_settings vault_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vault_settings
    ADD CONSTRAINT vault_settings_user_id_key UNIQUE (user_id);


--
-- Name: idx_chat_conversations_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_conversations_user_id ON public.chat_conversations USING btree (user_id);


--
-- Name: idx_chat_messages_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_conversation_id ON public.chat_messages USING btree (conversation_id);


--
-- Name: idx_check_history_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_check_history_created_at ON public.check_history USING btree (created_at DESC);


--
-- Name: idx_check_history_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_check_history_user_id ON public.check_history USING btree (user_id);


--
-- Name: idx_guide_steps_device_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guide_steps_device_type ON public.guide_steps USING gin (device_type);


--
-- Name: idx_guides_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guides_category ON public.guides USING btree (category);


--
-- Name: idx_trusted_helpers_invitation_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trusted_helpers_invitation_token ON public.trusted_helpers USING btree (invitation_token);


--
-- Name: idx_vault_password_resets_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vault_password_resets_expires ON public.vault_password_resets USING btree (expires_at);


--
-- Name: idx_vault_password_resets_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vault_password_resets_token ON public.vault_password_resets USING btree (token);


--
-- Name: profiles ensure_owner_admin; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER ensure_owner_admin BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.ensure_owner_access();


--
-- Name: profiles set_admin_on_signup; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_admin_on_signup BEFORE INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.check_admin_email();


--
-- Name: chat_conversations update_chat_conversations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON public.chat_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: guides update_guides_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_guides_updated_at BEFORE UPDATE ON public.guides FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: subscriptions update_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: support_tickets update_support_tickets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: user_achievements update_user_achievements_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_achievements_updated_at BEFORE UPDATE ON public.user_achievements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_notes update_user_notes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_notes_updated_at BEFORE UPDATE ON public.user_notes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: vault_items update_vault_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_vault_items_updated_at BEFORE UPDATE ON public.vault_items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: chat_messages chat_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;


--
-- Name: checkins checkins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checkins
    ADD CONSTRAINT checkins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: glossary_terms glossary_terms_related_guide_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.glossary_terms
    ADD CONSTRAINT glossary_terms_related_guide_id_fkey FOREIGN KEY (related_guide_id) REFERENCES public.guides(id) ON DELETE SET NULL;


--
-- Name: guide_steps guide_steps_guide_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_steps
    ADD CONSTRAINT guide_steps_guide_id_fkey FOREIGN KEY (guide_id) REFERENCES public.guides(id) ON DELETE CASCADE;


--
-- Name: hardware_issues hardware_issues_related_guide_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hardware_issues
    ADD CONSTRAINT hardware_issues_related_guide_id_fkey FOREIGN KEY (related_guide_id) REFERENCES public.guides(id) ON DELETE SET NULL;


--
-- Name: panic_cases panic_cases_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.panic_cases
    ADD CONSTRAINT panic_cases_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: pending_subscriptions pending_subscriptions_claimed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_subscriptions
    ADD CONSTRAINT pending_subscriptions_claimed_by_fkey FOREIGN KEY (claimed_by) REFERENCES auth.users(id);


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: support_credits support_credits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_credits
    ADD CONSTRAINT support_credits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: support_messages support_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: support_messages support_messages_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id) ON DELETE CASCADE;


--
-- Name: support_tickets support_tickets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: trusted_helpers trusted_helpers_helper_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trusted_helpers
    ADD CONSTRAINT trusted_helpers_helper_user_id_fkey FOREIGN KEY (helper_user_id) REFERENCES auth.users(id);


--
-- Name: trusted_helpers trusted_helpers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trusted_helpers
    ADD CONSTRAINT trusted_helpers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: vault_folders vault_folders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vault_folders
    ADD CONSTRAINT vault_folders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: vault_items vault_items_folder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vault_items
    ADD CONSTRAINT vault_items_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.vault_folders(id) ON DELETE CASCADE;


--
-- Name: vault_items vault_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vault_items
    ADD CONSTRAINT vault_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: vault_settings vault_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vault_settings
    ADD CONSTRAINT vault_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: support_messages Admins can create messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can create messages" ON public.support_messages FOR INSERT WITH CHECK (public.is_admin(auth.uid()));


--
-- Name: guide_steps Admins can manage guide steps; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage guide steps" ON public.guide_steps USING (public.is_admin(auth.uid()));


--
-- Name: guides Admins can manage guides; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage guides" ON public.guides USING (public.is_admin(auth.uid()));


--
-- Name: support_tickets Admins can update all tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all tickets" ON public.support_tickets FOR UPDATE USING (public.is_admin(auth.uid()));


--
-- Name: support_messages Admins can view all messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all messages" ON public.support_messages FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: pending_subscriptions Admins can view all pending subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all pending subscriptions" ON public.pending_subscriptions FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: subscriptions Admins can view all subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: support_tickets Admins can view all tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all tickets" ON public.support_tickets FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: glossary_terms Anyone can view glossary terms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view glossary terms" ON public.glossary_terms FOR SELECT USING (true);


--
-- Name: guide_steps Anyone can view guide steps; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view guide steps" ON public.guide_steps FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.guides
  WHERE ((guides.id = guide_steps.guide_id) AND (guides.is_published = true)))));


--
-- Name: hardware_issues Anyone can view hardware issues; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view hardware issues" ON public.hardware_issues FOR SELECT USING (true);


--
-- Name: guides Anyone can view published guides; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view published guides" ON public.guides FOR SELECT USING ((is_published = true));


--
-- Name: quiz_questions Anyone can view quiz questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view quiz questions" ON public.quiz_questions FOR SELECT USING (true);


--
-- Name: user_wishlist Helpers can view user wishlist; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Helpers can view user wishlist" ON public.user_wishlist FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.trusted_helpers
  WHERE ((trusted_helpers.helper_user_id = auth.uid()) AND (trusted_helpers.user_id = user_wishlist.user_id) AND (trusted_helpers.invitation_accepted = true)))));


--
-- Name: checkins Users can create checkins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create checkins" ON public.checkins FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: trusted_helpers Users can create helpers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create helpers" ON public.trusted_helpers FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: chat_messages Users can create messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create messages in their conversations" ON public.chat_messages FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.chat_conversations
  WHERE ((chat_conversations.id = chat_messages.conversation_id) AND (chat_conversations.user_id = auth.uid())))));


--
-- Name: support_messages Users can create messages on own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create messages on own tickets" ON public.support_messages FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.support_tickets
  WHERE ((support_tickets.id = support_messages.ticket_id) AND (support_tickets.user_id = auth.uid())))));


--
-- Name: panic_cases Users can create panic cases; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create panic cases" ON public.panic_cases FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: chat_conversations Users can create their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own conversations" ON public.chat_conversations FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: support_tickets Users can create tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create tickets" ON public.support_tickets FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: vault_folders Users can create vault folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create vault folders" ON public.vault_folders FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: vault_items Users can create vault items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create vault items" ON public.vault_items FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: vault_settings Users can create vault settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create vault settings" ON public.vault_settings FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: checkins Users can delete own checkins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own checkins" ON public.checkins FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: trusted_helpers Users can delete own helpers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own helpers" ON public.trusted_helpers FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_wishlist Users can delete own wishlist items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own wishlist items" ON public.user_wishlist FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: chat_conversations Users can delete their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own conversations" ON public.chat_conversations FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: vault_folders Users can delete vault folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete vault folders" ON public.vault_folders FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: vault_items Users can delete vault items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete vault items" ON public.vault_items FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: support_credits Users can insert own credits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own credits" ON public.support_credits FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_notes Users can insert own notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own notes" ON public.user_notes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_achievements Users can insert their own achievements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own achievements" ON public.user_achievements FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: check_history Users can insert their own check history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own check history" ON public.check_history FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_wishlist Users can insert wishlist items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert wishlist items" ON public.user_wishlist FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: support_credits Users can update own credits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own credits" ON public.support_credits FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: trusted_helpers Users can update own helpers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own helpers" ON public.trusted_helpers FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_notes Users can update own notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own notes" ON public.user_notes FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: support_tickets Users can update own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own tickets" ON public.support_tickets FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_achievements Users can update their own achievements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own achievements" ON public.user_achievements FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: chat_conversations Users can update their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own conversations" ON public.chat_conversations FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: vault_folders Users can update vault folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update vault folders" ON public.vault_folders FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: vault_items Users can update vault items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update vault items" ON public.vault_items FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: vault_settings Users can update vault settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update vault settings" ON public.vault_settings FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: chat_messages Users can view messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view messages in their conversations" ON public.chat_messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.chat_conversations
  WHERE ((chat_conversations.id = chat_messages.conversation_id) AND (chat_conversations.user_id = auth.uid())))));


--
-- Name: support_messages Users can view messages on own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view messages on own tickets" ON public.support_messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.support_tickets
  WHERE ((support_tickets.id = support_messages.ticket_id) AND (support_tickets.user_id = auth.uid())))));


--
-- Name: checkins Users can view own checkins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own checkins" ON public.checkins FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: support_credits Users can view own credits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own credits" ON public.support_credits FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: trusted_helpers Users can view own helpers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own helpers" ON public.trusted_helpers FOR SELECT USING (((auth.uid() = user_id) OR (auth.uid() = helper_user_id)));


--
-- Name: user_notes Users can view own notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own notes" ON public.user_notes FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: panic_cases Users can view own panic cases; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own panic cases" ON public.panic_cases FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: pending_subscriptions Users can view own pending subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own pending subscriptions" ON public.pending_subscriptions FOR SELECT USING ((lower(purchaser_email) = lower((( SELECT users.email
   FROM auth.users
  WHERE (users.id = auth.uid())))::text)));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: subscriptions Users can view own subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: support_tickets Users can view own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: vault_folders Users can view own vault folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own vault folders" ON public.vault_folders FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: vault_items Users can view own vault items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own vault items" ON public.vault_items FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: vault_settings Users can view own vault settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own vault settings" ON public.vault_settings FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_wishlist Users can view own wishlist; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own wishlist" ON public.user_wishlist FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_achievements Users can view their own achievements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: check_history Users can view their own check history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own check history" ON public.check_history FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: chat_conversations Users can view their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own conversations" ON public.chat_conversations FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: vault_password_resets Users can view their own password reset tokens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own password reset tokens" ON public.vault_password_resets FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: chat_conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: check_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.check_history ENABLE ROW LEVEL SECURITY;

--
-- Name: checkins; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

--
-- Name: glossary_terms; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.glossary_terms ENABLE ROW LEVEL SECURITY;

--
-- Name: guide_steps; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.guide_steps ENABLE ROW LEVEL SECURITY;

--
-- Name: guides; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;

--
-- Name: hardware_issues; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hardware_issues ENABLE ROW LEVEL SECURITY;

--
-- Name: panic_cases; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.panic_cases ENABLE ROW LEVEL SECURITY;

--
-- Name: pending_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pending_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: quiz_questions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

--
-- Name: subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: support_credits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_credits ENABLE ROW LEVEL SECURITY;

--
-- Name: support_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: support_tickets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

--
-- Name: trusted_helpers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.trusted_helpers ENABLE ROW LEVEL SECURITY;

--
-- Name: user_achievements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

--
-- Name: user_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_wishlist; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_wishlist ENABLE ROW LEVEL SECURITY;

--
-- Name: vault_folders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vault_folders ENABLE ROW LEVEL SECURITY;

--
-- Name: vault_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vault_items ENABLE ROW LEVEL SECURITY;

--
-- Name: vault_password_resets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vault_password_resets ENABLE ROW LEVEL SECURITY;

--
-- Name: vault_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vault_settings ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;