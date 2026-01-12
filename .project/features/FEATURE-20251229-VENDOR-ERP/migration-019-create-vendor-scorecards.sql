-- Migration 019: Create vendor_scorecards table
-- Feature: FEATURE-20251229-VENDOR-ERP
-- Description: Performance tracking and metrics over time periods
-- Created: 2025-12-29
-- Phase: 2 - Multi-Tenancy & ERP Fields

-- Create vendor_scorecards table
CREATE TABLE IF NOT EXISTS vendor_scorecards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL CHECK (metric_name IN (
        'on_time_delivery_pct',
        'order_accuracy_pct',
        'fill_rate_pct',
        'product_quality_score',
        'responsiveness_score',
        'pricing_competitiveness_score',
        'invoice_accuracy_pct',
        'lead_time_adherence_pct',
        'damage_rate_pct',
        'return_rate_pct',
        'overall_satisfaction_score'
    )),
    metric_value NUMERIC(10,2),
    score INTEGER CHECK (score >= 0 AND score <= 100),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    calculation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_points_count INTEGER DEFAULT 0 CHECK (data_points_count >= 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add check constraint for period dates
ALTER TABLE vendor_scorecards
ADD CONSTRAINT chk_vendor_scorecards_period
CHECK (period_end >= period_start);

-- Add unique constraint to prevent duplicate metric entries for same period
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_scorecards_unique_metric_period
ON vendor_scorecards(vendor_id, metric_name, period_start, period_end);

-- Add index for vendor lookups (multi-tenancy enforcement)
CREATE INDEX IF NOT EXISTS idx_vendor_scorecards_vendor_restaurant
ON vendor_scorecards(vendor_id, restaurant_id);

-- Add index for restaurant lookups
CREATE INDEX IF NOT EXISTS idx_vendor_scorecards_restaurant
ON vendor_scorecards(restaurant_id);

-- Add index for metric history queries
CREATE INDEX IF NOT EXISTS idx_vendor_scorecards_metric_history
ON vendor_scorecards(vendor_id, metric_name, period_start DESC);

-- Add index for time-based queries
CREATE INDEX IF NOT EXISTS idx_vendor_scorecards_period
ON vendor_scorecards(vendor_id, period_start, period_end);

-- Add index for finding latest metrics
CREATE INDEX IF NOT EXISTS idx_vendor_scorecards_latest
ON vendor_scorecards(vendor_id, metric_name, calculation_date DESC);

-- Add comments for documentation
COMMENT ON TABLE vendor_scorecards IS 'Performance metrics and scorecards for vendor evaluation over time periods';
COMMENT ON COLUMN vendor_scorecards.id IS 'Unique scorecard entry identifier (UUID)';
COMMENT ON COLUMN vendor_scorecards.vendor_id IS 'Reference to vendor being evaluated';
COMMENT ON COLUMN vendor_scorecards.restaurant_id IS 'Restaurant that owns this vendor relationship (multi-tenancy)';
COMMENT ON COLUMN vendor_scorecards.metric_name IS 'Name of the metric being tracked (e.g., on_time_delivery_pct, order_accuracy_pct)';
COMMENT ON COLUMN vendor_scorecards.metric_value IS 'Raw metric value (e.g., 95.5 for 95.5% on-time delivery)';
COMMENT ON COLUMN vendor_scorecards.score IS 'Normalized score from 0-100 for comparison across metrics';
COMMENT ON COLUMN vendor_scorecards.period_start IS 'Start date of measurement period (e.g., first day of month)';
COMMENT ON COLUMN vendor_scorecards.period_end IS 'End date of measurement period (e.g., last day of month)';
COMMENT ON COLUMN vendor_scorecards.calculation_date IS 'When this metric was calculated (for audit trail)';
COMMENT ON COLUMN vendor_scorecards.data_points_count IS 'Number of data points used in calculation (e.g., number of POs evaluated)';
COMMENT ON COLUMN vendor_scorecards.notes IS 'Additional context or explanations for the metric';

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vendor_scorecards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_vendor_scorecards_updated_at ON vendor_scorecards;
CREATE TRIGGER trigger_vendor_scorecards_updated_at
    BEFORE UPDATE ON vendor_scorecards
    FOR EACH ROW
    EXECUTE FUNCTION update_vendor_scorecards_updated_at();

-- Migration validation queries:
-- Verify table exists
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'vendor_scorecards';

-- Verify columns
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'vendor_scorecards'
-- ORDER BY ordinal_position;

-- Verify indexes
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'vendor_scorecards';

-- Verify unique constraint on metric+period
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'vendor_scorecards'
-- AND indexname = 'idx_vendor_scorecards_unique_metric_period';

-- Verify triggers exist
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE event_object_table = 'vendor_scorecards';

-- Verify check constraints
-- SELECT constraint_name, constraint_type
-- FROM information_schema.table_constraints
-- WHERE table_name = 'vendor_scorecards'
-- AND constraint_type = 'CHECK';

-- Example calculation queries for future reference:

-- Calculate on-time delivery percentage for a vendor in a period
-- WITH delivery_stats AS (
--     SELECT
--         vendor_id,
--         COUNT(*) as total_deliveries,
--         SUM(CASE WHEN actual_delivery_date <= expected_delivery_date THEN 1 ELSE 0 END) as on_time_count
--     FROM purchase_orders
--     WHERE vendor_id = '<vendor_uuid>'
--     AND status = 'completed'
--     AND received_date BETWEEN '<period_start>' AND '<period_end>'
--     GROUP BY vendor_id
-- )
-- INSERT INTO vendor_scorecards (
--     vendor_id, restaurant_id, metric_name, metric_value, score,
--     period_start, period_end, data_points_count
-- )
-- SELECT
--     vendor_id,
--     '<restaurant_uuid>',
--     'on_time_delivery_pct',
--     ROUND((on_time_count::NUMERIC / total_deliveries * 100), 2),
--     ROUND((on_time_count::NUMERIC / total_deliveries * 100))::INTEGER,
--     '<period_start>',
--     '<period_end>',
--     total_deliveries
-- FROM delivery_stats;

-- Calculate order accuracy percentage (fill rate)
-- WITH accuracy_stats AS (
--     SELECT
--         po.vendor_id,
--         COUNT(DISTINCT po.id) as total_orders,
--         SUM(CASE WHEN poi.quantity_received >= poi.quantity_ordered THEN 1 ELSE 0 END) as accurate_items,
--         COUNT(poi.id) as total_items
--     FROM purchase_orders po
--     JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
--     WHERE po.vendor_id = '<vendor_uuid>'
--     AND po.status = 'completed'
--     AND po.received_date BETWEEN '<period_start>' AND '<period_end>'
--     GROUP BY po.vendor_id
-- )
-- INSERT INTO vendor_scorecards (
--     vendor_id, restaurant_id, metric_name, metric_value, score,
--     period_start, period_end, data_points_count
-- )
-- SELECT
--     vendor_id,
--     '<restaurant_uuid>',
--     'order_accuracy_pct',
--     ROUND((accurate_items::NUMERIC / total_items * 100), 2),
--     ROUND((accurate_items::NUMERIC / total_items * 100))::INTEGER,
--     '<period_start>',
--     '<period_end>',
--     total_orders
-- FROM accuracy_stats;

-- Test query: Get all metrics for a vendor in the latest period
-- SELECT
--     vs.metric_name,
--     vs.metric_value,
--     vs.score,
--     vs.period_start,
--     vs.period_end,
--     vs.data_points_count,
--     vs.calculation_date
-- FROM vendor_scorecards vs
-- WHERE vs.vendor_id = '<vendor_uuid>'
-- AND vs.restaurant_id = '<restaurant_uuid>'
-- AND vs.period_start = (
--     SELECT MAX(period_start)
--     FROM vendor_scorecards
--     WHERE vendor_id = '<vendor_uuid>'
-- )
-- ORDER BY vs.metric_name;

-- Test query: Get metric history over time for a specific metric
-- SELECT
--     vs.period_start,
--     vs.period_end,
--     vs.metric_value,
--     vs.score,
--     vs.data_points_count
-- FROM vendor_scorecards vs
-- WHERE vs.vendor_id = '<vendor_uuid>'
-- AND vs.restaurant_id = '<restaurant_uuid>'
-- AND vs.metric_name = 'on_time_delivery_pct'
-- ORDER BY vs.period_start DESC
-- LIMIT 12; -- Last 12 periods (e.g., months)

-- Test query: Compare vendors by average score across all metrics
-- SELECT
--     v.name as vendor_name,
--     AVG(vs.score) as avg_score,
--     COUNT(DISTINCT vs.metric_name) as metrics_tracked,
--     MIN(vs.period_start) as first_period,
--     MAX(vs.period_end) as last_period
-- FROM vendors v
-- JOIN vendor_scorecards vs ON v.id = vs.vendor_id
-- WHERE v.restaurant_id = '<restaurant_uuid>'
-- AND vs.period_start >= CURRENT_DATE - INTERVAL '6 months'
-- GROUP BY v.id, v.name
-- ORDER BY avg_score DESC;

-- Test query: Get vendor performance summary for dashboard
-- SELECT
--     v.name as vendor_name,
--     MAX(CASE WHEN vs.metric_name = 'on_time_delivery_pct' THEN vs.score END) as delivery_score,
--     MAX(CASE WHEN vs.metric_name = 'order_accuracy_pct' THEN vs.score END) as accuracy_score,
--     MAX(CASE WHEN vs.metric_name = 'fill_rate_pct' THEN vs.score END) as fill_rate_score,
--     MAX(CASE WHEN vs.metric_name = 'overall_satisfaction_score' THEN vs.score END) as satisfaction_score
-- FROM vendors v
-- LEFT JOIN vendor_scorecards vs ON v.id = vs.vendor_id
--     AND vs.period_start = (
--         SELECT MAX(period_start)
--         FROM vendor_scorecards
--         WHERE vendor_id = v.id
--     )
-- WHERE v.restaurant_id = '<restaurant_uuid>'
-- AND v.is_active = true
-- GROUP BY v.id, v.name
-- ORDER BY v.name;
