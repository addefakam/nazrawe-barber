import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Employee {
  id: string;
  name: string;
  active: boolean;
}

export interface Transaction {
  id: string;
  timestamp: number; // Epoch timestamp
  employeeId: string; // Links to Employee.id
  amount: number; // Stored in cents (integer)
  status: 'PAID' | 'CREDIT';
  customerName?: string;
  notes?: string;
}

interface AppContextType {
  employees: Employee[];
  transactions: Transaction[];
  theme: 'light' | 'dark';
  language: 'en' | 'am';
  quickAdds: number[];
  customServices: string[];
  toggleLanguage: () => void;
  addTransaction: (employeeId: string, amount: number, status: 'PAID' | 'CREDIT', customerName?: string, notes?: string) => void;
  settleTransaction: (id: string) => void;
  deleteTransaction: (id: string) => void;
  addEmployee: (name: string) => boolean;
  toggleEmployeeActive: (id: string) => void;
  toggleTheme: () => void;
  resetAllData: () => void;
  exportData: () => string;
  importData: (jsonString: string) => boolean;
  addQuickAdd: (val: number) => boolean;
  deleteQuickAdd: (val: number) => void;
  addCustomService: (name: string) => boolean;
  deleteCustomService: (name: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_EMPLOYEES: Employee[] = [
  { id: 'emp-1', name: 'Alex', active: true },
  { id: 'emp-2', name: 'Emma', active: true },
  { id: 'emp-3', name: 'Ben', active: true },
];

const DEFAULT_QUICK_ADDS = [50, 100, 150, 200, 500];

const DEFAULT_SERVICES = ['Haircut', 'Shaving', 'Massage', 'Hair Wash', 'Hair Dye', 'Facial'];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('dailly_employees');
    return saved ? JSON.parse(saved) : DEFAULT_EMPLOYEES;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('dailly_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('dailly_theme');
    return (saved as 'light' | 'dark') || 'dark';
  });

  const [language, setLanguage] = useState<'en' | 'am'>(() => {
    const saved = localStorage.getItem('dailly_language');
    return (saved as 'en' | 'am') || 'en';
  });

  const [quickAdds, setQuickAdds] = useState<number[]>(() => {
    const saved = localStorage.getItem('dailly_quick_adds');
    return saved ? JSON.parse(saved) : DEFAULT_QUICK_ADDS;
  });

  const [customServices, setCustomServices] = useState<string[]>(() => {
    const saved = localStorage.getItem('dailly_custom_services');
    return saved ? JSON.parse(saved) : DEFAULT_SERVICES;
  });

  // Persist state to localstorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dailly_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('dailly_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('dailly_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('dailly_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('dailly_quick_adds', JSON.stringify(quickAdds));
  }, [quickAdds]);

  useEffect(() => {
    localStorage.setItem('dailly_custom_services', JSON.stringify(customServices));
  }, [customServices]);

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'am' : 'en'));
  };

  const addTransaction = (
    employeeId: string,
    amount: number, // in cents
    status: 'PAID' | 'CREDIT',
    customerName?: string,
    notes?: string
  ) => {
    const unknownLabel = language === 'am' ? 'ያልታወቀ' : 'Unknown';
    const newTx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      employeeId,
      amount,
      status,
      customerName: status === 'CREDIT' ? customerName || unknownLabel : undefined,
      notes: notes?.trim() || undefined,
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const settleTransaction = (id: string) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, status: 'PAID' as const } : tx))
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  const addEmployee = (name: string): boolean => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    
    // Check if employee with same name already exists (case insensitive)
    const exists = employees.some((e) => e.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) return false;

    const newEmp: Employee = {
      id: `emp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: trimmed,
      active: true,
    };
    setEmployees((prev) => [...prev, newEmp]);
    return true;
  };

  const toggleEmployeeActive = (id: string) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === id ? { ...emp, active: !emp.active } : emp))
    );
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const resetAllData = () => {
    setEmployees(DEFAULT_EMPLOYEES);
    setTransactions([]);
    setQuickAdds(DEFAULT_QUICK_ADDS);
    setCustomServices(DEFAULT_SERVICES);
    localStorage.removeItem('dailly_employees');
    localStorage.removeItem('dailly_transactions');
    localStorage.removeItem('dailly_quick_adds');
    localStorage.removeItem('dailly_custom_services');
  };

  const addQuickAdd = (val: number): boolean => {
    if (val <= 0 || quickAdds.includes(val)) return false;
    // Keep list sorted numerically
    setQuickAdds(prev => [...prev, val].sort((a, b) => a - b));
    return true;
  };

  const deleteQuickAdd = (val: number) => {
    setQuickAdds(prev => prev.filter(v => v !== val));
  };

  const addCustomService = (name: string): boolean => {
    const trimmed = name.trim();
    if (!trimmed || customServices.includes(trimmed)) return false;
    setCustomServices(prev => [...prev, trimmed]);
    return true;
  };

  const deleteCustomService = (name: string) => {
    setCustomServices(prev => prev.filter(s => s !== name));
  };

  const exportData = (): string => {
    const data = {
      version: '1.1.0',
      exportedAt: Date.now(),
      employees,
      transactions,
      quickAdds,
      customServices,
    };
    return JSON.stringify(data, null, 2);
  };

  const importData = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && Array.isArray(parsed.employees) && Array.isArray(parsed.transactions)) {
        // Simple schema validation
        const validEmployees = parsed.employees.every(
          (e: any) => typeof e.id === 'string' && typeof e.name === 'string' && typeof e.active === 'boolean'
        );
        const validTransactions = parsed.transactions.every(
          (t: any) =>
            typeof t.id === 'string' &&
            typeof t.timestamp === 'number' &&
            typeof t.employeeId === 'string' &&
            typeof t.amount === 'number' &&
            (t.status === 'PAID' || t.status === 'CREDIT')
        );

        if (validEmployees && validTransactions) {
          setEmployees(parsed.employees);
          setTransactions(parsed.transactions);
          
          if (Array.isArray(parsed.quickAdds)) {
            setQuickAdds(parsed.quickAdds.sort((a: number, b: number) => a - b));
          }
          if (Array.isArray(parsed.customServices)) {
            setCustomServices(parsed.customServices);
          }
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        employees,
        transactions,
        theme,
        language,
        quickAdds,
        customServices,
        toggleLanguage,
        addTransaction,
        settleTransaction,
        deleteTransaction,
        addEmployee,
        toggleEmployeeActive,
        toggleTheme,
        resetAllData,
        exportData,
        importData,
        addQuickAdd,
        deleteQuickAdd,
        addCustomService,
        deleteCustomService,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
