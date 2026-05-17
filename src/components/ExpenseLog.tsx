import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatBirr } from '../utils/helpers';
import { translations } from '../utils/translations';

interface ExpenseLogProps {
  onSuccess: (message: string) => void;
}

const DEFAULT_CATEGORIES_EN = ['Rent', 'Supplies', 'Utilities', 'Salaries', 'Equipment', 'Other'];
const DEFAULT_CATEGORIES_AM = ['ኪራይ', 'እቃዎች', 'አገልግሎቶች', 'ደሞዝ', 'መሳሪያዎች', 'ሌላ'];

export const ExpenseLog: React.FC<ExpenseLogProps> = ({ onSuccess }) => {
  const { addExpense, language } = useApp();
  const t = translations[language];

  const [amountStr, setAmountStr] = useState<string>('');
  const [category, setCategory]   = useState<string>('');
  const [notes, setNotes]         = useState<string>('');
  const [errorMsg, setErrorMsg]   = useState<string>('');

  const categories = language === 'am' ? DEFAULT_CATEGORIES_AM : DEFAULT_CATEGORIES_EN;

  const parseAmount = (input: string): number => {
    const clean = input.trim().replace(/[^\d.,]/g, '').replace(/,/g, '.');
    const val = parseFloat(clean);
    if (isNaN(val) || val <= 0) return 0;
    return Math.round(val * 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cents = parseAmount(amountStr);
    if (cents <= 0) {
      setErrorMsg(t.validAmountError);
      return;
    }
    if (!category.trim()) {
      setErrorMsg(t.expenseCategoryError);
      return;
    }

    addExpense(cents, category, notes);

    const amount = formatBirr(cents);
    onSuccess(`✅ ${amount} ${t.expenseSavedFor} ${category}`);

    // Reset form
    setAmountStr('');
    setNotes('');
    // Keep category for rapid entry
  };

  return (
    <div className="animated-fade-in">
      <form onSubmit={handleSubmit} className="glass-panel">

        {/* Page heading */}
        <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>{t.recordExpenseTitle}</h2>
        <p style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', marginBottom: '18px', lineHeight: 1.5 }}>
          {t.recordExpenseDesc}
        </p>

        {/* Error Banner */}
        {errorMsg && (
          <div style={{
            padding: '12px', borderRadius: '10px', marginBottom: '16px',
            backgroundColor: 'rgba(244, 63, 94, 0.12)',
            color: 'hsl(var(--color-danger))', fontSize: '13px', fontWeight: 600,
            border: '1px solid rgba(244, 63, 94, 0.2)',
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Category chips */}
        <div className="form-group">
          <label className="form-label">{t.expenseCategoryLabel}</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
            {categories.map(cat => {
              const isSelected = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  style={{
                    background: isSelected ? 'hsl(var(--color-danger))' : 'hsla(var(--color-danger) / 0.08)',
                    color: isSelected ? '#fff' : 'hsl(var(--color-danger))',
                    border: '1px solid hsla(var(--color-danger) / 0.25)',
                    cursor: 'pointer', padding: '6px 12px', borderRadius: '8px',
                    fontSize: '12px', fontWeight: 600, transition: 'all 0.15s ease',
                  }}
                  onClick={() => setCategory(isSelected ? '' : cat)}
                >
                  {cat}
                </button>
              );
            })}
          </div>
          <input
            type="text"
            className="input-field"
            placeholder={t.expenseCategoryPlaceholder}
            value={category}
            onChange={e => setCategory(e.target.value)}
          />
        </div>

        {/* Amount */}
        <div className="form-group">
          <label className="form-label">{t.step3}</label>
          <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              inputMode="decimal"
              className="input-field"
              placeholder="0.00"
              style={{
                flex: 1, fontSize: '24px', fontWeight: 'bold',
                color: 'hsl(var(--color-danger))',
              }}
              value={amountStr}
              onChange={e => setAmountStr(e.target.value)}
            />
            {amountStr && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: 'auto', padding: '0 16px', borderRadius: '12px' }}
                onClick={() => setAmountStr('')}
              >
                {t.clearBtn}
              </button>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="form-group">
          <label className="form-label">{t.expenseNotesLabel}</label>
          <input
            type="text"
            className="input-field"
            placeholder={t.expenseNotesPlaceholder}
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        {/* Save Button */}
        <button
          type="submit"
          className="btn"
          style={{
            marginTop: '8px', fontSize: '16px', width: '100%',
            background: 'linear-gradient(135deg, hsl(var(--color-danger)), #c0392b)',
            color: '#fff', border: 'none', borderRadius: '14px',
            padding: '16px', fontWeight: 700, cursor: 'pointer',
            transition: 'opacity 0.2s ease',
          }}
        >
          {t.expenseSaveBtn}
        </button>
      </form>
    </div>
  );
};
