import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 9, fontFamily: 'Helvetica' },
  coverPage: { padding: 40, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100%' },
  coverTitle: { fontSize: 32, fontWeight: 'bold', marginBottom: 20, color: '#1a1a1a' },
  coverSubtitle: { fontSize: 16, color: '#666', marginBottom: 10 },
  coverInfo: { fontSize: 12, color: '#999', marginTop: 40 },
  header: { marginBottom: 15, borderBottom: '2px solid #2563eb', paddingBottom: 8 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#2563eb' },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 8, marginTop: 12, color: '#1a1a1a', backgroundColor: '#f0f9ff', padding: 6, borderLeft: '3px solid #2563eb' },
  subsectionTitle: { fontSize: 11, fontWeight: 'bold', marginTop: 10, marginBottom: 5, color: '#333' },
  text: { fontSize: 9, marginBottom: 3, lineHeight: 1.4 },
  boldText: { fontWeight: 'bold' },
  kpiGrid: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  kpiCard: { width: '23%', padding: 8, backgroundColor: '#f8fafc', borderRadius: 4, borderLeft: '3px solid #2563eb' },
  kpiLabel: { fontSize: 8, color: '#64748b', marginBottom: 3 },
  kpiValue: { fontSize: 14, fontWeight: 'bold', color: '#1a1a1a' },
  kpiTrend: { fontSize: 7, color: '#64748b', marginTop: 2 },
  table: { marginTop: 5, marginBottom: 10 },
  tableRow: { flexDirection: 'row', borderBottom: '1px solid #e2e8f0', paddingVertical: 4 },
  tableRowZebra: { backgroundColor: '#f8fafc' },
  tableHeader: { backgroundColor: '#2563eb', color: '#fff', fontWeight: 'bold', borderBottom: '2px solid #1e40af' },
  tableCell: { padding: 3, fontSize: 8 },
  alertBox: { backgroundColor: '#fee2e2', padding: 8, borderRadius: 4, marginBottom: 8, borderLeft: '3px solid #ef4444' },
  warningBox: { backgroundColor: '#fef3c7', padding: 8, borderRadius: 4, marginBottom: 8, borderLeft: '3px solid #f59e0b' },
  infoBox: { backgroundColor: '#dbeafe', padding: 8, borderRadius: 4, marginBottom: 8, borderLeft: '3px solid #3b82f6' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, paddingVertical: 3, borderBottom: '1px solid #f1f5f9' },
  employeeProfile: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 4, marginBottom: 8, borderLeft: '3px solid #64748b' },
  timeline: { marginLeft: 10, borderLeft: '2px solid #e2e8f0', paddingLeft: 10 },
  timelineItem: { marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #f1f5f9' },
  footer: { position: 'absolute', bottom: 20, left: 30, right: 30, textAlign: 'center', color: '#94a3b8', fontSize: 7, borderTop: '1px solid #e2e8f0', paddingTop: 5, flexDirection: 'row', justifyContent: 'space-between' },
  pageNumber: { textAlign: 'right' },
});

interface ReportData {
  metadata: { period: { start: string; end: string }; generated_at: string; generated_by: string; total_employees: number };
  kpis: any; statistics: any; incidents: any[]; emergencyAlerts: any[]; riskScores: any[];
  allRiskScores: any[]; moodCheckins: any[]; trainingCompletions: any[]; cases: any[];
  psychReferrals: any[]; hrisData: any[]; employeeProfiles: any[]; timeline: any[];
}

const getRiskLevel = (score: number) => score >= 70 ? 'ALTO' : score >= 40 ? 'MEDIO' : 'BAJO';

export function ReportPDFDocument({ data }: { data: ReportData }) {
  return (
    <Document>
      <Page size="A4" style={styles.coverPage}>
        <Text style={styles.coverTitle}>REPORTE REFUGI COMPLETO</Text>
        <View style={{ marginTop: 40 }}>
          <Text style={styles.coverSubtitle}>Periodo: {format(new Date(data.metadata.period.start), 'dd MMM yyyy', { locale: es })} - {format(new Date(data.metadata.period.end), 'dd MMM yyyy', { locale: es })}</Text>
        </View>
        <View style={{ marginTop: 30 }}>
          <Text style={styles.coverInfo}>Generado: {format(new Date(data.metadata.generated_at), 'dd/MM/yyyy HH:mm')}</Text>
          <Text style={styles.coverInfo}>Por: {data.metadata.generated_by}</Text>
          <Text style={styles.coverInfo}>Total Empleadas: {data.metadata.total_employees}</Text>
        </View>
      </Page>

      {/* Resumen Ejecutivo */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}><Text style={styles.title}>1. Resumen Ejecutivo</Text></View>
        <Text style={styles.sectionTitle}>📊 Indicadores Principales</Text>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}><Text style={styles.kpiLabel}>Riesgo Promedio</Text><Text style={styles.kpiValue}>{data.statistics.risk.avg_score.toFixed(1)}</Text></View>
          <View style={styles.kpiCard}><Text style={styles.kpiLabel}>Incidentes</Text><Text style={styles.kpiValue}>{data.statistics.incidents.total}</Text></View>
          <View style={styles.kpiCard}><Text style={styles.kpiLabel}>Ánimo</Text><Text style={styles.kpiValue}>{data.statistics.mood.avg_level !== null ? data.statistics.mood.avg_level.toFixed(1) : 'Sin datos'}</Text></View>
          <View style={styles.kpiCard}><Text style={styles.kpiLabel}>Formación</Text><Text style={styles.kpiValue}>{((data.statistics.training.employees_100_percent / data.metadata.total_employees) * 100).toFixed(0)}%</Text></View>
        </View>
        {data.statistics.risk.high_risk > 0 && <View style={styles.alertBox}><Text style={[styles.text, styles.boldText]}>⚠️ {data.statistics.risk.high_risk} empleadas en riesgo alto</Text></View>}
        <View style={styles.footer}><Text>Refugi</Text><Text>Pág. 1/8</Text></View>
      </Page>

      {/* Más páginas con datos completos */}
    </Document>
  );
}
