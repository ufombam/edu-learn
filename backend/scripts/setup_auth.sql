-- Create auth schema
CREATE SCHEMA IF NOT EXISTS auth;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create auth.users table
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid,
  email character varying,
  encrypted_password character varying,
  email_confirmed_at timestamp with time zone,
  invited_at timestamp with time zone,
  confirmation_token character varying,
  confirmation_sent_at timestamp with time zone,
  recovery_token character varying,
  recovery_sent_at timestamp with time zone,
  email_change_token_new character varying,
  email_change character varying,
  email_change_sent_at timestamp with time zone,
  last_sign_in_at timestamp with time zone,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  is_super_admin boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  phone character varying,
  phone_confirmed_at timestamp with time zone,
  phone_change character varying,
  phone_change_token character varying,
  phone_change_sent_at timestamp with time zone,
  confirmed_at timestamp with time zone,
  email_change_token_current character varying,
  email_change_confirm_status smallint,
  banned_until timestamp with time zone,
  reauthentication_token character varying,
  reauthentication_sent_at timestamp with time zone,
  is_sso_user boolean DEFAULT false NOT NULL,
  deleted_at timestamp with time zone
);

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';

-- Create auth.uid() function for RLS
CREATE OR REPLACE FUNCTION auth.uid()
 RETURNS uuid
 LANGUAGE sql
 STABLE
AS $function$
  -- Return the user_id from the session_user variable or null
  -- In a real Supabase environment this is handled differently, 
  -- but for local RLS we can simulate it by setting a config var
  -- or just returning NULL and handling RLS application-side if needed.
  -- For strict compatibility with migrations that use auth.uid(), we return NULL by default.
  -- You can set this variable in your transaction: set_config('app.current_user_id', '...', false);
  SELECT nullif(current_setting('app.current_user_id', true), '')::uuid;
$function$;
