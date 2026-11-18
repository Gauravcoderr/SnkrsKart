import 'dotenv/config';
import { connectDB } from '../config/database';
import { Blog } from '../models/Blog';

const blogs = [
  // ai-legit-check-sneakers-india-guide-2026 — seeded 2026-05-30
  // air-jordan-1-low-og-sail-india-2026, trophy-room-closing-marcus-jordan-sneaker-culture-2026, world-cup-2026-sneaker-collabs-messi-kith-thrasher-india — seeded 2026-06-05
  // willy-chavarria-adidas-copa-mundial-india-2026, asics-gel-lyte-iii-remastered-shigeyuki-mitsui-2026, new-balance-992-made-in-usa-shadow-grey-india-2026 — seeded 2026-06-08
  // air-jordan-3-bin-23-pinot-noir-june-2026, jjjjound-new-balance-1890-india-2026, sneaker-resale-crash-buyers-guide-2026 — seeded 2026-06-11
  // converse-shai-001-steel-india-2026, salomon-xt-6-gorpcore-india-2026, adidas-hyperboost-euphoria-new-boost-2026 — seeded 2026-06-15
  // vaa-air-jordan-1-alaska-virgil-abloh-archive — seeded 2026-06-18
  // a-ma-maniere-nike-pegasus-premium-2026, nike-air-max-goadome-low-sp-2026, onitsuka-tiger-ot-group-spin-off-2026 — seeded 2026-06-18
  {
    title: 'V.A.A. Air Jordan 1 "Alaska" — Virgil Abloh\'s Archive Drops Its First Sneaker',
    slug: 'vaa-air-jordan-1-alaska-virgil-abloh-archive',
    excerpt: 'The Virgil Abloh Archive, led by his widow Shannon Abloh, has released its debut sneaker — the V.A.A. Air Jordan 1 "Alaska." Here\'s everything you need to know.',
    coverImage: 'https://res.cloudinary.com/dadulg5bs/image/upload/v1781505523/blog-images/vaa-air-jordan-1-alaska-virgil-abloh-archive-cover-fix.jpg',
    author: 'SNKRS CART',
    tags: ['Jordan', 'Nike', 'Collaboration', 'Virgil Abloh', 'New Release'],
    metaTitle: 'V.A.A. Air Jordan 1 "Alaska" — Virgil Abloh Archive First Sneaker Drop | SNKRS CART',
    metaDescription: 'The Virgil Abloh Archive has released its first sneaker — the V.A.A. Air Jordan 1 "Alaska." Learn about the design, release date, and where to buy in India.',
    metaKeywords: 'V.A.A Air Jordan 1 Alaska, Virgil Abloh Archive sneaker, VAA Jordan 1, Off-White Jordan 1 2026, Jordan 1 new release India',
    published: true,
    content: `<p>Placeholder — seeded separately.</p>`.trim(),
  },
  // virat-kohli-one8-sneaker-india-2026, bape-adidas-adizero-evo-sl-2026, jaide-air-jordan-11-low-first-collab-2026 — seeded 2026-06-21
  // one8-global-premiere-virat-kohli-delhi-2026, one8-vs-hrx-celebrity-sportswear-india-2026, virat-kohli-one8-agilitas-equity-story-2026, puma-india-post-kohli-next-gen-ambassadors-2026 — seeded 2026-06-25
  // ronaldo-cr7-mercurial-gold-six-world-cups-2026, messi-f50-el-ultimo-tango-farewell-boot-2026, skechers-reebok-world-cup-2026-underdogs — seeded 2026-06-26
  // air-jordan-7-miro-barcelona-2026, kith-new-balance-2011-ronnie-fieg-2026, air-jordan-3-true-blue-2026 — seeded 2026-06-29
  // hidden-ny-asics-gel-kinetic-2-2026, new-balance-niobium-concept-1-tokyo-2026, nike-air-max-95-konbini-pack-2026 — seeded 2026-07-01
  // nike-air-zoom-flight-the-glove-india-2026, vans-old-skool-souvenir-india-2026, indian-sneaker-festival-gurugram-2026 — seeded 2026-07-06
  // nike-air-force-1-low-01-triple-white-2026, jalen-brunson-nike-kobe-ny-vs-ny-2026, on-running-vs-hoka-india-2026 — seeded 2026-07-07
  // a-cold-wall-salomon-acs-pro-india-2026, air-jordan-1-love-letter-india-2026, carbon-plate-super-shoes-india-2026 — seeded 2026-07-09
  // air-jordan-16-free-the-youth-metallic-silver-2026, mary-jane-sneaker-trend-india-2026, tamil-nadu-adidas-footwear-manufacturing-india-2026 — seeded 2026-07-12
  // bape-vans-knu-skool-camo-collab-2026, sneaker-indianization-trend-india-2026, superkicks-delhi-flagship-store-2026 — seeded 2026-07-16
  // victor-solomon-nike-trophies-pack-india-2026, vans-kpop-demon-hunters-golden-india-2026, yoho-blinc-hands-free-sneakers-india-2026 — seeded 2026-07-23
  // nike-lebron-23-hardwood-classic-india-2026, skechers-cricket-elite-india-endorsement-strategy, anta-puma-stake-india-business-impact — seeded 2026-07-26
  // nike-atelier-merc-premium-india-2026, india-bis-footwear-qco-2026-extension, reebok-karol-g-classics-india-abfrl-2026 — seeded 2026-07-30
  // travis-kelce-air-jordan-10-chiefs-pe-2026, nike-air-force-1-low-floral-ir8617-900-india-2026, pokemon-adidas-30th-anniversary-collection-india-2026 — seeded 2026-08-03
  // adidas-harden-vol-10-northern-lights-canada-exclusive-2026, air-jordan-13-wings-denim-legacy-2026, india-marathon-boom-running-shoes-asics-nike-adidas-2026 — seeded 2026-08-05
  // air-jordan-9-low-what-the-kilroy-2026, nike-moon-shoe-italy-blue-sail-chlorophyll-2026, reebok-angel-reese-1-barbie-india-2026 — seeded 2026-08-07
  // adidas-limited-edt-superstar-made-in-india-2026, kanye-west-yeezy-jd-sports-comeback-2026, puma-speedcat-low-profile-trend-india-2026 — seeded 2026-08-10
  // nike-kobe-5-protro-dodgers-2026, aime-leon-dore-new-balance-running-pack-2026, nike-ja-4-nightmare-2026 — seeded 2026-08-13
  // air-jordan-6-oreo-2026, vandythepink-asics-gel-kayano-ice-cream-2026, slam-nike-zoom-hyperflight-safety-orange-2026 — seeded 2026-08-22
  // reebok-question-96-26-zellerfeld-3d-printed-2026, swagger-hub-india-sneaker-reseller-2026, sneaker-cleaning-restoration-india-2026 — seeded 2026-08-25
  // awake-ny-air-jordan-6-blueberry-2026, westside-gunn-saucony-grid-jazz-9-2026, air-jordan-12-sumo-japan-import-india-2026 — seeded 2026-08-28
  // comme-des-garcons-air-jordan-11-india-2026, new-balance-983-vs-1906r-india-2026, jordan-design-studio-syn-zhuang-air-jordan-1-2026 — seeded 2026-09-04
  // terror-squad-air-force-1-university-red-fat-joe-2026, air-jordan-7-tennis-day-agassi-us-open-2026, adidas-tang-jacket-india-price-2026 — seeded 2026-09-07
  // onitsuka-tiger-japanese-sneakers-boom-tourists-india-2026, justin-bieber-skylrk-matterdaddies-latte-world-cup-final-2026, nike-x2-football-culture-community-playbook-india-2026 — seeded 2026-09-10
  // travis-scott-air-jordan-1-low-chicago-2027, air-jordan-12-bucks-idols-become-rivals-2026, mowalola-air-jordan-14-burnt-red-2026 — seeded 2026-09-16
  // air-jordan-16-black-pack-2026, jordan-son-of-mars-low-black-cat-comeback-2026, nike-gt-force-high-top-basketball-reveal-2026 — seeded 2026-09-22
  // pokemon-adidas-launch-store-list-resale-india-2026 — seeded 2026-09-22
  // air-jordan-1-low-og-last-dance-at-the-garden-india-2026 — seeded 2026-09-24
  // nike-jordan-retro-supply-cut-2027-india-impact, nike-kobe-10-protro-5am-flight-india-2026, nike-halloween-sneakers-2026-air-jordan-5-dunk-shibuya-kd-19 — seeded 2026-10-02
  // lisa-blackpink-nike-moon-shoe-tough-red-campaign-india-2026, puma-rcb-dhruv-kapoor-milan-fashion-week-jackets-india-2026 — seeded 2026-10-04
  // thums-up-gully-labs-gully-number-001-toofani-sneaker-india-2026 — seeded 2026-10-05
  // air-jordan-1-high-og-royal-2026-india, street-fighter-puma-suede-pack-india-2026, adidas-handball-spezial-loafer-snoafer-trend-india-2026 — seeded 2026-10-10
  // nike-air-force-1-low-what-the-la-2026-india, kiko-kostadinov-crocs-vaals-india-2026, air-jordan-4-light-army-europe-exclusive-india-2026 - seeded 2026-10-15
  // sneakerauth-ai-sneaker-legit-check-india, nigo-j-hope-nike-air-force-1-01-burnt-sunrise-india-2026, nike-bengaluru-campus-india-2026 - seeded 2026-10-20
  // nike-kobe-mamba-eterno-dia-de-los-muertos-pack-india-2026, nike-shox-comeback-corteiz-r419-india-2026, crocs-india-kl-rahul-feel-it-all-festive-2026 - seeded 2026-10-24
  // air-jordan-14-forest-green-2026-india, adidas-record-quarter-samba-gazelle-discounts-india-2026, foot-locker-india-two-years-six-stores-bis-2026 - seeded 2026-10-27
  // air-jordan-4-bred-2026-black-friday-india, nike-investor-day-full-stride-ahead-india-2026, reebok-g-unit-g6-50-cent-restock-india-2026 - seeded 2026-11-18
  {
    title: 'Nike Air Foamposite Pro "Mummy Duck" and the College Football Pack: Worth Importing to India?',
    slug: 'nike-air-foamposite-pro-mummy-duck-college-football-pack-india-2026',
    excerpt: 'Oregon\'s bandaged duck mascot spent a year as a player exclusive. Now it is a $230 Foamposite Pro on SNKRS, with four school colourways behind it, and landing one in India costs about ₹32,000 before shipping.',
    coverImage: 'https://res.cloudinary.com/dadulg5bs/image/upload/v1794989345/blog-images/nike-air-foamposite-pro-mummy-duck-college-football-pack-india-2026-cover.webp',
    author: 'SNKRS CART',
    tags: ['nike', 'foamposite', 'basketball', 'new-release', 'college-football', 'india', 'resale'],
    metaTitle: 'Nike Foamposite Pro Mummy Duck: India Price | SNKRS CART',
    metaDescription: 'Nike Air Foamposite Pro Mummy Duck IZ7806-001: release date, $230 price, the LSU, FSU, Ohio State and TCU pack, and what importing one to India really costs.',
    metaKeywords: 'Nike Air Foamposite Pro Mummy Duck, Foamposite Mummy Duck IZ7806-001, Mummy Duck release date, Foamposite price India, Nike Foamposite college football pack, LSU Foamposite IX2091-700, Foamposite import duty India',
    published: false,
    template: 'v3',
    content: `
<p>A duck wrapped in bandages, printed on the heel of a $230 Foamposite. That is where Nike landed this month. The Air Foamposite Pro "Mummy Duck" (style code IZ7806-001) launched on Nike SNKRS on November 3, 2026, in men's sizing, and it is the first time Oregon's mummified mascot has been sold to anyone who does not play for the Ducks.</p>

<p>It is also not alone. Nike has spent this autumn turning the Foamposite Pro into a college football shoe, with four more school colourways lined up behind the Oregon pair. For a silhouette that started life as a late-1990s basketball shoe, that is a strange new job. For Indian buyers, it raises a simple question: is any of this worth the import bill?</p>

<img src="https://res.cloudinary.com/dadulg5bs/image/upload/v1794989349/blog-images/nike-air-foamposite-pro-mummy-duck-college-football-pack-india-2026-inline-1.webp" alt="Nike Air Foamposite Pro Mummy Duck IZ7806-001 heel with mummified Oregon duck graphic" style="width:100%;border-radius:12px;margin:32px 0;box-shadow:0 4px 24px rgba(0,0,0,0.10);" />

<h2>From Locker Room Exclusive to SNKRS</h2>

<p>The Mummy Duck began as a player exclusive. In 2025, Oregon and Nike made a football-only Foamposite Pro with a matching Vaporposite cleat for the team. <a href="https://sneakerbardetroit.com/nike-air-foamposite-pro-mummy-duck-2026/" target="_blank" rel="noopener">Sneaker Bar Detroit</a> is blunt about what happened next: neither pair was sold to the public. That PE was white-based. The retail version flips it dark.</p>

<p>So what does $230 buy? Black/Barely Volt-White, officially. The shell is the star: iridescent, sliding from deep green to black to a hint of purple as you turn it. Collar, tongue and eyestay stay black under white laces. Then the Swoosh, oversized and pale Volt, stitched over frayed white fabric that reads like a bandage coming loose. "OREGON" sits on the heel, the insoles and the pull tabs. The mummified duck shows up on both heels and inside, too. And per <a href="https://justfreshkicks.com/?p=240796" target="_blank" rel="noopener">Just Fresh Kicks</a>, those Swooshes glow in the dark.</p>

<p>Oregon and the Foamposite go back a while. <a href="https://houseofheat.co/nike/oregon-nike-air-foamposite-pro-mummy-duck-iz7806-001" target="_blank" rel="noopener">House of Heat</a> traces the link past a decade, including a 2013 Air Foamposite One. Both House of Heat and Sneaker Bar Detroit also say a second Oregon Foamposite Pro is planned for the holiday window. House of Heat ties a white pair to style code JA5895-001, but no images have surfaced, so treat it as pending.</p>

<p>One warning before you shop: the Mummy Duck release date is a mess online. Sneaker Bar Detroit, House of Heat and StockX all list November 3. Other pages still say November 16, December 1 or even December 31. The two mirrors we trust agree on November 3 at $230, and we are going with that.</p>

<h2>The Four-School Pack Behind It</h2>

<p>The bigger story is the pack. Sneaker Bar Detroit first reported the leaked codes back in October 2025, and they have held up:</p>

<p><strong>Florida State</strong>: Team Maroon/White, IX2095-600.<br/>
<strong>LSU</strong>: University Gold/White, IX2091-700.<br/>
<strong>Ohio State</strong>: White/University Red, IX2094-100.<br/>
<strong>TCU</strong>: New Orchid/White, IX2092-500.</p>

<p>The LSU pair is the loudest. Per <a href="https://justfreshkicks.com/?p=245480" target="_blank" rel="noopener">Just Fresh Kicks' October 23 report</a>, it pairs a bright yellow shell with black tiger stripes, a purple collar and lining, LSU logos on the tongue and heel, and "Geaux Tigers" on the heel tabs. The same outlet reported a November 5 release at $250 through Foot Locker and Hibbett, while flagging that the date was not confirmed. We could not find a second source agreeing on that price, so read $250 as Just Fresh Kicks' figure, not a settled one.</p>

<img src="https://res.cloudinary.com/dadulg5bs/image/upload/v1794989354/blog-images/nike-air-foamposite-pro-mummy-duck-college-football-pack-india-2026-inline-2.webp" alt="Nike Air Foamposite Pro LSU Tigers IX2091-700 yellow shell with tiger stripes" style="width:100%;border-radius:12px;margin:32px 0;box-shadow:0 4px 24px rgba(0,0,0,0.10);" />

<h2>Why Any of This Matters in India</h2>

<p>Let us be honest. Nobody in Pune is repping TCU. College football barely registers here, and the school logos mean little to most Indian buyers. What does travel is the Foamposite itself: a heavy molded shell, a shape you can spot across a room, and colours that do not exist on any other shoe. The Mummy Duck works here for the same reason it works in Oregon. The bandage Swoosh and the oil-slick shell are wild before you know the backstory.</p>

<p>The maths is the problem. Using the open.er-api.com rate for November 18, 2026 (₹93.51 to the dollar), $230 converts to about ₹21,508. The <a href="https://eximpe.com/hsncode-finder/64039120" target="_blank" rel="noopener">eximpe duty table</a> for HSN 6403 (rates as at May 13, 2026) stacks 20% basic customs duty, a cess of 20% on that duty, a 10% welfare surcharge on both, then 18% IGST on the lot. That is roughly ₹4,302 duty, ₹860 cess, ₹516 surcharge and ₹4,894 IGST. Landed: about <strong>₹32,080</strong>, before shipping or a forwarder's cut. If the school pairs really retail at $250, each one lands near ₹34,870.</p>

<p>No India retail listing for either the Mummy Duck or the school pack turned up in our research. So this is import or reseller territory only.</p>

<p>Resale? We tried. StockX lists the Mummy Duck at $230 retail with a November 3 date, but its market panel showed only "Loading..." and no sales history when we checked. We will not guess a premium. Anyone quoting you one off a blank page is selling a story.</p>

<p>Sizing next. Both mirrors list the Mummy Duck in men's sizing, so knock one off your US number to get UK (US 9 is UK 8). Fit notes? Neither mirror has any. If you already own a Foamposite, match that size. Get it wrong on a ₹32,000 import and you are stuck with it.</p>

<h2>Our Verdict</h2>

<p>The Mummy Duck is the one to want. It has a real story, a PE that nobody could buy for a year, and a design that does not need a fan's context to land. If you can get it near retail through a friend abroad, do it. Paying a reseller premium on top of ₹32,000 landed? No. That is a lot for a shoe that weighs this much and breathes this little in an Indian summer.</p>

<p>The school pack we would skip. LSU is fun, and Florida State's maroon is the cleanest of the four. Still, with no team to cheer for, you are looking at four colour swaps on a shell the Foamposite has worn many times before.</p>

<p>Wearing it? Keep everything else quiet. Black straight-leg denim or black cargos and a grey hoodie do the job. The green shell will catch the light without help.</p>

<img src="https://res.cloudinary.com/dadulg5bs/image/upload/v1794989358/blog-images/nike-air-foamposite-pro-mummy-duck-college-football-pack-india-2026-inline-3.webp" alt="Nike Air Foamposite Pro Mummy Duck Black Barely Volt three quarter view" style="width:100%;border-radius:12px;margin:32px 0;box-shadow:0 4px 24px rgba(0,0,0,0.10);" />

<p>A mummified duck was never supposed to leave the locker room. Now it has, and the Foamposite has a new identity on the field. Whether it earns a spot in your rotation comes down to one number: ₹32,080 before shipping. If that is too steep, see what is in stock and ready to ship across India on our <a href="/products?brand=Nike">Nike page</a>.</p>

<p>Into darker, spookier Nike designs? Our round-up of <a href="/blogs/nike-halloween-sneakers-2026-air-jordan-5-dunk-shibuya-kd-19">Nike's Halloween 2026 sneakers</a> covers the rest of this season's darker drops.</p>

`.trim(),
  },
  {
    title: 'NOCTA x Nike Air Modmax "Pink Spell": Drake\'s Shox-Style Shoe and Its Real Cost in India',
    slug: 'nocta-nike-air-modmax-pink-spell-india-2026',
    excerpt: 'Six Air pods, four of them pumped to 17 psi under a raised heel, and a pink upper that hides nothing. NOCTA\'s first all-new Nike silhouette dropped on November 16 at $180, and importing one to India lands at about ₹25,000 before shipping.',
    coverImage: 'https://res.cloudinary.com/dadulg5bs/image/upload/v1794988976/blog-images/nocta-nike-air-modmax-pink-spell-india-2026-cover.webp',
    author: 'SNKRS CART',
    tags: ['nike', 'nocta', 'drake', 'collaboration', 'new-release', 'air-modmax', 'india'],
    metaTitle: 'NOCTA Nike Air Modmax Pink Spell: India Price | SNKRS CART',
    metaDescription: 'NOCTA x Nike Air Modmax Pink Spell IQ6711-600 explained: six tuned Air pods, $180 retail, Nov 16 to 17 release and the landed cost of importing it to India.',
    metaKeywords: 'NOCTA Nike Air Modmax, Air Modmax Pink Spell IQ6711-600, NOCTA Air Modmax price India, Drake NOCTA new shoe 2026, Nike Air Modmax release date, Nike modular Air cushioning, NOCTA sneakers India import duty',
    published: false,
    template: 'v2',
    content: `
<p>Drake's NOCTA has made a lot of Nike apparel. It has made far fewer shoes. On November 16, 2026, that changed in a loud way: the NOCTA x Nike Air Modmax "Pink Spell" (style code IQ6711-600) went live on NOCTA's own site, with Nike SNKRS and select retailers following on November 17. Retail is $180. The shoe is pink almost everywhere you look, and it sits on a heel that looks like it was borrowed from a Shox.</p>

<p>This is not another Air Force 1 with a NOCTA logo on the heel. It is a new silhouette built on what Hypebeast describes as a first-of-its-kind modular cushioning system from Nike, and that makes it the most interesting thing the label has put on feet so far. Whether it is a shoe you should chase from India is a different question, and the maths is not kind.</p>

<img src="https://res.cloudinary.com/dadulg5bs/image/upload/v1794988986/blog-images/nocta-nike-air-modmax-pink-spell-india-2026-inline-1.webp" alt="NOCTA x Nike Air Modmax Pink Spell IQ6711-600 lateral side view 2026" style="width:100%;border-radius:12px;margin:32px 0;box-shadow:0 4px 24px rgba(0,0,0,0.10);" />

<h2>Six Air Pods and a Raised Heel: What the Air Modmax Actually Is</h2>

<p>Strip the colour away and the idea is simple. Instead of one long Air bag, the Modmax uses six separate, semi-transparent Air units sitting between a thin outsole and a curved synthetic support frame. <a href="https://hypebeast.com/?post=6817098" target="_blank" rel="noopener">Hypebeast's November 15 report</a> gives the split: the four rear units in the heel are pressurised to 17 psi to soak up impact, while the two forward units run at 7 psi to help the foot roll from midfoot to forefoot. Under that sits a Cushlon foam midsole, a TPU carrier that doubles as heel cage and midfoot shank, TPU bumpers on the toe and both sides, and a sticky G-Tek rubber outsole.</p>

<p>Most of the cushioning lives at the back, so the heel rides high. From the side it looks like a Shox, and <a href="https://sneakerbardetroit.com/nocta-nike-air-modmax-pink-spell/" target="_blank" rel="noopener">Sneaker Bar Detroit</a> says so outright, adding that the exposed pods borrow from the Air Liquid Max. Sole Retriever's Zach Harris put it in one line: "a Shox-like design with columns of cushioning built into a raised heel." Hard to argue.</p>

<p>Up top, it gets stranger. The leather is pale pink. The toe box is thin and perforated. Down each side run wavy quilted panels, and both Sole Retriever and Hypebeast reached for the same comparison: a football boot. The lace area and the top of the tongue go a shade brighter, and a yellow hit glows through the heel pods. Official colourway, per <a href="https://www.soleretriever.com/news/articles/nocta-nike-air-modmax-pink-spell-official-images" target="_blank" rel="noopener">Sole Retriever</a>: Pink Spell/Pink Spell-Amarillo-Volt. Unisex sizing.</p>

<h2>Release Details and the $160 vs $180 Confusion</h2>

<p>Three sources line up on the basics. The style code is IQ6711-600. NOCTA sold it first on November 16, 2026, and Nike SNKRS plus select retailers got it a day later. The price is $180.</p>

<p>One wrinkle. Hypebeast's own article lists $180 in its spec box but says $160 in the body text. Sneaker Bar Detroit marks $180 as confirmed and Sole Retriever lists $180 too, so that is the number we are working from. If you see $160 quoted elsewhere, that is where it came from.</p>

<p>NOCTA's footwear record is short. Sneaker Bar Detroit lists the Hot Step, the Air Glide and a handful of Air Force 1 releases, and notes that an Air Max Plus collaboration was rumoured for a while and never showed up. The Modmax quietly answers that rumour: the curving lines across the padded upper carry some of the Air Max Plus spirit, just on a completely different base.</p>

<img src="https://res.cloudinary.com/dadulg5bs/image/upload/v1794989000/blog-images/nocta-nike-air-modmax-pink-spell-india-2026-inline-2.webp" alt="NOCTA Nike Air Modmax Pink Spell heel close-up showing modular Air units" style="width:100%;border-radius:12px;margin:32px 0;box-shadow:0 4px 24px rgba(0,0,0,0.10);" />

<h2>What It Costs to Get a Pair to India</h2>

<p>No India retail listing for the Air Modmax turned up during our research this week, and the confirmed launch channels are NOCTA, Nike SNKRS and select retailers. So for most Indian buyers the realistic route is an import or a reseller who imported one. Here is what that looks like on paper.</p>

<p>At the rate published by open.er-api.com on November 18, 2026 (₹93.51 to the dollar), the $180 retail price works out to about ₹16,832. Footwear coming into India under HSN 6403 attracts, per the <a href="https://eximpe.com/hsncode-finder/64039120" target="_blank" rel="noopener">eximpe duty table</a> (rates as at May 13, 2026): 20% basic customs duty, an agriculture cess of 20% of that duty, a 10% social welfare surcharge on both, and 18% IGST on top of everything. On ₹16,832 that is roughly ₹3,366 duty, ₹673 cess, ₹404 surcharge and ₹3,830 IGST. Landed: about <strong>₹25,106</strong>, before you have paid a rupee of international shipping or a forwarder's fee.</p>

<p>Call it ₹26,000 to ₹28,000 by the time a box reaches Mumbai or Bengaluru through a forwarder. For a first-colourway, first-generation silhouette from a celebrity label, that is a lot of money for an unknown.</p>

<p>Resale is the other route, and we cannot give you a number for it honestly. The StockX page we tried returned a 404, and the shoe has been on sale for barely two days. Any premium quoted to you this week is a guess dressed up as a market. Wait for a few weeks of real sales before you pay anyone above landed cost.</p>

<p>Sizing note: Sole Retriever lists the pair as unisex, which in Nike's system means men's US sizing. Most Indian buyers wear UK sizes, so take one off your US number (UK 8 is US 9). There are no on-foot fit reports for the Modmax yet, so if you sit between sizes, wait for them before committing to an import you cannot return.</p>

<h2>Is the Hype Real? Our Take</h2>

<p>The technology is the most promising part of the Modmax, and it is better than we expected. Tuning front and rear Air pods to different pressures is a real idea, not a paint job, and NOCTA getting first use of it says Nike sees this as more than a merch play. If the Modmax system shows up later on general-release Nike pairs, this is the shoe people will point back to.</p>

<p>The Pink Spell pair, though, is a shoe for weekends and photos. Pink upper, pink laces, pink midsole. Delhi dust will find it on day one. Love it? Buy it at retail and wear it hard. But ₹25,000-plus to import it, or a reseller's markup stacked on that, is too much for the first version of a sole nobody has walked through a monsoon in.</p>

<p>Styling, if you go for it: let the shoe carry the outfit. Washed black denim or charcoal cargos, a plain white or grey tee, nothing else pink. At a Saturday gig in Mumbai or Bengaluru it will turn heads. Pair it with a busy print and it starts to look like a costume.</p>

<img src="https://res.cloudinary.com/dadulg5bs/image/upload/v1794989009/blog-images/nocta-nike-air-modmax-pink-spell-india-2026-inline-3.webp" alt="NOCTA x Nike Air Modmax Pink Spell outsole G-Tek rubber lug pattern" style="width:100%;border-radius:12px;margin:32px 0;box-shadow:0 4px 24px rgba(0,0,0,0.10);" />

<p>The smart move for most Indian buyers is patience. Let the first pairs land, let fit reports and real resale data settle, and see whether a quieter colourway follows. The Modmax could be the start of something. It does not need your ₹25,000 in its first week. In the meantime, browse what is actually in stock and ready to ship across India on our <a href="/products?brand=Nike">Nike page</a>.</p>

<p>If the raised-heel look is what pulled you in, our breakdown of the <a href="/blogs/nike-shox-comeback-corteiz-r419-india-2026">Nike Shox comeback and the Corteiz R419</a> covers the original column-cushioning shoe and which Shox models are worth buying in India today.</p>

`.trim(),
  },
];

async function seed() {
  await connectDB();
  let added = 0;
  let skipped = 0;

  for (const blog of blogs) {
    const existing = await Blog.findOne({ slug: blog.slug });
    if (existing) {
      console.log(`⏭  Already exists: ${blog.slug}`);
      skipped++;
      continue;
    }
    await Blog.create(blog);
    console.log(`✅ Added: ${blog.slug}`);
    added++;
  }

  console.log(`\nDone. Added: ${added} | Skipped: ${skipped}`);
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
