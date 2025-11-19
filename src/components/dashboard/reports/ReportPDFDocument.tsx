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
  successBox: { backgroundColor: '#dcfce7', padding: 8, borderRadius: 4, marginBottom: 8, borderLeft: '3px solid #22c55e' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, paddingVertical: 3, borderBottom: '1px solid #f1f5f9' },
  employeeProfile: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 4, marginBottom: 8, borderLeft: '3px solid #64748b' },
  timeline: { marginLeft: 10, borderLeft: '2px solid #e2e8f0', paddingLeft: 10 },
  timelineItem: { marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #f1f5f9' },
  footer: { position: 'absolute', bottom: 20, left: 30, right: 30, textAlign: 'center', color: '#94a3b8', fontSize: 7, borderTop: '1px solid #e2e8f0', paddingTop: 5, flexDirection: 'row', justifyContent: 'space-between' },
  pageNumber: { textAlign: 'right' },
  progressBar: { flexDirection: 'row', fontSize: 10, fontFamily: 'Courier' },
  chip: { fontSize: 7, backgroundColor: '#e0e7ff', color: '#3730a3', padding: 2, borderRadius: 2, marginRight: 4 },
  emptyState: { textAlign: 'center', color: '#94a3b8', fontSize: 10, marginTop: 20, fontStyle: 'italic' },
});

interface ReportData {
  metadata: { period: { start: string; end: string }; generated_at: string; generated_by: string; total_employees: number };
  kpis: any; statistics: any; incidents: any[]; emergencyAlerts: any[]; riskScores: any[];
  allRiskScores: any[]; moodCheckins: any[]; trainingCompletions: any[]; cases: any[];
  psychReferrals: any[]; hrisData: any[]; employeeProfiles: any[]; timeline: any[];
}

const getRiskLevel = (score: number) => score >= 70 ? 'ALTO' : score >= 40 ? 'MEDIO' : 'BAJO';
const getRiskColor = (score: number) => score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#22c55e';

const createProgressBar = (percentage: number, maxWidth: number = 20) => {
  const filled = Math.round((percentage / 100) * maxWidth);
  return '█'.repeat(filled) + '░'.repeat(maxWidth - filled);
};

export function ReportPDFDocument({ data }: { data: ReportData }) {
  const totalPages = 10;
  
  return (
    <Document>
      {/* PORTADA */}
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

      {/* PÁGINA 1: RESUMEN EJECUTIVO */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}><Text style={styles.title}>1. Resumen Ejecutivo</Text></View>
        
        <Text style={styles.sectionTitle}>📊 Indicadores Principales</Text>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Riesgo Promedio</Text>
            <Text style={[styles.kpiValue, { color: getRiskColor(data.statistics.risk.avg_score) }]}>
              {data.statistics.risk.avg_score.toFixed(1)}
            </Text>
            <Text style={styles.kpiTrend}>{getRiskLevel(data.statistics.risk.avg_score)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Incidentes</Text>
            <Text style={styles.kpiValue}>{data.statistics.incidents.total}</Text>
            <Text style={styles.kpiTrend}>{data.statistics.incidents.sla_breached} SLA breach</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Ánimo Promedio</Text>
            <Text style={styles.kpiValue}>
              {data.statistics.mood.avg_level !== null ? data.statistics.mood.avg_level.toFixed(1) : 'N/A'}
            </Text>
            <Text style={styles.kpiTrend}>{data.statistics.mood.total_checkins} check-ins</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Formación 100%</Text>
            <Text style={styles.kpiValue}>
              {data.metadata.total_employees > 0 
                ? ((data.statistics.training.employees_100_percent / data.metadata.total_employees) * 100).toFixed(0) 
                : 0}%
            </Text>
            <Text style={styles.kpiTrend}>{data.statistics.training.employees_100_percent} empleadas</Text>
          </View>
        </View>

        {data.statistics.risk.high_risk > 0 && (
          <View style={styles.alertBox}>
            <Text style={[styles.text, styles.boldText]}>⚠️ ATENCIÓN: {data.statistics.risk.high_risk} empleadas en riesgo ALTO</Text>
            <Text style={styles.text}>Se recomienda revisión inmediata y seguimiento personalizado</Text>
          </View>
        )}

        {data.statistics.incidents.sla_breached > 0 && (
          <View style={styles.warningBox}>
            <Text style={[styles.text, styles.boldText]}>⏰ {data.statistics.incidents.sla_breached} incidentes con SLA incumplido</Text>
          </View>
        )}

        <Text style={styles.subsectionTitle}>Distribución de Riesgo</Text>
        <View style={styles.statRow}>
          <Text style={styles.text}>Alto (≥70):</Text>
          <Text style={styles.text}>{data.statistics.risk.high_risk} ({data.metadata.total_employees > 0 ? ((data.statistics.risk.high_risk / data.metadata.total_employees) * 100).toFixed(1) : 0}%)</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.text}>Medio (40-69):</Text>
          <Text style={styles.text}>{data.statistics.risk.medium_risk} ({data.metadata.total_employees > 0 ? ((data.statistics.risk.medium_risk / data.metadata.total_employees) * 100).toFixed(1) : 0}%)</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.text}>Bajo (&lt;40):</Text>
          <Text style={styles.text}>{data.statistics.risk.low_risk} ({data.metadata.total_employees > 0 ? ((data.statistics.risk.low_risk / data.metadata.total_employees) * 100).toFixed(1) : 0}%)</Text>
        </View>

        <View style={styles.footer}>
          <Text>Refugi - Reporte Confidencial</Text>
          <Text>Pág. 1/{totalPages}</Text>
        </View>
      </Page>

      {/* PÁGINA 2: ANÁLISIS DE INCIDENTES */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}><Text style={styles.title}>2. Análisis de Incidentes</Text></View>

        <Text style={styles.sectionTitle}>📋 Resumen de Incidentes</Text>
        <View style={styles.infoBox}>
          <View style={styles.statRow}>
            <Text style={styles.text}>Total Incidentes:</Text>
            <Text style={[styles.text, styles.boldText]}>{data.statistics.incidents.total}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.text}>Tiempo Promedio Resolución:</Text>
            <Text style={[styles.text, styles.boldText]}>{data.statistics.incidents.avg_resolution_time.toFixed(0)} minutos</Text>
          </View>
        </View>

        {data.incidents.length > 0 ? (
          <>
            <Text style={styles.subsectionTitle}>Distribución por Tipo</Text>
            {Object.entries(data.statistics.incidents.by_type).map(([type, count]) => {
              const numCount = Number(count);
              const percentage = (numCount / data.statistics.incidents.total) * 100;
              return (
                <View key={type} style={styles.statRow}>
                  <Text style={styles.text}>{type}:</Text>
                  <Text style={styles.text}>{createProgressBar(percentage, 15)} {numCount} ({percentage.toFixed(0)}%)</Text>
                </View>
              );
            })}

            <Text style={styles.subsectionTitle}>Estado de Incidentes</Text>
            {Object.entries(data.statistics.incidents.by_status).map(([status, count]) => {
              const numCount = Number(count);
              return (
                <View key={status} style={styles.statRow}>
                  <Text style={styles.text}>{status}:</Text>
                  <Text style={[styles.text, styles.boldText]}>{numCount}</Text>
                </View>
              );
            })}

            <Text style={styles.subsectionTitle}>Incidentes Detallados (Últimos 20)</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, { width: '25%' }]}>Empleada</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>Tipo</Text>
                <Text style={[styles.tableCell, { width: '15%' }]}>Estado</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>Fecha</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>Resolución</Text>
              </View>
              {data.incidents.slice(0, 20).map((inc, idx) => (
                <View key={inc.id} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowZebra : {}]}>
                  <Text style={[styles.tableCell, { width: '25%' }]}>{inc.employee_name}</Text>
                  <Text style={[styles.tableCell, { width: '20%' }]}>{inc.type}</Text>
                  <Text style={[styles.tableCell, { width: '15%' }]}>{inc.status}</Text>
                  <Text style={[styles.tableCell, { width: '20%' }]}>{format(new Date(inc.opened_at), 'dd/MM HH:mm')}</Text>
                  <Text style={[styles.tableCell, { width: '20%' }]}>
                    {inc.resolution_time_mins ? `${inc.resolution_time_mins}m` : '-'}
                    {inc.sla_breached && ' ⚠️'}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.emptyState}>Sin incidentes registrados en este periodo</Text>
        )}

        <View style={styles.footer}>
          <Text>Refugi - Reporte Confidencial</Text>
          <Text>Pág. 2/{totalPages}</Text>
        </View>
      </Page>

      {/* PÁGINA 3: ANÁLISIS DE RIESGO */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}><Text style={styles.title}>3. Análisis de Riesgo</Text></View>

        <Text style={styles.sectionTitle}>⚠️ Distribución de Riesgo</Text>
        <View style={{ marginBottom: 10 }}>
          <View style={styles.statRow}>
            <Text style={styles.text}>Alto (≥70):</Text>
            <Text style={[styles.text, { color: '#ef4444' }]}>
              {createProgressBar((data.statistics.risk.high_risk / data.metadata.total_employees) * 100)} {data.statistics.risk.high_risk}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.text}>Medio (40-69):</Text>
            <Text style={[styles.text, { color: '#f59e0b' }]}>
              {createProgressBar((data.statistics.risk.medium_risk / data.metadata.total_employees) * 100)} {data.statistics.risk.medium_risk}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.text}>Bajo (&lt;40):</Text>
            <Text style={[styles.text, { color: '#22c55e' }]}>
              {createProgressBar((data.statistics.risk.low_risk / data.metadata.total_employees) * 100)} {data.statistics.risk.low_risk}
            </Text>
          </View>
        </View>

        {data.riskScores.length > 0 ? (
          <>
            <Text style={styles.subsectionTitle}>Top 15 Empleadas por Riesgo</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, { width: '35%' }]}>Empleada</Text>
                <Text style={[styles.tableCell, { width: '15%' }]}>Score</Text>
                <Text style={[styles.tableCell, { width: '15%' }]}>Nivel</Text>
                <Text style={[styles.tableCell, { width: '35%' }]}>Factores</Text>
              </View>
              {data.riskScores
                .sort((a, b) => b.score - a.score)
                .slice(0, 15)
                .map((rs, idx) => (
                  <View key={`${rs.employee_id}-${idx}`} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowZebra : {}]}>
                    <Text style={[styles.tableCell, { width: '35%' }]}>{rs.employee_name}</Text>
                    <Text style={[styles.tableCell, { width: '15%', color: getRiskColor(rs.score), fontWeight: 'bold' }]}>
                      {rs.score}
                    </Text>
                    <Text style={[styles.tableCell, { width: '15%' }]}>{getRiskLevel(rs.score)}</Text>
                    <Text style={[styles.tableCell, { width: '35%', fontSize: 7 }]}>
                      {rs.chips.slice(0, 3).join(', ') || 'Normal'}
                    </Text>
                  </View>
                ))}
            </View>
          </>
        ) : (
          <Text style={styles.emptyState}>Sin datos de riesgo disponibles</Text>
        )}

        <View style={styles.footer}>
          <Text>Refugi - Reporte Confidencial</Text>
          <Text>Pág. 3/{totalPages}</Text>
        </View>
      </Page>

      {/* PÁGINA 4: ESTADO ANÍMICO */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}><Text style={styles.title}>4. Estado Anímico (Mood Check-ins)</Text></View>

        <Text style={styles.sectionTitle}>😊 Resumen de Ánimo</Text>
        <View style={styles.infoBox}>
          <View style={styles.statRow}>
            <Text style={styles.text}>Total Check-ins:</Text>
            <Text style={[styles.text, styles.boldText]}>{data.statistics.mood.total_checkins}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.text}>Nivel Promedio:</Text>
            <Text style={[styles.text, styles.boldText]}>
              {data.statistics.mood.avg_level !== null ? data.statistics.mood.avg_level.toFixed(2) : 'N/A'} / 5
            </Text>
          </View>
        </View>

        {data.moodCheckins.length > 0 ? (
          <>
            <Text style={styles.subsectionTitle}>Distribución por Nivel</Text>
            {[5, 4, 3, 2, 1].map(level => {
              const count = data.statistics.mood.by_level[level] || 0;
              const percentage = data.statistics.mood.total_checkins > 0 
                ? (count / data.statistics.mood.total_checkins) * 100 
                : 0;
              const emoji = level >= 4 ? '😊' : level === 3 ? '😐' : '😔';
              
              return (
                <View key={level} style={styles.statRow}>
                  <Text style={styles.text}>{emoji} Nivel {level}:</Text>
                  <Text style={styles.text}>
                    {createProgressBar(percentage, 15)} {count} ({percentage.toFixed(0)}%)
                  </Text>
                </View>
              );
            })}

            <Text style={styles.subsectionTitle}>Check-ins Recientes (Últimos 25)</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, { width: '30%' }]}>Empleada</Text>
                <Text style={[styles.tableCell, { width: '15%' }]}>Nivel</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>Fecha</Text>
                <Text style={[styles.tableCell, { width: '35%' }]}>Notas</Text>
              </View>
              {data.moodCheckins.slice(0, 25).map((mc, idx) => (
                <View key={`${mc.employee_id}-${idx}`} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowZebra : {}]}>
                  <Text style={[styles.tableCell, { width: '30%' }]}>
                    {mc.is_anonymous ? '(Anónimo)' : mc.employee_name}
                  </Text>
                  <Text style={[styles.tableCell, { width: '15%', fontWeight: 'bold' }]}>{mc.mood_level}/5</Text>
                  <Text style={[styles.tableCell, { width: '20%' }]}>{format(new Date(mc.created_at), 'dd/MM HH:mm')}</Text>
                  <Text style={[styles.tableCell, { width: '35%', fontSize: 7 }]}>
                    {mc.notes?.substring(0, 30) || '-'}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.emptyState}>Sin check-ins de ánimo en este periodo</Text>
        )}

        <View style={styles.footer}>
          <Text>Refugi - Reporte Confidencial</Text>
          <Text>Pág. 4/{totalPages}</Text>
        </View>
      </Page>

      {/* PÁGINA 5: FORMACIÓN Y CAPACITACIÓN */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}><Text style={styles.title}>5. Formación y Capacitación</Text></View>

        <Text style={styles.sectionTitle}>🎓 Resumen de Formación</Text>
        <View style={styles.successBox}>
          <View style={styles.statRow}>
            <Text style={styles.text}>Total Completaciones:</Text>
            <Text style={[styles.text, styles.boldText]}>{data.statistics.training.total_completions}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.text}>Empleadas con 100%:</Text>
            <Text style={[styles.text, styles.boldText]}>
              {data.statistics.training.employees_100_percent} ({data.metadata.total_employees > 0 ? ((data.statistics.training.employees_100_percent / data.metadata.total_employees) * 100).toFixed(0) : 0}%)
            </Text>
          </View>
        </View>

        {data.trainingCompletions.length > 0 ? (
          <>
            <Text style={styles.subsectionTitle}>Completaciones por Curso</Text>
            {Object.entries(data.statistics.training.by_course).map(([course, count]) => {
              const numCount = Number(count);
              const percentage = (numCount / data.metadata.total_employees) * 100;
              return (
                <View key={course} style={styles.statRow}>
                  <Text style={styles.text}>{course}:</Text>
                  <Text style={styles.text}>
                    {createProgressBar(percentage, 12)} {numCount} ({percentage.toFixed(0)}%)
                  </Text>
                </View>
              );
            })}

            <Text style={styles.subsectionTitle}>Completaciones Recientes (Últimas 30)</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, { width: '40%' }]}>Empleada</Text>
                <Text style={[styles.tableCell, { width: '30%' }]}>Curso</Text>
                <Text style={[styles.tableCell, { width: '30%' }]}>Fecha Completado</Text>
              </View>
              {data.trainingCompletions.slice(0, 30).map((tc, idx) => (
                <View key={`${tc.employee_id}-${tc.course_code}-${idx}`} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowZebra : {}]}>
                  <Text style={[styles.tableCell, { width: '40%' }]}>{tc.employee_name}</Text>
                  <Text style={[styles.tableCell, { width: '30%' }]}>{tc.course_code}</Text>
                  <Text style={[styles.tableCell, { width: '30%' }]}>
                    {tc.completed_at ? format(new Date(tc.completed_at), 'dd/MM/yyyy') : '-'}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.emptyState}>Sin completaciones de formación en este periodo</Text>
        )}

        <View style={styles.footer}>
          <Text>Refugi - Reporte Confidencial</Text>
          <Text>Pág. 5/{totalPages}</Text>
        </View>
      </Page>

      {/* PÁGINA 6: CASOS Y REFERENCIAS PSICOLÓGICAS */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}><Text style={styles.title}>6. Casos y Referencias Psicológicas</Text></View>

        <Text style={styles.sectionTitle}>📁 Casos</Text>
        <View style={styles.infoBox}>
          <View style={styles.statRow}>
            <Text style={styles.text}>Total Casos:</Text>
            <Text style={[styles.text, styles.boldText]}>{data.statistics.cases.total}</Text>
          </View>
        </View>

        {data.cases.length > 0 ? (
          <>
            <Text style={styles.subsectionTitle}>Distribución por Estado</Text>
            {Object.entries(data.statistics.cases.by_state).map(([state, count]) => {
              const numCount = Number(count);
              return (
                <View key={state} style={styles.statRow}>
                  <Text style={styles.text}>{state}:</Text>
                  <Text style={[styles.text, styles.boldText]}>{numCount}</Text>
                </View>
              );
            })}

            <Text style={styles.subsectionTitle}>Casos Detallados</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, { width: '30%' }]}>Empleada</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>Estado</Text>
                <Text style={[styles.tableCell, { width: '25%' }]}>Responsable</Text>
                <Text style={[styles.tableCell, { width: '25%' }]}>Creado</Text>
              </View>
              {data.cases.map((c, idx) => (
                <View key={c.id} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowZebra : {}]}>
                  <Text style={[styles.tableCell, { width: '30%' }]}>{c.employee_name}</Text>
                  <Text style={[styles.tableCell, { width: '20%' }]}>{c.state}</Text>
                  <Text style={[styles.tableCell, { width: '25%', fontSize: 7 }]}>{c.owner_name}</Text>
                  <Text style={[styles.tableCell, { width: '25%' }]}>{format(new Date(c.created_at), 'dd/MM/yyyy')}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.emptyState}>Sin casos registrados en este periodo</Text>
        )}

        <Text style={styles.sectionTitle}>🏥 Referencias Psicológicas</Text>
        <View style={styles.infoBox}>
          <View style={styles.statRow}>
            <Text style={styles.text}>Total Referencias:</Text>
            <Text style={[styles.text, styles.boldText]}>{data.statistics.referrals.total}</Text>
          </View>
        </View>

        {data.psychReferrals.length > 0 ? (
          <>
            <Text style={styles.subsectionTitle}>Por Estado</Text>
            {Object.entries(data.statistics.referrals.by_status).map(([status, count]) => {
              const numCount = Number(count);
              return (
                <View key={status} style={styles.statRow}>
                  <Text style={styles.text}>{status}:</Text>
                  <Text style={[styles.text, styles.boldText]}>{numCount}</Text>
                </View>
              );
            })}

            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, { width: '35%' }]}>Empleada</Text>
                <Text style={[styles.tableCell, { width: '25%' }]}>Estado</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>Proveedor</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>Cita</Text>
              </View>
              {data.psychReferrals.map((pr, idx) => (
                <View key={pr.id} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowZebra : {}]}>
                  <Text style={[styles.tableCell, { width: '35%' }]}>{pr.employee_name}</Text>
                  <Text style={[styles.tableCell, { width: '25%' }]}>{pr.status}</Text>
                  <Text style={[styles.tableCell, { width: '20%', fontSize: 7 }]}>{pr.provider_name || '-'}</Text>
                  <Text style={[styles.tableCell, { width: '20%', fontSize: 7 }]}>
                    {pr.appointment_at ? format(new Date(pr.appointment_at), 'dd/MM') : '-'}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.emptyState}>Sin referencias psicológicas en este periodo</Text>
        )}

        <View style={styles.footer}>
          <Text>Refugi - Reporte Confidencial</Text>
          <Text>Pág. 6/{totalPages}</Text>
        </View>
      </Page>

      {/* PÁGINA 7: ALERTAS DE EMERGENCIA */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}><Text style={styles.title}>7. Alertas de Emergencia</Text></View>

        <Text style={styles.sectionTitle}>🚨 Resumen de Alertas</Text>
        <View style={styles.alertBox}>
          <View style={styles.statRow}>
            <Text style={styles.text}>Total Alertas:</Text>
            <Text style={[styles.text, styles.boldText]}>{data.statistics.alerts.total}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.text}>Resueltas:</Text>
            <Text style={[styles.text, styles.boldText]}>{data.statistics.alerts.resolved}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.text}>Pendientes:</Text>
            <Text style={[styles.text, styles.boldText]}>{data.statistics.alerts.pending}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.text}>Tiempo Promedio Resolución:</Text>
            <Text style={[styles.text, styles.boldText]}>{data.statistics.alerts.avg_resolution_time.toFixed(0)} minutos</Text>
          </View>
        </View>

        {data.emergencyAlerts.length > 0 ? (
          <>
            <Text style={styles.subsectionTitle}>Alertas Detalladas</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, { width: '25%' }]}>Empleada</Text>
                <Text style={[styles.tableCell, { width: '15%' }]}>Tipo</Text>
                <Text style={[styles.tableCell, { width: '15%' }]}>Estado</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>Fecha</Text>
                <Text style={[styles.tableCell, { width: '25%' }]}>Resuelto Por</Text>
              </View>
              {data.emergencyAlerts.map((alert, idx) => (
                <View key={alert.id} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowZebra : {}]}>
                  <Text style={[styles.tableCell, { width: '25%' }]}>{alert.employee_name}</Text>
                  <Text style={[styles.tableCell, { width: '15%' }]}>{alert.alert_type}</Text>
                  <Text style={[styles.tableCell, { width: '15%' }]}>
                    {alert.is_resolved ? '✓' : '⏳'}
                  </Text>
                  <Text style={[styles.tableCell, { width: '20%' }]}>{format(new Date(alert.created_at), 'dd/MM HH:mm')}</Text>
                  <Text style={[styles.tableCell, { width: '25%', fontSize: 7 }]}>{alert.resolved_by_name || '-'}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.emptyState}>Sin alertas de emergencia en este periodo</Text>
        )}

        <View style={styles.footer}>
          <Text>Refugi - Reporte Confidencial</Text>
          <Text>Pág. 7/{totalPages}</Text>
        </View>
      </Page>

      {/* PÁGINA 8: PERFILES DE ALTO RIESGO */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}><Text style={styles.title}>8. Perfiles de Empleadas de Alto Riesgo</Text></View>

        <Text style={styles.sectionTitle}>⚠️ Top 10 Empleadas por Riesgo</Text>

        {data.employeeProfiles
          .sort((a, b) => b.risk.current_score - a.risk.current_score)
          .slice(0, 10)
          .map((emp, idx) => (
            <View key={emp.id} style={styles.employeeProfile}>
              <Text style={[styles.text, styles.boldText, { marginBottom: 4 }]}>
                {idx + 1}. {emp.full_name}
              </Text>
              
              <View style={{ flexDirection: 'row', marginBottom: 3 }}>
                <Text style={[styles.text, { width: '30%' }]}>Riesgo:</Text>
                <Text style={[styles.text, styles.boldText, { color: getRiskColor(emp.risk.current_score) }]}>
                  {emp.risk.current_score} - {getRiskLevel(emp.risk.current_score)}
                </Text>
              </View>

              {emp.risk.chips.length > 0 && (
                <View style={{ flexDirection: 'row', marginBottom: 3, flexWrap: 'wrap' }}>
                  <Text style={[styles.text, { width: '30%' }]}>Factores:</Text>
                  <Text style={[styles.text, { width: '70%', fontSize: 7 }]}>
                    {emp.risk.chips.join(', ')}
                  </Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', marginBottom: 3 }}>
                <Text style={[styles.text, { width: '30%' }]}>Ánimo:</Text>
                <Text style={styles.text}>
                  {emp.mood.latest_level ? `${emp.mood.latest_level}/5` : 'Sin datos'} 
                  {emp.mood.total_checkins > 0 && ` (${emp.mood.total_checkins} check-ins)`}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', marginBottom: 3 }}>
                <Text style={[styles.text, { width: '30%' }]}>Actividad:</Text>
                <Text style={styles.text}>
                  {emp.activity.total_alerts} alertas, {emp.activity.total_incidents} incidentes
                  {emp.activity.active_cases > 0 && `, ${emp.activity.active_cases} casos activos`}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', marginBottom: 3 }}>
                <Text style={[styles.text, { width: '30%' }]}>Formación:</Text>
                <Text style={styles.text}>{emp.training.completion_percentage.toFixed(0)}% completado</Text>
              </View>

              {emp.hris && (
                <View style={{ flexDirection: 'row' }}>
                  <Text style={[styles.text, { width: '30%' }]}>HRIS:</Text>
                  <Text style={[styles.text, { fontSize: 7 }]}>
                    {emp.hris.department || 'N/A'} | {emp.hris.location || 'N/A'} | {emp.hris.shift || 'N/A'}
                  </Text>
                </View>
              )}
            </View>
          ))}

        {data.employeeProfiles.length === 0 && (
          <Text style={styles.emptyState}>Sin perfiles de empleadas disponibles</Text>
        )}

        <View style={styles.footer}>
          <Text>Refugi - Reporte Confidencial</Text>
          <Text>Pág. 8/{totalPages}</Text>
        </View>
      </Page>

      {/* PÁGINA 9: DATOS HRIS */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}><Text style={styles.title}>9. Datos HRIS</Text></View>

        <Text style={styles.sectionTitle}>🏢 Información de Recursos Humanos</Text>

        {data.hrisData.length > 0 ? (
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { width: '30%' }]}>Empleada</Text>
              <Text style={[styles.tableCell, { width: '20%' }]}>Departamento</Text>
              <Text style={[styles.tableCell, { width: '20%' }]}>Ubicación</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>Turno</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>Estado</Text>
            </View>
            {data.hrisData.map((hris, idx) => (
              <View key={`${hris.employee_id}-${idx}`} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowZebra : {}]}>
                <Text style={[styles.tableCell, { width: '30%' }]}>{hris.employee_name}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>{hris.department || '-'}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>{hris.location || '-'}</Text>
                <Text style={[styles.tableCell, { width: '15%' }]}>{hris.shift || '-'}</Text>
                <Text style={[styles.tableCell, { width: '15%' }]}>{hris.status || 'active'}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyState}>Sin datos HRIS disponibles</Text>
        )}

        <View style={styles.footer}>
          <Text>Refugi - Reporte Confidencial</Text>
          <Text>Pág. 9/{totalPages}</Text>
        </View>
      </Page>

      {/* PÁGINA 10: TIMELINE DE EVENTOS */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}><Text style={styles.title}>10. Timeline de Eventos Importantes</Text></View>

        <Text style={styles.sectionTitle}>📅 Cronología de Eventos</Text>

        {data.timeline.length > 0 ? (
          <View style={styles.timeline}>
            {data.timeline.slice(0, 40).map((event, idx) => (
              <View key={idx} style={styles.timelineItem}>
                <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                  <Text style={[styles.text, styles.boldText, { width: '25%' }]}>
                    {format(new Date(event.date), 'dd/MM HH:mm')}
                  </Text>
                  <Text style={[styles.text, { width: '20%' }]}>
                    {event.type === 'alert' && '🚨'}
                    {event.type === 'incident' && '📋'}
                    {event.type === 'case' && '📁'}
                    {event.type === 'referral' && '🏥'}
                    {' '}{event.type}
                  </Text>
                  <Text style={[styles.text, { width: '55%', fontSize: 8 }]}>
                    {event.employee}: {event.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyState}>Sin eventos registrados en este periodo</Text>
        )}

        <View style={styles.footer}>
          <Text>Refugi - Reporte Confidencial</Text>
          <Text>Pág. 10/{totalPages}</Text>
        </View>
      </Page>
    </Document>
  );
}
