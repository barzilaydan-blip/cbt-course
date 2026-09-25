import PreviewShell from "../PreviewShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { ModulesListView } from "@/components/modules/ModuleListItem";
import { moduleItems } from "../mock";

export default function Page() {
  return (
    <PreviewShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader title="רשימת מפגשים" description="5 מפגשים, מתוכם 1 הקלטות א-סינכרוניות — קורס CBT" />
        <ModulesListView items={moduleItems} />
      </div>
    </PreviewShell>
  );
}
