'use client';

import { useState, useMemo } from 'react';
import {
  getMonthlyData,
  getAvailableYears,
  hasHolidayCalendar,
  normalizeVacationRange,
  countTotalVacationWorkdays,
} from './utils/calendar';
import styles from './page.module.css';

const CURRENT_YEAR = new Date().getFullYear();

export default function SalaryCalculator() {
  const [salaryInput, setSalaryInput] = useState('100000');
  const [taxRate, setTaxRate] = useState(13);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [calcMode, setCalcMode] = useState('standard');
  const [vacationStart, setVacationStart] = useState('');
  const [vacationEnd, setVacationEnd] = useState('');
  const [vacationPayoutPerDayInput, setVacationPayoutPerDayInput] = useState('');

  const salary = Number(salaryInput);
  const parsedSalary = Number.isFinite(salary) ? salary : 0;
  const vacationPayoutPerDay = Number(vacationPayoutPerDayInput);
  const parsedVacationPayoutPerDay = Number.isFinite(vacationPayoutPerDay) ? vacationPayoutPerDay : 0;
  const availableYears = useMemo(() => getAvailableYears(), []);

  const monthsData = useMemo(() => {
    return getMonthlyData(parsedSalary, taxRate, year, {
      mode: calcMode,
      vacationStart,
      vacationEnd,
      vacationPayoutPerDay: parsedVacationPayoutPerDay,
    });
  }, [parsedSalary, taxRate, year, calcMode, vacationStart, vacationEnd, parsedVacationPayoutPerDay]);

  const vacationSummary = useMemo(() => {
    const { start, end } = normalizeVacationRange(vacationStart, vacationEnd);
    if (!start || !end) {
      return null;
    }

    return {
      workdays: countTotalVacationWorkdays(start, end),
    };
  }, [vacationStart, vacationEnd]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0);
  };

  const isVacationMode = calcMode === 'vacation';
  const yearHasHolidays = hasHolidayCalendar(year);

  const formatPaymentDaysLabel = (paidDays, totalDays, vacationDays) => {
    if (!isVacationMode || vacationDays <= 0) {
      return `${paidDays} раб. дн.`;
    }

    return `${paidDays} из ${totalDays} раб. дн. (−${vacationDays} отпуск)`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Годовой калькулятор зарплаты</h1>
          <p className={styles.subtitle}>
            Расчетный лист по рабочим дням и праздникам РФ ({year} год)
            {!yearHasHolidays && ' — учитываются только выходные, без переносов праздников'}
          </p>

          <div className={styles.controls}>
            <div className={styles.field}>
              <label htmlFor="year" className={styles.label}>Год</label>
              <select
                id="year"
                className={styles.input}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="salary" className={styles.label}>Оклад (в рублях)</label>
              <div className={styles.inputWrap}>
                <input
                  id="salary"
                  type="number"
                  className={styles.input}
                  value={salaryInput}
                  onChange={(e) => setSalaryInput(e.target.value)}
                  min="0"
                  step="1000"
                />
                {salaryInput !== '' && (
                  <button
                    type="button"
                    className={styles.clearButton}
                    onClick={() => setSalaryInput('')}
                    aria-label="Очистить поле оклада"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="taxRate" className={styles.label}>НДФЛ, %</label>
              <input
                id="taxRate"
                type="number"
                className={styles.input}
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>

          <div className={styles.modeSection}>
            <span className={styles.label}>Режим расчёта</span>
            <div className={styles.modeToggle}>
              <label className={styles.modeOption}>
                <input
                  type="radio"
                  name="calcMode"
                  value="standard"
                  checked={calcMode === 'standard'}
                  onChange={() => setCalcMode('standard')}
                />
                Стандартный
              </label>
              <label className={styles.modeOption}>
                <input
                  type="radio"
                  name="calcMode"
                  value="vacation"
                  checked={calcMode === 'vacation'}
                  onChange={() => setCalcMode('vacation')}
                />
                С учётом отпуска
              </label>
            </div>
          </div>

          {isVacationMode && (
            <div className={styles.vacationControls}>
              <div className={styles.vacationDates}>
                <div className={styles.field}>
                  <label htmlFor="vacationStart" className={styles.label}>Отпуск с</label>
                  <input
                    id="vacationStart"
                    type="date"
                    className={styles.input}
                    value={vacationStart}
                    onChange={(e) => setVacationStart(e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="vacationEnd" className={styles.label}>Отпуск по</label>
                  <input
                    id="vacationEnd"
                    type="date"
                    className={styles.input}
                    value={vacationEnd}
                    onChange={(e) => setVacationEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="vacationPayoutPerDay" className={styles.label}>
                  Сумма за 1 отпускной день (на руки), руб.
                </label>
                <input
                  id="vacationPayoutPerDay"
                  type="number"
                  className={styles.input}
                  value={vacationPayoutPerDayInput}
                  onChange={(e) => setVacationPayoutPerDayInput(e.target.value)}
                  min="0"
                  step="100"
                  placeholder="0"
                />
              </div>

              {vacationSummary && parsedVacationPayoutPerDay > 0 && (
                <p className={styles.vacationHint}>
                  Итого отпускные: {formatCurrency(parsedVacationPayoutPerDay * vacationSummary.workdays)} руб.
                  ({parsedVacationPayoutPerDay.toLocaleString('ru-RU')} × {vacationSummary.workdays} раб. дн.)
                </p>
              )}

              {vacationSummary && (
                <p className={styles.vacationHint}>
                  Рабочие дни отпуска исключаются из зарплаты. Если отпуск после 15-го числа,
                  уменьшение будет на выплате 5-го числа следующего месяца.
                </p>
              )}
            </div>
          )}
        </header>

        <main className={styles.tableSection}>
          <div className={styles.monthGrid}>
            {monthsData.map((monthData) => (
              <article className={styles.monthCard} key={monthData.month}>
                <h2 className={styles.monthTitle}>{monthData.monthName}</h2>
                <p className={styles.monthMeta}>
                  Рабочих дней в месяце: {monthData.workingDays}
                  {isVacationMode && monthData.vacationDays > 0 && (
                    <span className={styles.vacationBadge}>
                      {' '}· в отпуске: {monthData.vacationDays} раб. дн.
                    </span>
                  )}
                </p>

                {monthData.vacationPayout != null && (
                  <div className={`${styles.paymentRow} ${styles.vacationPayoutRow}`}>
                    <span className={styles.paymentLabel}>
                      Отпускные ({monthData.vacationPeriodLabel})
                    </span>
                    <span className={styles.amount}>
                      {formatCurrency(monthData.vacationPayout)} руб.
                    </span>
                  </div>
                )}

                <div className={styles.paymentRow}>
                  <span className={styles.paymentLabel}>
                    5 число (за 16-конец {monthData.previousMonthName})
                    {isVacationMode && (
                      <span className={styles.paymentDays}>
                        {formatPaymentDaysLabel(
                          monthData.paymentOn5PaidDays,
                          monthData.paymentOn5TotalDays,
                          monthData.paymentOn5VacationDays,
                        )}
                      </span>
                    )}
                  </span>
                  <span className={styles.amount}>{formatCurrency(monthData.paymentOn5Net)} руб.</span>
                </div>

                <div className={styles.paymentRow}>
                  <span className={styles.paymentLabel}>
                    20 число (за 1-15 {monthData.monthName})
                    {isVacationMode && (
                      <span className={styles.paymentDays}>
                        {formatPaymentDaysLabel(
                          monthData.paymentOn20PaidDays,
                          monthData.paymentOn20TotalDays,
                          monthData.paymentOn20VacationDays,
                        )}
                      </span>
                    )}
                  </span>
                  <span className={styles.amount}>{formatCurrency(monthData.paymentOn20Net)} руб.</span>
                </div>
              </article>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
