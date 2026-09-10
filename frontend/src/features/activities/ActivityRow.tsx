import { useNavigate } from 'react-router-dom';

import { activityDetailPath } from '@/constants/routes';

import {
  ActivityDetailArrowCell,
  ActivityIndicatorCells,
  ActivityMeasureCells,
  ActivityNameCell,
} from './activity-cells';
import { ACTIVITIES_REVEAL_ATTRIBUTE, TABLE_CLASS, TABLE_ROLE } from './activity-table';

import type { EvmActivityReport } from '@/api/types';

interface ActivityRowProps {
  projectId: string;
  activity: EvmActivityReport;
}

/**
 * One activity of the project table. The whole row leads to the activity detail, which is
 * where editing, deleting and registering progress now live: thirteen columns plus two
 * buttons per row is what forced the old table to scroll on any screen.
 */
export function ActivityRow({ projectId, activity }: ActivityRowProps) {
  const navigate = useNavigate();
  const detailPath = activityDetailPath(projectId, activity.id);

  function openDetail() {
    void navigate(detailPath);
  }

  return (
    <tr
      {...{ [ACTIVITIES_REVEAL_ATTRIBUTE]: true }}
      role={TABLE_ROLE.ROW}
      className={TABLE_CLASS.ROW}
      onClick={openDetail}
    >
      <ActivityNameCell
        name={activity.name}
        owner={activity.owner}
        notes={activity.indicators.notes}
        detailPath={detailPath}
      />
      <ActivityMeasureCells input={activity.input} indicators={activity.indicators} />
      <ActivityIndicatorCells indicators={activity.indicators} />
      <ActivityDetailArrowCell />
    </tr>
  );
}
