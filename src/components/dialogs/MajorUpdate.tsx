import { Modal } from '@/components/ui/modal.tsx';

interface Props {
  open: boolean;
  onClose: () => void;
  currentVersion?: string;
  previousVersion?: string;
}

export function MajorUpdate({
  open,
  onClose,
  currentVersion = '',
  previousVersion = '',
}: Props) {
  return (
    <Modal open={open} onClose={onClose}>
      <h2>Atualização Importante</h2>

      {currentVersion && previousVersion && (
        <p>
          <strong>Playlite foi atualizado</strong> de v{previousVersion} para v
          {currentVersion}
        </p>
      )}

      <p>
        Esta versão do Playlite trouxe mudanças estruturais importantes no banco
        de dados e melhorias de compatibilidade.
      </p>

      <ul>
        <li>✅ Backup automático criado</li>
        <li>✅ Dados migrados com segurança</li>
        <li>✅ Sistema de versionamento ativo</li>
      </ul>

      <p>
        <strong>Seus dados estão seguros!</strong> Um backup foi criado
        automaticamente na pasta <code>backups/</code> do diretório da
        aplicação.
      </p>

      <button onClick={onClose}>Entendi, continuar</button>
    </Modal>
  );
}
