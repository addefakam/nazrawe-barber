import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../utils/translations';
import { formatBirr, formatDate, formatTime } from '../utils/helpers';

interface SettingsProps {
  onSuccess: (message: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ onSuccess }) => {
  const { 
    employees, transactions, theme, addEmployee, toggleEmployeeActive, toggleTheme, 
    resetAllData, exportData, importData, language,
    quickAdds, customServices, addQuickAdd, deleteQuickAdd, addCustomService, deleteCustomService
  } = useApp();
  const t = translations[language];

  // Stylist Form State
  const [newEmpName, setNewEmpName] = useState<string>('');
  const [empError, setEmpError]     = useState<string>('');

  // Quick Add Form State
  const [newQuickAddStr, setNewQuickAddStr] = useState<string>('');
  const [quickAddError, setQuickAddError]   = useState<string>('');

  // Custom Service Form State
  const [newServiceStr, setNewServiceStr] = useState<string>('');
  const [serviceError, setServiceError]   = useState<string>('');

  // Reset confirmation state
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    setEmpError('');
    const name = newEmpName.trim();
    if (!name) { setEmpError(t.enterStylistNameError); return; }

    const ok = addEmployee(name);
    if (!ok) { setEmpError(t.stylistExistsError); return; }

    onSuccess(`✅ "${name}" ${t.stylistAddedSuccess}`);
    setNewEmpName('');
  };

  const handleAddQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setQuickAddError('');
    const val = parseInt(newQuickAddStr.trim(), 10);
    if (isNaN(val) || val <= 0) {
      setQuickAddError(t.validQuickAddError);
      return;
    }

    const ok = addQuickAdd(val);
    if (!ok) {
      setQuickAddError(t.quickAddExistsError);
      return;
    }

    onSuccess(`✅ +${val} ${language === 'am' ? 'ፈጣን መሙያ ተጨምሯል!' : 'added as Quick Add!'}`);
    setNewQuickAddStr('');
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    setServiceError('');
    const name = newServiceStr.trim();
    if (!name) {
      setServiceError(t.serviceNameError);
      return;
    }

    const ok = addCustomService(name);
    if (!ok) {
      setServiceError(t.serviceExistsError);
      return;
    }

    onSuccess(`✅ "${name}" ${language === 'am' ? 'አገልግሎት ተጨምሯል!' : 'added to Services!'}`);
    setNewServiceStr('');
  };

  const handleExport = () => {
    const data = exportData();
    const uri  = 'data:application/json;charset=utf-8,' + encodeURIComponent(data);
    const link = document.createElement('a');
    link.setAttribute('href', uri);
    link.setAttribute('download', `nazrawe_backup_${new Date().toISOString().slice(0, 10)}.json`);
    link.click();
    onSuccess(language === 'am' ? 'የመረጃ ፋይል ወርዷል።' : 'Backup file downloaded.');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result;
      if (typeof result === 'string') {
        const ok = importData(result);
        onSuccess(ok 
          ? (language === 'am' ? '✅ መረጃው በተሳካ ሁኔታ ተመልሷል!' : '✅ Backup restored successfully!')
          : (language === 'am' ? '❌ ስህተት፡ የማይሰራ የመረጃ ፋይል ነው' : '❌ Error: Invalid backup file.')
        );
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportPDF = () => {
    // 1. Gather stats
    const totalSalesCents = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const cashCollectedCents = transactions.reduce((sum, tx) => sum + (tx.status === 'PAID' ? tx.amount : 0), 0);
    const creditSalesCents = transactions.reduce((sum, tx) => sum + (tx.status === 'CREDIT' ? tx.amount : 0), 0);
    const ownerShareCents = Math.round(cashCollectedCents * 0.50);

    // 2. Stylist stats
    const stylistStats = employees.map(emp => {
      const empTxs = transactions.filter(tx => tx.employeeId === emp.id);
      const cashCents = empTxs.reduce((sum, tx) => sum + (tx.status === 'PAID' ? tx.amount : 0), 0);
      const creditCents = empTxs.reduce((sum, tx) => sum + (tx.status === 'CREDIT' ? tx.amount : 0), 0);
      return {
        name: emp.name,
        totalCount: empTxs.length,
        cash: cashCents,
        credit: creditCents,
        total: cashCents + creditCents
      };
    }).filter(s => s.totalCount > 0);

    // 3. Construct HTML
    const reportDateStr = `${formatDate(Date.now())} ${formatTime(Date.now())}`;
    
    const txRows = transactions.map(tx => {
      const empName = employees.find(e => e.id === tx.employeeId)?.name || 'Unknown';
      const dateStr = `${formatDate(tx.timestamp)} ${formatTime(tx.timestamp)}`;
      const typeLabel = tx.status === 'PAID' ? (language === 'am' ? 'ጥሬ ገንዘብ' : 'CASH') : (language === 'am' ? 'ብድር' : 'CREDIT');
      const typeClass = tx.status === 'PAID' ? 'badge-cash' : 'badge-credit';
      
      return `
        <tr>
          <td>${dateStr}</td>
          <td><strong>${empName}</strong></td>
          <td>${tx.customerName || '-'}</td>
          <td><span class="note-text">${tx.notes || '-'}</span></td>
          <td><span class="badge ${typeClass}">${typeLabel}</span></td>
          <td class="amount-cell">${formatBirr(tx.amount)}</td>
        </tr>
      `;
    }).join('');

    const stylistRows = stylistStats.map(s => {
      return `
        <tr>
          <td><strong>${s.name}</strong></td>
          <td style="text-align: center;">${s.totalCount}</td>
          <td>${formatBirr(s.cash)}</td>
          <td>${formatBirr(s.credit)}</td>
          <td class="amount-cell"><strong>${formatBirr(s.total)}</strong></td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${t.pdfReportTitle}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
          
          body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 30px;
            font-size: 13px;
            line-height: 1.5;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 25px;
          }

          .logo-area {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .scissors-logo {
            font-size: 28px;
            background: #b45309;
            color: white;
            width: 46px;
            height: 46px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
          }

          .barber-title h1 {
            font-family: 'Outfit', sans-serif;
            font-size: 22px;
            font-weight: 700;
            margin: 0 0 4px 0;
            color: #b45309;
            letter-spacing: -0.02em;
          }

          .barber-title p {
            margin: 0;
            font-size: 12px;
            color: #64748b;
            font-weight: 500;
          }

          .meta-info {
            text-align: right;
            font-size: 11px;
            color: #64748b;
          }

          .meta-info h2 {
            font-family: 'Outfit', sans-serif;
            font-size: 15px;
            margin: 0 0 6px 0;
            color: #1e293b;
          }

          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }

          .kpi-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 15px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          }

          .kpi-label {
            font-size: 9px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 4px;
          }

          .kpi-value {
            font-family: 'Outfit', sans-serif;
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
          }

          .kpi-card.owner-share {
            background: #fef3c7;
            border-color: #fde68a;
          }

          .kpi-card.owner-share .kpi-label {
            color: #b45309;
          }

          .kpi-card.owner-share .kpi-value {
            color: #78350f;
          }

          h3 {
            font-family: 'Outfit', sans-serif;
            font-size: 14px;
            color: #1e293b;
            border-left: 3px solid #b45309;
            padding-left: 8px;
            margin: 25px 0 12px 0;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }

          th {
            background: #f1f5f9;
            color: #475569;
            font-weight: 600;
            font-size: 11px;
            text-transform: uppercase;
            padding: 10px 12px;
            text-align: left;
            border-bottom: 1px solid #cbd5e1;
          }

          td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
            color: #334155;
          }

          tr:last-child td {
            border-bottom: 2px solid #cbd5e1;
          }

          .amount-cell {
            text-align: right;
            font-family: 'Outfit', sans-serif;
          }

          th.amount-header {
            text-align: right;
          }

          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 6px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
          }

          .badge-cash {
            background: #dcfce7;
            color: #15803d;
          }

          .badge-credit {
            background: #ffedd5;
            color: #c2410c;
          }

          .note-text {
            color: #64748b;
            font-style: italic;
          }

          @media print {
            body {
              padding: 0;
            }
            .kpi-card {
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-area">
            <div class="scissors-logo">✂️</div>
            <div class="barber-title">
              <h1>Nazrawe Barber — ናዝራዊ ፀጉር ቤት</h1>
              <p>Men's Barber Specialist — የሂሳብ መግለጫ መዝገብ</p>
            </div>
          </div>
          <div class="meta-info">
            <h2>${t.pdfReportTitle}</h2>
            <div><strong>${t.pdfReportDate}:</strong> ${reportDateStr}</div>
            <div><strong>${t.pdfTotalTransactions}:</strong> ${transactions.length}</div>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">${t.totalSales}</div>
            <div class="kpi-value">${formatBirr(totalSalesCents)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">${t.cashCollected}</div>
            <div class="kpi-value">${formatBirr(cashCollectedCents)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">${t.onCredit}</div>
            <div class="kpi-value">${formatBirr(creditSalesCents)}</div>
          </div>
          <div class="kpi-card owner-share">
            <div class="kpi-label">${t.yourShare}</div>
            <div class="kpi-value">${formatBirr(ownerShareCents)}</div>
          </div>
        </div>

        <h3>${t.pdfStylistPerformance}</h3>
        <table>
          <thead>
            <tr>
              <th>${t.pdfColStylist}</th>
              <th style="text-align: center; width: 120px;">${t.pdfTotalTransactions}</th>
              <th>${t.legendCash}</th>
              <th>${t.legendCredit}</th>
              <th class="amount-header">${t.totalSales}</th>
            </tr>
          </thead>
          <tbody>
            ${stylistRows || `<tr><td colspan="5" style="text-align: center; color: #64748b;">${t.noStylists}</td></tr>`}
          </tbody>
        </table>

        <h3>${t.pdfTransactionsList}</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 140px;">${t.pdfColDate}</th>
              <th>${t.pdfColStylist}</th>
              <th>${t.pdfColCustomer}</th>
              <th>${t.pdfColService}</th>
              <th style="width: 80px;">${t.pdfColStatus}</th>
              <th class="amount-header" style="width: 100px;">${t.pdfColAmount}</th>
            </tr>
          </thead>
          <tbody>
            ${txRows || `<tr><td colspan="6" style="text-align: center; color: #64748b;">${t.noIncome}</td></tr>`}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }
  };

  const executeReset = () => {
    resetAllData();
    onSuccess(language === 'am' ? 'ሁሉንም መረጃዎች ጠፍተዋል።' : 'All data has been reset.');
    setShowResetConfirm(false);
  };

  return (
    <div className="animated-fade-in">

      {/* Appearance */}
      <div className="glass-panel">
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>{t.appSettingsTitle}</h2>
        <div className="settings-list">
          <div className="settings-item">
            <div className="settings-item-info">
              <span className="settings-item-title">{t.appearanceLabel}</span>
              <span className="settings-item-desc">{t.appearanceDesc}</span>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: 'auto', padding: '8px 16px', borderRadius: '10px', fontSize: '13px' }}
              onClick={toggleTheme}
            >
              {theme === 'dark' ? t.lightModeBtn : t.darkModeBtn}
            </button>
          </div>
        </div>
      </div>

      {/* Stylist Management */}
      <div className="glass-panel">
        <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>{t.manageStylistsTitle}</h3>
        <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginBottom: '14px', lineHeight: 1.5 }}>
          {t.manageStylistsDesc}
        </p>

        {/* Add stylist form */}
        <form onSubmit={handleAddEmployee} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <input
              type="text"
              className="input-field"
              placeholder={t.newStylistPlaceholder}
              style={{ padding: '10px 14px', fontSize: '14px' }}
              value={newEmpName}
              onChange={e => setNewEmpName(e.target.value)}
            />
            {empError && (
              <span style={{ color: 'hsl(var(--color-danger))', fontSize: '10px', marginTop: '2px', fontWeight: 600 }}>
                ⚠️ {empError}
              </span>
            )}
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: 'auto', padding: '10px 16px', borderRadius: '12px', fontSize: '14px', height: 'fit-content' }}
          >
            {t.newStylistAddBtn}
          </button>
        </form>

        {/* Stylist list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {employees.map(emp => {
            const initial     = emp.name.charAt(0).toUpperCase();
            let avatarClass   = 'generic';
            const n           = emp.name.toLowerCase();
            if (n === 'alex') avatarClass = 'alex';
            else if (n === 'emma') avatarClass = 'emma';
            else if (n === 'ben')  avatarClass = 'ben';

            return (
              <div key={emp.id} className="emp-row">
                <div className="emp-row-left">
                  <div className={`ledger-avatar ${avatarClass}`} style={{ width: '28px', height: '28px', fontSize: '11px', borderRadius: '8px' }}>
                    {initial}
                  </div>
                  <span style={{ opacity: emp.active ? 1 : 0.5 }}>{emp.name}</span>
                </div>
                <button
                  type="button"
                  className={`emp-status-toggle ${emp.active ? 'active' : 'inactive'}`}
                  onClick={() => toggleEmployeeActive(emp.id)}
                >
                  {emp.active ? t.activeStatus : t.inactiveStatus}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Add (Br) Management */}
      <div className="glass-panel">
        <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>{t.manageQuickAddsTitle}</h3>
        <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginBottom: '14px', lineHeight: 1.5 }}>
          {t.quickAddHelp}
        </p>

        {/* Add quick add form */}
        <form onSubmit={handleAddQuickAdd} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <input
              type="text"
              inputMode="numeric"
              className="input-field"
              placeholder="e.g. 100"
              style={{ padding: '10px 14px', fontSize: '14px' }}
              value={newQuickAddStr}
              onChange={e => setNewQuickAddStr(e.target.value)}
            />
            {quickAddError && (
              <span style={{ color: 'hsl(var(--color-danger))', fontSize: '10px', marginTop: '2px', fontWeight: 600 }}>
                ⚠️ {quickAddError}
              </span>
            )}
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: 'auto', padding: '10px 16px', borderRadius: '12px', fontSize: '14px', height: 'fit-content' }}
          >
            {t.addQuickAddBtn}
          </button>
        </form>

        {/* Quick adds list */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {quickAdds.map(val => (
            <div 
              key={val} 
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'hsla(var(--text-muted) / 0.15)',
                border: '1px solid hsla(var(--border-color) / 0.8)',
                borderRadius: '8px', padding: '4px 10px', fontSize: '13px', fontWeight: 600
              }}
            >
              <span>+{val} Br</span>
              <button 
                type="button" 
                style={{ cursor: 'pointer', opacity: 0.6, fontSize: '11px', padding: '2px' }}
                onClick={() => deleteQuickAdd(val)}
              >
                ❌
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Services Management */}
      <div className="glass-panel">
        <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>{t.manageServicesTitle}</h3>
        <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginBottom: '14px', lineHeight: 1.5 }}>
          {t.servicesHelp}
        </p>

        {/* Add service form */}
        <form onSubmit={handleAddService} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <input
              type="text"
              className="input-field"
              placeholder={t.newServicePlaceholder}
              style={{ padding: '10px 14px', fontSize: '14px' }}
              value={newServiceStr}
              onChange={e => setNewServiceStr(e.target.value)}
            />
            {serviceError && (
              <span style={{ color: 'hsl(var(--color-danger))', fontSize: '10px', marginTop: '2px', fontWeight: 600 }}>
                ⚠️ {serviceError}
              </span>
            )}
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: 'auto', padding: '10px 16px', borderRadius: '12px', fontSize: '14px', height: 'fit-content' }}
          >
            {t.newStylistAddBtn}
          </button>
        </form>

        {/* Services list */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {customServices.map(serv => (
            <div 
              key={serv} 
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'hsla(var(--color-primary) / 0.12)',
                border: '1px solid hsla(var(--color-primary) / 0.25)',
                color: 'hsl(var(--color-primary))',
                borderRadius: '8px', padding: '4px 10px', fontSize: '13px', fontWeight: 600
              }}
            >
              <span>{serv}</span>
              <button 
                type="button" 
                style={{ cursor: 'pointer', opacity: 0.6, fontSize: '11px', padding: '2px' }}
                onClick={() => deleteCustomService(serv)}
              >
                ❌
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Backup */}
      <div className="glass-panel">
        <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>{t.backupTitle}</h3>
        <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginBottom: '14px' }}>
          {t.backupDesc}
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '10px', fontSize: '13px', borderRadius: '12px' }} onClick={handleExport}>
            {t.exportBtn}
          </button>
          <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '10px', fontSize: '13px', borderRadius: '12px' }} onClick={() => fileInputRef.current?.click()}>
            {t.importBtn}
          </button>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json" onChange={handleFileChange} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
          <button 
            type="button" 
            className="btn btn-primary" 
            style={{ 
              padding: '12px', fontSize: '13px', borderRadius: '12px',
              background: 'linear-gradient(135deg, hsl(var(--color-primary)) 0%, #d97706 100%)',
              color: '#000', fontWeight: 'bold'
            }} 
            onClick={handleExportPDF}
          >
            {t.exportPdfBtn}
          </button>
        </div>
      </div>

      {/* Install on Phone */}
      <div className="glass-panel" style={{ opacity: 0.85, marginBottom: 0 }}>
        <h3 style={{ fontSize: '14px', marginBottom: '6px' }}>{t.installTitle}</h3>
        <ul style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))', paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <li>{t.installStep1}</li>
          <li>{t.installStep2}</li>
          <li><strong>{t.installStep3}</strong></li>
          <li>{t.installStep4}</li>
        </ul>
      </div>

      {/* Danger Zone — Reset */}
      <div className="glass-panel" style={{ borderColor: 'hsla(var(--color-danger) / 0.15)' }}>
        <h3 style={{ fontSize: '16px', color: 'hsl(var(--color-danger))', marginBottom: '4px' }}>{t.resetTitle}</h3>
        <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginBottom: '14px' }}>
          {t.resetDesc}
        </p>
        <button
          type="button"
          className="btn btn-danger"
          style={{ padding: '10px', fontSize: '13px', borderRadius: '12px' }}
          onClick={() => setShowResetConfirm(true)}
        >
          {t.resetBtn}
        </button>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="modal-overlay">
          <div className="modal-content animated-fade-in" style={{ animationDuration: '0.2s' }}>
            <h3 className="modal-title" style={{ color: 'hsl(var(--color-danger))' }}>{t.resetModalTitle}</h3>
            <p className="modal-body">{t.resetModalBody}</p>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowResetConfirm(false)}>
                {t.cancel}
              </button>
              <button type="button" className="btn btn-danger" onClick={executeReset}>
                {t.yesResetEverything}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
