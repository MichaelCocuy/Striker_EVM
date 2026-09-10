import { RoleBadge } from '@/components/ui/RoleBadge';
import { userInitials } from '@/lib/initials';

import type { User } from '@/api/types';

interface UserChipProps {
  user: User;
}

const CHIP_CLASSES =
  'flex shrink-0 items-center gap-2.5 rounded-pill border border-line bg-surface py-[5px] pr-3 pl-[5px]';
const AVATAR_CLASSES =
  'grid size-[30px] shrink-0 place-items-center rounded-pill bg-accent-soft font-heading text-caption font-bold text-accent';

/** Who is signed in, at the right end of the topbar: initials, name and role. */
export function UserChip({ user }: UserChipProps) {
  return (
    <div className={CHIP_CLASSES} data-testid="user-chip">
      <span aria-hidden="true" className={AVATAR_CLASSES}>
        {userInitials(user.fullName)}
      </span>
      <div className="flex min-w-0 flex-col items-start gap-0.5">
        <span className="truncate font-heading text-small leading-tight font-semibold text-ink">
          {user.fullName}
        </span>
        <RoleBadge role={user.role} />
      </div>
    </div>
  );
}
