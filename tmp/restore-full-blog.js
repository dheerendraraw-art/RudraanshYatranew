require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const fullContent = `<h2 dir="ltr" class="text-text-100 mt-3 -mb-1 text-[1.125rem] font-bold" data-sourcepos="8:1-8:16;369-384">Introduction</h2>

<p class="font-claude-response-body break-words whitespace-normal" dir="ltr" data-sourcepos="10:1-10:410;386-795">Every year, hundreds of yatris set out from Pithoragarh toward Jyolingkong, walking the same borderland trails that lead to Adi Kailash — the sacred peak revered by both Hindus and Jains as a mirror image of Mount Kailash in Tibet. It is a journey that tests the body as much as it moves the spirit, with altitudes crossing 4,500 metres, weather that shifts within hours, and terrain that rewards preparation.</p>

<p class="font-claude-response-body break-words whitespace-normal" dir="ltr" data-sourcepos="12:1-12:453;797-1249">At <a href="https://rudraanshyatra.com">Rudraansh Yatra</a>, our guides have walked this route with yatris from every corner of India — students, retirees, families, and solo pilgrims alike. One thing they all agree on afterward: the right packing list makes the difference between a trip remembered for its hardship and one remembered for its peace. This Adi Kailash packing list draws directly from what our local guides recommend, season after season, to every yatri preparing for the trek.</p>

<h2 dir="ltr" class="text-text-100 mt-3 -mb-1 text-[1.125rem] font-bold" data-sourcepos="14:1-14:44;1251-1294">Essential Items for the Adi Kailash Trek</h2>

<p class="font-claude-response-body break-words whitespace-normal" dir="ltr" data-sourcepos="16:1-16:101;1296-1396">These are the non-negotiables. Our guides check for these before every group departs from Dharchula.</p>

<p class="font-claude-response-body break-words whitespace-normal" dir="ltr" data-sourcepos="18:1-18:34;1398-1431"><strong>Clothing for Variable Weather</strong></p>

<ul dir="ltr" class="[li_&]:mb-0 [li_&]:mt-1 [li_&]:gap-1 [&:not(:last-child)_ul]:pb-1 [&:not(:last-child)_ol]:pb-1 list-disc flex flex-col gap-1 pl-8 mb-3 print:block print:space-y-1" data-sourcepos="19:1-24:81;1432-1815">
<li class="font-claude-response-body whitespace-normal break-words pl-2" data-sourcepos="19:1-19:67;1432-1498">Thermal inner wear (top and bottom) for cold mornings and nights</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2" data-sourcepos="20:1-20:44;1499-1542">A windproof, water-resistant outer jacket</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2" data-sourcepos="21:1-21:89;1543-1631">Fleece or woollen layers for higher altitudes like Jyolingkong and Om Parvat viewpoint</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2" data-sourcepos="22:1-22:55;1632-1686">Comfortable, broken-in trekking shoes with good grip</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2" data-sourcepos="23:1-23:48;1687-1734">Woollen cap, gloves, and a neck scarf or buff</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2" data-sourcepos="24:1-24:81;1735-1815">Extra pairs of socks (wet socks in the hills are a common cause of discomfort)</li>
</ul>

<p class="font-claude-response-body break-words whitespace-normal" dir="ltr" data-sourcepos="26:1-26:25;1817-1841"><strong>Health and Hydration</strong></p>

<ul dir="ltr" class="[li_&]:mb-0 [li_&]:mt-1 [li_&]:gap-1 [&:not(:last-child)_ul]:pb-1 [&:not(:last-child)_ol]:pb-1 list-disc flex flex-col gap-1 pl-8 mb-3 print:block print:space-y-1" data-sourcepos="27:1-30:97;1842-2229">
<li class="font-claude-response-body whitespace-normal break-words pl-2" data-sourcepos="27:1-27:100;1842-1941">A refillable water bottle or hydration pouch — staying hydrated helps the body adjust to altitude</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2" data-sourcepos="28:1-28:51;1942-1992">Electrolyte or ORS sachets for the trekking days</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2" data-sourcepos="29:1-29:140;1993-2132">Personal medication, along with a basic first-aid kit (pain relief, altitude sickness tablets if prescribed, band-aids, antiseptic cream)</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2" data-sourcepos="30:1-30:97;2133-2229">A doctor's note for any pre-existing medical condition, especially heart or respiratory issues</li>
</ul>

<p class="font-claude-response-body break-words whitespace-normal" dir="ltr" data-sourcepos="32:1-32:38;2231-2268"><strong>Pilgrimage Identity and Documents</strong></p>

<ul dir="ltr" class="[li_&]:mb-0 [li_&]:mt-1 [li_&]:gap-1 [&:not(:last-child)_ul]:pb-1 [&:not(:last-child)_ol]:pb-1 list-disc flex flex-col gap-1 pl-8 mb-3 print:block print:space-y-1" data-sourcepos="33:1-36:60;2269-2542">
<li class="font-claude-response-body whitespace-normal break-words pl-2" data-sourcepos="33:1-33:59;2269-2327">Original and photocopies of your Inner Line Permit (ILP)</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2" data-sourcepos="34:1-34:68;2328-2395">Government-issued photo ID (Aadhaar card is most widely accepted)</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2" data-sourcepos="35:1-35:87;2396-2482">Passport-size photographs (guides usually ask for 4–6 copies for permit formalities)</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2" data-sourcepos="36:1-36:60;2483-2542">Medical fitness certificate, where required for the route</li>
</ul>

<p class="font-claude-response-body break-words whitespace-normal" dir="ltr" data-sourcepos="38:1-38:23;2544-2566"><strong>Safety and Comfort</strong></p>

<ul dir="ltr" class="[li_&]:mb-0 [li_&]:mt-1 [li_&]:gap-1 [&:not(:last-child)_ul]:pb-1 [&:not(:last-child)_ol]:pb-1 list-disc flex flex-col gap-1 pl-8 mb-3 print:block print:space-y-1" data-sourcepos="39:1-42:57;2567-2799">
<li class="font-claude-response-body whitespace-normal break-words pl-2" data-sourcepos="39:1-39:56;2567-2622">A sturdy trekking pole for the uneven, rocky sections</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2" data-sourcepos="40:1-40:49;2623-2671">A basic torch or headlamp with spare batteries</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2" data-sourcepos="41:1-41:71;2672-2742">Sunscreen and lip balm — the Himalayan sun is stronger than it feels</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2" data-sourcepos="42:1-42:57;2743-2799">UV-protection sunglasses for glare on higher stretches</li>
</ul>

<h2 dir="ltr" class="text-text-100 mt-3 -mb-1 text-[1.125rem] font-bold" data-sourcepos="44:1-44:34;2801-2834">Optional but Recommended Items</h2>

<p class="font-claude-response-body break-words whitespace-normal" dir="ltr" data-sourcepos="46:1-46:96;2836-2931">These aren't essential for everyone, but our guides often see yatris grateful they packed them.</p>

<ul dir="ltr" class="[li_&]:mb-0 [li_&]:mt-1 [li_&]:gap-1 [&:not(:last-child)_ul]:pb-1 [&:not(:last-child)_ol]:pb-1 list-disc flex flex-col gap-1 pl-8 mb-3 print:block print:space-y-1" data-sourcepos="48:1-52:51;2933-3204">
<li class="font-claude-response-body whitespace-normal break-words pl-2" data-sourcepos="48:1-48:56;2933-2988">A small notebook or journal for recording the journey</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2" data-sourcepos="49:1-49:65;2989-3053">A power bank, since charging points are limited past Dharchula</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2" data-sourcepos="50:1-50:55;3054-3108">Dry fruits or energy bars for the trekking stretches</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2" data-sourcepos="51:1-51:45;3109-3153">A lightweight rain cover for your backpack</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2" data-sourcepos="52:1-52:51;3154-3204">Woollen socks for sleeping in colder guesthouses</li>
</ul>

<h2 dir="ltr" class="text-text-100 mt-3 -mb-1 text-[1.125rem] font-bold" data-sourcepos="54:1-54:30;3206-3235">Guidelines from Our Guides</h2>

<p class="font-claude-response-body break-words whitespace-normal" dir="ltr" data-sourcepos="56:1-56:113;3237-3349">Beyond the packing list itself, our guides consistently share a few pieces of advice with every batch of yatris:</p>

<p class="font-claude-response-body break-words whitespace-normal" dir="ltr" data-sourcepos="58:1-58:230;3351-3580"><strong>Pack light, but pack right.</strong> Every extra kilogram matters on the climb toward Om Parvat and Jyolingkong. Our guides recommend a duffel bag or backpack under 10–12 kg for personal items, letting porters or mules carry the rest.</p>

<p class="font-claude-response-body break-words whitespace-normal" dir="ltr" data-sourcepos="60:1-60:210;3582-3791"><strong>Break in your shoes before you arrive.</strong> New shoes on old trails are one of the most common causes of blisters and discomfort. Guides suggest wearing your trekking shoes for at least a week before departure.</p>

<p class="font-claude-response-body break-words whitespace-normal" dir="ltr" data-sourcepos="62:1-62:219;3793-4011"><strong>Layer, don't bulk.</strong> Temperatures can shift by 15–20 degrees between Dharchula and the higher stretches. Guides advise carrying multiple thin layers rather than one heavy jacket, so you can adjust as the day changes.</p>

<p class="font-claude-response-body break-words whitespace-normal" dir="ltr" data-sourcepos="64:1-64:255;4013-4267"><strong>Respect the pace of the mountain.</strong> Altitude sickness doesn't discriminate by fitness level. Our guides ask every yatri to walk at a steady, unhurried pace, drink water frequently, and inform them immediately of any headache, nausea, or breathlessness.</p>

<p class="font-claude-response-body break-words whitespace-normal" dir="ltr" data-sourcepos="66:1-66:204;4269-4472"><strong>Keep your permit documents on your person, not in checked luggage.</strong> ILP checks happen at multiple points along the route, and guides recommend keeping copies easily accessible rather than packed away.</p>

<h2 dir="ltr" class="text-text-100 mt-3 -mb-1 text-[1.125rem] font-bold" data-sourcepos="68:1-68:30;4474-4503">Frequently Asked Questions</h2>

<p class="font-claude-response-body break-words whitespace-normal" dir="ltr" data-sourcepos="70:1-71:197;4505-4774"><strong>Q1. What is the most important item on the Adi Kailash packing list?</strong><br>Warm layered clothing and a reliable pair of broken-in trekking shoes top the list. Temperatures shift quickly at higher altitudes, and comfortable footwear prevents most common trekking injuries.</p>

<p class="font-claude-response-body break-words whitespace-normal" dir="ltr" data-sourcepos="73:1-74:249;4776-5099"><strong>Q2. Do I need special permits documents while packing for Adi Kailash?</strong><br>Yes. Carry your original Inner Line Permit (ILP), a government-issued photo ID, and a few passport-size photographs. Guides recommend keeping these in your daypack rather than checked luggage, since permit checks happen at multiple points en route.</p>

<p class="font-claude-response-body break-words whitespace-normal" dir="ltr" data-sourcepos="76:1-77:232;5101-5408"><strong>Q3. Is altitude sickness medication necessary for the Adi Kailash trek?</strong><br>It depends on your medical history. Consult your doctor before the trip, and if prescribed, carry altitude sickness tablets along with a basic first-aid kit. Staying hydrated and walking at a steady pace also helps reduce the risk.</p>

<p class="font-claude-response-body break-words whitespace-normal" dir="ltr" data-sourcepos="79:1-80:196;5410-5666"><strong>Q4. How much luggage weight is recommended for the trek?</strong><br>Our guides suggest keeping your personal backpack or duffel under 10–12 kg. Porters or mules typically carry additional baggage, so packing light for your daypack makes the walk more comfortable.</p>

<p class="font-claude-response-body break-words whitespace-normal" dir="ltr" data-sourcepos="82:1-83:219;5668-5986"><strong>Q5. What should I pack differently for higher-altitude stretches like Om Parvat or Jyolingkong?</strong><br>Carry extra woollen layers, gloves, and a windproof jacket for these sections, as temperatures drop noticeably compared to Dharchula. Sunglasses and sunscreen are also essential due to stronger UV exposure at altitude.</p>

<p class="font-claude-response-body break-words whitespace-normal" dir="ltr" data-sourcepos="85:1-86:197;5988-6257"><strong>Q6. Can beginners join the Adi Kailash Yatra with this packing list?</strong><br>Yes, this list is designed for yatris of varying fitness levels. Along with the right gear, guides recommend a steady pace and prior conditioning, especially for first-time high-altitude trekkers.</p>

<h2 dir="ltr" class="text-text-100 mt-3 -mb-1 text-[1.125rem] font-bold" data-sourcepos="88:1-88:14;6259-6272">Conclusion</h2>

<p class="font-claude-response-body break-words whitespace-normal" dir="ltr" data-sourcepos="90:1-90:326;6274-6599">The path to Adi Kailash is as much an inward journey as it is a physical one, and the right preparation lets you focus on that experience rather than on avoidable discomfort. A thoughtful packing list — built on the same advice our guides give every season — helps ensure your body is ready even as your spirit leads the way.</p>

<p class="font-claude-response-body break-words whitespace-normal" dir="ltr" data-sourcepos="92:1-92:290;6601-6890">If you're planning your Adi Kailash Yatra and want guidance tailored to your fitness level, travel dates, or group size, our team at Rudraansh Yatra is here to help. Reach out to us for permit assistance, route planning, and on-ground support from local experts who know this journey well.</p>`;

async function restoreBlog() {
  const { data, error } = await supabase
    .from('blogs')
    .update({ content: fullContent })
    .eq('id', '3c927d94-9d25-4c34-9f78-a9edd5d10184');

  if (error) {
    console.error('Error restoring blog content:', error);
  } else {
    console.log('SUCCESSfully restored full original blog content to Supabase database!');
  }
}

restoreBlog();
