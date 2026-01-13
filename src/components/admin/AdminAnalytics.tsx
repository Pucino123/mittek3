import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Eye, Globe, TrendingUp, ArrowUpRight, ArrowDownRight, Info, Trash2, RefreshCcw, MapPin } from 'lucide-react';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format, subDays } from 'date-fns';
import { da } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { LiveVisitorCounter } from './LiveVisitorCounter';
import { UsageHeatmap } from './UsageHeatmap';
interface AnalyticsData {
  page_views: number;
  unique_visitors: number;
  avg_session_duration: number;
  bounce_rate: number;
}

interface DailyStats {
  date: string;
  views: number;
  visitors: number;
}

interface ReferrerData {
  source: string;
  visits: number;
  percentage: number;
}

interface PageViewData {
  path: string;
  views: number;
}

interface GeoData {
  country: string;
  visits: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--accent))'];

export function AdminAnalytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [referrers, setReferrers] = useState<ReferrerData[]>([]);
  const [topPages, setTopPages] = useState<PageViewData[]>([]);
  const [geoData, setGeoData] = useState<GeoData[]>([]);
  const [summary, setSummary] = useState<AnalyticsData>({
    page_views: 0,
    unique_visitors: 0,
    avg_session_duration: 0,
    bounce_rate: 0,
  });
  const [previousSummary, setPreviousSummary] = useState<AnalyticsData>({
    page_views: 0,
    unique_visitors: 0,
    avg_session_duration: 0,
    bounce_rate: 0,
  });

  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleResetAnalytics = async () => {
    setIsResetting(true);
    try {
      // Delete all page views (analytics data source)
      const thirtyDaysAgo = subDays(new Date(), 30);
      const { error } = await supabase
        .from('page_views')
        .delete()
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (error) throw error;

      toast.success('Analysedata nulstillet', {
        description: 'Alle sidevisninger fra de seneste 30 dage er slettet',
      });
      
      // Refresh data
      await fetchAnalytics();
    } catch (err: any) {
      console.error('Reset error:', err);
      toast.error('Kunne ikke nulstille data');
    } finally {
      setIsResetting(false);
    }
  };

  const fetchAnalytics = async () => {
    setIsLoading(true);
    
    try {
      // Fetch page views for the last 30 days
      const thirtyDaysAgo = subDays(new Date(), 30);
      const sixtyDaysAgo = subDays(new Date(), 60);
      
      const { data: recentViews } = await supabase
        .from('page_views')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      const { data: previousViews } = await supabase
        .from('page_views')
        .select('*')
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString());

      // Process daily stats
      const dailyMap = new Map<string, { views: number; sessions: Set<string> }>();
      
      recentViews?.forEach(view => {
        const date = format(new Date(view.created_at), 'yyyy-MM-dd');
        const existing = dailyMap.get(date) || { views: 0, sessions: new Set<string>() };
        existing.views++;
        if (view.session_id) existing.sessions.add(view.session_id);
        dailyMap.set(date, existing);
      });

      const dailyStatsData: DailyStats[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        const dayData = dailyMap.get(date);
        dailyStatsData.push({
          date: format(new Date(date), 'd. MMM', { locale: da }),
          views: dayData?.views || 0,
          visitors: dayData?.sessions.size || 0,
        });
      }
      setDailyStats(dailyStatsData);

      // Calculate summary
      const totalViews = recentViews?.length || 0;
      const uniqueSessions = new Set(recentViews?.map(v => v.session_id).filter(Boolean)).size;
      const prevViews = previousViews?.length || 0;
      const prevUniqueSessions = new Set(previousViews?.map(v => v.session_id).filter(Boolean)).size;

      // Calculate bounce rate (sessions with only 1 page view)
      const sessionCounts = new Map<string, number>();
      recentViews?.forEach(v => {
        if (v.session_id) {
          sessionCounts.set(v.session_id, (sessionCounts.get(v.session_id) || 0) + 1);
        }
      });
      const bouncedSessions = Array.from(sessionCounts.values()).filter(count => count === 1).length;
      const bounceRate = uniqueSessions > 0 ? Math.round((bouncedSessions / uniqueSessions) * 100) : 0;

      // Estimate avg session duration (views per session * 30 seconds average)
      const avgPagesPerSession = uniqueSessions > 0 ? totalViews / uniqueSessions : 0;
      const avgSessionDuration = Math.round(avgPagesPerSession * 30);

      setSummary({
        page_views: totalViews,
        unique_visitors: uniqueSessions,
        avg_session_duration: avgSessionDuration,
        bounce_rate: bounceRate,
      });

      // Previous period stats
      const prevSessionCounts = new Map<string, number>();
      previousViews?.forEach(v => {
        if (v.session_id) {
          prevSessionCounts.set(v.session_id, (prevSessionCounts.get(v.session_id) || 0) + 1);
        }
      });
      const prevBouncedSessions = Array.from(prevSessionCounts.values()).filter(count => count === 1).length;
      const prevBounceRate = prevUniqueSessions > 0 ? Math.round((prevBouncedSessions / prevUniqueSessions) * 100) : 0;
      const prevAvgPagesPerSession = prevUniqueSessions > 0 ? prevViews / prevUniqueSessions : 0;

      setPreviousSummary({
        page_views: prevViews,
        unique_visitors: prevUniqueSessions,
        avg_session_duration: Math.round(prevAvgPagesPerSession * 30),
        bounce_rate: prevBounceRate,
      });

      // Process referrers from actual referrer data
      const referrerMap = new Map<string, number>();
      recentViews?.forEach(view => {
        let source = 'Direkte';
        if (view.referrer) {
          try {
            const url = new URL(view.referrer);
            source = url.hostname.replace('www.', '');
          } catch {
            source = view.referrer.slice(0, 30);
          }
        }
        referrerMap.set(source, (referrerMap.get(source) || 0) + 1);
      });

      const referrerData: ReferrerData[] = Array.from(referrerMap.entries())
        .map(([source, visits]) => ({
          source,
          visits,
          percentage: totalViews > 0 ? Math.round((visits / totalViews) * 100) : 0,
        }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 5);
      setReferrers(referrerData);

      // Process top pages from actual page paths
      const pageMap = new Map<string, number>();
      recentViews?.forEach(view => {
        const path = view.path || '/';
        pageMap.set(path, (pageMap.get(path) || 0) + 1);
      });

      const pageData: PageViewData[] = Array.from(pageMap.entries())
        .map(([path, views]) => ({ path, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 8);
      setTopPages(pageData);

      // Process geographic data
      const geoMap = new Map<string, number>();
      recentViews?.forEach(view => {
        const country = view.country || 'Ukendt';
        geoMap.set(country, (geoMap.get(country) || 0) + 1);
      });

      const geoDataProcessed: GeoData[] = Array.from(geoMap.entries())
        .map(([country, visits]) => ({ country, visits }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 6);
      setGeoData(geoDataProcessed);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getChangePercent = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const StatCard = ({ 
    title, 
    value, 
    previousValue,
    icon: Icon,
    format: formatFn = (v: number) => v.toLocaleString('da-DK'),
    suffix = ''
  }: { 
    title: string;
    value: number;
    previousValue: number;
    icon: React.ElementType;
    format?: (v: number) => string;
    suffix?: string;
  }) => {
    const change = getChangePercent(value, previousValue);
    const isPositive = change >= 0;
    
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">{title}</span>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{formatFn(value)}{suffix}</span>
            {previousValue > 0 && (
              <span className={`text-xs flex items-center ${isPositive ? 'text-success' : 'text-destructive'}`}>
                {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(change)}%
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">vs. forrige 30 dage</p>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Info & Reset */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Platformsanalyse</h2>
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="text-sm">
                  Denne side viser statistik over platformens aktivitet baseret på audit logs. 
                  Data inkluderer sidevisninger, unikke brugere, handlingstyper og aktivitetsmønstre 
                  over de seneste 30 dage.
                </p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchAnalytics}
            disabled={isLoading}
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Opdater
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isResetting}>
                {isResetting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Nulstil data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="h-5 w-5" />
                  Nulstil analysedata?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Dette vil permanent slette alle audit logs fra de seneste 30 dage. 
                  Denne handling kan ikke fortrydes.
                  <br /><br />
                  <strong>Er du helt sikker på, at du vil fortsætte?</strong>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuller</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleResetAnalytics}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Ja, slet data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Live Visitor Counter */}
      <LiveVisitorCounter />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Sidevisninger"
          value={summary.page_views}
          previousValue={previousSummary.page_views}
          icon={Eye}
        />
        <StatCard
          title="Unikke Brugere"
          value={summary.unique_visitors}
          previousValue={previousSummary.unique_visitors}
          icon={Users}
        />
        <StatCard
          title="Gns. Sessionstid"
          value={summary.avg_session_duration}
          previousValue={previousSummary.avg_session_duration}
          icon={TrendingUp}
          format={(v) => `${Math.floor(v / 60)}:${(v % 60).toString().padStart(2, '0')}`}
        />
        <StatCard
          title="Afvisningsrate"
          value={summary.bounce_rate}
          previousValue={previousSummary.bounce_rate}
          icon={Globe}
          suffix="%"
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Traffic Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Trafik Oversigt</CardTitle>
            <CardDescription>Sidevisninger og besøgende de seneste 30 dage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--info))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--info))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    name="Visninger"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorViews)"
                  />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    name="Besøgende"
                    stroke="hsl(var(--info))"
                    fillOpacity={1}
                    fill="url(#colorVisitors)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Aktivitetskilder</CardTitle>
            <CardDescription>Fordeling af handlingstyper</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center">
              {referrers.length > 0 ? (
                <div className="w-full flex items-center gap-6">
                  <div className="w-1/2 h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={referrers}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="visits"
                        >
                          {referrers.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-1/2 space-y-2">
                    {referrers.map((ref, index) => (
                      <div key={ref.source} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm truncate max-w-[120px]">{ref.source}</span>
                        </div>
                        <span className="text-sm font-medium">{ref.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground w-full">Ingen data tilgængelig</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Top Pages & Geography */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Sider</CardTitle>
            <CardDescription>Mest besøgte sider de seneste 30 dage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {topPages.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topPages} layout="vertical" margin={{ top: 0, right: 20, left: 80, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis 
                      type="category" 
                      dataKey="path" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                      width={70}
                      tickFormatter={(value) => value.length > 12 ? value.slice(0, 12) + '...' : value}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="views" name="Visninger" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Ingen data tilgængelig</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Geografisk Fordeling
            </CardTitle>
            <CardDescription>Besøgende efter land</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {geoData.length > 0 ? (
                <div className="space-y-3">
                  {geoData.map((item, index) => {
                    const maxVisits = geoData[0]?.visits || 1;
                    const percentage = Math.round((item.visits / maxVisits) * 100);
                    return (
                      <div key={item.country} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{item.country}</span>
                          <span className="text-muted-foreground">{item.visits} besøg</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Ingen geografiske data endnu</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Heatmap */}
      <UsageHeatmap />
    </div>
  );
}
