import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  title: string;
  description?: string;
  time: Date | string;
  icon: LucideIcon;
  status?: 'success' | 'warning' | 'error' | 'info';
}

interface ActivityTimelineProps {
  title?: string;
  activities: Activity[];
  maxHeight?: string;
}

export function ActivityTimeline({
  title = 'Recent Activity',
  activities,
  maxHeight = 'max-h-[400px]',
}: ActivityTimelineProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    }
  };

  const getIconBg = (status?: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/10';
      case 'warning':
        return 'bg-yellow-500/10';
      case 'error':
        return 'bg-red-500/10';
      default:
        return 'bg-blue-500/10';
    }
  };

  const getIconColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <Card className="border-border/50 animate-fade-in" style={{ animationDelay: '500ms' }}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`space-y-4 ${maxHeight} overflow-y-auto pr-2`}>
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No recent activity</p>
            </div>
          ) : (
            activities.map((activity, index) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors animate-fade-in"
                style={{ animationDelay: `${(index + 5) * 50}ms` }}
              >
                <div className={`rounded-full ${getIconBg(activity.status)} p-2 flex-shrink-0`}>
                  <activity.icon className={`h-4 w-4 ${getIconColor(activity.status)}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {activity.title}
                  </p>
                  {activity.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activity.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {typeof activity.time === 'string'
                      ? formatDistanceToNow(new Date(activity.time), { addSuffix: true })
                      : formatDistanceToNow(activity.time, { addSuffix: true })}
                  </p>
                </div>
                {activity.status && (
                  <Badge className={`${getStatusColor(activity.status)} border flex-shrink-0`}>
                    {activity.status}
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
