import styles from './MonthCard.module.css';

export default function MonthCard({
  monthName,
  workingDays,
  period1Days,
  period2Days,
  period1Amount,
  period2Amount,
  period1Net,
  period2Net,
  formatCurrency,
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.monthName}>{monthName}</h3>
        <div className={styles.workingDays}>
          <span className={styles.workingDaysLabel}>Рабочих дней:</span>
          <span className={styles.workingDaysValue}>{workingDays}</span>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.paymentRow}>
          <div className={styles.paymentInfo}>
            <div className={styles.paymentDate}>20 числа (аванс)</div>
            <div className={styles.paymentPeriod}>
              За период 1-15: <strong>{period1Days} дней</strong>
            </div>
          </div>
          <div className={styles.paymentAmount}>
            <div className={styles.grossAmount}>{formatCurrency(period1Amount)} руб.</div>
            <div className={styles.netAmount}>
              <span className={styles.netLabel}>На руки:</span>
              <span className={styles.netValue}>{formatCurrency(period1Net)} руб.</span>
            </div>
          </div>
        </div>

        <div className={styles.divider}></div>

        <div className={styles.paymentRow}>
          <div className={styles.paymentInfo}>
            <div className={styles.paymentDate}>5 числа (зарплата)</div>
            <div className={styles.paymentPeriod}>
              За период 16-конец: <strong>{period2Days} дней</strong>
            </div>
          </div>
          <div className={styles.paymentAmount}>
            <div className={styles.grossAmount}>{formatCurrency(period2Amount)} руб.</div>
            <div className={styles.netAmount}>
              <span className={styles.netLabel}>На руки:</span>
              <span className={styles.netValue}>{formatCurrency(period2Net)} руб.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}