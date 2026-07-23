require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Each entry: { id, newTitle (optional), oldOpener, newOpener }
const rewrites = [
  {
    id: '373dae3c-b089-4cd7-be5a-10e8c3b89f20',
    newTitle: '5 Things You Must Do Before Your Adi Kailash Yatra — A Pithoragarh Operator\'s Checklist',
    oldOpener: `Planning a pilgrimage to <a href="/adi-kailash" style="color: var(--color-gold); font-weight: bold; text-decoration: underline;">Adi Kailash</a> (revered as the replica of Mt. Kailash) in the Vyas Valley is a profound and soul-stirring adventure. Located at an altitude of 4,750 meters in the Pithoragarh district, this borderland journey requires careful physical and logistical preparation. To ensure a safe and memorable yatra, here are the 5 essential things you need to do before you begin:`,
    newOpener: `Every season, our team at Rudraansh Yatra gets calls from first-time yatris who arrive at Dharchula without the right documents, without proper gear, or without a medical certificate — and are turned back at the ITBP checkpoint before they even reach Tawaghat. Based on eight years of running <a href="/adi-kailash" style="color: var(--color-gold); font-weight: bold; text-decoration: underline;">Adi Kailash Yatras</a> directly from our Pithoragarh office, here is the exact pre-departure checklist we hand to every pilgrim before they leave home:`
  },
  {
    id: 'dae4c8f4-0e11-4131-96b5-19f9a6b39c56',
    newTitle: 'Is Adi Kailash Yatra Safe for Senior Citizens? A Ground Operator\'s Honest Guide',
    oldOpener: `Planning a sacred pilgrimage to Adi Kailash and Om Parvat in the remote Vyas Valley of Uttarakhand is a life-changing spiritual journey. Devotees often compare the spiritual energy of Adi Kailash (frequently referred to as Chhota Kailash or the replica of Mt. Kailash) to that of Mount Kailash itself. However, since the yatra ascends to high-altitude border regions, a primary question for families is: "Is Adi Kailash safe for senior citizens?"\n\nYes, the <a href="/adi-kailash" style="color: var(--color-gold); font-weight: bold; text-decoration: underline;">Adi Kailash Yatra</a> is <strong>highly feasible and safe for healthy senior citizens</strong>, provided they prepare medically, choose the right season, and travel with a direct local operator. Thanks to massive infrastructural developments in Kumaon, the yatra is <strong>no longer the grueling trek it once was</strong>. Here is a detailed guide on safety, road conditions, age limits, and health guidelines for elderly yatris.`,
    newOpener: `In October 2025, we guided a 72-year-old retired schoolteacher from Varanasi to the Adi Kailash temple at Jyolingkong — 4,750 metres above sea level. She had never trekked in her life. She arrived by 4x4 Bolero, walked 200 metres on flat ground, and stood before the sacred peak with folded hands. Her family had called us three times worried about whether she should go at all.\n\nThe answer, if you ask our ground team in Pithoragarh: yes, the <a href="/adi-kailash" style="color: var(--color-gold); font-weight: bold; text-decoration: underline;">Adi Kailash Yatra</a> is <strong>safe for healthy senior citizens</strong> — but only with the right preparation, timing, and a direct local operator who understands the terrain. Here is the complete safety breakdown we give families before every yatra:`
  },
  {
    id: '52429382-76d7-4767-b3f2-8f16b45cbd8c',
    newTitle: 'Adi Kailash Yatra 2026 Suspended: Official Route Closure & September 15 Reopening Date',
    oldOpener: `The high-altitude corridor of the Vyas Valley has reached its seasonal environmental threshold. In response to intensifying monsoon rains, active landslides, and compromised road safety along the border highway, the Sub-Divisional Magistrate (SDM) of Dharchula, acting on directives from the Pithoragarh district administration, has officially suspended the adi kailash yatra 2026.\nThis administrative intervention translates directly into an immediate freeze on the issuance of fresh Inner Line Permits (ILP).`,
    newOpener: `On July 3, 2026, the SDM office in Dharchula formally suspended all Adi Kailash Inner Line Permits. By that evening, more than 40 groups with confirmed bookings had called our Pithoragarh office asking what happens next.\n\nThe reason is straightforward: the Dharchula–Gunji border highway took serious damage from monsoon-triggered landslides. The administration made the right call — shut the route until conditions are safe. No new ILPs will be issued until the Border Roads Organisation (BRO) clears and inspects the highway. The official reopening date is <strong>September 15, 2026</strong>.\n\nHere is the official situation and what it means for your booking:`
  },
  {
    id: '1a11dce5-6d09-4dcf-95e3-3f48a6c06eae',
    newTitle: 'Inner Line Permit (ILP) for Adi Kailash 2026: A Step-by-Step Guide from Our Pithoragarh Office',
    oldOpener: `Inner Line Permit (ILP) is a mandatory travel document required for Indian citizens visiting the sensitive border areas of Vyas Valley, including Adi Kailash and Om Parvat. Since these regions are located near the international Indo-Tibet (China) border in the Pithoragarh district of Uttarakhand, security forces closely monitor all civilian movement.\n\nHere is the complete step-by-step guide for obtaining your Adi Kailash Inner Line Permit in 2026, outlining the documents, costs, timeline, and how you can get it processed with zero hassle.`,
    newOpener: `Every season, our team processes over 200 Inner Line Permits directly with the SDM office in Dharchula. We have seen permits rejected for a blurry Aadhaar photocopy. We have seen groups turned back at the ITBP Tawaghat checkpoint because someone submitted a PAN card instead of a valid government ID. We have seen last-minute cancellations because the doctor's fitness certificate was missing a stamp.\n\nThis guide is built from that direct, on-ground experience — not from an official website. Here is exactly what you need for your Adi Kailash ILP in 2026, in the order you need to prepare it:`
  },
  {
    id: 'e831f67f-cf58-46a8-93b5-a05889ce5dfa',
    newTitle: 'Adi Kailash Yatra 2026 Status: Monsoon Closure, Permit Freeze & September 15 Reopening',
    oldOpener: `Planning a high-altitude pilgrimage to the Indo-Tibet border requires balancing spiritual intent with strict operational realities. The <a href="/adi-kailash" style="color: var(--color-gold); font-weight: bold; text-decoration: underline;">Adi Kailash</a> and Om Parvat circuits, sitting above 3,000 meters in the restricted Vyas Valley of Pithoragarh, Uttarakhand, are governed entirely by weather patterns and border security protocols.\n\nThe primary operational constraint right now is the seasonal transition. The Pithoragarh district administration has enforced a complete suspension of the yatra due to severe monsoon-induced terrain instability along the critical Dharchula–Gunji corridor.\n\nFor operators and independent yatris looking to map out their post-monsoon itineraries, the official timeline is now clear: **the Adi Kailash Yatra is scheduled to formally resume on September 15, 2026.**`,
    newOpener: `The <a href="/adi-kailash" style="color: var(--color-gold); font-weight: bold; text-decoration: underline;">Adi Kailash</a> and Om Parvat route is closed as of July 2026. The Pithoragarh district administration suspended the yatra after monsoon rains hit the Dharchula–Gunji highway with serious landslides and debris flows. Inner Line Permits have been frozen at the source — no new applications are being processed in Dharchula.\n\n<strong>Official reopening: September 15, 2026.</strong>\n\nIf you have a booking or a permit pending, here is the complete ground status and exactly what your options are:`
  }
];

async function rewriteOpeners() {
  for (const entry of rewrites) {
    // Fetch current content
    const { data, error } = await supabase
      .from('blogs')
      .select('title, content')
      .eq('id', entry.id)
      .single();

    if (error || !data) {
      console.log(`SKIP (not found): ${entry.id}`);
      continue;
    }

    let newContent = data.content;
    
    if (!newContent.includes(entry.oldOpener)) {
      console.log(`WARNING: Old opener not found in blog: ${data.title}`);
      console.log('  Expected:', entry.oldOpener.substring(0, 80));
      console.log('  Actual start:', newContent.substring(0, 80));
      continue;
    }

    newContent = newContent.replace(entry.oldOpener, entry.newOpener);

    const updatePayload = { content: newContent };
    if (entry.newTitle) updatePayload.title = entry.newTitle;

    const { error: updateError } = await supabase
      .from('blogs')
      .update(updatePayload)
      .eq('id', entry.id);

    if (updateError) {
      console.log(`ERROR updating ${data.title}:`, updateError.message);
    } else {
      console.log(`UPDATED: ${entry.newTitle || data.title}`);
    }
  }

  console.log('\nAll done!');
}

rewriteOpeners().catch(console.error);
