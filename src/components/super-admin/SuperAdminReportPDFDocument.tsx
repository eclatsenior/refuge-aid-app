import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  coverPage: {
    padding: 40,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  coverTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1a1a2e',
  },
  coverSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  coverMeta: {
    fontSize: 12,
    color: '#888',
    marginTop: 20,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1a1a2e',
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  statBox: {
    width: '33%',
    padding: 10,
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  statLabel: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 6,
    paddingHorizontal: 5,
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
  },
  tableCellHeader: {
    flex: 1,
    fontSize: 9,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#999',
    textAlign: 'center',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 8,
    color: '#999',
  },
});

interface ReportData {
  metadata: {
    generated_at: string;
    generated_by: string;
  };
  overview: {
    totalUsers: number;
    totalEmployees: number;
    totalLeads: number;
    activeSubscriptions: number;
    totalAlerts: number;
    unresolvedAlerts: number;
    activeSessionsToday: number;
    recentSignups: number;
    avgMood: number | null;
  };
  users: Array<{
    full_name: string;
    email: string;
    role: string;
    created_at: string;
  }>;
  subscriptions: Array<{
    id: string;
    status: string;
    employee_limit: number;
    current_period_end: string | null;
    profiles?: { full_name: string; email: string };
  }>;
  alerts: Array<{
    id: string;
    alert_type: string;
    is_resolved: boolean;
    created_at: string;
    profiles?: { full_name: string; email: string };
  }>;
}

interface SuperAdminReportPDFDocumentProps {
  data: ReportData;
}

export function SuperAdminReportPDFDocument({ data }: SuperAdminReportPDFDocumentProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatShortDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <Text style={styles.coverTitle}>REPORTE CONTROL MAESTRO</Text>
        <Text style={styles.coverSubtitle}>Panel de Super Administración</Text>
        <View style={{ marginTop: 60 }}>
          <Text style={styles.coverMeta}>Generado: {formatDate(data.metadata.generated_at)}</Text>
          <Text style={styles.coverMeta}>Por: {data.metadata.generated_by}</Text>
        </View>
        <View style={{ marginTop: 100 }}>
          <Text style={{ fontSize: 12, color: '#666' }}>Refugi App</Text>
        </View>
      </Page>

      {/* Executive Summary */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Resumen Ejecutivo</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{data.overview.totalUsers}</Text>
            <Text style={styles.statLabel}>Total Usuarios</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{data.overview.totalEmployees}</Text>
            <Text style={styles.statLabel}>Empleados</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{data.overview.totalLeads}</Text>
            <Text style={styles.statLabel}>Refugi Leads</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{data.overview.activeSubscriptions}</Text>
            <Text style={styles.statLabel}>Suscripciones Activas</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{data.overview.totalAlerts}</Text>
            <Text style={styles.statLabel}>Total Alertas</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{data.overview.unresolvedAlerts}</Text>
            <Text style={styles.statLabel}>Alertas Sin Resolver</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{data.overview.activeSessionsToday}</Text>
            <Text style={styles.statLabel}>Sesiones Hoy</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{data.overview.recentSignups}</Text>
            <Text style={styles.statLabel}>Registros (30d)</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{data.overview.avgMood ?? 'N/A'}</Text>
            <Text style={styles.statLabel}>Ánimo Promedio (24h)</Text>
          </View>
        </View>

        <Text style={styles.footer}>Refugi App - Control Maestro</Text>
        <Text style={styles.pageNumber}>1</Text>
      </Page>

      {/* Users Page */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Usuarios del Sistema</Text>
        <Text style={{ marginBottom: 15, color: '#666' }}>
          Total: {data.users.length} usuarios registrados
        </Text>
        
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCellHeader, { flex: 2 }]}>Nombre</Text>
            <Text style={[styles.tableCellHeader, { flex: 2 }]}>Email</Text>
            <Text style={styles.tableCellHeader}>Rol</Text>
            <Text style={styles.tableCellHeader}>Registro</Text>
          </View>
          {data.users.slice(0, 30).map((user, index) => (
            <View style={styles.tableRow} key={index}>
              <Text style={[styles.tableCell, { flex: 2 }]}>{user.full_name}</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>{user.email}</Text>
              <Text style={styles.tableCell}>{user.role}</Text>
              <Text style={styles.tableCell}>{formatShortDate(user.created_at)}</Text>
            </View>
          ))}
        </View>
        
        {data.users.length > 30 && (
          <Text style={{ marginTop: 10, color: '#666', fontSize: 9 }}>
            ... y {data.users.length - 30} usuarios más
          </Text>
        )}

        <Text style={styles.footer}>Refugi App - Control Maestro</Text>
        <Text style={styles.pageNumber}>2</Text>
      </Page>

      {/* Subscriptions Page */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Suscripciones</Text>
        <Text style={{ marginBottom: 15, color: '#666' }}>
          Total: {data.subscriptions.length} suscripciones
        </Text>
        
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCellHeader, { flex: 2 }]}>Usuario</Text>
            <Text style={styles.tableCellHeader}>Estado</Text>
            <Text style={styles.tableCellHeader}>Empleados</Text>
            <Text style={[styles.tableCellHeader, { flex: 1.5 }]}>Vencimiento</Text>
          </View>
          {data.subscriptions.map((sub, index) => (
            <View style={styles.tableRow} key={index}>
              <Text style={[styles.tableCell, { flex: 2 }]}>
                {sub.profiles?.full_name || 'N/A'}
              </Text>
              <Text style={styles.tableCell}>{sub.status}</Text>
              <Text style={styles.tableCell}>{sub.employee_limit}</Text>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>
                {sub.current_period_end ? formatShortDate(sub.current_period_end) : 'N/A'}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>Refugi App - Control Maestro</Text>
        <Text style={styles.pageNumber}>3</Text>
      </Page>

      {/* Alerts Page */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Alertas SOS</Text>
        <Text style={{ marginBottom: 15, color: '#666' }}>
          Total: {data.alerts.length} alertas | Sin resolver: {data.overview.unresolvedAlerts}
        </Text>
        
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCellHeader, { flex: 2 }]}>Empleado</Text>
            <Text style={styles.tableCellHeader}>Tipo</Text>
            <Text style={styles.tableCellHeader}>Estado</Text>
            <Text style={[styles.tableCellHeader, { flex: 1.5 }]}>Fecha</Text>
          </View>
          {data.alerts.slice(0, 40).map((alert, index) => (
            <View style={styles.tableRow} key={index}>
              <Text style={[styles.tableCell, { flex: 2 }]}>
                {alert.profiles?.full_name || 'N/A'}
              </Text>
              <Text style={styles.tableCell}>{alert.alert_type}</Text>
              <Text style={styles.tableCell}>{alert.is_resolved ? 'Resuelto' : 'Pendiente'}</Text>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>
                {formatShortDate(alert.created_at)}
              </Text>
            </View>
          ))}
        </View>
        
        {data.alerts.length > 40 && (
          <Text style={{ marginTop: 10, color: '#666', fontSize: 9 }}>
            ... y {data.alerts.length - 40} alertas más
          </Text>
        )}

        <Text style={styles.footer}>Refugi App - Control Maestro</Text>
        <Text style={styles.pageNumber}>4</Text>
      </Page>
    </Document>
  );
}
