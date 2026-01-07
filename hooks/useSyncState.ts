
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/firebase';
import { doc, onSnapshot, setDoc } from "firebase/firestore";

// Hook que funciona como useState, mas sincroniza com o Firebase Firestore
// Se o usuário não estiver logado (userId nulo), funciona como useState normal (em memória/local)
export function useSyncState<T>(
  key: string, 
  initialValue: T, 
  userId: string | null
): [T, React.Dispatch<React.SetStateAction<T>>] {
  
  // Tenta carregar do localStorage primeiro para evitar "flicker" ou usar como cache offline
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
        const localKey = `glicosync-cache-${userId || 'guest'}-${key}`;
        const item = window.localStorage.getItem(localKey);
        
        // --- LOGICA DE MIGRAÇÃO DE DADOS ANTIGOS ---
        if (!item || item === 'undefined') {
            const legacyKey = key;
            const legacyItem = window.localStorage.getItem(legacyKey);
            
            if (legacyItem && legacyItem !== 'undefined') {
                window.localStorage.setItem(localKey, legacyItem);
                return JSON.parse(legacyItem);
            }
            return initialValue;
        }
        // -------------------------------------------

        return JSON.parse(item);
    } catch (error) {
        console.warn(`Erro ao carregar ${key} do cache local:`, error);
        return initialValue;
    }
  });

  // REF para rastrear o valor atual do estado sem causar re-renderizações dentro do listener
  // Isso é crucial para quebrar o ciclo de atualização infinita.
  const stateRef = useRef<T>(state);

  // Atualiza a ref sempre que o estado muda
  useEffect(() => {
      stateRef.current = state;
  }, [state]);

  // Flag para controlar se já sincronizamos com a nuvem pelo menos uma vez.
  const [isCloudSynced, setIsCloudSynced] = useState(false);

  // 1. Sincronização vinda da Nuvem (Download/Listen)
  useEffect(() => {
    if (!userId || !db) return;

    const docRef = doc(db, "users", userId, "data", key);

    const unsubscribe = onSnapshot(docRef, 
      (docSnap) => {
        setIsCloudSynced(true); 

        if (docSnap.exists()) {
            const docData = docSnap.data();
            
            if (docData && 'value' in docData) {
                const cloudValue = docData.value as T;
                
                // CORREÇÃO CRÍTICA DE LOOP:
                // Compara o valor da nuvem com o valor local atual (via ref).
                // Só atualiza o estado se houver uma diferença REAL no conteúdo.
                // JSON.stringify é usado para comparação profunda de objetos/arrays.
                if (JSON.stringify(cloudValue) !== JSON.stringify(stateRef.current)) {
                    console.log(`[Sync] Recebendo atualização externa para: ${key}`);
                    setState(cloudValue);
                    
                    // Atualiza cache local imediatamente para consistência
                    try {
                        localStorage.setItem(`glicosync-cache-${userId}-${key}`, JSON.stringify(cloudValue));
                    } catch (e) {
                        console.error("Erro ao salvar cache local vindo da nuvem:", e);
                    }
                }
            }
        }
      },
      (error) => {
        console.warn(`Sincronização em nuvem pausada para ${key} (Offline ou Erro):`, error.message);
        setIsCloudSynced(true); // Assume sincronizado para permitir uso local
      }
    );

    return () => unsubscribe();
  }, [userId, key]);

  // 2. Sincronização para a Nuvem (Upload) e LocalStorage (Cache)
  useEffect(() => {
      // Salva no LocalStorage sempre (cache/offline) Imediatamente
      if (userId) {
          const localKey = `glicosync-cache-${userId}-${key}`;
          try {
            const serializedState = JSON.stringify(state);
            window.localStorage.setItem(localKey, serializedState);
          } catch (e) { 
              console.error("Erro fatal ao salvar no LocalStorage:", e); 
          }
      }

      // Só salva na nuvem se JÁ TIVERMOS sincronizado a leitura inicial.
      if (userId && db && isCloudSynced) {
          const timeoutId = setTimeout(async () => {
              try {
                  const docRef = doc(db, "users", userId, "data", key);
                  // A escrita na nuvem vai disparar o onSnapshot acima.
                  // Graças à comparação JSON.stringify na leitura, o loop será interrompido lá se os dados forem iguais.
                  await setDoc(docRef, { value: state }, { merge: true });
              } catch (e: any) {
                  if (e.code !== 'permission-denied') {
                      console.warn("Falha ao persistir na nuvem (tentando novamente mais tarde):", e.message);
                  }
              }
          }, 2000); // Debounce de 2s

          return () => clearTimeout(timeoutId);
      }
  }, [state, userId, key, isCloudSynced]);

  return [state, setState];
}
