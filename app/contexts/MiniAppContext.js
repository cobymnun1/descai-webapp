'use client'

import { createContext, useContext, useEffect, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

const MiniAppContext = createContext(null);

export function MiniAppProvider({ children }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState(null);

  useEffect(() => {
    const load = async () => {
      // Signal ready IMMEDIATELY - don't wait for context
      sdk.actions.ready();
      
      try {
        const ctx = await sdk.context;
        setContext(ctx);
        setIsSDKLoaded(true);
      } catch (error) {
        console.log('Running in web mode (not mini app):', error);
        setIsSDKLoaded(true);
      }
    };

    load();
  }, []);

  return (
    <MiniAppContext.Provider value={{ isSDKLoaded, context, sdk }}>
      {children}
    </MiniAppContext.Provider>
  );
}

export const useMiniApp = () => useContext(MiniAppContext);

