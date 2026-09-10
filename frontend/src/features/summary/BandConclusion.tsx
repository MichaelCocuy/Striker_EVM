import { BAND_COPY } from './band-copy';
import { BAND_INK } from './band-tokens';
import { NOTES_HEADING } from './verdict-copy';

interface BandConclusionProps {
  /** The one-line answer to "¿cómo va el proyecto?", composed from the two statuses. */
  headline: string;
  /** Where the deviation sits, or why there is nothing to evaluate. */
  detail: string;
  /** Notes the report attaches when an indicator does not apply. */
  notes: readonly string[];
}

const CELL_CLASS = 'relative flex flex-col gap-2';
/** Poppins 600 at the 21px of the handoff, the largest thing on the band. */
const HEADLINE_CLASS = 'font-heading text-[21px]/[1.3] font-semibold tracking-tight';
const DETAIL_CLASS = 'text-small leading-normal';
const NOTES_CLASS = 'flex list-disc flex-col gap-1 pl-4 text-caption leading-normal';

/**
 * First cell of the band: the conclusion in plain Spanish, the activity that carries the
 * deviation, and any note the report attached about why an indicator does not apply.
 */
export function BandConclusion({ headline, detail, notes }: BandConclusionProps) {
  return (
    <div className={CELL_CLASS}>
      <p className="eyebrow" style={{ color: BAND_INK.OVERLINE }}>
        {BAND_COPY.OVERLINE}
      </p>
      <p className={HEADLINE_CLASS} style={{ color: BAND_INK.HEADLINE }}>
        {headline}
      </p>
      <p className={DETAIL_CLASS} style={{ color: BAND_INK.BODY }}>
        {detail}
      </p>
      {notes.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="eyebrow" style={{ color: BAND_INK.LABEL }}>
            {NOTES_HEADING}
          </p>
          <ul className={NOTES_CLASS} style={{ color: BAND_INK.BODY }}>
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
