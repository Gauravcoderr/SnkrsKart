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
  // DRAFT — auto-content run 2026-09-16, pending human review (published: false)
  {
    title: 'J Balvin x Air Jordan 4 "Lemonade" — Release Date, Price & Is It Worth It in India',
    slug: 'j-balvin-air-jordan-4-lemonade-2026',
    excerpt: 'J Balvin debuted his Air Jordan 4 "Lemonade" at the World Cup opening ceremony, and the retail pair drops September 25 for $225. Here is what the croc-leather colourway actually costs once it clears Indian customs.',
    coverImage: 'https://res.cloudinary.com/dadulg5bs/image/upload/v1789545700/blog-images/j-balvin-air-jordan-4-lemonade-2026-cover.webp',
    author: 'SNKRS CART',
    tags: ['jordan', 'air-jordan-4', 'collaboration', 'new-release', 'india', 'j-balvin', 'buying-guide', 'sneaker-culture'],
    metaTitle: 'J Balvin Air Jordan 4 Lemonade India Price | SNKRS CART',
    metaDescription: 'J Balvin\'s Air Jordan 4 "Lemonade" lands September 25 for $225 — croc leather, a SOLO HAZLO dubrae, and the real landed cost once it clears Indian customs.',
    metaKeywords: 'J Balvin Air Jordan 4, Air Jordan 4 Lemonade India, IW2872-700 release, J Balvin Jordan collab, Jordan 4 price India 2026, croc leather Jordan 4',
    published: false,
    content: `<p>J Balvin walked out at the opening ceremony of the 2026 FIFA World Cup in a shoe most of the internet had only seen in blurry backstage photos: an Air Jordan 4 dipped almost entirely in yellow, croc-textured leather catching the stadium lights like wet paint.</p>

<p>Ten days later, on September 25, that shoe goes up for real. Officially the J Balvin x Air Jordan 4 "Lemonade," style code IW2872-700, it retails for $225 on SNKRS and Nike.com — a $25 jump over a standard AJ4 retro. For anyone who's tracked Balvin's run with Jordan Brand since 2020, that premium isn't a shock. What's different this time is how hard the shoe leans into his pop persona rather than basketball heritage.</p>

<img src="https://res.cloudinary.com/dadulg5bs/image/upload/v1789545707/blog-images/j-balvin-air-jordan-4-lemonade-2026-inline-1.webp" alt="J Balvin Air Jordan 4 Lemonade croc-texture yellow upper close-up 2026" style="width:100%;border-radius:12px;margin:32px 0;box-shadow:0 4px 24px rgba(0,0,0,0.10);" />

<h2>What's Actually On the Shoe</h2>
<p>Every reference photo from <a href="https://sneakerbardetroit.com/j-balvin-air-jordan-4-lemonade-iw2872-700/" target="_blank" rel="noopener">Sneaker Bar Detroit</a> shows the same build: several shades of yellow layered rather than one flat tone, wrapped in genuine croc-textured leather across the toe box and eyestay. Nike kept its own wordmark debossed on the left heel and handed the right heel entirely to Balvin — his upside-down smiley face sits there instead of a Jumpman. The tongue carries a woven dubrae reading "SOLO HAZLO," a direct Spanish flip on Nike's own tagline.</p>

<p>None of that touches the AJ4 tooling underneath. Same visible Air unit, same mesh wings, same lacing system Tinker Hatfield drew up in 1989. This is a paint-and-materials story, not a structural one, and that distinction matters when you're deciding whether $225 is worth it. Buyers who handled the earlier Balvin Jordan pairs will recognise the same attention to real leather grain over printed texture — Nike doesn't cut that corner on his collabs, whatever else you think of the pricing.</p>

<h2>Why Nike Keeps Coming Back to Balvin</h2>
<p>This isn't a first date. Balvin's Jordan Brand relationship stretches back to 2020, and every release since has tied into his "Colores" album era and his Colombian identity rather than a generic Latin-market marketing push. Debuting Lemonade on a World Cup stage instead of a standard SNKRS announcement was deliberate — reach a football-first global audience that a basketball silhouette wouldn't normally touch. According to <a href="https://www.soleretriever.com/news/articles/j-balvin-air-jordan-4-retro-lemonade-release-preview" target="_blank" rel="noopener">SoleRetriever's release preview</a>, the World Cup unveiling was the clearest look anyone had at the pair before official images dropped.</p>

<p>It also fits a pattern Jordan Brand leaned on hard through the 2026 World Cup window: pairing basketball silhouettes with musicians and footballers who have nothing to do with the NBA, betting that a global tournament audience converts into sneaker buyers faster than another basketball-only drop would. Balvin is the music half of that bet. Whether it moves units the way a football-boot collab does is a separate question Nike clearly thinks is worth testing.</p>

<img src="https://res.cloudinary.com/dadulg5bs/image/upload/v1789545711/blog-images/j-balvin-air-jordan-4-lemonade-2026-inline-2.webp" alt="J Balvin Air Jordan 4 Lemonade heel smiley face logo detail shot" style="width:100%;border-radius:12px;margin:32px 0;box-shadow:0 4px 24px rgba(0,0,0,0.10);" />

<h2>India: Availability, Sizing and the Landed-Cost Math</h2>
<p>Jordan Brand hasn't confirmed an India SNKRS allocation for this pair, and Balvin's earlier AJ4 drops haven't historically shown up as official India stock either. Expect this one to reach Indian buyers through resale and grey-market import rather than a local retail drop on day one.</p>

<p>Worth running the numbers anyway, because Indian buyers will be pricing this against import listings within days. At roughly ₹96 to the dollar — the mid-September 2026 rate — $225 converts to about ₹21,600. Footwear entering India carries a 35% basic customs duty, a 10% social welfare surcharge calculated on that duty, and 18% IGST stacked on both, a combined multiplier of about 1.634×. That puts the landed cost near ₹35,300 before an import agent takes their own cut.</p>

<p>For scale, SNKRS CART carries the standard <a href="/products/air-jordan-4-retro-black-cat-2025">Air Jordan 4 "Black Cat"</a> retro at ₹25,500. Once Lemonade clears customs, it'll land close to ₹10,000 above that for the same silhouette wearing a different paint job and a croc-texture upcharge. On sizing, the AJ4 has run true-to-size across every retro we've handled in-store — no reason to expect this collab tooling to fit any differently, so order your usual Jordan size rather than sizing up for the extra materials on the upper.</p>

<h2>Is the Hype Real?</h2>
<p>There's also a simpler read on why Jordan Brand picked a World Cup stage over a normal SNKRS teaser: Balvin's own upside-down smiley face has been his personal mark since well before this collab, showing up on merch and stage visuals for years. Handing it the entire right heel — instead of squeezing it next to a Jumpman — signals Nike treating him as a co-owner of the design language, not just a paid face on a colourway. That's a bigger concession than most musician collabs get, regardless of whether you end up buying the shoe.</p>

<p>No live resale number exists yet — the shoe hasn't released, so there's no StockX or GOAT market to point to, only pre-release watchlists. Anyone quoting you a resale premium in September is pricing your impatience, not the market.</p>

<p>My honest read: the execution is genuinely good, and Balvin's team clearly understood the assignment on materials. But it's still a colourway on four-year-old tooling carrying a $25 premium that turns into a roughly ₹10,000 gap once it clears Indian customs. If you specifically collect Balvin's Jordan run, that premium buys you a real piece of a coherent multi-year story. If you just want a clean yellow AJ4, the Black Cat at ₹25,500 does more for less money and skips the import wait entirely.</p>

<p>Styling-wise, treat the croc-texture yellow as the loudest thing in the fit — straight-leg denim, a plain white tee, nothing else competing for attention. Pattern-clash it and the shoe stops reading as a statement piece and starts reading as noise.</p>

<p>For more on how Jordan Brand and adidas both keep using global pop stars to push their retros past basketball and football audiences, our piece on <a href="/blogs/bad-bunny-adidas-ballerina-flamboyan-india-2026">Bad Bunny's adidas Ballerina "Flamboyan"</a> covers the same playbook from the adidas side.</p>`.trim(),
  },
  {
    title: 'Air Jordan 9 OG "Space Jam" 2026: Release Guide & Is It Worth Cop Over the 2016 Pair',
    slug: 'air-jordan-9-space-jam-2026',
    excerpt: 'Air Jordan 9 OG "Space Jam" returns September 19 for the film\'s 30th anniversary, and the 2016 retro before it already trades near double retail on StockX. We weigh chasing the new pair against hunting deadstock, and what either costs landed in India.',
    coverImage: 'https://res.cloudinary.com/dadulg5bs/image/upload/v1789545720/blog-images/air-jordan-9-space-jam-2026-cover.webp',
    author: 'SNKRS CART',
    tags: ['jordan', 'air-jordan-9', 'retro', 'basketball', 'india', 'new-release', 'space-jam', 'sneaker-culture'],
    metaTitle: 'Air Jordan 9 Space Jam 2026 Release Guide | SNKRS CART',
    metaDescription: 'Air Jordan 9 OG "Space Jam" returns September 19 for the film\'s 30th anniversary at $215 — full details, India landed pricing, and if it beats the 2016 retro.',
    metaKeywords: 'Air Jordan 9 Space Jam 2026, IX6179-100 release date, Space Jam Jordan 9 India price, Air Jordan 9 resale value, Jordan 9 30th anniversary, Space Jam retro India',
    published: false,
    content: `<p>Ten years ago, Jordan Brand retro'd the Air Jordan 9 "Space Jam" and watched it settle into one of the steadier resale performers in the line — a pair that still trades for close to double its $190 retail on StockX today. On September 19, the White/Black/True Red colourway comes back again, this time for the film's 30th anniversary, at $215, style code IX6179-100.</p>

<p>So the actual question isn't whether the shoe looks good — it does, and it always has. It's whether you should chase this 2026 retail pair or keep hunting a deadstock 2016 one instead.</p>

<img src="https://res.cloudinary.com/dadulg5bs/image/upload/v1789545727/blog-images/air-jordan-9-space-jam-2026-inline-1.webp" alt="Michael Jordan wearing Air Jordan 9 Space Jam colourway 1996 film still" style="width:100%;border-radius:12px;margin:32px 0;box-shadow:0 4px 24px rgba(0,0,0,0.10);" />

<h2>The Case for the 2026 Pair</h2>
<p>Per <a href="https://sneakerbardetroit.com/air-jordan-9-og-space-jam-2026-release-date/" target="_blank" rel="noopener">Sneaker Bar Detroit</a>, the 2026 retro updates the shape to sit closer to the original 1993 mold than the 2016 version did — a detail purists will notice in the toe spring and heel volume, even if casual buyers won't. White leather covers most of the upper, black nubuck wraps the mudguard and collar, and True Red hits the Jumpman logos, tongue branding, the heel "23," and the globe graphic that ties the shoe back to the film. Every pair ships in Tune Squad-themed packaging with gym artwork printed inside the box lid, and Nike is running full family sizing — adults at $215, which means kids and toddler sizes are covered too, unlike some retros that skip GS entirely.</p>

<p>Buy it new and you get a warranty against defects, a clean box, and zero risk of the fakes that circulate heavily around any Jordan 9 with "Space Jam" in the name. That last point matters more than it sounds — this colourway has been retro'd in 1993, 2002, 2008 as part of a Countdown Pack, 2010, and 2016, and counterfeiters have had three decades of practice.</p>

<h2>The Case for Hunting a 2016 Pair Instead</h2>
<p>The counter-argument is resale math. The 2016 retro debuted at $190 and, per <a href="https://www.nicekicks.com/air-jordan-9-og-space-jam-ix6179-100-drop/" target="_blank" rel="noopener">Nice Kicks</a>' release coverage and current StockX listings, now trades around $325 with a three-month average closer to $360 — roughly a 70-90% premium a decade later. A 30th-anniversary release, by contrast, tends to get a wider allocation than a standalone drop precisely because Jordan Brand wants the anniversary story to reach as many buyers as possible. Wider allocation historically caps how fast resale climbs. If pure investment return is the goal, a well-kept 2016 deadstock pair has already proven its trajectory; the 2026 pair hasn't proven anything yet.</p>

<img src="https://res.cloudinary.com/dadulg5bs/image/upload/v1789545733/blog-images/air-jordan-9-space-jam-2026-inline-2.webp" alt="Air Jordan 9 Space Jam 2026 white black true red side profile detail" style="width:100%;border-radius:12px;margin:32px 0;box-shadow:0 4px 24px rgba(0,0,0,0.10);" />

<p>There's a small history quirk worth untangling here: the Air Jordan 9 first released in 1993, three years before Space Jam hit theatres in 1996 — but this White/Black/True Red colourway is the one Michael Jordan actually wore on-screen and in promotional stills for the film, which is why the "Space Jam" name stuck to it rather than to a shoe that released the same year the movie did. That gap between release year and cultural association is exactly why Jordan Brand keeps retiring and re-releasing it around round-number anniversaries of the film instead of the shoe itself.</p>

<p>On sizing, the Air Jordan 9 nubuck mudguard creases faster than the smooth leather panels around it — expect visible creasing within the first few wears if you're a daily-rotation buyer, not a shelf-only collector. The silhouette itself runs true to size across every retro we've handled, so there's no need to size up or down from your standard Jordan fit.</p>

<h2>India: What This Actually Costs Landed</h2>
<p>Jordan Brand's India presence runs through SNKRS and multi-brand boutiques rather than confirmed day-one retail for every colourway, so treat the $215 US price as a floor, not what you'll pay locally. At roughly ₹96 to the dollar this September, $215 converts to about ₹20,640. Add India's footwear duty stack — 35% basic customs duty, a 10% social welfare surcharge on that duty, and 18% IGST layered on both — and the combined multiplier lands near 1.634×, putting the realistic landed cost around ₹33,700.</p>

<p>For comparison, SNKRS CART's own <a href="/products/air-jordan-1-retro-low-og-chicago-2025">Air Jordan 1 Low OG "Chicago"</a> retails at ₹15,495 and the <a href="/products/air-jordan-4-retro-black-cat-2025">Air Jordan 4 "Black Cat"</a> sits at ₹25,500 — this anniversary Jordan 9 will run meaningfully above both once it clears customs, which is the trade-off of chasing a US-only anniversary release instead of a shoe built for the India market from day one.</p>

<h2>No Live Resale Number Yet — Here's the Honest Version</h2>
<p>Nothing on StockX or GOAT reflects a real 2026 market price as of this writing, because the shoe hasn't released. What we do have is the 2016 pair's decade-long climb, and that's a genuinely useful comparison rather than a guess: Jordan Brand rarely oversaturates the Air Jordan 9 the way it does the 1s and 4s, and the silhouette has held value across three retro cycles now. That's not a promise this pair repeats it — anniversary releases run bigger — but it's a far more honest signal than inventing a premium nobody has paid yet.</p>

<p>We didn't find an active r/SneakersIndia thread on this specific colourway as of publishing — the release is still a few days out, and Indian community chatter tends to pick up once a pair is physically in hands rather than in press images. Once it lands, expect the usual split between VegNonVeg and Superkicks stock checks and SNKRS app allocation complaints; we'll update if a distinct India conversation forms.</p>

<h2>Our Verdict</h2>
<p>Buy the 2026 retail pair if you want to wear it, want family sizing, or want zero counterfeit risk — at $215 it's fairly priced for what Jordan Brand is delivering, and the updated 1993-leaning shape is a real, if subtle, upgrade. Chase a 2016 deadstock pair instead only if resale return is genuinely the point, because that pair has already proven what this one is merely hoping to repeat. We wouldn't pay above retail for either version right now; let the market decide before you do.</p>

<p>For the fuller design lineage behind Jordan Brand's habit of returning to its most photographed OG colourways, see our piece on the <a href="/blogs/air-jordan-1-banned-colorway-story">Air Jordan 1 "Banned" story</a>, which covers the same instinct one silhouette earlier.</p>`.trim(),
  },
  {
    title: 'JENNIE x adidas Superstar Square Toe Ballet: Design Story, Resale Reality & India Price',
    slug: 'jennie-adidas-superstar-square-toe-ballet-2026',
    excerpt: 'JENNIE turned six years of adidas ambassador work into her first co-designed sneaker: a laceless, square-toe Superstar Ballet. Two weeks after release, StockX already shows it trading below retail.',
    coverImage: 'https://res.cloudinary.com/dadulg5bs/image/upload/v1789545746/blog-images/jennie-adidas-superstar-square-ballet-2026-cover.webp',
    author: 'SNKRS CART',
    tags: ['adidas', 'superstar', 'collaboration', 'women-sneakers', 'ballet', 'india', 'new-release', 'k-pop'],
    metaTitle: 'Jennie Adidas Superstar Square Toe India | SNKRS CART',
    metaDescription: 'JENNIE\'s adidas Superstar Square Toe Ballet dropped September 1 at $150 — the ballet redesign, resale reality, and what it actually costs landed in India.',
    metaKeywords: 'Jennie adidas Superstar, adidas Superstar Square Toe Ballet, LB3786 LB3787 release, Jennie adidas India price, K-pop sneaker collab, adidas Originals by Jennie',
    published: false,
    content: `<p>JENNIE has fronted adidas Originals campaigns for years without ever getting her own shoe. That changed on September 1, when the adidas Superstar Square Toe Ballet dropped in two colourways — Off White with Core Black stripes (LB3786) and the reverse Core Black colourway (LB3787) — at $150 each, marking her first official adidas Originals collaboration rather than another season as the face of one.</p>

<p>Two weeks later, the resale numbers are already telling a different story than the launch hype did.</p>

<img src="https://res.cloudinary.com/dadulg5bs/image/upload/v1789545753/blog-images/jennie-adidas-superstar-square-ballet-2026-inline-1.webp" alt="Jennie adidas Superstar Square Toe Ballet black colourway side profile" style="width:100%;border-radius:12px;margin:32px 0;box-shadow:0 4px 24px rgba(0,0,0,0.10);" />

<h2>Fifty-Six Years of Shell Toe, Redesigned for a Ballet Flat</h2>
<p>The Superstar's shell toe has stayed structurally untouched since 1969 — through Run-D.M.C., through a dozen sport-to-street pivots, through every collab adidas has ever tried on it. This one actually changes the shape. The famous rubber shell is squared off rather than rounded, the laces are gone entirely in favour of an elastic midfoot strap, and a small bow sits at the forefoot to push the ballet reference through. Inside, a stitched label pairs the adidas Trefoil with JENNIE's own logo, which is the detail that confirms this was designed with her rather than just licensed to her name.</p>

<p>Per <a href="https://www.soleretriever.com/news/articles/jennie-adidas-superstar-square-toe-ballet-release-date-september-2026" target="_blank" rel="noopener">SoleRetriever's coverage</a>, both colourways stick close to the Superstar's most familiar palette rather than chasing a JENNIE-specific colour story — a deliberate choice to keep the shoe reading as a Superstar first and a collab second.</p>

<h2>Why a Ballet Flat, Why Now</h2>
<p>Ballet flats and Mary Jane-adjacent silhouettes have been creeping into sneaker culture for two years, and adidas picking a K-pop headliner with genuine sneaker-campaign history — rather than a fashion-only ambassador — to front the crossover is a calculated bet that her audience will treat a laceless, elastic-strap Superstar as a legitimate wardrobe piece rather than a novelty. <a href="https://www.highsnobiety.com/p/jennie-adidas-superstar-square-ballet/" target="_blank" rel="noopener">Highsnobiety</a> frames it as adidas doubling down on women's lifestyle footwear specifically, using JENNIE's reach rather than a generic influencer drop to do it.</p>

<img src="https://res.cloudinary.com/dadulg5bs/image/upload/v1789545760/blog-images/jennie-adidas-superstar-square-ballet-2026-inline-2.webp" alt="Jennie adidas Superstar Square Toe Ballet white and black pack overview" style="width:100%;border-radius:12px;margin:32px 0;box-shadow:0 4px 24px rgba(0,0,0,0.10);" />

<p>The timeline actually goes back further than most coverage lets on. JENNIE and adidas first crossed paths in 2020, when BLACKPINK fronted the brand's "Change Is a Team Sport" campaign. She became a standing adidas Originals ambassador in June 2024 through the CLOT Gazelle campaign, and by 2026 she was appearing alongside Samuel L. Jackson, Kendall Jenner, Lamine Yamal and James Harden in adidas's own Superstar campaign — the exact silhouette she'd go on to redesign months later. Six years of ambassador work turning into one co-designed release is a slower, more deliberate arc than most celebrity sneaker deals get, and it shows in how restrained the colourways are: no logo overload, no rebrand of the Trefoil, just a structural change to the shoe itself.</p>

<h2>The Resale Number Nobody Expected</h2>
<p>Here's the honest part: StockX currently shows a lowest ask of $93 on both colourways — roughly $100 with Xpress Ship — against a $150 retail. That's a real, verified figure from an already-released pair, not a projection, and it means the shoe is trading at a 35-38% discount to retail two weeks after launch. Hype at the reveal did not translate into sustained demand once buyers had the shoe in hand. Either the elastic-strap ballet construction reads as more niche than adidas hoped, or JENNIE's audience showed up for the campaign imagery more than for a $150 purchase.</p>

<h2>India: The Fandom Is Real, the Stock Isn't Confirmed</h2>
<p>BLACKPINK's Indian fanbase is large enough that Vans has already tapped it directly with a separate K-pop collab this year, and JENNIE's own reach in India runs through the same channels. adidas hasn't confirmed local stock for this pair through its India storefront, so treat it as an import proposition for now rather than something you'll find at a mall counter.</p>

<p>Run the landed math regardless: at roughly ₹96 to the dollar this September, $150 converts to about ₹14,400. Add India's footwear duty stack — 35% basic customs duty, a 10% social welfare surcharge on that duty, and 18% IGST on both — and the combined 1.634× multiplier puts the realistic landed cost near ₹23,500. For comparison, SNKRS CART's own <a href="/products?brand=Adidas">adidas Samba OG "Cow Print"</a> retails at ₹11,000 — this collab, once imported, will cost roughly double that for a shoe built for looks rather than lockdown.</p>

<p>We didn't find a dedicated r/SneakersIndia thread on this release as of publishing — K-pop footwear collabs tend to surface in Instagram comment sections and fan-club Discord servers before they hit the sneaker subreddits, and this one is no exception. If you're tracking import options, VegNonVeg's international order desk and Superkicks' pre-order requests are the two channels that have historically brought in JENNIE-adjacent adidas releases for Indian buyers, though neither has listed this pair yet.</p>

<h2>Our Take</h2>
<p>Credit where it's due: this is a genuine design reinterpretation, not a colourway-only celebrity tie-in. Removing the laces, squaring the toe, and adding a tonal midsole took real work, and it's more thoughtful than most K-pop sneaker collabs bother to be. But a ballet-flat Superstar sacrifices the thing sneakers are actually for — there's no lockdown, no lace tension, no real support, which makes this a fashion statement rather than an everyday shoe.</p>

<p>Given StockX is already sitting below retail, we wouldn't pay the full ₹23,500 landed price right now. Wait a few more weeks; a shoe already discounting at two weeks old is unlikely to reverse course before it discounts further. Style it the way the campaign does — cropped trousers or a midi skirt, bare ankle, nothing bulky competing with the squared-off toe.</p>

<p>For more on how K-pop artists are reshaping which sneakers actually reach Indian shelves, see our piece on the <a href="/blogs/vans-kpop-demon-hunters-golden-india-2026">Vans x KPop Demon Hunters "Golden"</a> collab and why India didn't get an allocation of that one either.</p>`.trim(),
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
