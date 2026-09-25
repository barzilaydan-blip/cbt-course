import PreviewShell from "../PreviewShell";
import { PageHeader } from "@/components/ui/PageHeader";
import ResourceLibrary from "@/components/resources/ResourceLibrary";
import { resources } from "../mock";

export default function Page() {
  return (
    <PreviewShell width="max-w-6xl">
      <div className="space-y-6">
        <PageHeader title="מרכז משאבים" description="טפסים קליניים, שאלונים ומדריכים להורדה — חפש לפי שם או סנן לפי קטגוריה." />
        <ResourceLibrary resources={resources} />
      </div>
    </PreviewShell>
  );
}
