import {
  ACTIVITY_COLUMN_LABELS,
  ACTIVITY_DEVIATION_DESCRIPTION,
  ACTIVITY_INDICATOR_COLUMNS,
  TABLE_CLASS,
  TABLE_ROLE,
} from './activity-table';

interface ActivityTableHeadProps {
  /**
   * Extra column between the activity and its deviation, only in the registrar's table (the
   * project the activity belongs to). The project table needs none: the owner reads under the
   * activity name.
   */
  contextColumnLabel?: string;
}

/** Header of both activity tables, so their columns can never drift apart. */
export function ActivityTableHead({ contextColumnLabel }: ActivityTableHeadProps) {
  return (
    <thead role={TABLE_ROLE.ROW_GROUP} className={TABLE_CLASS.HEAD}>
      <tr role={TABLE_ROLE.ROW} className={TABLE_CLASS.HEADER_ROW}>
        <th scope="col" role={TABLE_ROLE.COLUMN_HEADER} className={TABLE_CLASS.HEADER_CELL}>
          {ACTIVITY_COLUMN_LABELS.NAME}
        </th>
        {contextColumnLabel !== undefined && (
          <th scope="col" role={TABLE_ROLE.COLUMN_HEADER} className={TABLE_CLASS.HEADER_CELL}>
            {contextColumnLabel}
          </th>
        )}
        <th scope="col" role={TABLE_ROLE.COLUMN_HEADER} className={TABLE_CLASS.HEADER_CELL}>
          <abbr title={ACTIVITY_DEVIATION_DESCRIPTION}>{ACTIVITY_COLUMN_LABELS.DEVIATION}</abbr>
        </th>
        <th scope="col" role={TABLE_ROLE.COLUMN_HEADER} className={TABLE_CLASS.HEADER_CELL}>
          {ACTIVITY_COLUMN_LABELS.PROGRESS}
        </th>
        {ACTIVITY_INDICATOR_COLUMNS.map((column) => (
          <th
            key={column.key}
            scope="col"
            role={TABLE_ROLE.COLUMN_HEADER}
            className={TABLE_CLASS.NUMERIC_HEADER_CELL}
          >
            <abbr title={column.description}>{column.label}</abbr>
          </th>
        ))}
        <th scope="col" role={TABLE_ROLE.COLUMN_HEADER} className={TABLE_CLASS.NUMERIC_HEADER_CELL}>
          {ACTIVITY_COLUMN_LABELS.ACTIONS}
        </th>
      </tr>
    </thead>
  );
}
