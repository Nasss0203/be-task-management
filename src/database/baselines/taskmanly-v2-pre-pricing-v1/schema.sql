--
-- PostgreSQL database dump
--

\restrict M7KjXsTxrjZn1U5McitlSfrHelSag82ZhA2W5omkg8VGVO1nSsfZl2Pu6WD1qaI

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

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
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: activities_action_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.activities_action_enum AS ENUM (
    'TASK_CREATED',
    'TASK_UPDATED',
    'TASK_DELETED',
    'TASK_RESTORED',
    'TASK_STATUS_CHANGED',
    'TASK_PRIORITY_CHANGED',
    'TASK_TITLE_CHANGED',
    'TASK_DESCRIPTION_CHANGED',
    'TASK_DUE_DATE_CHANGED',
    'TASK_START_DATE_CHANGED',
    'TASK_ESTIMATE_CHANGED',
    'TASK_ASSIGNED',
    'TASK_UNASSIGNED',
    'TASK_MOVED_TO_SPRINT',
    'TASK_REMOVED_FROM_SPRINT',
    'TASK_MOVED_TO_BACKLOG',
    'SPRINT_CREATED',
    'SPRINT_UPDATED',
    'SPRINT_STARTED',
    'SPRINT_COMPLETED',
    'SPRINT_CANCELLED',
    'SPRINT_DELETED',
    'SPRINT_RESTORED',
    'COMMENT_CREATED',
    'COMMENT_UPDATED',
    'COMMENT_DELETED',
    'ATTACHMENT_UPLOADED',
    'ATTACHMENT_DELETED',
    'PAGE_CREATED',
    'PAGE_UPDATED',
    'PAGE_DELETED',
    'PAGE_RESTORED',
    'PAGE_BLOCK_CREATED',
    'PAGE_BLOCK_UPDATED',
    'PAGE_BLOCK_DELETED',
    'PAGE_BLOCK_REORDERED',
    'WORKSPACE_MEMBER_JOINED',
    'WORKSPACE_MEMBER_REMOVED',
    'WORKSPACE_MEMBER_ROLE_CHANGED',
    'PROJECT_CREATED',
    'PROJECT_UPDATED',
    'PROJECT_DELETED',
    'PROJECT_RESTORED'
);


--
-- Name: activities_entity_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.activities_entity_type_enum AS ENUM (
    'TASK',
    'SPRINT',
    'COMMENT',
    'ATTACHMENT',
    'PAGE',
    'PAGE_BLOCK',
    'WORKSPACE',
    'PROJECT'
);


--
-- Name: ai_conversations_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ai_conversations_status_enum AS ENUM (
    'ACTIVE',
    'ARCHIVED'
);


--
-- Name: ai_generations_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ai_generations_status_enum AS ENUM (
    'PROCESSING',
    'COMPLETED',
    'APPLIED',
    'DISCARDED',
    'FAILED'
);


--
-- Name: ai_messages_role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ai_messages_role_enum AS ENUM (
    'USER',
    'ASSISTANT',
    'SYSTEM',
    'TOOL'
);


--
-- Name: ai_tool_calls_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ai_tool_calls_status_enum AS ENUM (
    'PENDING',
    'RUNNING',
    'SUCCEEDED',
    'FAILED'
);


--
-- Name: attachments_provider_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.attachments_provider_enum AS ENUM (
    'R2',
    'CLOUDINARY'
);


--
-- Name: attachments_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.attachments_status_enum AS ENUM (
    'READY',
    'FAILED'
);


--
-- Name: audit_logs_entity_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.audit_logs_entity_type_enum AS ENUM (
    'WORKSPACE',
    'PROJECT',
    'TASK',
    'SPRINT',
    'COMMENT',
    'ATTACHMENT',
    'PAGE',
    'PAGE_BLOCK',
    'USER',
    'ROLE',
    'PERMISSION',
    'BILLING',
    'SYSTEM'
);


--
-- Name: billing_features_value_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.billing_features_value_type_enum AS ENUM (
    'BOOLEAN',
    'NUMBER',
    'STRING'
);


--
-- Name: billing_plan_prices_billing_interval_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.billing_plan_prices_billing_interval_enum AS ENUM (
    'MONTHLY',
    'YEARLY'
);


--
-- Name: billing_plan_prices_provider_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.billing_plan_prices_provider_enum AS ENUM (
    'STRIPE',
    'SEPAY'
);


--
-- Name: billing_webhook_events_provider_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.billing_webhook_events_provider_enum AS ENUM (
    'STRIPE',
    'SEPAY'
);


--
-- Name: billing_webhook_events_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.billing_webhook_events_status_enum AS ENUM (
    'PENDING',
    'PROCESSED',
    'FAILED',
    'IGNORED'
);


--
-- Name: billing_webhooks_provider_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.billing_webhooks_provider_enum AS ENUM (
    'MANUAL',
    'MOMO',
    'VNPAY',
    'STRIPE'
);


--
-- Name: billing_webhooks_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.billing_webhooks_status_enum AS ENUM (
    'RECEIVED',
    'PROCESSED',
    'FAILED',
    'IGNORED'
);


--
-- Name: boards_view_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.boards_view_type_enum AS ENUM (
    'BOARD',
    'TABLE',
    'LIST',
    'CALENDAR',
    'TIMELINE',
    'GALLERY',
    'CHART',
    'DASHBOARD',
    'FORM',
    'MAP',
    'FEED',
    'BACKLOG'
);


--
-- Name: database_property_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.database_property_type_enum AS ENUM (
    'TITLE',
    'TEXT',
    'NUMBER',
    'SELECT',
    'MULTI_SELECT',
    'STATUS',
    'DATE',
    'CHECKBOX',
    'PERSON',
    'URL',
    'EMAIL',
    'PHONE',
    'FILE',
    'CREATED_TIME',
    'UPDATED_TIME',
    'CREATED_BY'
);


--
-- Name: database_view_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.database_view_type_enum AS ENUM (
    'TABLE',
    'BOARD',
    'CALENDAR',
    'LIST'
);


--
-- Name: invoices_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.invoices_status_enum AS ENUM (
    'DRAFT',
    'OPEN',
    'PAID',
    'VOID',
    'UNCOLLECTIBLE'
);


--
-- Name: mentions_entity_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.mentions_entity_type_enum AS ENUM (
    'TASK',
    'PAGE',
    'PAGE_BLOCK'
);


--
-- Name: mentions_source_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.mentions_source_type_enum AS ENUM (
    'TASK_COMMENT',
    'PAGE_COMMENT',
    'PAGE_BLOCK'
);


--
-- Name: notifications_sender_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notifications_sender_type_enum AS ENUM (
    'SYSTEM',
    'USER'
);


--
-- Name: page_access_request_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.page_access_request_status_enum AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


--
-- Name: page_blocks_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.page_blocks_type_enum AS ENUM (
    'TEXT',
    'HEADER',
    'QUOTE',
    'DIVIDER',
    'CODE',
    'TODO',
    'IMAGE',
    'VIDEO',
    'FILE',
    'BOOKMARK',
    'EMBED',
    'FIGMA',
    'GITHUB_GIST',
    'GOOGLE_MAPS',
    'TWEET',
    'DATABASE_VIEW',
    'TABLE_SIMPLE',
    'MERMAID',
    'BUTTON',
    'TOGGLE'
);


--
-- Name: page_edit_request_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.page_edit_request_status_enum AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


--
-- Name: page_publication_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.page_publication_type AS ENUM (
    'DIRECT',
    'INHERITED'
);


--
-- Name: page_share_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.page_share_status_enum AS ENUM (
    'PENDING',
    'ACCEPTED',
    'REJECTED'
);


--
-- Name: page_template_blocks_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.page_template_blocks_type_enum AS ENUM (
    'TEXT',
    'HEADER',
    'QUOTE',
    'DIVIDER',
    'CODE',
    'TODO',
    'IMAGE',
    'VIDEO',
    'FILE',
    'BOOKMARK',
    'EMBED',
    'FIGMA',
    'GITHUB_GIST',
    'GOOGLE_MAPS',
    'TWEET',
    'DATABASE_VIEW',
    'TABLE_SIMPLE',
    'MERMAID',
    'BUTTON',
    'TOGGLE'
);


--
-- Name: page_template_database_properties_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.page_template_database_properties_type_enum AS ENUM (
    'TITLE',
    'TEXT',
    'NUMBER',
    'SELECT',
    'MULTI_SELECT',
    'STATUS',
    'DATE',
    'CHECKBOX',
    'PERSON',
    'URL',
    'EMAIL',
    'PHONE',
    'FILE',
    'CREATED_TIME',
    'UPDATED_TIME',
    'CREATED_BY'
);


--
-- Name: page_template_database_views_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.page_template_database_views_type_enum AS ENUM (
    'TABLE',
    'BOARD',
    'CALENDAR',
    'LIST'
);


--
-- Name: page_template_versions_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.page_template_versions_status_enum AS ENUM (
    'DRAFT',
    'PUBLISHED'
);


--
-- Name: page_templates_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.page_templates_status_enum AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ARCHIVED'
);


--
-- Name: page_templates_visibility_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.page_templates_visibility_enum AS ENUM (
    'PRIVATE',
    'WORKSPACE',
    'PUBLIC'
);


--
-- Name: payment_orders_provider_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_orders_provider_enum AS ENUM (
    'STRIPE',
    'SEPAY'
);


--
-- Name: payment_orders_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_orders_status_enum AS ENUM (
    'PENDING',
    'PAID',
    'FAILED',
    'EXPIRED',
    'CANCELED'
);


--
-- Name: payment_transactions_provider_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_transactions_provider_enum AS ENUM (
    'STRIPE',
    'SEPAY'
);


--
-- Name: payment_transactions_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_transactions_status_enum AS ENUM (
    'PENDING',
    'SUCCESS',
    'FAILED'
);


--
-- Name: payments_payment_method_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payments_payment_method_enum AS ENUM (
    'QR',
    'ATM',
    'VISA',
    'BANK_TRANSFER',
    'WALLET',
    'UNKNOWN'
);


--
-- Name: payments_provider_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payments_provider_enum AS ENUM (
    'MANUAL',
    'MOMO',
    'VNPAY',
    'STRIPE'
);


--
-- Name: payments_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payments_status_enum AS ENUM (
    'PENDING',
    'PROCESSING',
    'SUCCEEDED',
    'FAILED',
    'CANCELLED',
    'REFUNDED'
);


--
-- Name: plans_billing_interval_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.plans_billing_interval_enum AS ENUM (
    'MONTH',
    'YEAR',
    'LIFETIME'
);


--
-- Name: projects_visibility_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.projects_visibility_enum AS ENUM (
    'PRIVATE',
    'INTERNAL'
);


--
-- Name: resource_access_level_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.resource_access_level_enum AS ENUM (
    'VIEWER',
    'COMMENTER',
    'EDITOR',
    'FULL_ACCESS'
);


--
-- Name: roles_name_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.roles_name_enum AS ENUM (
    'OWNER',
    'ADMIN',
    'MEMBER',
    'VIEWER'
);


--
-- Name: sprints_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sprints_status_enum AS ENUM (
    'PLANNED',
    'ACTIVE',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: subscriptions_billing_interval_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.subscriptions_billing_interval_enum AS ENUM (
    'MONTH',
    'YEAR',
    'LIFETIME'
);


--
-- Name: subscriptions_provider_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.subscriptions_provider_enum AS ENUM (
    'MANUAL',
    'MOMO',
    'VNPAY',
    'STRIPE'
);


--
-- Name: subscriptions_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.subscriptions_status_enum AS ENUM (
    'TRIALING',
    'ACTIVE',
    'PAST_DUE',
    'CANCELLED',
    'EXPIRED',
    'INCOMPLETE'
);


--
-- Name: teamspace_members_role_name_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.teamspace_members_role_name_enum AS ENUM (
    'OWNER',
    'MEMBER'
);


--
-- Name: teamspaces_visibility_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.teamspaces_visibility_enum AS ENUM (
    'OPEN',
    'PRIVATE'
);


--
-- Name: template_entitlements_source_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.template_entitlements_source_enum AS ENUM (
    'FREE_CLAIM'
);


--
-- Name: template_listings_offer_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.template_listings_offer_type_enum AS ENUM (
    'FREE'
);


--
-- Name: template_listings_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.template_listings_status_enum AS ENUM (
    'DRAFT',
    'PUBLISHED'
);


--
-- Name: template_version_assets_asset_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.template_version_assets_asset_type_enum AS ENUM (
    'THUMBNAIL',
    'OPEN_GRAPH',
    'PREVIEW_IMAGE',
    'EXPORT_IMAGE'
);


--
-- Name: template_version_assets_provider_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.template_version_assets_provider_enum AS ENUM (
    'S3',
    'CLOUDINARY',
    'R2'
);


--
-- Name: template_version_assets_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.template_version_assets_status_enum AS ENUM (
    'PENDING',
    'READY',
    'FAILED'
);


--
-- Name: usage_limits_resource_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.usage_limits_resource_type_enum AS ENUM (
    'MEMBERS',
    'PROJECTS',
    'TASKS',
    'PAGES',
    'PAGE_TEMPLATES',
    'STORAGE_MB',
    'ATTACHMENTS',
    'SPRINTS'
);


--
-- Name: user_activity_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_activity_type_enum AS ENUM (
    'LOGIN',
    'OPEN_APP',
    'OPEN_WORKSPACE',
    'REFRESH_TOKEN'
);


--
-- Name: users_system_role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.users_system_role_enum AS ENUM (
    'USER',
    'SYSTEM_ADMIN',
    'SUPER_ADMIN'
);


--
-- Name: workspace_invites_role_name_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.workspace_invites_role_name_enum AS ENUM (
    'OWNER',
    'MEMBER'
);


--
-- Name: workspace_invites_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.workspace_invites_status_enum AS ENUM (
    'PENDING',
    'ACCEPTED',
    'EXPIRED',
    'REVOKED',
    'DECLINED'
);


--
-- Name: workspace_invites_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.workspace_invites_type_enum AS ENUM (
    'EMAIL',
    'LINK'
);


--
-- Name: workspace_members_membership_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.workspace_members_membership_type_enum AS ENUM (
    'GUEST',
    'MEMBER'
);


--
-- Name: workspace_members_role_name_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.workspace_members_role_name_enum AS ENUM (
    'OWNER',
    'MEMBER'
);


--
-- Name: workspace_subscriptions_provider_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.workspace_subscriptions_provider_enum AS ENUM (
    'STRIPE',
    'SEPAY'
);


--
-- Name: workspace_subscriptions_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.workspace_subscriptions_status_enum AS ENUM (
    'PENDING',
    'ACTIVE',
    'PAST_DUE',
    'CANCELED',
    'EXPIRED'
);


--
-- Name: workspace_templates_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.workspace_templates_status_enum AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ARCHIVED'
);


--
-- Name: workspace_templates_visibility_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.workspace_templates_visibility_enum AS ENUM (
    'PRIVATE',
    'WORKSPACE',
    'PUBLIC',
    'PUBLIC_PENDING'
);


--
-- Name: workspaces_layout_mode_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.workspaces_layout_mode_enum AS ENUM (
    'tabs',
    'blocks'
);


--
-- Name: check_page_public_site_ownership(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_page_public_site_ownership() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN
        IF NEW.public_subdomain IS NOT NULL AND EXISTS (
          SELECT 1 FROM published_sites s WHERE s.subdomain=NEW.public_subdomain AND s.root_page_id<>NEW.id
        ) THEN RAISE EXCEPTION 'Public subdomain is reserved by a historical site'; END IF;
        IF EXISTS (SELECT 1 FROM published_sites s WHERE s.root_page_id=NEW.id AND s.disabled_at IS NULL
          AND (NEW.parent_page_id IS NOT NULL OR NEW.public_subdomain IS DISTINCT FROM s.subdomain))
        THEN RAISE EXCEPTION 'Active PublishedSite requires a matching root Page reservation'; END IF;
        RETURN NEW;
      END $$;


--
-- Name: check_site_root_ownership(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_site_root_ownership() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN
        IF EXISTS (SELECT 1 FROM pages p WHERE p.public_subdomain=NEW.subdomain AND p.id<>NEW.root_page_id)
        THEN RAISE EXCEPTION 'PublishedSite subdomain is reserved by another Page'; END IF;
        IF NEW.disabled_at IS NULL AND NOT EXISTS (
          SELECT 1 FROM pages p WHERE p.id=NEW.root_page_id AND p.parent_page_id IS NULL
            AND p.public_subdomain=NEW.subdomain
        ) THEN RAISE EXCEPTION 'Active PublishedSite requires a matching root Page reservation'; END IF;
        RETURN NEW;
      END $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activities (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    workspace_id uuid NOT NULL,
    project_id uuid,
    entity_type public.activities_entity_type_enum NOT NULL,
    entity_id uuid NOT NULL,
    actor_id uuid,
    action public.activities_action_enum NOT NULL,
    field character varying(100),
    old_value jsonb,
    new_value jsonb,
    metadata jsonb,
    is_system boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: ai_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_conversations (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    workspace_id uuid,
    status public.ai_conversations_status_enum DEFAULT 'ACTIVE'::public.ai_conversations_status_enum NOT NULL,
    title character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ai_generations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_generations (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    conversation_id uuid,
    workspace_id uuid,
    output_data jsonb,
    status public.ai_generations_status_enum DEFAULT 'PROCESSING'::public.ai_generations_status_enum NOT NULL,
    error_message text,
    capability character varying(100) NOT NULL,
    input_data jsonb,
    error_code character varying(100),
    provider character varying(100),
    model character varying(255),
    applied_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ai_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_messages (
    id uuid NOT NULL,
    conversation_id uuid NOT NULL,
    role public.ai_messages_role_enum NOT NULL,
    content text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ai_tool_calls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_tool_calls (
    id uuid NOT NULL,
    generation_id uuid NOT NULL,
    tool_name character varying(255) NOT NULL,
    status public.ai_tool_calls_status_enum DEFAULT 'PENDING'::public.ai_tool_calls_status_enum NOT NULL,
    arguments jsonb,
    result_metadata jsonb,
    duration_ms integer,
    error_code character varying(100),
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_ai_tool_calls_duration_ms_non_negative" CHECK (((duration_ms IS NULL) OR (duration_ms >= 0)))
);


--
-- Name: ai_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_usage (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    workspace_id uuid,
    conversation_id uuid,
    generation_id uuid,
    provider character varying(100) NOT NULL,
    model character varying(255) NOT NULL,
    prompt_tokens integer DEFAULT 0 NOT NULL,
    completion_tokens integer DEFAULT 0 NOT NULL,
    total_tokens integer DEFAULT 0 NOT NULL,
    estimated_cost numeric(18,8),
    currency character varying(3),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_ai_usage_completion_tokens_non_negative" CHECK ((completion_tokens >= 0)),
    CONSTRAINT "CHK_ai_usage_estimated_cost_non_negative" CHECK (((estimated_cost IS NULL) OR (estimated_cost >= (0)::numeric))),
    CONSTRAINT "CHK_ai_usage_prompt_tokens_non_negative" CHECK ((prompt_tokens >= 0)),
    CONSTRAINT "CHK_ai_usage_total_tokens_non_negative" CHECK ((total_tokens >= 0))
);


--
-- Name: attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attachments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    workspace_id uuid NOT NULL,
    task_id uuid,
    comment_id uuid,
    uploaded_by uuid NOT NULL,
    file_name character varying(255) NOT NULL,
    mime_type character varying(150) NOT NULL,
    size bigint NOT NULL,
    provider public.attachments_provider_enum DEFAULT 'R2'::public.attachments_provider_enum NOT NULL,
    storage_key text,
    public_id text,
    url text,
    secure_url text,
    status public.attachments_status_enum DEFAULT 'READY'::public.attachments_status_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    page_block_id uuid
);


--
-- Name: billing_features; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_features (
    id uuid NOT NULL,
    code character varying(150) NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    value_type public.billing_features_value_type_enum NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: billing_plan_features; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_plan_features (
    id uuid NOT NULL,
    plan_id uuid NOT NULL,
    feature_id uuid NOT NULL,
    value jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: billing_plan_prices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_plan_prices (
    id uuid NOT NULL,
    plan_id uuid NOT NULL,
    billing_interval public.billing_plan_prices_billing_interval_enum NOT NULL,
    currency character varying(3) NOT NULL,
    amount bigint NOT NULL,
    provider public.billing_plan_prices_provider_enum NOT NULL,
    provider_price_id character varying(255),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: billing_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_plans (
    id uuid NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    is_public boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: billing_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_usage (
    id uuid NOT NULL,
    workspace_id uuid NOT NULL,
    feature_id uuid NOT NULL,
    period_start timestamp with time zone NOT NULL,
    period_end timestamp with time zone NOT NULL,
    used_value bigint DEFAULT '0'::bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: billing_webhook_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_webhook_events (
    id uuid NOT NULL,
    provider public.billing_webhook_events_provider_enum NOT NULL,
    provider_event_id character varying(255) NOT NULL,
    event_type character varying(255) NOT NULL,
    payload jsonb NOT NULL,
    status public.billing_webhook_events_status_enum DEFAULT 'PENDING'::public.billing_webhook_events_status_enum NOT NULL,
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: database_properties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.database_properties (
    id uuid NOT NULL,
    database_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    type public.database_property_type_enum NOT NULL,
    "position" character varying(255) NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    is_hideable boolean DEFAULT true NOT NULL
);


--
-- Name: database_property_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.database_property_options (
    id uuid NOT NULL,
    property_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    color character varying(50),
    "position" character varying(255) NOT NULL
);


--
-- Name: database_row_values; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.database_row_values (
    id uuid NOT NULL,
    row_id uuid NOT NULL,
    property_id uuid NOT NULL,
    value jsonb
);


--
-- Name: database_rows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.database_rows (
    id uuid NOT NULL,
    database_id uuid NOT NULL
);


--
-- Name: database_view_properties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.database_view_properties (
    id uuid NOT NULL,
    view_id uuid NOT NULL,
    property_id uuid NOT NULL,
    "position" character varying NOT NULL,
    visible boolean DEFAULT true NOT NULL,
    width integer
);


--
-- Name: database_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.database_views (
    id uuid NOT NULL,
    database_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    type public.database_view_type_enum NOT NULL,
    "position" character varying(255) NOT NULL
);


--
-- Name: databases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.databases (
    id uuid NOT NULL,
    page_id uuid NOT NULL,
    name character varying(255) NOT NULL
);


--
-- Name: mentions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mentions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    workspace_id uuid NOT NULL,
    project_id uuid,
    mentioner_id uuid NOT NULL,
    mentioned_user_id uuid NOT NULL,
    source_type public.mentions_source_type_enum NOT NULL,
    source_id uuid NOT NULL,
    entity_type public.mentions_entity_type_enum NOT NULL,
    entity_id uuid NOT NULL,
    notification_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    receiver_id uuid NOT NULL,
    sender_type public.notifications_sender_type_enum DEFAULT 'SYSTEM'::public.notifications_sender_type_enum NOT NULL,
    actor_id uuid,
    workspace_id uuid,
    title character varying(255) NOT NULL,
    message text,
    action_url text,
    metadata jsonb,
    read_at timestamp without time zone,
    archived_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    source_id uuid,
    source_type character varying(64) DEFAULT 'system'::character varying NOT NULL,
    type character varying(100) NOT NULL
);


--
-- Name: page_access_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_access_requests (
    id uuid NOT NULL,
    page_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status public.page_access_request_status_enum NOT NULL,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: page_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_blocks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    page_id uuid NOT NULL,
    type public.page_blocks_type_enum NOT NULL,
    title character varying,
    order_index integer DEFAULT 0 NOT NULL,
    position_x integer,
    position_y integer,
    width integer,
    height integer,
    content jsonb,
    data_config jsonb,
    style_config jsonb,
    created_by uuid NOT NULL,
    is_open boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone,
    deleted_by uuid,
    parent_block_id uuid
);


--
-- Name: page_edit_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_edit_requests (
    id uuid NOT NULL,
    page_id uuid NOT NULL,
    page_share_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status public.page_edit_request_status_enum NOT NULL,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: page_favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_favorites (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    page_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: page_publications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_publications (
    id uuid NOT NULL,
    site_id uuid NOT NULL,
    page_id uuid NOT NULL,
    path character varying(2048) NOT NULL,
    published_by uuid NOT NULL,
    published_at timestamp with time zone NOT NULL,
    unpublished_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    parent_publication_id uuid,
    publication_type public.page_publication_type DEFAULT 'DIRECT'::public.page_publication_type NOT NULL,
    include_descendants boolean DEFAULT false NOT NULL,
    visibility_override character varying(11),
    CONSTRAINT "CK_page_publications_inherited_options" CHECK (((publication_type <> 'INHERITED'::public.page_publication_type) OR (include_descendants = false))),
    CONSTRAINT "CK_page_publications_shape" CHECK (((((path)::text = '/'::text) AND (parent_publication_id IS NULL) AND (publication_type = 'DIRECT'::public.page_publication_type)) OR (((path)::text <> '/'::text) AND (parent_publication_id IS NOT NULL) AND (parent_publication_id <> id)))),
    CONSTRAINT "CK_page_publications_visibility_override" CHECK ((((publication_type = 'INHERITED'::public.page_publication_type) OR (visibility_override IS NULL)) AND ((visibility_override IS NULL) OR ((visibility_override)::text = ANY ((ARRAY['PUBLISHED'::character varying, 'UNPUBLISHED'::character varying])::text[])))))
);


--
-- Name: page_share_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_share_links (
    id uuid NOT NULL,
    page_id uuid NOT NULL,
    token_hash character varying(64) NOT NULL,
    created_by uuid NOT NULL,
    expires_at timestamp with time zone,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: page_share_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_share_settings (
    id uuid NOT NULL,
    page_id uuid NOT NULL,
    link_access_level public.resource_access_level_enum,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    workspace_access_level public.resource_access_level_enum
);


--
-- Name: page_shares; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_shares (
    id uuid NOT NULL,
    page_id uuid NOT NULL,
    user_id uuid NOT NULL,
    access_level public.resource_access_level_enum NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    share_link_id uuid,
    status public.page_share_status_enum DEFAULT 'PENDING'::public.page_share_status_enum NOT NULL
);


--
-- Name: page_template_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_template_blocks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    version_id uuid NOT NULL,
    parent_block_id uuid,
    type public.page_template_blocks_type_enum NOT NULL,
    title character varying(255),
    position_x integer,
    position_y integer,
    width integer,
    height integer,
    order_index integer DEFAULT 0 NOT NULL,
    content jsonb,
    style_config jsonb,
    data_config jsonb,
    created_by uuid NOT NULL,
    is_open boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: page_template_database_properties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_template_database_properties (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    template_database_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    type public.page_template_database_properties_type_enum NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    is_hideable boolean DEFAULT true NOT NULL,
    "position" character varying(255) NOT NULL
);


--
-- Name: page_template_database_property_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_template_database_property_options (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    template_property_id uuid CONSTRAINT page_template_database_property_o_template_property_id_not_null NOT NULL,
    name character varying(255) NOT NULL,
    color character varying(50),
    "position" character varying(255) NOT NULL
);


--
-- Name: page_template_database_row_values; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_template_database_row_values (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    template_row_id uuid NOT NULL,
    template_property_id uuid NOT NULL,
    value jsonb
);


--
-- Name: page_template_database_rows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_template_database_rows (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    template_database_id uuid NOT NULL
);


--
-- Name: page_template_database_view_properties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_template_database_view_properties (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    template_view_id uuid CONSTRAINT page_template_database_view_propertie_template_view_id_not_null NOT NULL,
    template_property_id uuid CONSTRAINT page_template_database_view_prope_template_property_id_not_null NOT NULL,
    "position" character varying(255) NOT NULL,
    visible boolean DEFAULT true NOT NULL,
    width integer
);


--
-- Name: page_template_database_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_template_database_views (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    template_database_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    type public.page_template_database_views_type_enum NOT NULL,
    "position" character varying(255) NOT NULL
);


--
-- Name: page_template_databases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_template_databases (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    version_id uuid NOT NULL,
    name character varying(255) NOT NULL
);


--
-- Name: page_template_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_template_versions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    template_id uuid NOT NULL,
    version_number integer NOT NULL,
    status public.page_template_versions_status_enum DEFAULT 'DRAFT'::public.page_template_versions_status_enum NOT NULL,
    created_by uuid NOT NULL,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    snapshot_hash character varying(64)
);


--
-- Name: page_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_templates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    workspace_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    icon character varying(255),
    cover_url text,
    created_by uuid NOT NULL,
    status public.page_templates_status_enum DEFAULT 'DRAFT'::public.page_templates_status_enum NOT NULL,
    visibility public.page_templates_visibility_enum DEFAULT 'PRIVATE'::public.page_templates_visibility_enum NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    source_page_id uuid
);


--
-- Name: pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    workspace_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    slug character varying(255),
    icon character varying(255),
    cover_url text,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone,
    deleted_by uuid,
    teamspace_id uuid,
    parent_page_id uuid,
    public_subdomain character varying(63),
    CONSTRAINT ck_pages_public_subdomain_root CHECK (((parent_page_id IS NULL) = (public_subdomain IS NOT NULL)))
);


--
-- Name: payment_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_orders (
    id uuid NOT NULL,
    workspace_id uuid NOT NULL,
    subscription_id uuid,
    plan_price_id uuid NOT NULL,
    provider public.payment_orders_provider_enum NOT NULL,
    order_code character varying(100) NOT NULL,
    amount bigint NOT NULL,
    currency character varying(3) NOT NULL,
    status public.payment_orders_status_enum DEFAULT 'PENDING'::public.payment_orders_status_enum NOT NULL,
    expires_at timestamp with time zone,
    paid_at timestamp with time zone,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: payment_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_transactions (
    id uuid NOT NULL,
    payment_order_id uuid NOT NULL,
    provider public.payment_transactions_provider_enum NOT NULL,
    provider_transaction_id character varying(255),
    amount bigint NOT NULL,
    currency character varying(3) NOT NULL,
    status public.payment_transactions_status_enum NOT NULL,
    provider_data jsonb,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(100) NOT NULL,
    description character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: publication_root_ownership_created_publications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.publication_root_ownership_created_publications (
    publication_id uuid CONSTRAINT publication_root_ownership_created_publ_publication_id_not_null NOT NULL
);


--
-- Name: publication_root_ownership_publication_backup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.publication_root_ownership_publication_backup (
    publication_id uuid CONSTRAINT publication_root_ownership_publication__publication_id_not_null NOT NULL,
    unpublished_at timestamp with time zone,
    published_at timestamp with time zone,
    updated_at timestamp with time zone,
    published_by uuid
);


--
-- Name: publication_root_ownership_site_backup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.publication_root_ownership_site_backup (
    site_id uuid NOT NULL,
    disabled_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: published_sites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.published_sites (
    id uuid NOT NULL,
    workspace_id uuid NOT NULL,
    root_page_id uuid NOT NULL,
    subdomain character varying(63) NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    disabled_at timestamp with time zone,
    allow_updates boolean DEFAULT false NOT NULL
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    token character varying(512) NOT NULL,
    user_agent character varying(255),
    ip_address inet,
    expires_at timestamp without time zone NOT NULL,
    revoked_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: teamspace_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teamspace_members (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    teamspace_id uuid NOT NULL,
    workspace_member_id uuid NOT NULL,
    role_name public.teamspace_members_role_name_enum DEFAULT 'MEMBER'::public.teamspace_members_role_name_enum NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: teamspaces; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teamspaces (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    workspace_id uuid NOT NULL,
    name character varying(150) NOT NULL,
    slug character varying(180) NOT NULL,
    description text,
    icon character varying(500),
    visibility public.teamspaces_visibility_enum DEFAULT 'OPEN'::public.teamspaces_visibility_enum NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by uuid
);


--
-- Name: template_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.template_categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: template_entitlements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.template_entitlements (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    template_id uuid NOT NULL,
    user_id uuid NOT NULL,
    source public.template_entitlements_source_enum DEFAULT 'FREE_CLAIM'::public.template_entitlements_source_enum NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: template_listing_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.template_listing_categories (
    listing_id uuid NOT NULL,
    category_id uuid NOT NULL
);


--
-- Name: template_listings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.template_listings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    template_id uuid NOT NULL,
    offer_type public.template_listings_offer_type_enum DEFAULT 'FREE'::public.template_listings_offer_type_enum NOT NULL,
    status public.template_listings_status_enum DEFAULT 'DRAFT'::public.template_listings_status_enum NOT NULL,
    created_by uuid NOT NULL,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    published_version_id uuid
);


--
-- Name: template_version_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.template_version_assets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    template_version_id uuid NOT NULL,
    asset_type public.template_version_assets_asset_type_enum NOT NULL,
    provider public.template_version_assets_provider_enum NOT NULL,
    storage_key text NOT NULL,
    mime_type character varying(150),
    file_size bigint,
    width integer,
    height integer,
    status public.template_version_assets_status_enum DEFAULT 'PENDING'::public.template_version_assets_status_enum NOT NULL,
    generated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_auth_identities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_auth_identities (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    provider character varying(50) NOT NULL,
    issuer character varying(500) NOT NULL,
    provider_subject character varying(255) NOT NULL,
    provider_email character varying(255),
    email_verified boolean DEFAULT false NOT NULL,
    tenant_id character varying(255),
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_profiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    display_name character varying(150),
    full_name character varying(150),
    bio text,
    phone_number character varying(30),
    location character varying(150),
    job_title character varying(150),
    website character varying(255),
    cover_url character varying(500),
    timezone character varying(50),
    language character varying(20),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    last_active_workspace_id uuid
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    username character varying(100) NOT NULL,
    google_id character varying(255),
    avatar_url character varying(500),
    password_hash character varying(255),
    is_active boolean DEFAULT true NOT NULL,
    is_email_verified boolean DEFAULT false NOT NULL,
    email_verification_token character varying(255),
    email_verification_expires timestamp without time zone,
    reset_password_token character varying(255),
    reset_password_expires timestamp without time zone,
    system_role public.users_system_role_enum DEFAULT 'USER'::public.users_system_role_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- Name: workspace_invites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workspace_invites (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    workspace_id uuid NOT NULL,
    user_id uuid,
    email character varying(255),
    type public.workspace_invites_type_enum DEFAULT 'EMAIL'::public.workspace_invites_type_enum NOT NULL,
    role_name public.workspace_invites_role_name_enum DEFAULT 'MEMBER'::public.workspace_invites_role_name_enum NOT NULL,
    invited_by uuid NOT NULL,
    token character varying(255) NOT NULL,
    status public.workspace_invites_status_enum DEFAULT 'PENDING'::public.workspace_invites_status_enum NOT NULL,
    accepted_at timestamp without time zone,
    expires_at timestamp without time zone NOT NULL,
    max_uses integer,
    used_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: workspace_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workspace_members (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    workspace_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role_name public.workspace_members_role_name_enum DEFAULT 'MEMBER'::public.workspace_members_role_name_enum,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    last_opened_at timestamp with time zone,
    membership_type public.workspace_members_membership_type_enum DEFAULT 'MEMBER'::public.workspace_members_membership_type_enum NOT NULL,
    CONSTRAINT "CHK_workspace_members_membership_type_role" CHECK ((((membership_type = 'GUEST'::public.workspace_members_membership_type_enum) AND (role_name IS NULL)) OR ((membership_type = 'MEMBER'::public.workspace_members_membership_type_enum) AND (role_name IS NOT NULL))))
);


--
-- Name: workspace_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workspace_subscriptions (
    id uuid NOT NULL,
    workspace_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    plan_price_id uuid,
    provider public.workspace_subscriptions_provider_enum,
    status public.workspace_subscriptions_status_enum NOT NULL,
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    cancel_at_period_end boolean DEFAULT false NOT NULL,
    canceled_at timestamp with time zone,
    provider_customer_id character varying(255),
    provider_subscription_id character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: workspaces; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workspaces (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    layout_mode public.workspaces_layout_mode_enum DEFAULT 'tabs'::public.workspaces_layout_mode_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone,
    deleted_by uuid,
    created_by uuid
);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: workspaces PK_098656ae401f3e1a4586f47fd8e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT "PK_098656ae401f3e1a4586f47fd8e" PRIMARY KEY (id);


--
-- Name: payment_orders PK_158dd178010c39759305293a149; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT "PK_158dd178010c39759305293a149" PRIMARY KEY (id);


--
-- Name: database_properties PK_1e6e9a3327cfdf01ca0384c7b03; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.database_properties
    ADD CONSTRAINT "PK_1e6e9a3327cfdf01ca0384c7b03" PRIMARY KEY (id);


--
-- Name: user_profiles PK_1ec6662219f4605723f1e41b6cb; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT "PK_1ec6662219f4605723f1e41b6cb" PRIMARY KEY (id);


--
-- Name: workspace_members PK_22ab43ac5865cd62769121d2bc4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_members
    ADD CONSTRAINT "PK_22ab43ac5865cd62769121d2bc4" PRIMARY KEY (id);


--
-- Name: databases PK_238a190c9ace4bea3dc1896f988; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.databases
    ADD CONSTRAINT "PK_238a190c9ace4bea3dc1896f988" PRIMARY KEY (id);


--
-- Name: page_access_requests PK_24b5fb691d9d11ed4f540a6c8bd; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_access_requests
    ADD CONSTRAINT "PK_24b5fb691d9d11ed4f540a6c8bd" PRIMARY KEY (id);


--
-- Name: mentions PK_2c728c4685beaa7be19e11eae42; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mentions
    ADD CONSTRAINT "PK_2c728c4685beaa7be19e11eae42" PRIMARY KEY (id);


--
-- Name: teamspace_members PK_32a6a75312fa3f629a7fefcad85; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teamspace_members
    ADD CONSTRAINT "PK_32a6a75312fa3f629a7fefcad85" PRIMARY KEY (id);


--
-- Name: ai_usage PK_3dddab3a15520a9c3eba859195d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_usage
    ADD CONSTRAINT "PK_3dddab3a15520a9c3eba859195d" PRIMARY KEY (id);


--
-- Name: database_rows PK_3e384659a989d40f847e13ce8c1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.database_rows
    ADD CONSTRAINT "PK_3e384659a989d40f847e13ce8c1" PRIMARY KEY (id);


--
-- Name: workspace_invites PK_43f7a0e0b0549fe2581e9cb57bc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_invites
    ADD CONSTRAINT "PK_43f7a0e0b0549fe2581e9cb57bc" PRIMARY KEY (id);


--
-- Name: billing_usage PK_55b77cbbebecd847e5c71420846; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_usage
    ADD CONSTRAINT "PK_55b77cbbebecd847e5c71420846" PRIMARY KEY (id);


--
-- Name: page_edit_requests PK_5b0050ca14890845f726c0afa95; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_edit_requests
    ADD CONSTRAINT "PK_5b0050ca14890845f726c0afa95" PRIMARY KEY (id);


--
-- Name: database_views PK_5cb8297e534ee0d9cca1e606326; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.database_views
    ADD CONSTRAINT "PK_5cb8297e534ee0d9cca1e606326" PRIMARY KEY (id);


--
-- Name: attachments PK_5e1f050bcff31e3084a1d662412; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT "PK_5e1f050bcff31e3084a1d662412" PRIMARY KEY (id);


--
-- Name: ai_conversations PK_60db12765b82858ba00c8aa4ae2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_conversations
    ADD CONSTRAINT "PK_60db12765b82858ba00c8aa4ae2" PRIMARY KEY (id);


--
-- Name: database_view_properties PK_69606f35f29931b5ec0e07aea19; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.database_view_properties
    ADD CONSTRAINT "PK_69606f35f29931b5ec0e07aea19" PRIMARY KEY (id);


--
-- Name: notifications PK_6a72c3c0f683f6462415e653c3a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY (id);


--
-- Name: billing_features PK_6a8bc438832e49a9bb339cbdf6c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_features
    ADD CONSTRAINT "PK_6a8bc438832e49a9bb339cbdf6c" PRIMARY KEY (id);


--
-- Name: page_share_links PK_7b7818fc2a5042b4547701a271e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_share_links
    ADD CONSTRAINT "PK_7b7818fc2a5042b4547701a271e" PRIMARY KEY (id);


--
-- Name: refresh_tokens PK_7d8bee0204106019488c4c50ffa; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY (id);


--
-- Name: activities PK_7f4004429f731ffb9c88eb486a8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "PK_7f4004429f731ffb9c88eb486a8" PRIMARY KEY (id);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: pages PK_8f21ed625aa34c8391d636b7d3b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT "PK_8f21ed625aa34c8391d636b7d3b" PRIMARY KEY (id);


--
-- Name: permissions PK_920331560282b8bd21bb02290df; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY (id);


--
-- Name: billing_plan_features PK_95915b33ed4097d8fa68634e5cd; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_plan_features
    ADD CONSTRAINT "PK_95915b33ed4097d8fa68634e5cd" PRIMARY KEY (id);


--
-- Name: workspace_subscriptions PK_98db3712679ce8ee3435961d85a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_subscriptions
    ADD CONSTRAINT "PK_98db3712679ce8ee3435961d85a" PRIMARY KEY (id);


--
-- Name: teamspaces PK_a37477ed618d13aed4aa2cf8170; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teamspaces
    ADD CONSTRAINT "PK_a37477ed618d13aed4aa2cf8170" PRIMARY KEY (id);


--
-- Name: ai_messages PK_a390434d4a515ba18a41bc996c2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_messages
    ADD CONSTRAINT "PK_a390434d4a515ba18a41bc996c2" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: billing_webhook_events PK_a4c2d2eae68da905a0b6063d0ea; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_webhook_events
    ADD CONSTRAINT "PK_a4c2d2eae68da905a0b6063d0ea" PRIMARY KEY (id);


--
-- Name: ai_generations PK_ac39086528be836b5aac57d3896; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_generations
    ADD CONSTRAINT "PK_ac39086528be836b5aac57d3896" PRIMARY KEY (id);


--
-- Name: page_shares PK_ceb630b1d5540981f7be503b028; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_shares
    ADD CONSTRAINT "PK_ceb630b1d5540981f7be503b028" PRIMARY KEY (id);


--
-- Name: page_favorites PK_cf022ded67eda3abe9a5c20a14f; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_favorites
    ADD CONSTRAINT "PK_cf022ded67eda3abe9a5c20a14f" PRIMARY KEY (id);


--
-- Name: billing_plan_prices PK_cf502d85d2cf0499c929d86a43e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_plan_prices
    ADD CONSTRAINT "PK_cf502d85d2cf0499c929d86a43e" PRIMARY KEY (id);


--
-- Name: payment_transactions PK_d32b3c6b0d2c1d22604cbcc8c49; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT "PK_d32b3c6b0d2c1d22604cbcc8c49" PRIMARY KEY (id);


--
-- Name: database_property_options PK_d652b4111b571abdefdf1974b13; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.database_property_options
    ADD CONSTRAINT "PK_d652b4111b571abdefdf1974b13" PRIMARY KEY (id);


--
-- Name: ai_tool_calls PK_d9582da589bad9f520cfdfe337e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_tool_calls
    ADD CONSTRAINT "PK_d9582da589bad9f520cfdfe337e" PRIMARY KEY (id);


--
-- Name: page_blocks PK_da57feac0f4c851a6419487176b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_blocks
    ADD CONSTRAINT "PK_da57feac0f4c851a6419487176b" PRIMARY KEY (id);


--
-- Name: page_share_settings PK_efaabb9be41594344172987d787; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_share_settings
    ADD CONSTRAINT "PK_efaabb9be41594344172987d787" PRIMARY KEY (id);


--
-- Name: billing_plans PK_f5dd8c47fbdcd68a43b97f9795e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_plans
    ADD CONSTRAINT "PK_f5dd8c47fbdcd68a43b97f9795e" PRIMARY KEY (id);


--
-- Name: database_row_values PK_fa36f0e9461a83049ff281c204a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.database_row_values
    ADD CONSTRAINT "PK_fa36f0e9461a83049ff281c204a" PRIMARY KEY (id);


--
-- Name: page_publications PK_page_publications; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_publications
    ADD CONSTRAINT "PK_page_publications" PRIMARY KEY (id);


--
-- Name: page_template_blocks PK_page_template_blocks; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_template_blocks
    ADD CONSTRAINT "PK_page_template_blocks" PRIMARY KEY (id);


--
-- Name: page_template_database_properties PK_page_template_database_properties; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_template_database_properties
    ADD CONSTRAINT "PK_page_template_database_properties" PRIMARY KEY (id);


--
-- Name: page_template_database_property_options PK_page_template_database_property_options; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_template_database_property_options
    ADD CONSTRAINT "PK_page_template_database_property_options" PRIMARY KEY (id);


--
-- Name: page_template_database_row_values PK_page_template_database_row_values; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_template_database_row_values
    ADD CONSTRAINT "PK_page_template_database_row_values" PRIMARY KEY (id);


--
-- Name: page_template_database_rows PK_page_template_database_rows; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_template_database_rows
    ADD CONSTRAINT "PK_page_template_database_rows" PRIMARY KEY (id);


--
-- Name: page_template_database_view_properties PK_page_template_database_view_properties; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_template_database_view_properties
    ADD CONSTRAINT "PK_page_template_database_view_properties" PRIMARY KEY (id);


--
-- Name: page_template_database_views PK_page_template_database_views; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_template_database_views
    ADD CONSTRAINT "PK_page_template_database_views" PRIMARY KEY (id);


--
-- Name: page_template_databases PK_page_template_databases; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_template_databases
    ADD CONSTRAINT "PK_page_template_databases" PRIMARY KEY (id);


--
-- Name: page_template_versions PK_page_template_versions; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_template_versions
    ADD CONSTRAINT "PK_page_template_versions" PRIMARY KEY (id);


--
-- Name: page_templates PK_page_templates; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_templates
    ADD CONSTRAINT "PK_page_templates" PRIMARY KEY (id);


--
-- Name: published_sites PK_published_sites; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.published_sites
    ADD CONSTRAINT "PK_published_sites" PRIMARY KEY (id);


--
-- Name: template_categories PK_template_categories; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_categories
    ADD CONSTRAINT "PK_template_categories" PRIMARY KEY (id);


--
-- Name: template_entitlements PK_template_entitlements; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_entitlements
    ADD CONSTRAINT "PK_template_entitlements" PRIMARY KEY (id);


--
-- Name: template_listing_categories PK_template_listing_categories; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_listing_categories
    ADD CONSTRAINT "PK_template_listing_categories" PRIMARY KEY (listing_id, category_id);


--
-- Name: template_listings PK_template_listings; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_listings
    ADD CONSTRAINT "PK_template_listings" PRIMARY KEY (id);


--
-- Name: template_version_assets PK_template_version_assets; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_version_assets
    ADD CONSTRAINT "PK_template_version_assets" PRIMARY KEY (id);


--
-- Name: user_auth_identities PK_user_auth_identities; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_auth_identities
    ADD CONSTRAINT "PK_user_auth_identities" PRIMARY KEY (id);


--
-- Name: user_profiles UQ_6ca9503d77ae39b4b5a6cc3ba88; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT "UQ_6ca9503d77ae39b4b5a6cc3ba88" UNIQUE (user_id);


--
-- Name: page_share_settings UQ_6dfa4e64017f36ea37a4ce3e254; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_share_settings
    ADD CONSTRAINT "UQ_6dfa4e64017f36ea37a4ce3e254" UNIQUE (page_id);


--
-- Name: permissions UQ_8dad765629e83229da6feda1c1d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT "UQ_8dad765629e83229da6feda1c1d" UNIQUE (code);


--
-- Name: workspaces UQ_b8e9fe62e93d60089dfc4f175f3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT "UQ_b8e9fe62e93d60089dfc4f175f3" UNIQUE (slug);


--
-- Name: billing_plan_features UQ_billing_plan_features_plan_feature; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_plan_features
    ADD CONSTRAINT "UQ_billing_plan_features_plan_feature" UNIQUE (plan_id, feature_id);


--
-- Name: billing_usage UQ_billing_usage_workspace_feature_period; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_usage
    ADD CONSTRAINT "UQ_billing_usage_workspace_feature_period" UNIQUE (workspace_id, feature_id, period_start, period_end);


--
-- Name: billing_webhook_events UQ_billing_webhook_events_provider_event; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_webhook_events
    ADD CONSTRAINT "UQ_billing_webhook_events_provider_event" UNIQUE (provider, provider_event_id);


--
-- Name: database_view_properties UQ_database_view_property_view_property; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.database_view_properties
    ADD CONSTRAINT "UQ_database_view_property_view_property" UNIQUE (view_id, property_id);


--
-- Name: page_favorites UQ_page_favorites_user_page; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_favorites
    ADD CONSTRAINT "UQ_page_favorites_user_page" UNIQUE (user_id, page_id);


--
-- Name: page_publications UQ_page_publications_site_id_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_publications
    ADD CONSTRAINT "UQ_page_publications_site_id_id" UNIQUE (site_id, id);


--
-- Name: page_publications UQ_page_publications_site_page; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_publications
    ADD CONSTRAINT "UQ_page_publications_site_page" UNIQUE (site_id, page_id);


--
-- Name: page_publications UQ_page_publications_site_path; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_publications
    ADD CONSTRAINT "UQ_page_publications_site_path" UNIQUE (site_id, path);


--
-- Name: page_shares UQ_page_shares_page_user; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_shares
    ADD CONSTRAINT "UQ_page_shares_page_user" UNIQUE (page_id, user_id);


--
-- Name: page_template_database_view_properties UQ_page_template_database_view_properties_view_property; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_template_database_view_properties
    ADD CONSTRAINT "UQ_page_template_database_view_properties_view_property" UNIQUE (template_view_id, template_property_id);


--
-- Name: page_template_versions UQ_page_template_versions_template_id_version_number; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_template_versions
    ADD CONSTRAINT "UQ_page_template_versions_template_id_version_number" UNIQUE (template_id, version_number);


--
-- Name: payment_transactions UQ_payment_transactions_provider_transaction; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT "UQ_payment_transactions_provider_transaction" UNIQUE (provider, provider_transaction_id);


--
-- Name: published_sites UQ_published_sites_subdomain; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.published_sites
    ADD CONSTRAINT "UQ_published_sites_subdomain" UNIQUE (subdomain);


--
-- Name: template_categories UQ_template_categories_slug; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_categories
    ADD CONSTRAINT "UQ_template_categories_slug" UNIQUE (slug);


--
-- Name: template_entitlements UQ_template_entitlements_template_user; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_entitlements
    ADD CONSTRAINT "UQ_template_entitlements_template_user" UNIQUE (template_id, user_id);


--
-- Name: template_listings UQ_template_listings_template_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_listings
    ADD CONSTRAINT "UQ_template_listings_template_id" UNIQUE (template_id);


--
-- Name: template_version_assets UQ_template_version_assets_version_id_asset_type; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_version_assets
    ADD CONSTRAINT "UQ_template_version_assets_version_id_asset_type" UNIQUE (template_version_id, asset_type);


--
-- Name: page_template_versions UQ_template_version_id_template; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_template_versions
    ADD CONSTRAINT "UQ_template_version_id_template" UNIQUE (id, template_id);


--
-- Name: publication_root_ownership_created_publications publication_root_ownership_created_publications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publication_root_ownership_created_publications
    ADD CONSTRAINT publication_root_ownership_created_publications_pkey PRIMARY KEY (publication_id);


--
-- Name: publication_root_ownership_publication_backup publication_root_ownership_publication_backup_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publication_root_ownership_publication_backup
    ADD CONSTRAINT publication_root_ownership_publication_backup_pkey PRIMARY KEY (publication_id);


--
-- Name: publication_root_ownership_site_backup publication_root_ownership_site_backup_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publication_root_ownership_site_backup
    ADD CONSTRAINT publication_root_ownership_site_backup_pkey PRIMARY KEY (site_id);


--
-- Name: IDX_08cc326bcc36b69774c6721e9a; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_08cc326bcc36b69774c6721e9a" ON public.mentions USING btree (notification_id);


--
-- Name: IDX_0bd5012aeb82628e07f6a1be53; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_0bd5012aeb82628e07f6a1be53" ON public.users USING btree (google_id);


--
-- Name: IDX_244c5f17089416157f6dc9190f; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_244c5f17089416157f6dc9190f" ON public.attachments USING btree (workspace_id, task_id);


--
-- Name: IDX_3fb5314ef323d02aed62ccb283; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_3fb5314ef323d02aed62ccb283" ON public.attachments USING btree (public_id);


--
-- Name: IDX_47d7917a734629d1cc15887086; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_47d7917a734629d1cc15887086" ON public.mentions USING btree (workspace_id, mentioned_user_id);


--
-- Name: IDX_70f034bc5912fde02b82b329f1; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_70f034bc5912fde02b82b329f1" ON public.activities USING btree (workspace_id, entity_type, entity_id);


--
-- Name: IDX_789eee36df14bb2a655b087404; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_789eee36df14bb2a655b087404" ON public.activities USING btree (workspace_id, created_at);


--
-- Name: IDX_78e06b2e7a3bd9b9239de4aa28; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_78e06b2e7a3bd9b9239de4aa28" ON public.activities USING btree (actor_id);


--
-- Name: IDX_7eb55326eb220fef58d00cccbf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_7eb55326eb220fef58d00cccbf" ON public.attachments USING btree (workspace_id, comment_id);


--
-- Name: IDX_97672ac88f789774dd47f7c8be; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON public.users USING btree (email);


--
-- Name: IDX_PAGES_DELETED_AT; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_PAGES_DELETED_AT" ON public.pages USING btree (deleted_at);


--
-- Name: IDX_PAGES_PARENT_PAGE_ID; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_PAGES_PARENT_PAGE_ID" ON public.pages USING btree (parent_page_id);


--
-- Name: IDX_PAGES_WORKSPACE_ID; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_PAGES_WORKSPACE_ID" ON public.pages USING btree (workspace_id);


--
-- Name: IDX_PAGE_BLOCKS_DELETED_AT; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_PAGE_BLOCKS_DELETED_AT" ON public.page_blocks USING btree (deleted_at);


--
-- Name: IDX_PAGE_BLOCKS_PAGE_ID; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_PAGE_BLOCKS_PAGE_ID" ON public.page_blocks USING btree (page_id);


--
-- Name: IDX_PAGE_BLOCKS_PARENT_BLOCK_ID; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_PAGE_BLOCKS_PARENT_BLOCK_ID" ON public.page_blocks USING btree (parent_block_id);


--
-- Name: IDX_WORKSPACES_DELETED_AT; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_WORKSPACES_DELETED_AT" ON public.workspaces USING btree (deleted_at);


--
-- Name: IDX_ai_conversations_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ai_conversations_created_at" ON public.ai_conversations USING btree (created_at);


--
-- Name: IDX_ai_conversations_user_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ai_conversations_user_created_at" ON public.ai_conversations USING btree (user_id, created_at);


--
-- Name: IDX_ai_conversations_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ai_conversations_user_id" ON public.ai_conversations USING btree (user_id);


--
-- Name: IDX_ai_conversations_workspace_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ai_conversations_workspace_created_at" ON public.ai_conversations USING btree (workspace_id, created_at);


--
-- Name: IDX_ai_conversations_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ai_conversations_workspace_id" ON public.ai_conversations USING btree (workspace_id);


--
-- Name: IDX_ai_generations_conversation_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ai_generations_conversation_created_at" ON public.ai_generations USING btree (conversation_id, created_at);


--
-- Name: IDX_ai_generations_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ai_generations_conversation_id" ON public.ai_generations USING btree (conversation_id);


--
-- Name: IDX_ai_generations_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ai_generations_created_at" ON public.ai_generations USING btree (created_at);


--
-- Name: IDX_ai_generations_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ai_generations_status" ON public.ai_generations USING btree (status);


--
-- Name: IDX_ai_generations_user_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ai_generations_user_created_at" ON public.ai_generations USING btree (user_id, created_at);


--
-- Name: IDX_ai_generations_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ai_generations_user_id" ON public.ai_generations USING btree (user_id);


--
-- Name: IDX_ai_generations_workspace_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ai_generations_workspace_created_at" ON public.ai_generations USING btree (workspace_id, created_at);


--
-- Name: IDX_ai_generations_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ai_generations_workspace_id" ON public.ai_generations USING btree (workspace_id);


--
-- Name: IDX_ai_messages_conversation_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ai_messages_conversation_created_at" ON public.ai_messages USING btree (conversation_id, created_at);


--
-- Name: IDX_ai_messages_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ai_messages_conversation_id" ON public.ai_messages USING btree (conversation_id);


--
-- Name: IDX_ai_tool_calls_generation_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ai_tool_calls_generation_created_at" ON public.ai_tool_calls USING btree (generation_id, created_at);


--
-- Name: IDX_ai_tool_calls_generation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ai_tool_calls_generation_id" ON public.ai_tool_calls USING btree (generation_id);


--
-- Name: IDX_ai_tool_calls_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ai_tool_calls_status" ON public.ai_tool_calls USING btree (status);


--
-- Name: IDX_ai_tool_calls_tool_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ai_tool_calls_tool_name" ON public.ai_tool_calls USING btree (tool_name);


--
-- Name: IDX_ai_usage_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ai_usage_conversation_id" ON public.ai_usage USING btree (conversation_id);


--
-- Name: IDX_ai_usage_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ai_usage_created_at" ON public.ai_usage USING btree (created_at);


--
-- Name: IDX_ai_usage_generation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ai_usage_generation_id" ON public.ai_usage USING btree (generation_id);


--
-- Name: IDX_ai_usage_model_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ai_usage_model_created_at" ON public.ai_usage USING btree (model, created_at);


--
-- Name: IDX_ai_usage_user_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ai_usage_user_created_at" ON public.ai_usage USING btree (user_id, created_at);


--
-- Name: IDX_ai_usage_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ai_usage_user_id" ON public.ai_usage USING btree (user_id);


--
-- Name: IDX_ai_usage_workspace_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ai_usage_workspace_created_at" ON public.ai_usage USING btree (workspace_id, created_at);


--
-- Name: IDX_ai_usage_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ai_usage_workspace_id" ON public.ai_usage USING btree (workspace_id);


--
-- Name: IDX_bca646bf128e29d7b1f5fd2339; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_bca646bf128e29d7b1f5fd2339" ON public.activities USING btree (workspace_id, project_id);


--
-- Name: IDX_billing_plan_features_feature_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_billing_plan_features_feature_id" ON public.billing_plan_features USING btree (feature_id);


--
-- Name: IDX_billing_plan_features_plan_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_billing_plan_features_plan_id" ON public.billing_plan_features USING btree (plan_id);


--
-- Name: IDX_billing_plan_prices_plan_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_billing_plan_prices_plan_id" ON public.billing_plan_prices USING btree (plan_id);


--
-- Name: IDX_billing_plan_prices_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_billing_plan_prices_provider" ON public.billing_plan_prices USING btree (provider);


--
-- Name: IDX_billing_usage_feature_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_billing_usage_feature_id" ON public.billing_usage USING btree (feature_id);


--
-- Name: IDX_billing_usage_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_billing_usage_workspace_id" ON public.billing_usage USING btree (workspace_id);


--
-- Name: IDX_billing_webhook_events_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_billing_webhook_events_status" ON public.billing_webhook_events USING btree (status);


--
-- Name: IDX_d644737df1052524a913770615; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_d644737df1052524a913770615" ON public.mentions USING btree (entity_type, entity_id);


--
-- Name: IDX_ec3648b85f6af7eafe865a3257; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ec3648b85f6af7eafe865a3257" ON public.attachments USING btree (storage_key);


--
-- Name: IDX_fa0f2f3576ba3faf0607be6445; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_fa0f2f3576ba3faf0607be6445" ON public.mentions USING btree (workspace_id, source_type, source_id);


--
-- Name: IDX_fe0bb3f6520ee0469504521e71; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_fe0bb3f6520ee0469504521e71" ON public.users USING btree (username);


--
-- Name: IDX_notifications_receiver_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_notifications_receiver_created_at" ON public.notifications USING btree (receiver_id, created_at);


--
-- Name: IDX_notifications_receiver_read_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_notifications_receiver_read_at" ON public.notifications USING btree (receiver_id, read_at);


--
-- Name: IDX_notifications_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_notifications_source" ON public.notifications USING btree (source_type, source_id);


--
-- Name: IDX_notifications_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_notifications_workspace_id" ON public.notifications USING btree (workspace_id);


--
-- Name: IDX_page_access_requests_page_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_access_requests_page_id" ON public.page_access_requests USING btree (page_id);


--
-- Name: IDX_page_access_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_access_requests_status" ON public.page_access_requests USING btree (status);


--
-- Name: IDX_page_access_requests_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_access_requests_user_id" ON public.page_access_requests USING btree (user_id);


--
-- Name: IDX_page_edit_requests_page_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_edit_requests_page_id" ON public.page_edit_requests USING btree (page_id);


--
-- Name: IDX_page_edit_requests_page_share_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_edit_requests_page_share_id" ON public.page_edit_requests USING btree (page_share_id);


--
-- Name: IDX_page_edit_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_edit_requests_status" ON public.page_edit_requests USING btree (status);


--
-- Name: IDX_page_edit_requests_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_edit_requests_user_id" ON public.page_edit_requests USING btree (user_id);


--
-- Name: IDX_page_favorites_page_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_favorites_page_id" ON public.page_favorites USING btree (page_id);


--
-- Name: IDX_page_favorites_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_favorites_user_id" ON public.page_favorites USING btree (user_id);


--
-- Name: IDX_page_publications_page_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_publications_page_id" ON public.page_publications USING btree (page_id);


--
-- Name: IDX_page_publications_parent_publication_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_publications_parent_publication_id" ON public.page_publications USING btree (parent_publication_id);


--
-- Name: IDX_page_publications_site_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_publications_site_id" ON public.page_publications USING btree (site_id);


--
-- Name: IDX_page_publications_unpublished_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_publications_unpublished_at" ON public.page_publications USING btree (unpublished_at);


--
-- Name: IDX_page_share_links_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_share_links_created_by" ON public.page_share_links USING btree (created_by);


--
-- Name: IDX_page_share_links_page_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_share_links_page_id" ON public.page_share_links USING btree (page_id);


--
-- Name: IDX_page_shares_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_shares_created_by" ON public.page_shares USING btree (created_by);


--
-- Name: IDX_page_shares_page_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_shares_page_id" ON public.page_shares USING btree (page_id);


--
-- Name: IDX_page_shares_share_link_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_shares_share_link_id" ON public.page_shares USING btree (share_link_id);


--
-- Name: IDX_page_shares_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_shares_status" ON public.page_shares USING btree (status);


--
-- Name: IDX_page_shares_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_shares_user_id" ON public.page_shares USING btree (user_id);


--
-- Name: IDX_page_template_blocks_parent_block_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_template_blocks_parent_block_id" ON public.page_template_blocks USING btree (parent_block_id);


--
-- Name: IDX_page_template_blocks_version_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_template_blocks_version_id" ON public.page_template_blocks USING btree (version_id);


--
-- Name: IDX_page_template_blocks_version_id_order_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_template_blocks_version_id_order_index" ON public.page_template_blocks USING btree (version_id, order_index);


--
-- Name: IDX_page_template_database_properties_template_database_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_template_database_properties_template_database_id" ON public.page_template_database_properties USING btree (template_database_id);


--
-- Name: IDX_page_template_database_property_options_template_prop_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_template_database_property_options_template_prop_id" ON public.page_template_database_property_options USING btree (template_property_id);


--
-- Name: IDX_page_template_database_row_values_template_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_template_database_row_values_template_property_id" ON public.page_template_database_row_values USING btree (template_property_id);


--
-- Name: IDX_page_template_database_row_values_template_row_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_template_database_row_values_template_row_id" ON public.page_template_database_row_values USING btree (template_row_id);


--
-- Name: IDX_page_template_database_rows_template_database_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_template_database_rows_template_database_id" ON public.page_template_database_rows USING btree (template_database_id);


--
-- Name: IDX_page_template_database_view_properties_template_prop_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_template_database_view_properties_template_prop_id" ON public.page_template_database_view_properties USING btree (template_property_id);


--
-- Name: IDX_page_template_database_view_properties_template_view_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_template_database_view_properties_template_view_id" ON public.page_template_database_view_properties USING btree (template_view_id);


--
-- Name: IDX_page_template_database_views_template_database_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_template_database_views_template_database_id" ON public.page_template_database_views USING btree (template_database_id);


--
-- Name: IDX_page_template_databases_version_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_template_databases_version_id" ON public.page_template_databases USING btree (version_id);


--
-- Name: IDX_page_template_versions_template_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_template_versions_template_id" ON public.page_template_versions USING btree (template_id);


--
-- Name: IDX_page_template_versions_template_id_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_template_versions_template_id_status" ON public.page_template_versions USING btree (template_id, status);


--
-- Name: IDX_page_templates_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_templates_created_by" ON public.page_templates USING btree (created_by);


--
-- Name: IDX_page_templates_source_page_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_templates_source_page_id" ON public.page_templates USING btree (source_page_id);


--
-- Name: IDX_page_templates_status_visibility; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_templates_status_visibility" ON public.page_templates USING btree (status, visibility);


--
-- Name: IDX_page_templates_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_page_templates_workspace_id" ON public.page_templates USING btree (workspace_id);


--
-- Name: IDX_payment_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_payment_orders_status" ON public.payment_orders USING btree (status);


--
-- Name: IDX_payment_orders_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_payment_orders_workspace_id" ON public.payment_orders USING btree (workspace_id);


--
-- Name: IDX_payment_transactions_payment_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_payment_transactions_payment_order_id" ON public.payment_transactions USING btree (payment_order_id);


--
-- Name: IDX_published_sites_disabled_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_published_sites_disabled_at" ON public.published_sites USING btree (disabled_at);


--
-- Name: IDX_published_sites_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_published_sites_workspace_id" ON public.published_sites USING btree (workspace_id);


--
-- Name: IDX_teamspace_members_teamspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_teamspace_members_teamspace_id" ON public.teamspace_members USING btree (teamspace_id);


--
-- Name: IDX_teamspace_members_workspace_member_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_teamspace_members_workspace_member_id" ON public.teamspace_members USING btree (workspace_member_id);


--
-- Name: IDX_teamspaces_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_teamspaces_deleted_at" ON public.teamspaces USING btree (deleted_at);


--
-- Name: IDX_teamspaces_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_teamspaces_workspace_id" ON public.teamspaces USING btree (workspace_id);


--
-- Name: IDX_template_categories_is_active_sort_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_template_categories_is_active_sort_order" ON public.template_categories USING btree (is_active, sort_order, name);


--
-- Name: IDX_template_listing_categories_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_template_listing_categories_category_id" ON public.template_listing_categories USING btree (category_id);


--
-- Name: IDX_template_listing_categories_listing_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_template_listing_categories_listing_id" ON public.template_listing_categories USING btree (listing_id);


--
-- Name: IDX_template_listings_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_template_listings_created_by" ON public.template_listings USING btree (created_by);


--
-- Name: IDX_template_listings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_template_listings_status" ON public.template_listings USING btree (status);


--
-- Name: IDX_template_listings_template_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_template_listings_template_id" ON public.template_listings USING btree (template_id);


--
-- Name: IDX_template_version_assets_template_version_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_template_version_assets_template_version_id" ON public.template_version_assets USING btree (template_version_id);


--
-- Name: IDX_user_auth_identities_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_user_auth_identities_user_id" ON public.user_auth_identities USING btree (user_id);


--
-- Name: IDX_workspace_invites_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_workspace_invites_email" ON public.workspace_invites USING btree (email);


--
-- Name: IDX_workspace_invites_invited_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_workspace_invites_invited_by" ON public.workspace_invites USING btree (invited_by);


--
-- Name: IDX_workspace_invites_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_workspace_invites_status" ON public.workspace_invites USING btree (status);


--
-- Name: IDX_workspace_invites_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_workspace_invites_type" ON public.workspace_invites USING btree (type);


--
-- Name: IDX_workspace_invites_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_workspace_invites_user_id" ON public.workspace_invites USING btree (user_id);


--
-- Name: IDX_workspace_invites_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_workspace_invites_workspace_id" ON public.workspace_invites USING btree (workspace_id);


--
-- Name: IDX_workspace_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_workspace_members_user_id" ON public.workspace_members USING btree (user_id);


--
-- Name: IDX_workspace_members_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_workspace_members_workspace_id" ON public.workspace_members USING btree (workspace_id);


--
-- Name: IDX_workspace_subscriptions_plan_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_workspace_subscriptions_plan_id" ON public.workspace_subscriptions USING btree (plan_id);


--
-- Name: IDX_workspace_subscriptions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_workspace_subscriptions_status" ON public.workspace_subscriptions USING btree (status);


--
-- Name: UQ_PAGES_WORKSPACE_SLUG_ACTIVE; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UQ_PAGES_WORKSPACE_SLUG_ACTIVE" ON public.pages USING btree (workspace_id, slug) WHERE (deleted_at IS NULL);


--
-- Name: UQ_PAGE_BLOCKS_CHILD_ORDER_ACTIVE; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UQ_PAGE_BLOCKS_CHILD_ORDER_ACTIVE" ON public.page_blocks USING btree (page_id, parent_block_id, order_index) WHERE ((parent_block_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: UQ_PAGE_BLOCKS_ROOT_ORDER_ACTIVE; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UQ_PAGE_BLOCKS_ROOT_ORDER_ACTIVE" ON public.page_blocks USING btree (page_id, order_index) WHERE ((parent_block_id IS NULL) AND (deleted_at IS NULL));


--
-- Name: UQ_billing_features_code; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UQ_billing_features_code" ON public.billing_features USING btree (code);


--
-- Name: UQ_billing_plans_code; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UQ_billing_plans_code" ON public.billing_plans USING btree (code);


--
-- Name: UQ_page_share_links_token_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UQ_page_share_links_token_hash" ON public.page_share_links USING btree (token_hash);


--
-- Name: UQ_payment_orders_order_code; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UQ_payment_orders_order_code" ON public.payment_orders USING btree (order_code);


--
-- Name: UQ_teamspace_members_teamspace_workspace_member; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UQ_teamspace_members_teamspace_workspace_member" ON public.teamspace_members USING btree (teamspace_id, workspace_member_id);


--
-- Name: UQ_teamspaces_workspace_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UQ_teamspaces_workspace_slug" ON public.teamspaces USING btree (workspace_id, slug);


--
-- Name: UQ_user_auth_identities_provider_issuer_subject_null_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UQ_user_auth_identities_provider_issuer_subject_null_tenant" ON public.user_auth_identities USING btree (provider, issuer, provider_subject) WHERE (tenant_id IS NULL);


--
-- Name: UQ_user_auth_identities_provider_issuer_subject_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UQ_user_auth_identities_provider_issuer_subject_tenant" ON public.user_auth_identities USING btree (provider, issuer, provider_subject, tenant_id) WHERE (tenant_id IS NOT NULL);


--
-- Name: UQ_workspace_invites_token; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UQ_workspace_invites_token" ON public.workspace_invites USING btree (token);


--
-- Name: UQ_workspace_members_workspace_user; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UQ_workspace_members_workspace_user" ON public.workspace_members USING btree (workspace_id, user_id);


--
-- Name: UQ_workspace_subscriptions_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UQ_workspace_subscriptions_workspace_id" ON public.workspace_subscriptions USING btree (workspace_id);


--
-- Name: idx_refresh_token_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_token_token ON public.refresh_tokens USING btree (token);


--
-- Name: idx_refresh_token_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_token_user ON public.refresh_tokens USING btree (user_id);


--
-- Name: uq_pages_public_subdomain; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_pages_public_subdomain ON public.pages USING btree (public_subdomain);


--
-- Name: pages tr_pages_public_site_ownership; Type: TRIGGER; Schema: public; Owner: -
--

CREATE CONSTRAINT TRIGGER tr_pages_public_site_ownership AFTER INSERT OR UPDATE OF parent_page_id, public_subdomain ON public.pages DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.check_page_public_site_ownership();


--
-- Name: published_sites tr_site_root_ownership; Type: TRIGGER; Schema: public; Owner: -
--

CREATE CONSTRAINT TRIGGER tr_site_root_ownership AFTER INSERT OR UPDATE OF subdomain, root_page_id, disabled_at ON public.published_sites DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.check_site_root_ownership();


--
-- Name: pages FK_064ab67bb29a28d073db287fc6d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT "FK_064ab67bb29a28d073db287fc6d" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: database_row_values FK_09b539c9049fd4dc3fa1655a17b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.database_row_values
    ADD CONSTRAINT "FK_09b539c9049fd4dc3fa1655a17b" FOREIGN KEY (property_id) REFERENCES public.database_properties(id) ON DELETE CASCADE;


--
-- Name: ai_conversations FK_12fdbf99ca0da93085d61edd3bb; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_conversations
    ADD CONSTRAINT "FK_12fdbf99ca0da93085d61edd3bb" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: ai_generations FK_1961f132b8336ebe3c790b9769b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_generations
    ADD CONSTRAINT "FK_1961f132b8336ebe3c790b9769b" FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE SET NULL;


--
-- Name: ai_usage FK_1b342fd5b20e5ffca652770404d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_usage
    ADD CONSTRAINT "FK_1b342fd5b20e5ffca652770404d" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: notifications FK_20f8b51fd9655c0b69feed5efc6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "FK_20f8b51fd9655c0b69feed5efc6" FOREIGN KEY (actor_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: database_view_properties FK_2ba1e95c23a8e3c0ce594cd1d1c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.database_view_properties
    ADD CONSTRAINT "FK_2ba1e95c23a8e3c0ce594cd1d1c" FOREIGN KEY (view_id) REFERENCES public.database_views(id) ON DELETE CASCADE;


--
-- Name: notifications FK_343c8ee2cd2f4036f2a3423989e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "FK_343c8ee2cd2f4036f2a3423989e" FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ai_usage FK_389fa8c971c418b326ecac0d8aa; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_usage
    ADD CONSTRAINT "FK_389fa8c971c418b326ecac0d8aa" FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE SET NULL;


--
-- Name: database_rows FK_3a87f5ae2bd2c8ed9c8a570f313; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.database_rows
    ADD CONSTRAINT "FK_3a87f5ae2bd2c8ed9c8a570f313" FOREIGN KEY (database_id) REFERENCES public.databases(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens FK_3ddc983c5f7bcf132fd8732c3f4; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: teamspace_members FK_3e20d681ae822569a6146b13f0f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teamspace_members
    ADD CONSTRAINT "FK_3e20d681ae822569a6146b13f0f" FOREIGN KEY (teamspace_id) REFERENCES public.teamspaces(id) ON DELETE CASCADE;


--
-- Name: workspace_members FK_4a7c584ddfe855379598b5e20fd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_members
    ADD CONSTRAINT "FK_4a7c584ddfe855379598b5e20fd" FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: workspace_members FK_4e83431119fa585fc7aa8b817db; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_members
    ADD CONSTRAINT "FK_4e83431119fa585fc7aa8b817db" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: teamspace_members FK_5fb94943d766dd3c8791e14f94e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teamspace_members
    ADD CONSTRAINT "FK_5fb94943d766dd3c8791e14f94e" FOREIGN KEY (workspace_member_id) REFERENCES public.workspace_members(id) ON DELETE CASCADE;


--
-- Name: user_profiles FK_6ca9503d77ae39b4b5a6cc3ba88; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT "FK_6ca9503d77ae39b4b5a6cc3ba88" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: page_share_settings FK_6dfa4e64017f36ea37a4ce3e254; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_share_settings
    ADD CONSTRAINT "FK_6dfa4e64017f36ea37a4ce3e254" FOREIGN KEY (page_id) REFERENCES public.pages(id) ON DELETE CASCADE;


--
-- Name: ai_tool_calls FK_73b4726214c8da50c03f959bdcc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_tool_calls
    ADD CONSTRAINT "FK_73b4726214c8da50c03f959bdcc" FOREIGN KEY (generation_id) REFERENCES public.ai_generations(id) ON DELETE CASCADE;


--
-- Name: database_view_properties FK_8759eb89fcb1d459d206ab0c1b4; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.database_view_properties
    ADD CONSTRAINT "FK_8759eb89fcb1d459d206ab0c1b4" FOREIGN KEY (property_id) REFERENCES public.database_properties(id) ON DELETE CASCADE;


--
-- Name: ai_usage FK_8d35990de31cf2fb45be6002a34; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_usage
    ADD CONSTRAINT "FK_8d35990de31cf2fb45be6002a34" FOREIGN KEY (generation_id) REFERENCES public.ai_generations(id) ON DELETE SET NULL;


--
-- Name: page_blocks FK_8dc937f145998715b5d715080e1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_blocks
    ADD CONSTRAINT "FK_8dc937f145998715b5d715080e1" FOREIGN KEY (parent_block_id) REFERENCES public.page_blocks(id);


--
-- Name: workspace_invites FK_93d8174e8b1537da7b092621c7f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_invites
    ADD CONSTRAINT "FK_93d8174e8b1537da7b092621c7f" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: workspace_invites FK_9ffc4e5b893e8fb91d66d466f6d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_invites
    ADD CONSTRAINT "FK_9ffc4e5b893e8fb91d66d466f6d" FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: ai_generations FK_a2199c6831df88c3e9c978ea4b5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_generations
    ADD CONSTRAINT "FK_a2199c6831df88c3e9c978ea4b5" FOREIGN KEY (conversation_id) REFERENCES public.ai_conversations(id) ON DELETE SET NULL;


--
-- Name: page_blocks FK_ad019765c7ffab9084d1d215d48; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_blocks
    ADD CONSTRAINT "FK_ad019765c7ffab9084d1d215d48" FOREIGN KEY (page_id) REFERENCES public.pages(id) ON DELETE CASCADE;


--
-- Name: database_views FK_ae2d6dd666ad2258ef7db5b38b9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.database_views
    ADD CONSTRAINT "FK_ae2d6dd666ad2258ef7db5b38b9" FOREIGN KEY (database_id) REFERENCES public.databases(id) ON DELETE CASCADE;


--
-- Name: teamspaces FK_b41e5ca3e57797efa1da9c71339; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teamspaces
    ADD CONSTRAINT "FK_b41e5ca3e57797efa1da9c71339" FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: page_blocks FK_c04e1bba3158ed15a30eee0349c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_blocks
    ADD CONSTRAINT "FK_c04e1bba3158ed15a30eee0349c" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: database_row_values FK_c44680d86391e4b06c34b611764; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.database_row_values
    ADD CONSTRAINT "FK_c44680d86391e4b06c34b611764" FOREIGN KEY (row_id) REFERENCES public.database_rows(id) ON DELETE CASCADE;


--
-- Name: pages FK_c4dd5f1b1eb8fb5c79ad236f256; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT "FK_c4dd5f1b1eb8fb5c79ad236f256" FOREIGN KEY (parent_page_id) REFERENCES public.pages(id) ON DELETE CASCADE;


--
-- Name: ai_generations FK_cb6e402a34c7f5630dec84ffb49; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_generations
    ADD CONSTRAINT "FK_cb6e402a34c7f5630dec84ffb49" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: workspace_invites FK_cf390e54ae1d8871cb74aad9c89; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_invites
    ADD CONSTRAINT "FK_cf390e54ae1d8871cb74aad9c89" FOREIGN KEY (invited_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ai_messages FK_de21fcb2d1df7fd6ca70f555b6d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_messages
    ADD CONSTRAINT "FK_de21fcb2d1df7fd6ca70f555b6d" FOREIGN KEY (conversation_id) REFERENCES public.ai_conversations(id) ON DELETE CASCADE;


--
-- Name: database_properties FK_e17dc83975eef70518071f43d03; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.database_properties
    ADD CONSTRAINT "FK_e17dc83975eef70518071f43d03" FOREIGN KEY (database_id) REFERENCES public.databases(id) ON DELETE CASCADE;


--
-- Name: pages FK_e81517e2f307170573c9be6f581; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT "FK_e81517e2f307170573c9be6f581" FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: database_property_options FK_f30eb092587ab22f40678651620; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.database_property_options
    ADD CONSTRAINT "FK_f30eb092587ab22f40678651620" FOREIGN KEY (property_id) REFERENCES public.database_properties(id) ON DELETE CASCADE;


--
-- Name: ai_usage FK_fb51cf283ac9e86792e4c0008a3; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_usage
    ADD CONSTRAINT "FK_fb51cf283ac9e86792e4c0008a3" FOREIGN KEY (conversation_id) REFERENCES public.ai_conversations(id) ON DELETE SET NULL;


--
-- Name: ai_conversations FK_fcf70f986be86ca896e79f6387e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_conversations
    ADD CONSTRAINT "FK_fcf70f986be86ca896e79f6387e" FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE SET NULL;


--
-- Name: template_listings FK_listing_published_version_template; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_listings
    ADD CONSTRAINT "FK_listing_published_version_template" FOREIGN KEY (published_version_id, template_id) REFERENCES public.page_template_versions(id, template_id);


--
-- Name: page_publications FK_page_publications_page; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_publications
    ADD CONSTRAINT "FK_page_publications_page" FOREIGN KEY (page_id) REFERENCES public.pages(id) ON DELETE CASCADE;


--
-- Name: page_publications FK_page_publications_parent; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_publications
    ADD CONSTRAINT "FK_page_publications_parent" FOREIGN KEY (site_id, parent_publication_id) REFERENCES public.page_publications(site_id, id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: page_publications FK_page_publications_published_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_publications
    ADD CONSTRAINT "FK_page_publications_published_by" FOREIGN KEY (published_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: page_publications FK_page_publications_site; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_publications
    ADD CONSTRAINT "FK_page_publications_site" FOREIGN KEY (site_id) REFERENCES public.published_sites(id) ON DELETE CASCADE;


--
-- Name: page_template_blocks FK_page_template_blocks_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_template_blocks
    ADD CONSTRAINT "FK_page_template_blocks_created_by" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: page_template_blocks FK_page_template_blocks_parent; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_template_blocks
    ADD CONSTRAINT "FK_page_template_blocks_parent" FOREIGN KEY (parent_block_id) REFERENCES public.page_template_blocks(id);


--
-- Name: page_template_blocks FK_page_template_blocks_version; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_template_blocks
    ADD CONSTRAINT "FK_page_template_blocks_version" FOREIGN KEY (version_id) REFERENCES public.page_template_versions(id) ON DELETE CASCADE;


--
-- Name: page_template_database_properties FK_page_template_database_properties_database; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_template_database_properties
    ADD CONSTRAINT "FK_page_template_database_properties_database" FOREIGN KEY (template_database_id) REFERENCES public.page_template_databases(id) ON DELETE CASCADE;


--
-- Name: page_template_database_property_options FK_page_template_database_property_options_property; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_template_database_property_options
    ADD CONSTRAINT "FK_page_template_database_property_options_property" FOREIGN KEY (template_property_id) REFERENCES public.page_template_database_properties(id) ON DELETE CASCADE;


--
-- Name: page_template_database_row_values FK_page_template_database_row_values_property; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_template_database_row_values
    ADD CONSTRAINT "FK_page_template_database_row_values_property" FOREIGN KEY (template_property_id) REFERENCES public.page_template_database_properties(id) ON DELETE CASCADE;


--
-- Name: page_template_database_row_values FK_page_template_database_row_values_row; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_template_database_row_values
    ADD CONSTRAINT "FK_page_template_database_row_values_row" FOREIGN KEY (template_row_id) REFERENCES public.page_template_database_rows(id) ON DELETE CASCADE;


--
-- Name: page_template_database_rows FK_page_template_database_rows_database; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_template_database_rows
    ADD CONSTRAINT "FK_page_template_database_rows_database" FOREIGN KEY (template_database_id) REFERENCES public.page_template_databases(id) ON DELETE CASCADE;


--
-- Name: page_template_database_view_properties FK_page_template_database_view_properties_property; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_template_database_view_properties
    ADD CONSTRAINT "FK_page_template_database_view_properties_property" FOREIGN KEY (template_property_id) REFERENCES public.page_template_database_properties(id) ON DELETE CASCADE;


--
-- Name: page_template_database_view_properties FK_page_template_database_view_properties_view; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_template_database_view_properties
    ADD CONSTRAINT "FK_page_template_database_view_properties_view" FOREIGN KEY (template_view_id) REFERENCES public.page_template_database_views(id) ON DELETE CASCADE;


--
-- Name: page_template_database_views FK_page_template_database_views_database; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_template_database_views
    ADD CONSTRAINT "FK_page_template_database_views_database" FOREIGN KEY (template_database_id) REFERENCES public.page_template_databases(id) ON DELETE CASCADE;


--
-- Name: page_template_databases FK_page_template_databases_version; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_template_databases
    ADD CONSTRAINT "FK_page_template_databases_version" FOREIGN KEY (version_id) REFERENCES public.page_template_versions(id) ON DELETE CASCADE;


--
-- Name: page_template_versions FK_page_template_versions_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_template_versions
    ADD CONSTRAINT "FK_page_template_versions_created_by" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: page_template_versions FK_page_template_versions_template; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_template_versions
    ADD CONSTRAINT "FK_page_template_versions_template" FOREIGN KEY (template_id) REFERENCES public.page_templates(id) ON DELETE CASCADE;


--
-- Name: page_templates FK_page_templates_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_templates
    ADD CONSTRAINT "FK_page_templates_created_by" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: page_templates FK_page_templates_source_page; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_templates
    ADD CONSTRAINT "FK_page_templates_source_page" FOREIGN KEY (source_page_id) REFERENCES public.pages(id) ON DELETE SET NULL;


--
-- Name: page_templates FK_page_templates_workspace; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_templates
    ADD CONSTRAINT "FK_page_templates_workspace" FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: published_sites FK_published_sites_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.published_sites
    ADD CONSTRAINT "FK_published_sites_created_by" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: published_sites FK_published_sites_root_page; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.published_sites
    ADD CONSTRAINT "FK_published_sites_root_page" FOREIGN KEY (root_page_id) REFERENCES public.pages(id) ON DELETE RESTRICT;


--
-- Name: published_sites FK_published_sites_workspace; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.published_sites
    ADD CONSTRAINT "FK_published_sites_workspace" FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: template_entitlements FK_template_entitlements_template; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_entitlements
    ADD CONSTRAINT "FK_template_entitlements_template" FOREIGN KEY (template_id) REFERENCES public.page_templates(id) ON DELETE CASCADE;


--
-- Name: template_entitlements FK_template_entitlements_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_entitlements
    ADD CONSTRAINT "FK_template_entitlements_user" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: template_listing_categories FK_template_listing_categories_category; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_listing_categories
    ADD CONSTRAINT "FK_template_listing_categories_category" FOREIGN KEY (category_id) REFERENCES public.template_categories(id) ON DELETE RESTRICT;


--
-- Name: template_listing_categories FK_template_listing_categories_listing; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_listing_categories
    ADD CONSTRAINT "FK_template_listing_categories_listing" FOREIGN KEY (listing_id) REFERENCES public.template_listings(id) ON DELETE CASCADE;


--
-- Name: template_listings FK_template_listings_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_listings
    ADD CONSTRAINT "FK_template_listings_created_by" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: template_listings FK_template_listings_template; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_listings
    ADD CONSTRAINT "FK_template_listings_template" FOREIGN KEY (template_id) REFERENCES public.page_templates(id) ON DELETE CASCADE;


--
-- Name: template_version_assets FK_template_version_assets_template_version; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_version_assets
    ADD CONSTRAINT "FK_template_version_assets_template_version" FOREIGN KEY (template_version_id) REFERENCES public.page_template_versions(id) ON DELETE CASCADE;


--
-- Name: user_auth_identities FK_user_auth_identities_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_auth_identities
    ADD CONSTRAINT "FK_user_auth_identities_user_id" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict M7KjXsTxrjZn1U5McitlSfrHelSag82ZhA2W5omkg8VGVO1nSsfZl2Pu6WD1qaI

