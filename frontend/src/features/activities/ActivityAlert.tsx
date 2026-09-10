import { TriangleAlert } from 'lucide-react';

import { ICON_SIZE, ICON_STROKE } from './activity-icons';

import type { ActivityAlertReading } from './activity-detail';

interface ActivityAlertProps {
  reading: ActivityAlertReading;
}

/** The red block of the detail: what the report says about an activity heading over budget. */
export function ActivityAlert({ reading }: ActivityAlertProps) {
  return (
    <div className="flex gap-3 rounded-md bg-danger-soft p-4 text-danger">
      <TriangleAlert
        aria-hidden="true"
        size={ICON_SIZE.CONTENT}
        strokeWidth={ICON_STROKE.EMPHASIS}
        className="mt-0.5 shrink-0"
      />
      <div className="flex flex-col gap-1">
        <p className="font-heading text-small font-semibold">{reading.title}</p>
        <p className="text-caption leading-relaxed">{reading.body}</p>
      </div>
    </div>
  );
}
