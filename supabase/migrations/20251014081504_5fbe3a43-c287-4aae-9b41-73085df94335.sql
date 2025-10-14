-- Activar feature flags para KPIs y Cola de Atención
UPDATE feature_flags 
SET is_enabled = true, updated_at = now() 
WHERE flag_name IN ('ff_refugi_kpis', 'ff_refugi_queue');