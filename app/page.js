'use client';

import { useState, useMemo } from 'react';
import {
  getMonthlyData,
  getAvailableYears,
  hasHolidayCalendar,
  normalizeVacationRange,
  countTotalVacationWorkdays,
  countTotalVacationCalendarDays,
  calculateAverageDailyRate,
} from './utils/calendar';
import styles from './page.module.css';

const CURRENT_YEAR = new Date().getFullYear();

function createEmptyVacation() {
  return { id: Date.now() + Math.random(), vacationStart: '', vacationEnd: '' };
}

export default function SalaryCalculator() {
  const [salaryInput, setSalaryInput] = useState('100000');
  const [taxRate, setTaxRate] = useState(13);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [calcMode, setCalcMode] = useState('standard');
  const [vacations, setVacations] = useState([]);

  const salary = Number(salaryInput);
  const parsedSalary = Number.isFinite(salary) ? salary : 0;
  const availableYears = useMemo(() => getAvailableYears(), []);

  const monthsData = useMemo(() => {
    return getMonthlyData(parsedSalary, taxRate, year, {
      mode: calcMode,
      vacations,
    });
  }, [parsedSalary, taxRate, year, calcMode, vacations]);

  const vacationSummary = useMemo(() => {
    let totalCalendarDays = 0;
    let totalPayout = 0;
    for (const v of vacations) {
      const { start, end } = normalizeVacationRange(v.vacationStart, v.vacationEnd);
      if (start && end) {
        const calendarDays = countTotalVacationCalendarDays(start, end);
        const payoutPerDay = calculateAverageDailyRate(parsedSalary);
        totalCalendarDays += calendarDays;
        totalPayout += payoutPerDay * calendarDays;
      }
    }
    if (totalCalendarDays === 0) {
      return null;
    }
    return { calendarDays: totalCalendarDays, totalPayout };
  }, [vacations, parsedSalary]);

  const addVacation = () => {
    setVacations((prev) => [...prev, createEmptyVacation()]);
  };

  const removeVacation = (id) => {
    setVacations((prev) => prev.filter((v) => v.id !== id));
  };

  const updateVacation = (id, field, value) => {
    setVacations((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
    );
  };

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
              <div className={styles.vacationListHeader}>
                <span className={styles.label}>Отпуска</span>
                <button type="button" className={styles.addVacationButton} onClick={addVacation}>
                  + Добавить
                </button>
              </div>

              {vacations.length === 0 && (
                <p className={styles.vacationHint}>Добавьте отпуск, чтобы учесть уменьшение рабочих дней</p>
              )}

              {vacations.map((v) => (
                <div className={styles.vacationItem} key={v.id}>
                  <div className={styles.vacationDates}>
                    <div className={styles.field}>
                      <label className={styles.label}>С</label>
                      <input
                        type="date"
                        className={styles.input}
                        value={v.vacationStart}
                        onChange={(e) => updateVacation(v.id, 'vacationStart', e.target.value)}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>По</label>
                      <input
                        type="date"
                        className={styles.input}
                        value={v.vacationEnd}
                        onChange={(e) => updateVacation(v.id, 'vacationEnd', e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.removeVacationButton}
                    onClick={() => removeVacation(v.id)}
                    aria-label="Удалить отпуск"
                  >
                    ×
                  </button>
                </div>
              ))}

              {vacationSummary && (
                <p className={styles.vacationHint}>
                  Итого отпускных дней: {vacationSummary.calendarDays} · Сумма: {formatCurrency(vacationSummary.totalPayout)} руб.
                </p>
              )}

              {vacations.some((v) => v.vacationStart && v.vacationEnd) && (
                <p className={styles.vacationHint}>
                  Стоимость дня отпуска рассчитывается автоматически по средней оплате за аналогичный период прошлого года.
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
                <div className={styles.monthCardHeader}>
                  <h2 className={styles.monthTitle}>{monthData.monthName}</h2>
                  <span className={styles.totalPayout}>
                    {formatCurrency(monthData.totalPayout)} руб.
                  </span>
                </div>
                <p className={styles.monthMeta}>
                  Рабочих дней в месяце: {monthData.workingDays}
                  {isVacationMode && monthData.vacationDays > 0 && (
                    <span className={styles.vacationBadge}>
                      {' '}· в отпуске: {monthData.vacationDays} раб. дн.
                    </span>
                  )}
                </p>

                {monthData.vacationLabels && monthData.vacationLabels.length > 0 && (
                  <div className={`${styles.paymentRow} ${styles.vacationPayoutRow}`}>
                    <span className={styles.paymentLabel}>
                      Отпускные:
                      {monthData.vacationLabels.map((l, i) => (
                        <span key={i}>
                          {i > 0 && ';\u00A0'}
                          <span>{l.label}: {formatCurrency(l.payout)} руб.</span>
                        </span>
                      ))}
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
