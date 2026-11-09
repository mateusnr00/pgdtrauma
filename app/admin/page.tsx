import { goToAdmin, isAdmin } from '@/lib/auth';
import { getContentFresh } from '@/lib/content-store';
import { Editor } from './_editor/Editor';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  if (!(await isAdmin())) await goToAdmin('login');
  const content = await getContentFresh();
  return <Editor initial={content} storeReady={Boolean(process.env.BLOB_READ_WRITE_TOKEN)} />;
}
