import { EmptyState } from "@/components/ui/EmptyState";
import { Users } from "lucide-react";

export default function AdminGroupsIndexPage() {
  return (
    <EmptyState
      icon={Users}
      title="בחר קבוצה לניהול"
      description="בחר קבוצה מהרשימה בצד, או הוסף קבוצה חדשה."
    />
  );
}
