import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Transaction } from '../context/AppContext';
import { formatBirr, formatDate, formatTime } from '../utils/helpers';
import { translations } from '../utils/translations';

interface LedgerProps {
  onSuccess: (message: string) => void;
}

export const Ledger: React.FC<LedgerProps> = ({ onSuccess }) => {
  const { transactions, employees, settleTransaction, deleteTransaction, language } = useApp();
  const t = translations[language];

  const [searchTerm,   setSearchTerm]   = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'CREDIT'>('ALL');

  const [confirmSettleTx, setConfirmSettleTx] = useState<Transaction | null>(null);
  const [confirmDeleteTx, setConfirmDeleteTx] = useState<Transaction | null>(null);

  const getStylistName = (id: string): string => {
    const emp = employees.find(e => e.id === id);
    return emp ? emp.name : (language === 'am' ? 'ያልታወቀ' : 'Unknown');
  };

  // Filter logic
  const filteredTxs = transactions.filter(tx => {
    if (statusFilter !== 'ALL' && tx.status !== statusFilter) return false;

    const stylist  = getStylistName(tx.employeeId).toLowerCase();
    const customer = (tx.customerName || '').toLowerCase();
    const note     = (tx.notes || '').toLowerCase();
    const amount   = (tx.amount / 100).toFixed(2);
    const query    = searchTerm.toLowerCase().trim();

    if (query) {
      return stylist.includes(query) || customer.includes(query) || note.includes(query) || amount.includes(query);
    }
    return true;
  });

  // Group by date
  const groupByDate = (txs: Transaction[]) => {
    const groups: Record<string, Transaction[]> = {};
    const now           = new Date();
    const todayStr      = formatDate(now.getTime());
    const yesterdayStr  = formatDate(now.getTime() - 86400000);

    txs.forEach(tx => {
      const dateStr = formatDate(tx.timestamp);
      const heading = dateStr === todayStr ? t.today : dateStr === yesterdayStr ? t.yesterday : dateStr;
      if (!groups[heading]) groups[heading] = [];
      groups[heading].push(tx);
    });
    return groups;
  };

  const grouped = groupByDate(filteredTxs);

  const executeSettle = () => {
    if (!confirmSettleTx) return;
    settleTransaction(confirmSettleTx.id);
    const nameStr = confirmSettleTx.customerName || (language === 'am' ? 'ደንበኛ' : 'customer');
    onSuccess(`✅ ${formatBirr(confirmSettleTx.amount)} ${language === 'am' ? 'ከ' : 'from'} ${nameStr} ${language === 'am' ? 'ተከፍሏል ተብሎ ተመዝግቧል!' : 'marked as paid!'}`);
    setConfirmSettleTx(null);
  };

  const executeDelete = () => {
    if (!confirmDeleteTx) return;
    deleteTransaction(confirmDeleteTx.id);
    onSuccess(language === 'am' ? 'መዝገቡ ተሰርዟል።' : 'Record deleted.');
    setConfirmDeleteTx(null);
  };

  return (
    <div className="animated-fade-in">

      {/* Search & Filter */}
      <div className="glass-panel" style={{ paddingBottom: '14px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '14px' }}>{t.records}</h2>

        <div className="form-group" style={{ marginBottom: '12px' }}>
          <input
            type="text"
            className="input-field"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {(['ALL', 'PAID', 'CREDIT'] as const).map(s => (
            <button
              key={s}
              type="button"
              className="btn btn-secondary"
              style={{
                flex: 1, padding: '8px 4px', fontSize: '12px', borderRadius: '10px',
                background:   statusFilter === s ? 'hsla(var(--color-primary) / 0.15)' : '',
                borderColor:  statusFilter === s ? 'hsl(var(--color-primary))' : '',
                color:        statusFilter === s ? 'hsl(var(--color-primary))' : '',
                fontWeight: 700,
              }}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'ALL'    && t.filterAll}
              {s === 'PAID'   && t.filterCash}
              {s === 'CREDIT' && t.filterCredit}
            </button>
          ))}
        </div>
      </div>

      {/* Records List */}
      {filteredTxs.length === 0 ? (
        <div className="glass-panel empty-state">
          <div className="empty-icon">📋</div>
          <h3>{t.noRecordsFound}</h3>
          <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', marginTop: '6px' }}>
            {searchTerm || statusFilter !== 'ALL'
              ? t.noRecordsDescSearch
              : t.noRecordsDescDefault}
          </p>
        </div>
      ) : (
        Object.keys(grouped).map(dateHeading => (
          <div key={dateHeading} style={{ marginBottom: '20px' }}>
            <h3 className="ledger-group-title">{dateHeading}</h3>

            <div className="ledger-list">
              {grouped[dateHeading].map(tx => {
                const stylistName = getStylistName(tx.employeeId);
                const initial     = stylistName.charAt(0).toUpperCase();
                let avatarClass   = 'generic';
                const n           = stylistName.toLowerCase();
                if (n === 'alex') avatarClass = 'alex';
                else if (n === 'emma') avatarClass = 'emma';
                else if (n === 'ben')  avatarClass = 'ben';

                return (
                  <div key={tx.id} className="ledger-item">
                    <div className="ledger-item-left">
                      <div className={`ledger-avatar ${avatarClass}`}>{initial}</div>
                      <div className="ledger-details">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="ledger-name">{stylistName}</span>
                          <span className={`badge ${tx.status === 'PAID' ? 'badge-paid' : 'badge-credit'}`}>
                            {tx.status === 'PAID' ? t.cashBadge : t.creditBadge}
                          </span>
                        </div>
                        <div className="ledger-meta">
                          <span>{formatTime(tx.timestamp)}</span>
                          {tx.notes && <span>• {tx.notes}</span>}
                        </div>
                        {tx.status === 'CREDIT' && (
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--color-warning))', marginTop: '4px' }}>
                            {t.customerPrefix} {tx.customerName}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ledger-item-right">
                      <span className={`ledger-amount ${tx.status === 'PAID' ? 'paid' : 'credit'}`}>
                        {tx.status === 'PAID' ? '+' : ''}{formatBirr(tx.amount)}
                      </span>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        {tx.status === 'CREDIT' && (
                          <button
                            type="button"
                            className="settle-btn-mini"
                            onClick={() => setConfirmSettleTx(tx)}
                          >
                            {t.markPaidBtn}
                          </button>
                        )}
                        <button
                          type="button"
                          style={{ fontSize: '11px', color: 'hsl(var(--color-danger))', padding: '4px', cursor: 'pointer', opacity: 0.6 }}
                          onClick={() => setConfirmDeleteTx(tx)}
                          title="Delete record"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Mark as Paid Confirmation Modal */}
      {confirmSettleTx && (
        <div className="modal-overlay">
          <div className="modal-content animated-fade-in" style={{ animationDuration: '0.2s' }}>
            <h3 className="modal-title">{t.markPaidModalTitle}</h3>
            <p className="modal-body">
              {t.markPaidModalBody1} <strong>{formatBirr(confirmSettleTx.amount)}</strong> {t.markPaidModalBody2}{' '}
              <strong>{confirmSettleTx.customerName}</strong> {t.markPaidModalBody3}
            </p>
            <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
              {t.markPaidModalSub}
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmSettleTx(null)}>
                {t.cancel}
              </button>
              <button type="button" className="btn btn-success" onClick={executeSettle}>
                {t.yesMarkPaid}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteTx && (
        <div className="modal-overlay">
          <div className="modal-content animated-fade-in" style={{ animationDuration: '0.2s' }}>
            <h3 className="modal-title" style={{ color: 'hsl(var(--color-danger))' }}>
              {t.deleteModalTitle}
            </h3>
            <p className="modal-body">
              {t.deleteModalBody1} <strong>{formatBirr(confirmDeleteTx.amount)}</strong> {t.deleteModalBody2}{' '}
              <strong>{getStylistName(confirmDeleteTx.employeeId)}</strong>?
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmDeleteTx(null)}>
                {t.cancel}
              </button>
              <button type="button" className="btn btn-danger" onClick={executeDelete}>
                {t.yesDelete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
