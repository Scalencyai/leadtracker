const { sql } = require('@vercel/postgres');
const fs = require('fs');
const path = require('path');

async function initAdvancedFeatures() {
  console.log('🚀 Initializing LeadTracker Advanced Features...\n');

  try {
    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'lib', 'db-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split into individual statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Extract table name for logging
      const tableMatch = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
      const indexMatch = statement.match(/CREATE INDEX IF NOT EXISTS (\w+)/i);
      
      if (tableMatch) {
        console.log(`📊 Creating table: ${tableMatch[1]}...`);
      } else if (indexMatch) {
        console.log(`🔍 Creating index: ${indexMatch[1]}...`);
      } else {
        console.log(`⚙️  Executing statement ${i + 1}...`);
      }

      try {
        await sql.query(statement + ';');
        console.log('   ✅ Success\n');
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`);
        // Continue with other statements
      }
    }

    console.log('\n🎉 Advanced features database initialization complete!\n');
    console.log('Features enabled:');
    console.log('  ✅ Session Recording (session_recordings)');
    console.log('  ✅ Conversion Funnels (funnels, funnel_events, funnel_conversions)');
    console.log('  ✅ Click Heatmaps (click_events)');
    console.log('  ✅ Scroll Heatmaps (scroll_events)');
    console.log('  ✅ Page Screenshots (page_screenshots)\n');

    // Create sample funnel
    console.log('📋 Creating sample funnel...');
    try {
      await sql`
        INSERT INTO funnels (name, description, steps, is_active)
        VALUES (
          'Sample Conversion Funnel',
          'Page View → Button Click → Form Submit',
          ${JSON.stringify([
            { name: 'Landing Page', event_type: 'pageview', event_name: '/', match_rule: 'exact' },
            { name: 'CTA Click', event_type: 'click', event_name: 'button#signup', match_rule: 'contains' },
            { name: 'Form Submission', event_type: 'form_submit', event_name: 'signup_form', match_rule: 'exact' }
          ])},
          true
        )
        ON CONFLICT DO NOTHING
      `;
      console.log('   ✅ Sample funnel created\n');
    } catch (error) {
      console.log(`   ℹ️  Sample funnel already exists or error: ${error.message}\n`);
    }

    console.log('🚀 Next Steps:');
    console.log('  1. Install the advanced tracking script on your website');
    console.log('  2. Visit /dashboard/sessions to see session recordings');
    console.log('  3. Visit /dashboard/funnels to create and analyze funnels');
    console.log('  4. Visit /dashboard/heatmaps to view click & scroll heatmaps\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error initializing database:', error);
    process.exit(1);
  }
}

initAdvancedFeatures();
