import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatBirr } from '../utils/helpers';
import { translations } from '../utils/translations';

interface IncomeLogProps {
  onSuccess: (message: string) => void;
}

export const IncomeLog: React.FC<IncomeLogProps> = ({ onSuccess }) => {
  const { employees, addTransaction, language, quickAdds, customServices } = useApp();
  const t = translations[language];

  // Form state
  const [selectedEmpId, setSelectedEmpId] = useState<string>(() => {
    const first = employees.find(e => e.active);
    return first ? first.id : '';
  });
  const [amountStr, setAmountStr]       = useState<string>('');
  const [status, setStatus]             = useState<'PAID' | 'CREDIT'>('PAID');
  const [customerName, setCustomerName] = useState<string>('');
  const [notes, setNotes]               = useState<string>('');
  const [errorMsg, setErrorMsg]         = useState<string>('');

  const activeEmployees = employees.filter(e => e.active);

  // Parse amount — accepts both "." and "," as decimal separator
  const parseAmount = (input: string): number => {
    const clean = input.trim().replace(/[^\d.,]/g, '').replace(/,/g, '.');
    const val = parseFloat(clean);
    if (isNaN(val) || val <= 0) return 0;
    return Math.round(val * 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedEmpId) {
      setErrorMsg(t.selectStylistError);
      return;
    }
    const cents = parseAmount(amountStr);
    if (cents <= 0) {
      setErrorMsg(t.validAmountError);
      return;
    }
    if (status === 'CREDIT' && !customerName.trim()) {
      setErrorMsg(t.customerNameError);
      return;
    }

    const emp = employees.find(e => e.id === selectedEmpId);
    if (!emp) { setErrorMsg(t.invalidStylistError); return; }

    addTransaction(selectedEmpId, cents, status, status === 'CREDIT' ? customerName : undefined, notes);

    const amount = formatBirr(cents);
    const typeLabel = status === 'PAID' 
      ? (language === 'am' ? 'ጥሬ ገንዘብ' : 'Cash') 
      : (language === 'am' ? 'ብድር' : 'Credit');
    onSuccess(`✅ ${amount} ${t.successSave} ${emp.name} (${typeLabel})`);

    // Reset form — keep selected stylist for rapid logging
    setAmountStr('');
    setCustomerName('');
    setNotes('');
  };

  const handleQuickAdd = (val: number) => {
    const current = parseAmount(amountStr);
    const newAmt  = (current + val * 100) / 100;
    setAmountStr(newAmt.toFixed(2));
  };

  return (
    <div className="animated-fade-in">
      <form onSubmit={handleSubmit} className="glass-panel">

        {/* Page heading with a short how-to */}
        <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>{t.recordIncomeTitle}</h2>
        <p style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', marginBottom: '18px', lineHeight: 1.5 }}>
          {t.recordIncomeDesc}
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

        {/* STEP 1 — Pick Stylist */}
        <div className="form-group">
          <label className="form-label">{t.step1}</label>
          {activeEmployees.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', padding: '10px 0' }}>
              {t.noActiveStylists}
            </div>
          ) : (
            <div className="chip-grid">
              {activeEmployees.map(emp => (
                <div
                  key={emp.id}
                  className={`chip-select ${selectedEmpId === emp.id ? 'active' : ''}`}
                  onClick={() => setSelectedEmpId(emp.id)}
                >
                  <div className="chip-avatar">{emp.name.charAt(0).toUpperCase()}</div>
                  <span>{emp.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* STEP 2 — Did the client pay now or later? */}
        <div className="form-group">
          <label className="form-label">{t.step2}</label>
          <div className="toggle-switch" style={{ marginBottom: 0 }}>
            <div
              className={`toggle-option ${status === 'PAID' ? 'active paid-active' : ''}`}
              onClick={() => setStatus('PAID')}
            >
              {t.paidNowOption}
            </div>
            <div
              className={`toggle-option ${status === 'CREDIT' ? 'active credit-active' : ''}`}
              onClick={() => setStatus('CREDIT')}
            >
              {t.payLaterOption}
            </div>
          </div>
        </div>

        {/* If Credit — require customer name */}
        {status === 'CREDIT' && (
          <div className="animated-fade-in" style={{ animationDuration: '0.2s' }}>
            <div className="form-group">
              <label className="form-label">{t.customerNameLabel}</label>
              <input
                type="text"
                className="input-field"
                placeholder={t.customerPlaceholder}
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* STEP 3 — Enter Amount */}
        <div className="form-group">
          <label className="form-label">{t.step3}</label>
          <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              inputMode="decimal"
              className="input-field"
              placeholder="0.00"
              style={{ flex: 1, fontSize: '24px', fontWeight: 'bold' }}
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

          {/* Quick-amount shortcuts */}
          {quickAdds.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px' }}>
                {t.quickAddLabel}
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                {quickAdds.map(val => (
                  <button
                    key={val}
                    type="button"
                    className="keypad-btn"
                    style={{ padding: '8px 0', fontSize: '13px', borderRadius: '10px' }}
                    onClick={() => handleQuickAdd(val)}
                  >
                    +{val}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Service type (optional) */}
        <div className="form-group">
          <label className="form-label">{t.serviceLabel}</label>
          {customServices.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {customServices.map(serv => {
                const isSelected = notes === serv;
                return (
                  <button
                    key={serv}
                    type="button"
                    style={{
                      background: isSelected ? 'hsl(var(--color-primary))' : 'hsla(var(--color-primary) / 0.08)',
                      color: isSelected ? '#000' : 'hsl(var(--color-primary))',
                      border: '1px solid hsla(var(--color-primary) / 0.25)',
                      cursor: 'pointer', padding: '4px 10px', borderRadius: '6px',
                      fontSize: '11px', fontWeight: 600, transition: 'all 0.15s ease',
                    }}
                    onClick={() => setNotes(isSelected ? '' : serv)}
                  >
                    {serv}
                  </button>
                );
              })}
            </div>
          )}
          <input
            type="text"
            className="input-field"
            placeholder={t.notesPlaceholder}
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        {/* Save Button */}
        <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', fontSize: '16px' }}>
          {t.saveBtn}
        </button>
      </form>
    </div>
  );
};
