import { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  delay?: number;
}

export function StatCard({
  title,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  iconBg = 'bg-primary/10',
  iconColor = 'text-primary',
  delay = 0,
}: StatCardProps) {
  return (
    <Card
      className="group hover:shadow-xl hover:scale-105 transition-all duration-300 animate-fade-in border-border/50"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className={`rounded-lg ${iconBg} p-2 group-hover:brightness-110 transition-all`}
        >
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          {value}
        </div>
        {change && (
          <div className="flex items-center gap-1 text-xs mt-2">
            {trend === 'up' && (
              <>
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-600 font-medium">{change}</span>
              </>
            )}
            {trend === 'down' && (
              <>
                <TrendingDown className="h-3 w-3 text-red-500" />
                <span className="text-red-600 font-medium">{change}</span>
              </>
            )}
            {trend === 'neutral' && (
              <span className="text-muted-foreground font-medium">{change}</span>
            )}
            <span className="text-muted-foreground ml-1">from last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
