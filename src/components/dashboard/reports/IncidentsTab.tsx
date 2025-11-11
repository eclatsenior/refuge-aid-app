import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { formatDistanceToNow } from "date-fns";
import { getDateFnsLocale } from "@/lib/dateUtils";
import { Search, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Incident {
  id: string;
  employee_id: string;
  type: string;
  status: string;
  opened_at: string;
  closed_at: string | null;
  sla_breached_bool: boolean;
  notes: string | null;
  employee?: { full_name: string; email: string };
}

export function IncidentsTab() {
  const { t, i18n } = useTranslation('dashboard');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchIncidents();
  }, []);

  useEffect(() => {
    filterIncidents();
  }, [incidents, statusFilter, searchTerm]);

  const fetchIncidents = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get assigned employees
      const { data: assignments } = await supabase
        .from('employee_assignments')
        .select('employee_id')
        .eq('refugi_lead_id', user.id);
      
      const assignedEmployeeIds = assignments?.map(a => a.employee_id) || [];

      // Fetch incidents - FILTERED
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .in('employee_id', assignedEmployeeIds)
        .order('opened_at', { ascending: false });

      if (error) throw error;

      // Fetch employee info separately for each incident
      const incidentsWithEmployees = await Promise.all(
        (data || []).map(async (incident) => {
          const { data: empData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', incident.employee_id)
            .single();
          
          return {
            ...incident,
            employee: empData || { full_name: t('incidents.unknown'), email: '' }
          };
        })
      );

      setIncidents(incidentsWithEmployees as Incident[]);
    } finally {
      setLoading(false);
    }
  };

  const filterIncidents = () => {
    let filtered = incidents;

    if (statusFilter !== "all") {
      filtered = filtered.filter(i => i.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(i => 
        i.employee?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.employee?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredIncidents(filtered);
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: any } = {
      open: "destructive",
      in_progress: "outline",
      closed: "secondary"
    };
    return <Badge variant={variants[status] || "outline"}>{t(`incidents.statusBadges.${status}`) || status}</Badge>;
  };

  const stats = {
    total: incidents.length,
    open: incidents.filter(i => i.status === 'open').length,
    in_progress: incidents.filter(i => i.status === 'in_progress').length,
    closed: incidents.filter(i => i.status === 'closed').length,
    breached: incidents.filter(i => i.sla_breached_bool).length
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">{t('incidents.total')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-destructive">{stats.open}</div>
            <div className="text-sm text-muted-foreground">{t('incidents.open')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.in_progress}</div>
            <div className="text-sm text-muted-foreground">{t('incidents.inProgress')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.closed}</div>
            <div className="text-sm text-muted-foreground">{t('incidents.closed')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{stats.breached}</div>
            <div className="text-sm text-muted-foreground">{t('incidents.slaBreached')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('incidents.filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('incidents.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder={t('incidents.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('incidents.allStatus')}</SelectItem>
                <SelectItem value="open">{t('incidents.open')}</SelectItem>
                <SelectItem value="in_progress">{t('incidents.inProgress')}</SelectItem>
                <SelectItem value="closed">{t('incidents.closed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('incidents.incidentsCount', { count: filteredIncidents.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('incidents.employee')}</TableHead>
                <TableHead>{t('incidents.type')}</TableHead>
                <TableHead>{t('incidents.status')}</TableHead>
                <TableHead>{t('incidents.opened')}</TableHead>
                <TableHead>{t('incidents.closedAt')}</TableHead>
                <TableHead>{t('incidents.sla')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIncidents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {t('incidents.noIncidents')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredIncidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{incident.employee?.full_name}</div>
                        <div className="text-sm text-muted-foreground">{incident.employee?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{incident.type}</TableCell>
                    <TableCell>{getStatusBadge(incident.status)}</TableCell>
                    <TableCell className="text-sm">
                      {formatDistanceToNow(new Date(incident.opened_at), { addSuffix: true, locale: getDateFnsLocale(i18n.language) })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {incident.closed_at ? formatDistanceToNow(new Date(incident.closed_at), { addSuffix: true, locale: getDateFnsLocale(i18n.language) }) : '-'}
                    </TableCell>
                    <TableCell>
                      {incident.sla_breached_bool ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {t('incidents.breached')}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {t('incidents.ok')}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
