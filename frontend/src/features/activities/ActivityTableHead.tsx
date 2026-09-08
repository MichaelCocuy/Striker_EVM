import { ACTIVITY_COLUMN_LABELS, ACTIVITY_INDICATOR_COLUMNS, TABLE_CLASS } from './activity-table';

interface ActivityTableHeadProps {
  /**
   * Label of the second column, the only one that differs between the project table
   * (the activity's owner) and the registrar's table (the project it belongs to).
   */
  contextColumnLabel: string;
}

/** Header of both activity tables, so their columns can never drift apart. */
export function ActivityTableHead({ contextColumnLabel }: ActivityTableHeadProps) {
  return (
    <thead className="sticky top-0 z-10 bg-surface">
      <tr className={TABLE_CLASS.HEADER_ROW}>
        <th scope="col" className={TABLE_CLASS.HEADER_CELL}>
          {ACTIVITY_COLUMN_LABELS.NAME}
        </th>
        <th scope="col" className={TABLE_CLASS.HEADER_CELL}>
          {contextColumnLabel}
        </th>
        <th scope="col" className={TABLE_CLASS.NUMERIC_HEADER_CELL}>
          {ACTIVITY_COLUMN_LABELS.PLANNED_PROGRESS}
        </th>
        <th scope="col" className={TABLE_CLASS.NUMERIC_HEADER_CELL}>
          {ACTIVITY_COLUMN_LABELS.ACTUAL_PROGRESS}
        </th>
        {ACTIVITY_INDICATOR_COLUMNS.map((column) => (
          <th key={column.key} scope="col" className={TABLE_CLASS.NUMERIC_HEADER_CELL}>
            <abbr title={column.description}>{column.label}</abbr>
          </th>
        ))}
        <th scope="col" className={TABLE_CLASS.HEADER_CELL}>
          {ACTIVITY_COLUMN_LABELS.STATUS}
        </th>
        <th scope="col" className={TABLE_CLASS.NUMERIC_HEADER_CELL}>
          {ACTIVITY_COLUMN_LABELS.ACTIONS}
        </th>
      </tr>
    </thead>
  );
}
