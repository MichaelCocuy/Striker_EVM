"""Create app_user, project and activity tables.

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-09-08
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001_initial_schema"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

UUID_DEFAULT = sa.text("gen_random_uuid()")
NOW = sa.text("now()")
ALLOWED_ROLES = "'REGISTRAR', 'REVIEWER'"


def upgrade() -> None:
    op.create_table(
        "app_user",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=UUID_DEFAULT),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=NOW),
        sa.CheckConstraint(f"role IN ({ALLOWED_ROLES})", name="ck_app_user_role_allowed"),
        sa.UniqueConstraint("email", name="uq_app_user_email"),
    )
    op.create_table(
        "project",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=UUID_DEFAULT),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "created_by",
            sa.Uuid(),
            sa.ForeignKey("app_user.id", name="fk_project_created_by_app_user"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=NOW),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=NOW),
    )
    op.create_table(
        "activity",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=UUID_DEFAULT),
        sa.Column(
            "project_id",
            sa.Uuid(),
            sa.ForeignKey("project.id", name="fk_activity_project_id_project", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "owner_id",
            sa.Uuid(),
            sa.ForeignKey("app_user.id", name="fk_activity_owner_id_app_user"),
            nullable=False,
        ),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("budget_at_completion", sa.Numeric(14, 2), nullable=False),
        sa.Column("planned_progress_percent", sa.Numeric(5, 2), nullable=False),
        sa.Column("actual_progress_percent", sa.Numeric(5, 2), nullable=False),
        sa.Column("actual_cost", sa.Numeric(14, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=NOW),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=NOW),
        sa.CheckConstraint("budget_at_completion > 0", name="ck_activity_budget_positive"),
        sa.CheckConstraint("actual_cost >= 0", name="ck_activity_actual_cost_non_negative"),
        sa.CheckConstraint(
            "planned_progress_percent BETWEEN 0 AND 100", name="ck_activity_planned_percent_range"
        ),
        sa.CheckConstraint(
            "actual_progress_percent BETWEEN 0 AND 100", name="ck_activity_actual_percent_range"
        ),
    )
    op.create_index("ix_activity_project_id", "activity", ["project_id"])
    op.create_index("ix_activity_owner_id", "activity", ["owner_id"])


def downgrade() -> None:
    op.drop_index("ix_activity_owner_id", table_name="activity")
    op.drop_index("ix_activity_project_id", table_name="activity")
    op.drop_table("activity")
    op.drop_table("project")
    op.drop_table("app_user")
