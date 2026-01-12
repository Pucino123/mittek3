import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, RefreshCw, Eye, AlertTriangle, AlertCircle, Info, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

import type { Json } from '@/integrations/supabase/types';

interface AuditLog {
  id: string;
  created_at: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Json | null;
  severity: string;
}

const SEVERITY_CONFIG = {
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', badge: 'default' as const },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', badge: 'secondary' as const },
  error: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10', badge: 'destructive' as const },
  critical: { icon: XCircle, color: 'text-red-700', bg: 'bg-red-700/10', badge: 'destructive' as const },
};

const ACTION_LABELS: Record<string, string> = {
  checkout_initiated: 'Checkout startet',
  checkout_error: 'Checkout fejl',
  subscription_checkout_completed: 'Abonnement købt',
  subscription_claimed: 'Abonnement aktiveret',
  subscription_updated: 'Abonnement opdateret',
  subscription_canceled: 'Abonnement annulleret',
  claim_failed: 'Aktivering fejlet',
  claim_error: 'Aktivering fejl',
  rate_limit_exceeded: 'Rate limit overskredet',
  webhook_rejected: 'Webhook afvist',
  webhook_error: 'Webhook fejl',
  webhook_config_error: 'Webhook konfigurationsfejl',
};

export const AuditLogViewer = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchTerm === '' ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource_id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  const formatAction = (action: string) => {
    return ACTION_LABELS[action] || action.replace(/_/g, ' ');
  };

  const SeverityIcon = ({ severity }: { severity: string }) => {
    const config = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.info;
    const Icon = config.icon;
    return <Icon className={`h-4 w-4 ${config.color}`} />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Audit Log
            </CardTitle>
            <CardDescription>Oversigt over kritiske handlinger i systemet</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Opdater
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søg i logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Alle niveauer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle niveauer</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Advarsel</SelectItem>
              <SelectItem value="error">Fejl</SelectItem>
              <SelectItem value="critical">Kritisk</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm || severityFilter !== 'all'
              ? 'Ingen logs matcher søgningen'
              : 'Ingen audit logs endnu'}
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Tidspunkt</TableHead>
                  <TableHead>Handling</TableHead>
                  <TableHead>Ressource</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead className="text-right">Detaljer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className={SEVERITY_CONFIG[log.severity]?.bg}>
                    <TableCell>
                      <SeverityIcon severity={log.severity} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {format(new Date(log.created_at), 'dd/MM HH:mm:ss', { locale: da })}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{formatAction(log.action)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm">{log.resource_type}</span>
                        {log.resource_id && (
                          <span className="text-xs text-muted-foreground font-mono truncate max-w-[150px]">
                            {log.resource_id}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">
                      {log.ip_address ? log.ip_address.split(',')[0] : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <SeverityIcon severity={log.severity} />
                              {formatAction(log.action)}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Tidspunkt</p>
                                <p className="font-medium">
                                  {format(new Date(log.created_at), 'PPpp', { locale: da })}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Niveau</p>
                                <Badge variant={SEVERITY_CONFIG[log.severity]?.badge}>
                                  {log.severity.toUpperCase()}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Ressourcetype</p>
                                <p className="font-medium">{log.resource_type}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Ressource ID</p>
                                <p className="font-mono text-xs">{log.resource_id || '-'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">IP-adresse</p>
                                <p className="font-mono text-xs">{log.ip_address || '-'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Bruger ID</p>
                                <p className="font-mono text-xs">{log.user_id || '-'}</p>
                              </div>
                            </div>

                            {log.user_agent && (
                              <div>
                                <p className="text-muted-foreground text-sm mb-1">User Agent</p>
                                <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                                  {log.user_agent}
                                </p>
                              </div>
                            )}

                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                              <div>
                                <p className="text-muted-foreground text-sm mb-1">Metadata</p>
                                <ScrollArea className="h-[200px]">
                                  <pre className="text-xs font-mono bg-muted p-2 rounded overflow-auto">
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </pre>
                                </ScrollArea>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <p>
            Viser {filteredLogs.length} af {logs.length} logs
          </p>
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              {logs.filter((l) => l.severity === 'error' || l.severity === 'critical').length} fejl
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              {logs.filter((l) => l.severity === 'warning').length} advarsler
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
