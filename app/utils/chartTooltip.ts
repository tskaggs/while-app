export interface ChartTooltipItem {
  label: string
  value: string
  color: string
}

export function formatChartTooltipDateUtc(date: Date | string): string {
  const value = typeof date === 'string' ? new Date(date) : date

  return value.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function formatChartTooltipUtc(date: Date | string): string {
  const value = typeof date === 'string' ? new Date(date) : date

  return `${value.toLocaleString('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })} UTC`
}

export function buildChartTooltipHtml(header: string, items: ChartTooltipItem[]): string {
  const listItems = items.map((item) => `
    <li class="while-chart-tooltip-item">
      <span class="while-chart-tooltip-dot" style="background-color: ${item.color}"></span>
      <span class="while-chart-tooltip-label">${item.label}</span>
      <span class="while-chart-tooltip-value">${item.value}</span>
    </li>
  `).join('')

  return `
    <div class="while-chart-tooltip">
      <div class="while-chart-tooltip-header">${header}</div>
      <ul class="while-chart-tooltip-list">${listItems}</ul>
    </div>
  `
}
