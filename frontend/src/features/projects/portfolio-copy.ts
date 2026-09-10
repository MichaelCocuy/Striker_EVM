import { formatNumber } from '@/lib/format';

/**
 * Every string of the portfolio view, in Spanish, as the design handoff writes it
 * (`design_handoff_striker_evm/README.md`, "2 · Portafolio").
 *
 * Kept in one module because the same wording is shared by the KPI strip, the quadrant, its
 * hidden table and the dense list, and because a copy change should never mean touching four
 * components.
 */

/** The EVM reference reads as a scale mark ("1,0"), not as an indicator value. */
const REFERENCE_DECIMALS = 1;
const REFERENCE_LABEL = formatNumber(1, REFERENCE_DECIMALS);

const SINGULAR = 1;

export const PORTFOLIO_COPY = {
  /** The visible title of the view lives in the topbar; the page keeps its own heading for AT. */
  PAGE_TITLE: 'Todos los proyectos',
  LOADING: 'Cargando el portafolio…',
  NEW_PROJECT: 'Nuevo proyecto',
  KPI: {
    LABEL: 'Indicadores consolidados del portafolio',
    BUDGET: {
      OVERLINE: 'Presupuesto total',
      LEGEND_PREFIX: 'BAC sumado',
    },
    EARNED_VALUE: {
      OVERLINE: 'Valor ganado',
      LEGEND: 'EV consolidado a la fecha de corte',
    },
    RED: {
      OVERLINE: 'Proyectos en rojo',
      LEGEND: 'Sobre presupuesto o atrasados',
    },
    DEVIATION: {
      OVERLINE: 'Desviación proyectada',
      LEGEND: 'VAC sumado · un solo proyecto puede dominar el total',
    },
  },
  QUADRANT: {
    OVERLINE: 'Cuadrante',
    TITLE: 'CPI frente a SPI, proyecto por proyecto',
    DESCRIPTION:
      'El tamaño de la burbuja es el presupuesto. Arriba a la derecha es barato y a tiempo; abajo a la izquierda, caro y atrasado.',
    CHART_LABEL: 'Dispersión de CPI contra SPI por proyecto',
    BANDS_NOTE:
      'Banda verde: CPI sobre 1,0, el trabajo cuesta menos de lo presupuestado; banda roja, lo contrario. A la derecha de la línea punteada el proyecto va adelantado. El número corresponde al listado de proyectos.',
    OFF_SCALE_NOTE_PREFIX: 'Borde punteado en ',
    OFF_SCALE_NOTE_SUFFIX:
      ': sus índices quedan fuera de la escala, así que la burbuja se dibuja en el borde del área y su posición es aproximada.',
    NOT_PLOTTED_NOTE_PREFIX: 'Sin índices no hay punto, así que no se dibuja:',
    SPI_REFERENCE: `SPI ${REFERENCE_LABEL}`,
    CPI_REFERENCE: `CPI ${REFERENCE_LABEL}`,
    CHEAP: 'BARATO',
    EXPENSIVE: 'CARO',
    X_AXIS_TITLE: 'SPI · cronograma',
    Y_AXIS_TITLE: 'CPI · costo',
    TABLE: {
      CAPTION: 'Índices de cada proyecto del portafolio',
      NUMBER: '#',
      PROJECT: 'Proyecto',
      CPI: 'CPI',
      SPI: 'SPI',
      BUDGET: 'Presupuesto (BAC)',
      COST_STATUS: 'Costo',
      SCHEDULE_STATUS: 'Cronograma',
    },
  },
  LIST: {
    LABEL: 'Proyectos del portafolio',
    CPI: 'CPI',
    SPI: 'SPI',
    NO_ACTIVITIES: 'sin actividades',
    STATUS_LABEL: 'Estado consolidado',
    STATUS_UNAVAILABLE: 'Estado no disponible',
    ACTIONS_LABEL: 'Acciones del proyecto',
    EDIT: 'Editar',
    DELETE: 'Eliminar',
  },
  EMPTY: {
    OVERLINE: 'Portafolio vacío',
    TITLE: 'Todavía no hay proyectos',
    REVIEWER_BODY: 'Crea el primer proyecto para registrar sus actividades y seguir su estado EVM.',
    READ_ONLY_BODY: 'Cuando un revisor cree un proyecto, aparecerá aquí con su estado.',
  },
  DIALOG: {
    CREATE_TITLE: 'Nuevo proyecto',
    CREATE_DESCRIPTION: 'Registra el proyecto; después podrás agregarle actividades.',
    EDIT_TITLE: 'Editar proyecto',
    EDIT_DESCRIPTION: 'Actualiza el nombre o la descripción del proyecto.',
    DELETE_TITLE: 'Eliminar proyecto',
    DELETE_DESCRIPTION: 'Confirma la eliminación; es definitiva.',
  },
} as const;

/** `8 proyectos`, `1 proyecto`. */
export function projectCountLabel(count: number): string {
  return count === SINGULAR ? `${String(count)} proyecto` : `${String(count)} proyectos`;
}

/** `3 actividades`, `1 actividad`, `sin actividades`. */
export function activityCountLabel(count: number): string {
  if (count === 0) {
    return PORTFOLIO_COPY.LIST.NO_ACTIVITIES;
  }
  return count === SINGULAR ? `${String(count)} actividad` : `${String(count)} actividades`;
}

/** Legend of the total-budget tile: `BAC sumado · 7 proyectos con actividades`. */
export function budgetLegend(projectsWithActivities: number): string {
  return `${PORTFOLIO_COPY.KPI.BUDGET.LEGEND_PREFIX} · ${projectCountLabel(projectsWithActivities)} con actividades`;
}
