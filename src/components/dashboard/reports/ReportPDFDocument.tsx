import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #333',
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginTop: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: '48%',
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  kpiLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  table: {
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #ddd',
    paddingVertical: 8,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  tableCell: {
    fontSize: 10,
    padding: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 10,
    color: '#666',
    borderTop: '1 solid #ddd',
    paddingTop: 10,
  },
});

interface ReportData {
  period: { start: string; end: string };
  kpis: any;
  incidents: any[];
  riskScores: any[];
  moodStats: any;
  employeeSummary: any[];
}

export function ReportPDFDocument({ data }: { data: ReportData }) {
  const formatDate = (date: string) => format(new Date(date), "d 'de' MMMM yyyy", { locale: es });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Reporte Refugi</Text>
          <Text style={styles.subtitle}>
            Periodo: {formatDate(data.period.start)} - {formatDate(data.period.end)}
          </Text>
          <Text style={styles.subtitle}>
            Generado: {format(new Date(), "d 'de' MMMM yyyy 'a las' HH:mm", { locale: es })}
          </Text>
        </View>

        {/* KPIs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Indicadores Principales</Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Riesgo Activo</Text>
              <Text style={styles.kpiValue}>{data.kpis?.active_risk?.score?.toFixed(0) || 0}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Incidentes Semana</Text>
              <Text style={styles.kpiValue}>{data.kpis?.incidents_week || 0}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Ánimo Promedio</Text>
              <Text style={styles.kpiValue}>{data.kpis?.avg_mood?.toFixed(1) || 0}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Formación Completada</Text>
              <Text style={styles.kpiValue}>{data.kpis?.training_completion?.toFixed(0) || 0}%</Text>
            </View>
          </View>
        </View>

        {/* Incidents Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Incidentes del Periodo ({data.incidents?.length || 0})</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { width: '35%' }]}>Empleada</Text>
              <Text style={[styles.tableCell, { width: '25%' }]}>Tipo</Text>
              <Text style={[styles.tableCell, { width: '20%' }]}>Estado</Text>
              <Text style={[styles.tableCell, { width: '20%' }]}>Fecha</Text>
            </View>
            {data.incidents?.slice(0, 10).map((incident, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '35%' }]}>{incident.employee_name}</Text>
                <Text style={[styles.tableCell, { width: '25%' }]}>{incident.type}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>{incident.status}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>
                  {format(new Date(incident.opened_at), 'dd/MM/yyyy')}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Employee Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen por Empleada</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { width: '40%' }]}>Nombre</Text>
              <Text style={[styles.tableCell, { width: '20%' }]}>Riesgo</Text>
              <Text style={[styles.tableCell, { width: '20%' }]}>Ánimo</Text>
              <Text style={[styles.tableCell, { width: '20%' }]}>Estado</Text>
            </View>
            {data.employeeSummary?.slice(0, 15).map((emp, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '40%' }]}>{emp.full_name}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>{emp.risk_score || 0}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>{emp.mood_level || '-'}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>{emp.is_online ? 'Online' : 'Offline'}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Refugi - Sistema de Gestión de Bienestar Laboral</Text>
          <Text>Página 1 de 1</Text>
        </View>
      </Page>
    </Document>
  );
}
