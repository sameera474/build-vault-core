import { Badge } from '@/components/ui/badge';

interface DashboardHeaderProps {
  role: string;
  userName: string;
  description: string;
  gradientFrom?: string;
  gradientVia?: string;
  gradientTo?: string;
}

export function DashboardHeader({
  role,
  userName,
  description,
  gradientFrom = 'from-blue-600',
  gradientVia = 'via-purple-600',
  gradientTo = 'to-pink-600',
}: DashboardHeaderProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientVia} ${gradientTo} p-8 text-white animate-fade-in shadow-2xl`}
    >
      <div className="relative z-10">
        <Badge className="mb-3 bg-white/20 text-white border-white/30 hover:bg-white/30">
          {role} Dashboard
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          Welcome back, {userName}!
        </h1>
        <p className="text-white/90 text-base sm:text-lg max-w-2xl">
          {description}
        </p>
      </div>
      {/* Animated pattern overlay */}
      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]" />
      {/* Floating orbs */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
    </div>
  );
}
