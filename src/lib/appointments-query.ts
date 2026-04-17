/** Builds the same query string as the dashboard appointments list API. */
export function buildAppointmentsQueryString(args: {
  currentPage: number;
  pageSize: number;
  statusFilter: string;
  staffFilter: string;
  dateFilter: string;
  debouncedSearch: string;
  /** Used when the UI keeps `dateFilter === 'custom'` until a day is picked. */
  customDate?: string;
}): string {
  const params = new URLSearchParams();
  params.set('page', String(args.currentPage));
  params.set('limit', String(args.pageSize));
  if (args.statusFilter !== 'all') {
    params.set('status', args.statusFilter);
  }
  if (args.staffFilter !== 'all') {
    params.set('barberId', args.staffFilter === 'unassigned' ? 'unassigned' : args.staffFilter);
  }
  if (args.debouncedSearch.length > 0) {
    params.set('search', args.debouncedSearch);
  }

  const ymdMY = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' });
  const malaysiaNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));

  if (
    args.dateFilter === 'custom' &&
    /^\d{4}-\d{2}-\d{2}$/.test(args.customDate?.trim() || '')
  ) {
    const d = args.customDate!.trim();
    params.set('dateFrom', d);
    params.set('dateTo', d);
  } else if (args.dateFilter !== 'all') {
    if (args.dateFilter === 'today') {
      const s = ymdMY(malaysiaNow);
      params.set('dateFrom', s);
      params.set('dateTo', s);
    } else if (args.dateFilter === 'yesterday') {
      const d = new Date(malaysiaNow);
      d.setDate(d.getDate() - 1);
      const s = ymdMY(d);
      params.set('dateFrom', s);
      params.set('dateTo', s);
    } else if (args.dateFilter === 'this_week') {
      const d = new Date(malaysiaNow);
      const day = d.getDay();
      const daysToMonday = day === 0 ? 6 : day - 1;
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - daysToMonday);
      params.set('dateFrom', ymdMY(weekStart));
      params.set('dateTo', ymdMY(malaysiaNow));
    } else if (args.dateFilter === 'this_month') {
      const monthStart = new Date(malaysiaNow.getFullYear(), malaysiaNow.getMonth(), 1);
      params.set('dateFrom', ymdMY(monthStart));
      params.set('dateTo', ymdMY(malaysiaNow));
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(args.dateFilter)) {
      params.set('dateFrom', args.dateFilter);
      params.set('dateTo', args.dateFilter);
    }
  }

  return params.toString();
}
