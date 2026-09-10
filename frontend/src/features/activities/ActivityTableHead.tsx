import { TABLE_INDICATORS } from './activity-indicators';
import {
  ACTIVITY_COLUMN_LABELS,
  ACTIVITY_DEVIATION_DESCRIPTION,
  TABLE_CLASS,
  TABLE_ROLE,
} from './activity-table';

/** Header of the nine-column row, so cells and headers can never drift apart. */
export function ActivityTableHead() {
  return (
    <thead role={TABLE_ROLE.ROW_GROUP} className={TABLE_CLASS.HEAD}>
      <tr role={TABLE_ROLE.ROW}>
        <th scope="col" role={TABLE_ROLE.COLUMN_HEADER} className={TABLE_CLASS.HEADER_CELL}>
          {ACTIVITY_COLUMN_LABELS.NAME}
        </th>
        <th scope="col" role={TABLE_ROLE.COLUMN_HEADER} className={TABLE_CLASS.HEADER_CELL}>
          <abbr title={ACTIVITY_DEVIATION_DESCRIPTION}>{ACTIVITY_COLUMN_LABELS.DEVIATION}</abbr>
        </th>
        <th scope="col" role={TABLE_ROLE.COLUMN_HEADER} className={TABLE_CLASS.HEADER_CELL}>
          {ACTIVITY_COLUMN_LABELS.PROGRESS}
        </th>
        {TABLE_INDICATORS.map((indicator) => (
          <th
            key={indicator.key}
            scope="col"
            role={TABLE_ROLE.COLUMN_HEADER}
            className={TABLE_CLASS.NUMERIC_HEADER_CELL}
          >
            <abbr title={indicator.description}>{indicator.label}</abbr>
          </th>
        ))}
        <th scope="col" role={TABLE_ROLE.COLUMN_HEADER} className={TABLE_CLASS.NUMERIC_HEADER_CELL}>
          <span className="sr-only">{ACTIVITY_COLUMN_LABELS.DETAIL}</span>
        </th>
      </tr>
    </thead>
  );
}
