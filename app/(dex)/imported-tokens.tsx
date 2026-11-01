'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { DexToken } from '@/lib/dexConfig.testnet';

type ImportedTokensValue = {
  importedTokens: DexToken[];
  addImportedToken: (token: DexToken) => void;
};

const ImportedTokensContext = createContext<ImportedTokensValue | null>(null);

export function ImportedTokensProvider({ children }: { children: React.ReactNode }) {
  const [importedTokens, setImportedTokens] = useState<DexToken[]>([]);

  const addImportedToken = useCallback((token: DexToken) => {
    setImportedTokens((previous) =>
      previous.some((item) => item.address.toLowerCase() === token.address.toLowerCase())
        ? previous
        : [...previous, token]
    );
  }, []);

  const value = useMemo(
    () => ({ importedTokens, addImportedToken }),
    [importedTokens, addImportedToken]
  );

  return (
    <ImportedTokensContext.Provider value={value}>{children}</ImportedTokensContext.Provider>
  );
}

export function useImportedTokens() {
  const value = useContext(ImportedTokensContext);
  if (!value) {
    throw new Error('useImportedTokens must be used inside ImportedTokensProvider');
  }
  return value;
}
