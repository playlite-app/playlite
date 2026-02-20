import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui/alert-dialog';

// Tipagem das opções possíveis de passar ao chamar a função
type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive'; // Para botões vermelhos
};

// Tipagem do Contexto
type ConfirmContextType = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolvePromise, setResolvePromise] = useState<
    ((value: boolean) => void) | null
  >(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);

    return new Promise<boolean>(resolve => {
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    if (resolvePromise) resolvePromise(true);

    setOptions(null);
  };

  const handleCancel = () => {
    if (resolvePromise) resolvePromise(false);

    setOptions(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {/* Componente visual */}
      <AlertDialog open={options !== null} onOpenChange={handleCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {options?.title || 'Você tem certeza?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {options?.description || 'Esta ação não pode ser desfeita.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              {options?.cancelText || 'Cancelar'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              // Aplica estilo vermelho se for destrutivo
              className={
                options?.variant === 'destructive'
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-red-600'
                  : ''
              }
            >
              {options?.confirmText || 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

/**
 * Hook para acessar a função de confirmação.
 * Deve ser usado dentro de um ConfirmProvider.
 */
export function useConfirm() {
  const context = useContext(ConfirmContext);

  if (!context) {
    throw new Error('useConfirm deve ser usado dentro de um ConfirmProvider');
  }

  return context;
}
