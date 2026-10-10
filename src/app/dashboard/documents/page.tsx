import { getCurrentUser } from '@/lib/auth';
import { listDocuments } from '@/lib/store/repository';
import { DocumentLibrary } from '@/components/documents/DocumentLibrary';

export default async function DocumentsPage() {
  const user = await getCurrentUser();
  const documents = await listDocuments(user?.id || '');

  return (
    <div className="space-y-6">
      <DocumentLibrary initialDocuments={documents} />
    </div>
  );
}
