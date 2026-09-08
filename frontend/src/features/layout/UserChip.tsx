import { RoleBadge } from '@/components/ui/RoleBadge';
import { userInitials } from '@/lib/initials';

import type { User } from '@/api/types';

interface UserChipProps {
  user: User;
}

export function UserChip({ user }: UserChipProps) {
  return (
    <div className="flex items-center gap-3" data-testid="user-chip">
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-pill bg-accent-soft text-sm font-semibold text-accent"
      >
        {userInitials(user.fullName)}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold text-ink">{user.fullName}</span>
        <RoleBadge role={user.role} />
      </div>
    </div>
  );
}
