export {
  VisArea,
  VisAxis,
  VisCrosshair,
  VisGroupedBar,
  VisLine,
  VisStackedBar,
  VisTooltip,
  VisXYContainer
} from '@unovis/vue'

/** Brand-aligned series colors derived from the while palette */
export const whileChartPalette = [
  '#5A5CBF',
  '#9497E0',
  '#3D3E85',
  '#6E70D4',
  '#B8BAEB',
  '#4A4BA3'
] as const

export function getChartColor(index: number): string {
  return whileChartPalette[index % whileChartPalette.length]!
}

/** Light series colors for charts on dark red surfaces */
export const whileChartHeroPalette = [
  '#FAFAFA',
  'rgb(250 250 250 / 0.75)',
  '#F5E6E6',
  '#FFF0E0',
  '#E8E4FF',
  '#FFD6D6'
] as const

export function getChartHeroColor(index: number): string {
  return whileChartHeroPalette[index % whileChartHeroPalette.length]!
}

export const stackedBarConfig = {
  roundedCorners: 4,
  barPadding: 0.2
} as const
