import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Trash2, Wrench } from "lucide-react";

const demoUsersToFix = [
  {
    email: "john.manager@alpha.com",
    correct_name: "John Smith - Project Manager",
    correct_role: "project_manager",
    correct_tenant_role: "project_manager",
    correct_department: "Project Management",
    correct_job_title: "Project Manager",
    correct_company: "Alpha Construction Ltd",
  },
  {
    email: "sarah.quality@alpha.com",
    correct_name: "Sarah Johnson - Quality Manager",
    correct_role: "quality_manager",
    correct_tenant_role: "quality_manager",
    correct_department: "Quality Control",
    correct_job_title: "Quality Manager",
    correct_company: "Alpha Construction Ltd",
  },
  {
    email: "mike.tech@alpha.com",
    correct_name: "Mike Davis - Lab Technician",
    correct_role: "technician",
    correct_tenant_role: "technician",
    correct_department: "Laboratory",
    correct_job_title: "Lab Technician",
    correct_company: "Alpha Construction Ltd",
  },
  {
    email: "emily.admin@alpha.com",
    correct_name: "Emily Chen - Admin",
    correct_role: "admin",
    correct_tenant_role: "admin",
    correct_department: "Administration",
    correct_job_title: "Administrator",
    correct_company: "Alpha Construction Ltd",
  },
  {
    email: "robert.supervisor@alpha.com",
    correct_name: "Robert Wilson - Site Supervisor",
    correct_role: "supervisor",
    correct_tenant_role: "supervisor",
    correct_department: "Site Operations",
    correct_job_title: "Site Supervisor",
    correct_company: "Alpha Construction Ltd",
  },
];

export default function FixDemoUsers() {
  const [fixing, setFixing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const fixAllUsers = async () => {
    setFixing(true);
    let successCount = 0;
    let errorCount = 0;

    for (const user of demoUsersToFix) {
      try {
        // Find the user by email in profiles table
        const { data: profile, error: profileQueryError } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("email", user.email)
          .single();

        if (profileQueryError || !profile) {
          console.error(
            `User ${user.email} not found in profiles:`,
            profileQueryError
          );
          errorCount++;
          continue;
        }

        const userId = profile.user_id;

        // Find the correct company
        const { data: company, error: companyError } = await supabase
          .from("companies")
          .select("id")
          .eq("name", user.correct_company)
          .single();

        if (companyError || !company) {
          console.error(
            `Company ${user.correct_company} not found:`,
            companyError
          );
          errorCount++;
          continue;
        }

        // Update the profiles table
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            name: user.correct_name,
            role: user.correct_role,
            department: user.correct_department,
            job_title: user.correct_job_title,
            company_id: company.id,
          })
          .eq("user_id", userId);

        if (profileError) {
          console.error(
            `Error updating profile for ${user.email}:`,
            profileError
          );
          errorCount++;
          continue;
        }

        // Update or insert user_roles table
        const { error: roleError } = await supabase.from("user_roles").upsert({
          user_id: userId,
          role: user.correct_role as any, // Cast to app_role enum
        });

        if (roleError) {
          console.error(`Error updating role for ${user.email}:`, roleError);
          errorCount++;
          continue;
        }

        console.log(`Fixed ${user.email}`);
        successCount++;

        // Small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error: any) {
        console.error(`Error fixing ${user.email}:`, error);
        errorCount++;
      }
    }

    setFixing(false);

    toast({
      title: "Fix Complete",
      description: `Fixed ${successCount} users. ${errorCount} errors.`,
      variant: errorCount > 0 ? "destructive" : "default",
    });
  };

  const deleteAllUsers = async () => {
    if (
      !confirm(
        "Are you sure you want to delete all demo users? This cannot be undone."
      )
    ) {
      return;
    }

    setDeleting(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "fix-demo-users",
        {
          body: {
            action: "delete_all",
          },
        }
      );

      if (error) throw error;

      toast({
        title: "Success",
        description: "All demo users have been deleted",
      });
    } catch (error: any) {
      console.error("Error deleting users:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete users",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Fix Demo Users</h1>
        <p className="text-muted-foreground mt-2">
          Repair corrupted demo user data or delete and recreate them
        </p>
      </div>

      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-orange-900 dark:text-orange-100">
              Data Corruption Detected
            </CardTitle>
          </div>
          <CardDescription className="text-orange-800 dark:text-orange-200">
            Some demo users have incorrect names, roles, and company assignments
            in the database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-orange-900 dark:text-orange-100">
              Corrupted Users:
            </h3>
            <ul className="space-y-1 text-sm text-orange-800 dark:text-orange-200">
              {demoUsersToFix.map((user) => (
                <li key={user.email}>
                  • {user.email} → should be "{user.correct_name}" with role "
                  {user.correct_role}"
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              onClick={fixAllUsers}
              disabled={fixing || deleting}
              variant="default"
            >
              {fixing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2" />
                  Fixing...
                </>
              ) : (
                <>
                  <Wrench className="h-4 w-4 mr-2" />
                  Fix All Users
                </>
              )}
            </Button>

            <Button
              onClick={deleteAllUsers}
              disabled={fixing || deleting}
              variant="destructive"
            >
              {deleting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All & Recreate
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-orange-700 dark:text-orange-300 pt-2">
            After fixing or deleting, you'll need to recreate demo users from
            the Demo Users page if you deleted them.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What This Does</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold mb-1">Fix All Users:</h4>
            <p className="text-muted-foreground">
              Updates the profiles and user_roles tables with correct names and
              roles for existing demo users.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Delete All & Recreate:</h4>
            <p className="text-muted-foreground">
              Completely removes all demo users from profiles, user_roles, and
              auth.users tables. After deletion, go to the Demo Users page to
              create fresh accounts.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
