import { format, getDay, getDaysInMonth } from 'date-fns';
import { ru } from 'date-fns/locale';

const HOLIDAYS_BY_YEAR = {
  2025: new Set([
    '2025-01-01', '2025-01-02', '2025-01-03', '2025-01-04', '2025-01-05',
    '2025-01-06', '2025-01-07', '2025-01-08',
    '2025-02-22', '2025-02-23',
    '2025-03-08', '2025-03-09',
    '2025-05-01', '2025-05-02', '2025-05-03', '2025-05-04',
    '2025-05-08', '2025-05-09', '2025-05-10', '2025-05-11',
    '2025-06-12', '2025-06-13', '2025-06-14', '2025-06-15',
    '2025-11-02', '2025-11-03', '2025-11-04',
  ]),
  2026: new Set([
    '2026-01-01', '2026-01-02', '2026-01-05', '2026-01-06', '2026-01-07', '2026-01-08',
    '2026-02-21', '2026-02-22', '2026-02-23',
    '2026-03-07', '2026-03-08', '2026-03-09',
    '2026-05-01', '2026-05-02', '2026-05-03',
    '2026-05-09', '2026-05-10', '2026-05-11',
    '2026-06-12', '2026-06-13', '2026-06-14',
    '2026-11-04',
  ]),
  2027: new Set([
    '2027-01-01', '2027-01-02', '2027-01-03', '2027-01-04', '2027-01-05',
    '2027-01-06', '2027-01-07', '2027-01-08', '2027-01-09', '2027-01-10',
    '2027-02-21', '2027-02-22', '2027-02-23',
    '2027-03-06', '2027-03-07', '2027-03-08',
    '2027-05-01', '2027-05-02', '2027-05-03',
    '2027-05-08', '2027-05-09', '2027-05-10',
    '2027-06-12', '2027-06-13', '2027-06-14',
    '2027-11-04', '2027-11-05', '2027-11-06', '2027-11-07',
    '2027-12-31',
  ]),
};

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseVacationDate(value) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function normalizeVacationRange(vacationStart, vacationEnd) {
  const start = parseVacationDate(vacationStart);
  const end = parseVacationDate(vacationEnd);

  if (!start || !end) {
    return { start: null, end: null };
  }

  if (start.getTime() <= end.getTime()) {
    return { start, end };
  }

  return { start: end, end: start };
}

function isDateInVacation(date, vacationStart, vacationEnd) {
  if (!vacationStart || !vacationEnd) {
    return false;
  }

  const time = date.getTime();
  return time >= vacationStart.getTime() && time <= vacationEnd.getTime();
}

function isWorkday(date) {
  const dayOfWeek = getDay(date);

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }

  const year = date.getFullYear();
  const holidays = HOLIDAYS_BY_YEAR[year];
  if (holidays?.has(toDateKey(date))) {
    return false;
  }

  return true;
}

function getWorkingDaysInMonthByYear(year, month) {
  const daysInMonth = getDaysInMonth(new Date(year, month, 1));
  let workingDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    if (isWorkday(new Date(year, month, day))) {
      workingDays++;
    }
  }

  return workingDays;
}

function getWorkingDaysInPeriodByYear(year, month, startDay, endDay) {
  let workingDays = 0;

  for (let day = startDay; day <= endDay; day++) {
    if (isWorkday(new Date(year, month, day))) {
      workingDays++;
    }
  }

  return workingDays;
}

function countVacationWorkdaysInPeriod(year, month, startDay, endDay, vacationStart, vacationEnd) {
  if (!vacationStart || !vacationEnd) {
    return 0;
  }

  let count = 0;

  for (let day = startDay; day <= endDay; day++) {
    const date = new Date(year, month, day);
    if (isWorkday(date) && isDateInVacation(date, vacationStart, vacationEnd)) {
      count++;
    }
  }

  return count;
}

function countVacationWorkdaysInMonth(year, month, vacationStart, vacationEnd) {
  const daysInMonth = getDaysInMonth(new Date(year, month, 1));
  return countVacationWorkdaysInPeriod(year, month, 1, daysInMonth, vacationStart, vacationEnd);
}

function countTotalVacationWorkdays(vacationStart, vacationEnd) {
  if (!vacationStart || !vacationEnd) {
    return 0;
  }

  let count = 0;
  const cursor = new Date(vacationStart);

  while (cursor.getTime() <= vacationEnd.getTime()) {
    if (isWorkday(cursor)) {
      count++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}

function calculatePeriodNet(workingDaysInPeriod, vacationDaysInPeriod, dailyRate, taxMultiplier, useVacationMode) {
  const workedDays = useVacationMode
    ? Math.max(0, workingDaysInPeriod - vacationDaysInPeriod)
    : workingDaysInPeriod;

  return dailyRate * workedDays * taxMultiplier;
}

function calculateMonthParts(year, month, salary, taxRate, vacationOptions = {}) {
  const {
    useVacationMode = false,
    vacationStart = null,
    vacationEnd = null,
  } = vacationOptions;
  const daysInMonth = getDaysInMonth(new Date(year, month, 1));
  const workingDays = getWorkingDaysInMonthByYear(year, month);
  const period1Days = getWorkingDaysInPeriodByYear(year, month, 1, 15);
  const period2Days = getWorkingDaysInPeriodByYear(year, month, 16, daysInMonth);
  const dailyRate = workingDays > 0 ? salary / workingDays : 0;
  const taxMultiplier = 1 - taxRate / 100;
  const period1Vacation = useVacationMode
    ? countVacationWorkdaysInPeriod(year, month, 1, 15, vacationStart, vacationEnd)
    : 0;
  const period2Vacation = useVacationMode
    ? countVacationWorkdaysInPeriod(year, month, 16, daysInMonth, vacationStart, vacationEnd)
    : 0;
  const vacationDaysInMonth = period1Vacation + period2Vacation;

  return {
    month,
    year,
    monthName: format(new Date(year, month, 1), 'LLLL', { locale: ru }),
    workingDays,
    period1Days,
    period2Days,
    vacationDays: vacationDaysInMonth,
    period1Vacation,
    period2Vacation,
    period1Net: calculatePeriodNet(
      period1Days,
      period1Vacation,
      dailyRate,
      taxMultiplier,
      useVacationMode,
    ),
    period2Net: calculatePeriodNet(
      period2Days,
      period2Vacation,
      dailyRate,
      taxMultiplier,
      useVacationMode,
    ),
  };
}

function formatVacationRangeLabel(vacationStart, vacationEnd) {
  if (!vacationStart || !vacationEnd) {
    return '';
  }

  return `${format(vacationStart, 'd MMMM', { locale: ru })} – ${format(vacationEnd, 'd MMMM yyyy', { locale: ru })}`;
}

function getMonthlyData(salary, taxRate, year, options = {}) {
  const normalizedSalary = Number.isFinite(salary) ? Math.max(salary, 0) : 0;
  const normalizedTaxRate = Number.isFinite(taxRate) ? Math.min(Math.max(taxRate, 0), 100) : 13;
  const normalizedYear = Number.isFinite(year) ? year : new Date().getFullYear();
  const {
    mode = 'standard',
    vacationStart: vacationStartInput = '',
    vacationEnd: vacationEndInput = '',
    vacationPayoutPerDay = 0,
  } = options;
  const useVacationMode = mode === 'vacation';
  const { start: vacationStart, end: vacationEnd } = normalizeVacationRange(
    vacationStartInput,
    vacationEndInput,
  );
  const hasVacationRange = Boolean(vacationStart && vacationEnd);
  const normalizedPayoutPerDay = Number.isFinite(vacationPayoutPerDay)
    ? Math.max(vacationPayoutPerDay, 0)
    : 0;
  const totalVacationWorkdays = hasVacationRange
    ? countTotalVacationWorkdays(vacationStart, vacationEnd)
    : 0;
  const totalVacationPayout = normalizedPayoutPerDay * totalVacationWorkdays;
  const vacationPeriodLabel = hasVacationRange
    ? `${formatVacationRangeLabel(vacationStart, vacationEnd)}, ${totalVacationWorkdays} раб. дн.`
    : '';
  const vacationPayoutMonth = hasVacationRange ? vacationStart.getMonth() + 1 : null;
  const vacationPayoutYear = hasVacationRange ? vacationStart.getFullYear() : null;
  const monthBase = [];

  for (let month = 0; month < 12; month++) {
    monthBase.push(
      calculateMonthParts(normalizedYear, month, normalizedSalary, normalizedTaxRate, {
        useVacationMode: useVacationMode && hasVacationRange,
        vacationStart,
        vacationEnd,
      }),
    );
  }

  return monthBase.map((currentMonth, index) => {
    const previousMonth =
      index === 0
        ? calculateMonthParts(normalizedYear - 1, 11, normalizedSalary, normalizedTaxRate, {
            useVacationMode: useVacationMode && hasVacationRange,
            vacationStart,
            vacationEnd,
          })
        : monthBase[index - 1];

    const showVacationPayout =
      useVacationMode
      && hasVacationRange
      && totalVacationPayout > 0
      && vacationPayoutYear === normalizedYear
      && vacationPayoutMonth === currentMonth.month + 1;

    const paymentOn5PaidDays = previousMonth.period2Days - previousMonth.period2Vacation;
    const paymentOn20PaidDays = currentMonth.period1Days - currentMonth.period1Vacation;

    return {
      month: currentMonth.month + 1,
      monthName: currentMonth.monthName,
      workingDays: currentMonth.workingDays,
      vacationDays: currentMonth.vacationDays,
      salaryPeriodDays: currentMonth.period1Days,
      advancePeriodDays: previousMonth.period2Days,
      paymentOn20Net: currentMonth.period1Net,
      paymentOn5Net: previousMonth.period2Net,
      paymentOn5PaidDays,
      paymentOn5TotalDays: previousMonth.period2Days,
      paymentOn5VacationDays: previousMonth.period2Vacation,
      paymentOn20PaidDays,
      paymentOn20TotalDays: currentMonth.period1Days,
      paymentOn20VacationDays: currentMonth.period1Vacation,
      previousMonthName: previousMonth.monthName,
      vacationPayout: showVacationPayout ? totalVacationPayout : null,
      vacationPayoutPerDay: showVacationPayout ? normalizedPayoutPerDay : null,
      vacationPeriodLabel: showVacationPayout ? vacationPeriodLabel : null,
    };
  });
}

function getAvailableYears() {
  const currentYear = new Date().getFullYear();
  const years = new Set(Object.keys(HOLIDAYS_BY_YEAR).map(Number));
  years.add(currentYear);

  const sorted = [...years].sort((a, b) => a - b);
  const min = Math.min(sorted[0], currentYear - 1);
  const max = Math.max(sorted[sorted.length - 1], currentYear + 1);

  const result = [];
  for (let y = min; y <= max; y++) {
    result.push(y);
  }
  return result;
}

function hasHolidayCalendar(year) {
  return Boolean(HOLIDAYS_BY_YEAR[year]);
}

export {
  getMonthlyData,
  getWorkingDaysInMonthByYear,
  getWorkingDaysInPeriodByYear,
  countTotalVacationWorkdays,
  normalizeVacationRange,
  getAvailableYears,
  hasHolidayCalendar,
  HOLIDAYS_BY_YEAR,
};
