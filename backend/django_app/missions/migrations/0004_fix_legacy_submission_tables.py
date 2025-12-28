"""
Fix legacy database table names for mission submissions.

Some environments were created with legacy tables (e.g. "missionsubmissions")
instead of the current "mission_submissions" expected by models.
This migration renames/patches tables in-place and creates missing analytics tables.
"""

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("missions", "0003_add_missing_columns"),
    ]

    operations = [
        migrations.RunSQL(
            sql=r"""
DO $$
BEGIN
  -- Rename legacy table missionsubmissions -> mission_submissions if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'missionsubmissions'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'mission_submissions'
  ) THEN
    EXECUTE 'ALTER TABLE public.missionsubmissions RENAME TO mission_submissions';
  END IF;

  -- Ensure mission_submissions exists (if not, leave to normal migrations / manual intervention)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'mission_submissions'
  ) THEN
    -- Add columns that newer code expects
    EXECUTE 'ALTER TABLE public.mission_submissions ADD COLUMN IF NOT EXISTS mentor_score numeric(5,2)';
    EXECUTE 'ALTER TABLE public.mission_submissions ADD COLUMN IF NOT EXISTS mentor_reviewed_at timestamptz';
    EXECUTE 'ALTER TABLE public.mission_submissions ADD COLUMN IF NOT EXISTS ai_reviewed_at timestamptz';
    EXECUTE 'ALTER TABLE public.mission_submissions ADD COLUMN IF NOT EXISTS updated_at timestamptz';
    EXECUTE 'ALTER TABLE public.mission_submissions ADD COLUMN IF NOT EXISTS portfolio_item_id uuid';
  END IF;

  -- Create ai_feedback table if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ai_feedback'
  ) THEN
    EXECUTE $SQL$
      CREATE TABLE public.ai_feedback (
        id uuid PRIMARY KEY,
        submission_id uuid UNIQUE NOT NULL,
        score numeric(5,2) NOT NULL,
        strengths jsonb NOT NULL DEFAULT '[]'::jsonb,
        gaps jsonb NOT NULL DEFAULT '[]'::jsonb,
        suggestions jsonb NOT NULL DEFAULT '[]'::jsonb,
        competencies_detected jsonb NOT NULL DEFAULT '[]'::jsonb,
        full_feedback jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    $SQL$;
  END IF;

  -- Create mission_artifacts table if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'mission_artifacts'
  ) THEN
    EXECUTE $SQL$
      CREATE TABLE public.mission_artifacts (
        id uuid PRIMARY KEY,
        submission_id uuid NOT NULL,
        kind varchar(20) NOT NULL,
        url varchar(500) NOT NULL,
        filename varchar(255) NOT NULL DEFAULT '',
        size_bytes bigint,
        metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    $SQL$;
  END IF;
END $$;
""",
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]






























