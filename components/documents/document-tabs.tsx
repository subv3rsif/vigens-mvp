'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileUpload } from './file-upload';
import { FileList } from './file-list';
import { LinkList } from './link-list';

interface DocumentTabsProps {
  taskId: string;
}

type TabType = 'files' | 'links';

export function DocumentTabs({ taskId }: DocumentTabsProps) {
  return (
    <Tabs defaultValue="files" className="w-full">
      <TabsList variant="line" className="w-full">
        <TabsTrigger value="files">Fichiers</TabsTrigger>
        <TabsTrigger value="links">Liens</TabsTrigger>
      </TabsList>

      <TabsContent value="files" className="space-y-4 mt-4">
        <FileUpload taskId={taskId} />
        <FileList taskId={taskId} />
      </TabsContent>

      <TabsContent value="links" className="mt-4">
        <LinkList taskId={taskId} />
      </TabsContent>
    </Tabs>
  );
}
