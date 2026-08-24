/**
 * Baghdad timezone (Asia/Baghdad) date and time utilities.
 * Restaurant business day is defined from 00:00:00 to 23:59:59 in Asia/Baghdad.
 */

export const BUSINESS_TIMEZONE = 'Asia/Baghdad';

/**
 * Returns current date string in Baghdad timezone: "YYYY-MM-DD"
 */
export function getBaghdadDateString(date: Date = new Date()): string {
  // Use Intl with Asia/Baghdad
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date); // outputs YYYY-MM-DD
}

/**
 * Returns the start and end Date instances in UTC for a specific Baghdad business date (YYYY-MM-DD)
 * Baghdad is UTC+3 (no daylight saving time currently).
 */
export function getBaghdadDayRange(dateString?: string): { start: Date; end: Date; dateStr: string } {
  const dateStr = dateString || getBaghdadDateString();
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);

  // Baghdad is UTC+3.
  // 00:00:00 Baghdad is (day-1) 21:00:00 UTC
  // 23:59:59.999 Baghdad is (day) 20:59:59.999 UTC
  const start = new Date(Date.UTC(year, month, day, 0, 0, 0, 0) - 3 * 3600 * 1000);
  const end = new Date(Date.UTC(year, month, day, 23, 59, 59, 999) - 3 * 3600 * 1000);

  return { start, end, dateStr };
}

/**
 * Format any timestamp or date into Kurdish readable Baghdad date/time
 */
export function formatBaghdadDateTime(val: any): string {
  if (!val) return '—';
  let date: Date;
  if (val instanceof Date) {
    date = val;
  } else if (typeof val?.toDate === 'function') {
    date = val.toDate();
  } else if (typeof val?.seconds === 'number') {
    date = new Date(val.seconds * 1000);
  } else if (typeof val === 'string' || typeof val === 'number') {
    date = new Date(val);
  } else {
    return '—';
  }

  if (isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('ckb', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Format timestamp into Baghdad time only (e.g. 02:45 PM)
 */
export function formatBaghdadTime(val: any): string {
  if (!val) return '—';
  let date: Date;
  if (val instanceof Date) {
    date = val;
  } else if (typeof val?.toDate === 'function') {
    date = val.toDate();
  } else if (typeof val?.seconds === 'number') {
    date = new Date(val.seconds * 1000);
  } else if (typeof val === 'string' || typeof val === 'number') {
    date = new Date(val);
  } else {
    return '—';
  }

  if (isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Returns the start (Saturday) and current/end date in Baghdad timezone for the current week.
 * In Kurdistan / Iraq, the business week starts on Saturday.
 */
export function getBaghdadWeekRange(referenceDate: Date = new Date()): {
  startDateStr: string;
  endDateStr: string;
  start: Date;
  end: Date;
} {
  const todayStr = getBaghdadDateString(referenceDate);
  const [yearStr, monthStr, dayStr] = todayStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);

  // Construct current Baghdad day at noon UTC to avoid day shift
  const currentDayUtc = new Date(Date.UTC(year, month, day, 12, 0, 0));
  const dayOfWeek = currentDayUtc.getUTCDay(); // 0 is Sunday, 6 is Saturday

  // Calculate days since Saturday (start of week)
  const daysSinceSaturday = (dayOfWeek + 1) % 7;

  // Subtract days to get to Saturday
  const startDayUtc = new Date(currentDayUtc.getTime() - daysSinceSaturday * 24 * 3600 * 1000);
  const startYear = startDayUtc.getUTCFullYear();
  const startMonth = String(startDayUtc.getUTCMonth() + 1).padStart(2, '0');
  const startDay = String(startDayUtc.getUTCDate()).padStart(2, '0');
  const startDateStr = `${startYear}-${startMonth}-${startDay}`;

  const { start } = getBaghdadDayRange(startDateStr);
  const { end } = getBaghdadDayRange(todayStr);

  return {
    startDateStr,
    endDateStr: todayStr,
    start,
    end,
  };
}

/**
 * Returns the start (1st day of month) and current/end date in Baghdad timezone for the current month.
 */
export function getBaghdadMonthRange(referenceDate: Date = new Date()): {
  startDateStr: string;
  endDateStr: string;
  start: Date;
  end: Date;
} {
  const todayStr = getBaghdadDateString(referenceDate);
  const [yearStr, monthStr] = todayStr.split('-');
  const startDateStr = `${yearStr}-${monthStr}-01`;

  const { start } = getBaghdadDayRange(startDateStr);
  const { end } = getBaghdadDayRange(todayStr);

  return {
    startDateStr,
    endDateStr: todayStr,
    start,
    end,
  };
}

/**
 * Resolves the start date, end date, and Kurdish label for an AnalyticsRange.
 */
export function getAnalyticsRangeInfo(
  range: 'daily' | 'weekly' | 'monthly',
  referenceDate: Date = new Date()
): {
  startDateStr: string;
  endDateStr: string;
  label: string;
} {
  const todayStr = getBaghdadDateString(referenceDate);

  switch (range) {
    case 'weekly': {
      const week = getBaghdadWeekRange(referenceDate);
      return {
        startDateStr: week.startDateStr,
        endDateStr: week.endDateStr,
        label: `ئەم هەفتەیە (${week.startDateStr} تا ${week.endDateStr})`,
      };
    }
    case 'monthly': {
      const month = getBaghdadMonthRange(referenceDate);
      return {
        startDateStr: month.startDateStr,
        endDateStr: month.endDateStr,
        label: `ئەم مانگە (${month.startDateStr} تا ${month.endDateStr})`,
      };
    }
    case 'daily':
    default: {
      return {
        startDateStr: todayStr,
        endDateStr: todayStr,
        label: `ئەمڕۆ (${todayStr})`,
      };
    }
  }
}

