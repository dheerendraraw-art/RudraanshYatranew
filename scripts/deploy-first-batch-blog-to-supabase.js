// scripts/deploy-first-batch-blog-to-supabase.js
// Inserts or updates the new live ground report blog in Supabase

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ysnzxvvsegmkmkepclti.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SLUG = 'adi-kailash-permits-open-first-batch-completes-yatra-september-2026';
const TITLE = 'Adi Kailash Permits Start Sept 20: 1st Autumn Batch (25 Yatris) Successfully Completes Yatra [Ground Report 2026]';
const META_DESC = 'Live Ground Report: Adi Kailash online permits officially resumed on Sept 20, 2026. Rudraansh Yatra\'s 1st Autumn batch of 25 yatris has safely completed Adi Kailash & Om Parvat darshan. Read road conditions, checkpost updates & booking guide.';
const IMAGE_URL = 'assets/images/om-parvat-group.webp';

async function deploy() {
    console.log('🚀 Checking Supabase for slug:', SLUG);

    const htmlPath = path.join(__dirname, '..', 'blog', `${SLUG}.html`);
    const fullHtml = fs.readFileSync(htmlPath, 'utf8');

    // Extract inside <div class="blog-detail-body">
    const bodyMatch = fullHtml.match(/<div class="blog-detail-body">([\s\S]*?)<\/article>/i);
    const content = bodyMatch ? bodyMatch[1].trim() : fullHtml;

    // Check if record exists
    const { data: existing, error: checkErr } = await supabase
        .from('blogs')
        .select('id, slug, title')
        .eq('slug', SLUG)
        .maybeSingle();

    if (checkErr) {
        console.warn('Check error:', checkErr.message);
    }

    if (existing) {
        console.log(`Updating existing record ID: ${existing.id}`);
        const { data, error } = await supabase
            .from('blogs')
            .update({
                title: TITLE,
                meta_description: META_DESC,
                content: content,
                image_url: IMAGE_URL,
                author: 'Dheerendra Rautela'
            })
            .eq('id', existing.id)
            .select();


        if (error) {
            console.error('Update error:', error.message);
        } else {
            console.log('✅ Successfully updated blog in Supabase:', data[0]?.id);
        }
    } else {
        console.log('Creating new blog record in Supabase...');
        const { data, error } = await supabase
            .from('blogs')
            .insert([{
                title: TITLE,
                slug: SLUG,
                meta_description: META_DESC,
                content: content,
                image_url: IMAGE_URL,
                author: 'Dheerendra Rautela',
                created_at: new Date().toISOString()
            }])
            .select();

        if (error) {
            console.error('Insert error:', error.message);
        } else {
            console.log('✅ Successfully inserted new blog into Supabase! ID:', data[0]?.id);
        }
    }
}

deploy().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
