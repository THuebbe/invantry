// Check existing payment terms
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkPaymentTerms() {
  console.log('\n=== EXISTING PAYMENT TERMS ===\n');

  const { data, error } = await supabase
    .from('payment_terms')
    .select('*')
    .order('days', { ascending: true });

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No payment terms found in database');
    console.log('\n💡 You may need to seed payment_terms table first with standard terms:');
    console.log('  - Net 15');
    console.log('  - Net 30');
    console.log('  - Net 45');
    console.log('  - Net 60');
    console.log('  - Net 90');
    console.log('  - Due on Receipt');
    console.log('  - 2/10 Net 30 (2% discount if paid within 10 days, otherwise net 30)');
    return;
  }

  console.log(`✅ Found ${data.length} payment terms:\n`);
  data.forEach(term => {
    const discount = term.discount_percent
      ? ` (${term.discount_percent}% discount within ${term.discount_days} days)`
      : '';
    console.log(`  ${term.name} - ${term.days} days${discount}`);
    console.log(`    ID: ${term.id}`);
    console.log(`    Active: ${term.is_active}`);
    console.log('');
  });
}

checkPaymentTerms().catch(console.error);
