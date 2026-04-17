'use client';

import * as React from 'react';
import { mutate } from 'swr';
import { getSocket } from '../utils/socket';

type Scope = 'appointments' | 'clients' | 'packages';

function revalidateScope(scope: Scope) {
  const prefix = `swr:${scope}`;
  void mutate((key) => Array.isArray(key) && key[0] === prefix);
}

export type UseSocketSWRInvalidateOptions = {
  /** Called when server emits `appointment:created` (after list revalidation). */
  onAppointmentCreated?: (payload: { appointment: unknown }) => void;
};

/**
 * Listens for Socket.IO `invalidate` + `appointment:created` and revalidates matching SWR keys (`swr:appointments`, etc.).
 */
export function useSocketSWRInvalidate(options?: UseSocketSWRInvalidateOptions): void {
  const onCreatedRef = React.useRef(options?.onAppointmentCreated);
  onCreatedRef.current = options?.onAppointmentCreated;

  React.useEffect(() => {
    const socket = getSocket();

    const onInvalidate = (payload: { scope?: Scope }) => {
      const s = payload?.scope;
      if (s === 'appointments' || s === 'clients' || s === 'packages') {
        revalidateScope(s);
      }
    };

    const onAppointmentCreated = (data: { appointment: unknown }) => {
      revalidateScope('appointments');
      revalidateScope('clients');
      onCreatedRef.current?.(data);
    };

    socket.on('invalidate', onInvalidate);
    socket.on('appointment:created', onAppointmentCreated);

    return () => {
      socket.off('invalidate', onInvalidate);
      socket.off('appointment:created', onAppointmentCreated);
    };
  }, []);
}
