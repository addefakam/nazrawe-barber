import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatBirr, filterTransactionsByDate } from '../utils/helpers';
import { translations } from '../utils/translations';
import type { DateFilterType } from '../utils/helpers';

interface Tx { amount: number; status: string; employeeId: string; timestamp: number; }
type CustomMode = 'day' | 'month' | 'year';

// ── Week helpers ─────────────────────────────────────────────────────────────
const getWeekDays = (language: 'en' | 'am') => {
  const now  = new Date();
  const day  = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
  
  const labelsEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const labelsAm = ['ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'አርብ', 'ቅዳሜ', 'እሁድ'];
  const labels = language === 'am' ? labelsAm : labelsEn;

  return labels.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { label, date: d };
  });
};

// ── Compute all metrics from a transaction list ───────────────────────────────
const computeMetrics = (txs: Tx[], employees: { id: string; name: string; active: boolean }[]) => {
  let totalSales = 0, cashCollected = 0, onCredit = 0;
  txs.forEach(tx => {
    totalSales += tx.amount;
    if (tx.status === 'PAID') cashCollected += tx.amount;
    else                      onCredit      += tx.amount;
  });
  const ownerShare          = Math.floor(cashCollected / 2);
  const ownerShareIfAllPaid = Math.floor(totalSales / 2);
  const stylistStats = employees.map(emp => {
    let total = 0, paid = 0, credit = 0;
    txs.filter(t => t.employeeId === emp.id).forEach(t => {
      total += t.amount;
      if (t.status === 'PAID') paid += t.amount; else credit += t.amount;
    });
    return { ...emp, total, paid, credit };
  });
  return { totalSales, cashCollected, onCredit, ownerShare, ownerShareIfAllPaid, stylistStats };
};

// ── Shared metrics display ────────────────────────────────────────────────────
const DashboardMetrics: React.FC<{ metrics: ReturnType<typeof computeMetrics> }> = ({ metrics }) => {
  const { totalSales, cashCollected, onCredit, ownerShare, ownerShareIfAllPaid, stylistStats } = metrics;
  const { language } = useApp();
  const t = translations[language];

  return (
    <>
      {/* Owner Share */}
      <div className="glass-panel" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', borderRadius: '50%', background: 'radial-gradient(circle, hsla(var(--color-primary) / 0.2) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="metric-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{t.yourShare}</span>
            <span className="badge badge-paid">{t.payableNow}</span>
          </div>
          <div className="metric-value" style={{ fontSize: '36px', color: 'hsl(var(--color-primary))', margin: '8px 0' }}>
            {formatBirr(ownerShare)}
          </div>
          <div className="progress-bar-container" style={{ height: '10px' }}>
            <div className="progress-bar-fill" style={{
              width: totalSales > 0 ? `${(cashCollected / totalSales) * 100}%` : '0%',
              background: 'linear-gradient(90deg, hsl(var(--color-primary)) 0%, hsl(var(--color-success)) 100%)',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '6px', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ color: 'hsl(var(--text-secondary))' }}>{t.cashInHand}: <strong>{formatBirr(cashCollected)}</strong></span>
            <span style={{ color: 'hsl(var(--text-muted))' }}>{t.ifAllPaid}: <strong>{formatBirr(ownerShareIfAllPaid)}</strong></span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-2">
        <div className="glass-panel metric-card success">
          <div className="metric-label">{t.cashCollected}</div>
          <div className="metric-value">{formatBirr(cashCollected)}</div>
          <div className="metric-subtext">{language === 'am' ? '50% ለእርስዎ ይሄዳል' : '50% goes to you'}</div>
        </div>
        <div className="glass-panel metric-card warning">
          <div className="metric-label">{t.onCredit}</div>
          <div className="metric-value">{formatBirr(onCredit)}</div>
          <div className="metric-subtext">{language === 'am' ? 'ድርሻዎን ለማግኘት ይቀበሉ' : 'Collect to earn your share'}</div>
        </div>
      </div>
      <div className="glass-panel metric-card primary">
        <div className="metric-label">{t.totalSales}</div>
        <div className="metric-value">{formatBirr(totalSales)}</div>
        <div className="metric-subtext">{language === 'am' ? 'የጥሬ ገንዘብ እና ብድር ድምር' : 'Cash + Credit combined'}</div>
      </div>

      {/* Stylist breakdown */}
      <div className="glass-panel">
        <h3 style={{ fontSize: '15px', marginBottom: '14px', fontWeight: 700 }}>{t.stylistPerformance}</h3>
        {stylistStats.every(e => e.total === 0 && !e.active)
          ? <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '8px 0' }}>{t.noIncome}</p>
          : stylistStats.map(emp => {
              if (emp.total === 0 && !emp.active) return null;
              const paidRatio   = emp.total > 0 ? (emp.paid   / emp.total) * 100 : 0;
              const creditRatio = emp.total > 0 ? (emp.credit / emp.total) * 100 : 0;
              const initial     = emp.name.charAt(0).toUpperCase();
              let avatarClass   = 'generic';
              const n = emp.name.toLowerCase();
              if (n === 'alex') avatarClass = 'alex';
              else if (n === 'emma') avatarClass = 'emma';
              else if (n === 'ben')  avatarClass = 'ben';
              return (
                <div key={emp.id} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                      <div className={`ledger-avatar ${avatarClass}`} style={{ width: '26px', minWidth: '26px', height: '26px', fontSize: '11px', borderRadius: '8px' }}>{initial}</div>
                      <span style={{ fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {emp.name}{!emp.active && <span style={{ fontSize: '10px', color: 'hsl(var(--color-danger))' }}> ({language === 'am' ? 'አያገለግልም' : 'Inactive'})</span>}
                      </span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 700, paddingLeft: '8px', whiteSpace: 'nowrap' }}>
                      {emp.total > 0 ? formatBirr(emp.total) : <span style={{ color: 'hsl(var(--text-muted))' }}>—</span>}
                    </span>
                  </div>
                  <div className="progress-bar-container" style={{ height: '6px' }}>
                    {emp.total > 0
                      ? <div style={{ display: 'flex', width: '100%', height: '100%' }}>
                          <div style={{ width: `${paidRatio}%`,   backgroundColor: 'hsl(var(--color-success))', height: '100%' }} />
                          <div style={{ width: `${creditRatio}%`, backgroundColor: 'hsl(var(--color-warning))', height: '100%' }} />
                        </div>
                      : <div style={{ width: '0%', height: '100%' }} />}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                    <span>{t.legendCash}: {formatBirr(emp.paid)}</span>
                    <span>{t.legendCredit}: {formatBirr(emp.credit)}</span>
                  </div>
                </div>
              );
            })
        }
      </div>
    </>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const { transactions, employees, language } = useApp();
  const t = translations[language];
  const [dateFilter, setDateFilter] = useState<DateFilterType>('today');

  // Week view: selected day
  const weekDays  = getWeekDays(language);
  const todayName = weekDays.find(d => d.date.toDateString() === new Date().toDateString())?.label ?? weekDays[0].label;
  const [selectedDay, setSelectedDay] = useState<string>(todayName);

  // Custom picker state
  const [customMode, setCustomMode] = useState<CustomMode>('day');
  const todayISO  = new Date().toISOString().slice(0, 10);          // YYYY-MM-DD
  const monthISO  = new Date().toISOString().slice(0, 7);           // YYYY-MM
  const currentYr = new Date().getFullYear();
  const [customDay,   setCustomDay]   = useState<string>(todayISO);
  const [customMonth, setCustomMonth] = useState<string>(monthISO);
  const [customYear,  setCustomYear]  = useState<number>(currentYr);

  const filterLabels: Record<DateFilterType, string> = {
    today: t.today, yesterday: t.yesterday, week: t.week,
    month: t.month, all: t.all, custom: t.custom,
  };

  // ── Resolve which transactions to show ──────────────────────────────────────
  let displayTxs: Tx[];

  if (dateFilter === 'week') {
    const dayObj = weekDays.find(d => d.label === selectedDay);
    if (dayObj) {
      const start = new Date(dayObj.date.getFullYear(), dayObj.date.getMonth(), dayObj.date.getDate()).getTime();
      displayTxs  = (transactions as Tx[]).filter(tx => tx.timestamp >= start && tx.timestamp < start + 86400000);
    } else displayTxs = [];

  } else if (dateFilter === 'custom') {
    if (customMode === 'day') {
      const [y, m, d] = customDay.split('-').map(Number);
      const start = new Date(y, m - 1, d).getTime();
      displayTxs  = (transactions as Tx[]).filter(tx => tx.timestamp >= start && tx.timestamp < start + 86400000);
    } else if (customMode === 'month') {
      const [y, m] = customMonth.split('-').map(Number);
      const start = new Date(y, m - 1, 1).getTime();
      const end   = new Date(y, m, 1).getTime();
      displayTxs  = (transactions as Tx[]).filter(tx => tx.timestamp >= start && tx.timestamp < end);
    } else {
      // year
      const start = new Date(customYear, 0, 1).getTime();
      const end   = new Date(customYear + 1, 0, 1).getTime();
      displayTxs  = (transactions as Tx[]).filter(tx => tx.timestamp >= start && tx.timestamp < end);
    }
  } else {
    displayTxs = filterTransactionsByDate(transactions, dateFilter) as Tx[];
  }

  const metrics = computeMetrics(displayTxs, employees);

  // Year range for dropdown (2020 → current+1)
  const yearOptions: number[] = [];
  for (let y = currentYr + 1; y >= 2020; y--) yearOptions.push(y);

  return (
    <div className="animated-fade-in">

      {/* ── Main filter bar ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
        {(['today', 'yesterday', 'week', 'month', 'all', 'custom'] as DateFilterType[]).map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setDateFilter(f)}
            style={{
              flex: '0 0 auto',
              padding: '9px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              border: dateFilter === f
                ? '1.5px solid hsl(var(--color-primary))'
                : '1.5px solid hsla(var(--border-glass) / 0.1)',
              background: dateFilter === f
                ? 'hsla(var(--color-primary) / 0.12)'
                : 'hsla(var(--bg-surface) / 0.4)',
              color: dateFilter === f
                ? 'hsl(var(--color-primary))'
                : 'hsl(var(--text-primary))',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {filterLabels[f]}
          </button>
        ))}
      </div>

      {/* ── Week: day selector ──────────────────────────────────────────── */}
      {dateFilter === 'week' && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
          {weekDays.map(({ label, date }) => {
            const isToday  = date.toDateString() === new Date().toDateString();
            const isFuture = date > new Date() && !isToday;
            const isActive = selectedDay === label;
            return (
              <button key={label} type="button" onClick={() => setSelectedDay(label)}
                style={{
                  flex: '0 0 auto', minWidth: '52px', padding: '8px 12px', borderRadius: '10px',
                  fontSize: '13px', fontWeight: 700, cursor: isFuture ? 'default' : 'pointer',
                  border: isActive ? '1.5px solid hsl(var(--color-primary))' : '1.5px solid hsla(var(--border-glass) / 0.1)',
                  background: isActive ? 'hsla(var(--color-primary) / 0.12)' : 'hsla(var(--bg-surface) / 0.4)',
                  color: isActive ? 'hsl(var(--color-primary))' : isFuture ? 'hsl(var(--text-muted))' : 'hsl(var(--text-primary))',
                  opacity: isFuture ? 0.4 : 1, transition: 'all 0.15s ease',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                }}
              >
                {label}
                {isToday && <span style={{ fontSize: '8px', fontWeight: 700, color: isActive ? 'hsl(var(--color-primary))' : 'hsl(var(--text-muted))' }}>{t.todayBadge}</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Custom picker ───────────────────────────────────────────────── */}
      {dateFilter === 'custom' && (
        <div className="glass-panel animated-fade-in" style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>{t.pickCustomPeriod}</h3>

          {/* Mode selector: Day / Month / Year */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            {(['day', 'month', 'year'] as CustomMode[]).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setCustomMode(mode)}
                style={{
                  flex: 1, padding: '8px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                  cursor: 'pointer',
                  border: customMode === mode ? '1.5px solid hsl(var(--color-primary))' : '1.5px solid hsla(var(--border-glass) / 0.1)',
                  background: customMode === mode ? 'hsla(var(--color-primary) / 0.12)' : 'hsla(var(--bg-surface) / 0.4)',
                  color: customMode === mode ? 'hsl(var(--color-primary))' : 'hsl(var(--text-primary))',
                  transition: 'all 0.15s ease',
                }}
              >
                {mode === 'day' ? t.dayMode : mode === 'month' ? t.monthMode : t.yearMode}
              </button>
            ))}
          </div>

          {/* Day picker */}
          {customMode === 'day' && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-secondary))', display: 'block', marginBottom: '6px' }}>
                {t.selectDate}
              </label>
              <input
                type="date"
                value={customDay}
                max={todayISO}
                onChange={e => setCustomDay(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '12px', fontSize: '15px',
                  background: 'hsla(var(--bg-base) / 0.5)',
                  border: '1.5px solid hsla(var(--border-glass) / 0.12)',
                  color: 'hsl(var(--text-primary))',
                  colorScheme: 'dark',
                }}
              />
              {customDay && (
                <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '6px' }}>
                  {t.showingReportFor} <strong>{new Date(customDay + 'T00:00:00').toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                </p>
              )}
            </div>
          )}

          {/* Month picker */}
          {customMode === 'month' && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-secondary))', display: 'block', marginBottom: '6px' }}>
                {t.selectMonth}
              </label>
              <input
                type="month"
                value={customMonth}
                max={monthISO}
                onChange={e => setCustomMonth(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '12px', fontSize: '15px',
                  background: 'hsla(var(--bg-base) / 0.5)',
                  border: '1.5px solid hsla(var(--border-glass) / 0.12)',
                  color: 'hsl(var(--text-primary))',
                  colorScheme: 'dark',
                }}
              />
              {customMonth && (
                <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '6px' }}>
                  {t.showingReportFor} <strong>{new Date(customMonth + '-01').toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US', { year: 'numeric', month: 'long' })}</strong>
                </p>
              )}
            </div>
          )}

          {/* Year picker */}
          {customMode === 'year' && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-secondary))', display: 'block', marginBottom: '6px' }}>
                {t.selectYear}
              </label>
              <select
                value={customYear}
                onChange={e => setCustomYear(Number(e.target.value))}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '12px', fontSize: '15px',
                  background: 'hsl(var(--bg-surface))',
                  border: '1.5px solid hsla(var(--border-glass) / 0.12)',
                  color: 'hsl(var(--text-primary))',
                  cursor: 'pointer',
                }}
              >
                {yearOptions.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '6px' }}>
                {t.showingReportFor} <strong>{customYear}</strong>
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── The full dashboard metrics ───────────────────────────────────── */}
      <DashboardMetrics metrics={metrics} />
    </div>
  );
};
