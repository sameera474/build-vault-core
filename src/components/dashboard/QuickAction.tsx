import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QuickActionItem {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary';
}

interface QuickActionsProps {
  title?: string;
  actions: QuickActionItem[];
}

export function QuickActions({ title = 'Quick Actions', actions }: QuickActionsProps) {
  return (
    <Card className="border-border/50 animate-fade-in" style={{ animationDelay: '400ms' }}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={action.onClick}
              variant={action.variant || 'outline'}
              className="h-auto py-4 justify-start text-left group hover:scale-105 transition-all"
            >
              <div className="rounded-lg bg-primary/10 p-2 mr-3 group-hover:bg-primary/20 transition-colors">
                <action.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{action.title}</div>
                <div className="text-xs text-muted-foreground">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
