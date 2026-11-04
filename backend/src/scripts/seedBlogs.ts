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
  {
    title: "Nike Vegam Run: Nike's First Running Shoe Built for India Costs ₹3,795",
    slug: 'nike-vegam-run-india-price-flipkart-2026',
    excerpt: "Nike built a running shoe for Indian runners first and the rest of the world second. The Vegam Run costs ₹3,795, went on sale in India on November 1, and undercuts every Nike trainer in the Indian catalogue.",
    coverImage: "https://res.cloudinary.com/dadulg5bs/image/upload/v1793779488/blog-images/nike-vegam-run-india-price-flipkart-2026-cover.jpg",
    author: 'SNKRS CART',
    tags: ["nike", "running", "india", "new-release", "nike-vegam-run", "flipkart", "running-shoes"],
    metaTitle: "Nike Vegam Run Price in India ₹3,795 | SNKRS CART",
    metaDescription: "Nike Vegam Run price in India is ₹3,795 on Flipkart from November 1. Specs, colourways, how it compares with Run Defy and Revolution 8, and who should buy it.",
    metaKeywords: "Nike Vegam Run price India, Nike Vegam Run Flipkart, Nike running shoe made for India, Nike Vegam Run colourways, budget Nike running shoes India 2026, Nike Vegam Run vs Revolution 8, Nike After Dark Tour Mumbai",
    published: false,
    template: 'v2',
    content: `
<p>₹3,795. That is the number Nike put on the Vegam Run, and it is the most interesting thing the brand has done in India in years. No collab. No retro. Just a daily trainer made with Indian runners, under four grand, on sale since November 1 through <a href="https://www.flipkart.com/" target="_blank" rel="noopener">Flipkart</a> and a handful of retail stores.</p>

<p>Nike's own <a href="https://about.nike.com/newsroom/releases/nike-vegam-run-is-built-for-the-next-generation-of-india-runners" target="_blank" rel="noopener">newsroom release</a> calls it the brand's first running shoe for India, developed with runners and athletes here. Vegam is the Tamil word for speed, as <a href="https://www.esquireindia.co.in/style/just-landed/nike-vegam-run-price-specs-colourways-where-to-buy-launch-date" target="_blank" rel="noopener">Esquire India</a> points out. Other markets get it in 2027. For once, we are first in line.</p>

<img src="https://res.cloudinary.com/dadulg5bs/image/upload/v1793779494/blog-images/nike-vegam-run-india-price-flipkart-2026-inline-1.jpg" alt="Nike Vegam Run Lemon Venom colourway India launch November 2026" style="width:100%;border-radius:12px;margin:32px 0;box-shadow:0 4px 24px rgba(0,0,0,0.10);" />

<h2>What the Vegam Run Actually Is</h2>

<p>Strip away the launch copy and the spec sheet is short. Engineered mesh upper. Full-length foam midsole. A stacked, textured rubber outsole with extra rubber wrapped around the perimeter for wear. Pull tabs at the heel. That is it.</p>

<p>Notice what is missing. Nike does not name the foam. No ReactX, no ZoomX, no Air unit. When Nike leaves the foam unnamed, it is almost never the premium stuff, and that is fine at this price. This is a shoe for the 5K park run, the 6 a.m. society loop and the walk to the metro after. It is not trying to be a Pegasus.</p>

<p>Weight, heel-to-toe drop and width are not in Nike's release or in any of the coverage we read. So if you have a wide forefoot, and plenty of Indian feet do, try a pair on in store before you click buy on Flipkart.</p>

<p>The speed of development is the other detail worth your attention. According to Nike, it took 55 days to go from design brief to confirmed product and about five months from concept to launch. For a company that usually works on multi-year cycles, that is a sprint.</p>

<h2>Colourways, Price and Where to Buy in India</h2>

<p>Esquire India lists two launch colourways: Hyper Pink with silver metallic accents and Lemon Venom with Black and Wolf Grey. A third, tied to Nike's After Dark Tour stop in Mumbai in December, follows. Both launch pairs are loud on purpose. You will be seen on the road at 5:30 a.m.</p>

<p>On price, ignore the ₹3,750 you may have seen on Sneaker Bar Detroit. Esquire India, <a href="https://houseofheat.co/nike/nike-vegam-run-release-date" target="_blank" rel="noopener">House of Heat</a> and <a href="https://openthemagazine.com/business/is-nike-doing-a-xiaomi-why-its-3795-running-shoe-is-launching-on-flipkart" target="_blank" rel="noopener">Open Magazine</a> all list ₹3,795. At the open.er-api rate of ₹94.83 to the dollar on 4 November 2026, that works out to roughly $40.</p>

<p>Forget dollars. Look at the shelf. When Open Magazine checked Nike India's catalogue on October 29, the Run Defy sat at ₹3,995, the Revolution 8 at ₹4,295 and the Downshifter 14 at ₹4,895. Vegam beats all three. It also has to fight the adidas Adivat, which Open found discounted to ₹1,620 from an MRP of ₹3,599, and Decathlon's Ekiden One at ₹999.</p>

<p>Stock is thin. Flipkart plus a few stores now; Nike's Indian retail partners get it in spring 2027. Open Magazine says Flipkart has no exclusivity, so the usual Nike doors will carry it later.</p>

<img src="https://res.cloudinary.com/dadulg5bs/image/upload/v1793779501/blog-images/nike-vegam-run-india-price-flipkart-2026-inline-2.jpg" alt="Nike Vegam Run Hyper Pink colourway with silver Swoosh and stacked foam midsole" style="width:100%;border-radius:12px;margin:32px 0;box-shadow:0 4px 24px rgba(0,0,0,0.10);" />

<h2>Why Flipkart, and Why Now</h2>

<p>Open Magazine's headline asks whether Nike is "doing a Xiaomi," Fair question. Xiaomi sold the Mi 3 on Flipkart from July 22, 2014, at ₹13,999, and built its whole India business online. Nike wants the channel. Not the exclusivity.</p>

<p>The backdrop is not subtle either. Nike reported Q1 FY27 revenue of $11.2 billion, down 4 percent year on year, with direct sales down 8 percent, per the same Open piece. Greater China is still the problem child. On October 1 Nike announced a campus in Bengaluru, which we covered in our <a href="/blogs/nike-bengaluru-campus-india-2026">Nike Bengaluru campus breakdown</a>. A made-for-India runner a month later is not a coincidence. It is a strategy.</p>

<p>Deepa Ramprasad, Senior Director of Nike Road Running Footwear, put it plainly in the release: "Our ambition with Vegam Run was simple: Honor the voice of the runner in India and build what they need." Tarundeep Singh, General Manager of Nike India, called it "an invitation to running for more athletes in India and around the world."</p>

<p>Ashita Aggarwal, professor of marketing at SP Jain Institute of Management and Research, gave Open Magazine the counterpoint: "Rivals can defend their position through value and dependable availability." She is right. Under ₹4,000, the Swoosh alone does not win. Stock in your size, at your pincode, wins.</p>

<h2>Our Take: Buy It as a Starter, Not as a Statement</h2>

<p>Here is the honest read. If you are new to running, or you have been doing your weekday kilometres in a pair of casual sneakers, the Vegam Run is the easiest Nike recommendation we have made in a long time. Rubber where it wears, mesh that should cope with humid mornings, a price that does not hurt.</p>

<p>If you already own a Pegasus or a Novablast, skip it. Nothing on the spec sheet suggests it will outrun what you have, and Nike has not told us enough about the foam to argue otherwise.</p>

<p>And a word on resale, since someone will ask. There is no resale story here and there should not be. It is a ₹3,795 general release built to be worn out. Anyone listing it above retail on a marketplace is selling you impatience, not scarcity.</p>

<p>Styling is easy. Lemon Venom with black track pants and a plain white tee for the morning run, Hyper Pink with grey sweats for the coffee after. Do not overthink a trainer.</p>

<p>The bigger point is what this shoe says. Nike built something for Indian runners first and the rest of the world second. That has not happened before, and we hope it happens again. If you want more Nike on your feet while you wait for spring stock, browse our <a href="/products?brand=Nike">Nike collection</a>.</p>

<p>Running a marathon this season? Our <a href="/blogs/india-marathon-boom-running-shoes-asics-nike-adidas-2026">guide to India's marathon boom and the shoes people are actually racing in</a> picks up where this one stops.</p>
`.trim(),
  },
  {
    title: "Nike Doernbecher Freestyle 22: Six Kid-Designed Pairs and the India Import Math",
    slug: 'nike-doernbecher-freestyle-22-collection-india-2027',
    excerpt: "A British alien named Greg is about to sell out an Air Jordan 11 Low. Six young patients designed the Doernbecher Freestyle 22 collection, out in January 2027, and here is what each pair costs once it lands in India.",
    coverImage: "https://res.cloudinary.com/dadulg5bs/image/upload/v1793779506/blog-images/nike-doernbecher-freestyle-22-collection-india-2027-cover.webp",
    author: 'SNKRS CART',
    tags: ["nike", "jordan", "air-jordan-11", "doernbecher", "charity", "collaboration", "india", "acg"],
    metaTitle: "Nike Doernbecher Freestyle 22 Collection India | SNKRS CART",
    metaDescription: "Nike Doernbecher Freestyle 22 collection: six kid-designed pairs, an Air Jordan 11 Low IE, style codes, US prices, the January 2027 date and India landed cost.",
    metaKeywords: "Nike Doernbecher Freestyle 22 collection, Air Jordan 11 Low IE Doernbecher, Doernbecher 2027 release date, Nike ACG Rufus Doernbecher, Doernbecher sneakers India price, import Nike shoes India customs duty, what is Nike Doernbecher",
    published: false,
    template: 'v3',
    content: `
<p>A British alien named Greg is going to sell out an Air Jordan. That sentence only makes sense in one place: the Nike Doernbecher Freestyle program, where kids being treated at OHSU Doernbecher Children's Hospital in Portland design real Nike and Jordan shoes, and every dollar of profit goes back to the hospital.</p>

<p>Edition 22 went under the hammer first, at a charity auction in Portland on October 16, 2026. Six kids. Six shoes. Retail follows in January 2027 on SNKRS and at select stores. Per <a href="https://www.soleretriever.com/news/articles/nike-doernbecher-freestyle-22-collection-release-date-january-2027" target="_blank" rel="noopener">Sole Retriever</a> and <a href="https://sneakerbardetroit.com/nike-doernbecher-freestyle-22-collection-2027/" target="_blank" rel="noopener">Sneaker Bar Detroit</a>, the program has pulled in more than $44 million since 2004.</p>

<img src="https://res.cloudinary.com/dadulg5bs/image/upload/v1793779511/blog-images/nike-doernbecher-freestyle-22-collection-india-2027-inline-1.jpg" alt="Air Jordan 11 Low IE Doernbecher by Avery Wilson IX8191-922" style="width:100%;border-radius:12px;margin:32px 0;box-shadow:0 4px 24px rgba(0,0,0,0.10);" />

<h2>What Is Nike Doernbecher, and Why These Pairs Hit Different</h2>

<p>Most collabs start with a moodboard. These start with a kid's year: a transplant, a scar, the day treatment ended. Nike's designers handle the build. The stories are the patients' own. That is why collectors still hunt old Doernbechers when last month's hype pair is forgotten.</p>

<p>Twenty-two years in, the format has not changed much. It has not needed to. The shoes are weird, personal and very obviously not made by a trend forecaster. That is the point.</p>

<p>Look at this year's silhouette list too. One Jordan. A stability runner in the Structure Plus, a trail shoe in the ACG Rufus, a basketball shoe in the GT Future and a hybrid Air Max that stitches two classics together. It reads less like a hype pack and more like six kids picking what they actually wear, which is exactly how it should read.</p>

<h2>The Six Pairs, One by One</h2>

<p><strong>Air Jordan 11 Low IE by Avery Wilson.</strong> Avery, 13 according to Sneaker Bar Detroit, lives with OCD and ADHD and covered the shoe in characters she invented, Greg the British alien included. The word "neurospicy" appears on the pair, and a license-plate pin reading 143 honours her grandfather, Poppy. Style code IX8191-922, $200 per both Sole Retriever and Sneaker Bar Detroit.</p>

<p><strong>Nike Air Max 1/97 by Owen William Flint.</strong> Owen, 11, had a kidney transplant. His pair mixes superheroes, baseball and dirt bikes: the number 88, a spinning-wheel lace charm, a biker keychain and mud-style splatter. IX8189-922, $170.</p>

<p><strong>Nike ACG Rufus by Charlye Cosgrove.</strong> Charlye, 15, was treated for osteosarcoma. Pink camo from the shoes she wore as a baby, fuzzy green material that reads like Pacific Northwest moss, graphics that only show in sunlight, and a hidden stitched tag marking June 11, 2025, the day she finished treatment. IX8187-922, $120.</p>

<p><strong>Nike Air Force 1 Mid by Royce Short.</strong> Royce, 12, was born with a tracheoesophageal fistula. Rodeo is the theme: a belt-buckle closure, rope laces, branding for the bucking-bull business he wants to start, and an inside print that doubles as a map of places he plans to visit. IX8197-922. Sneaker Bar Detroit lists it at $140; Sole Retriever still has the price as TBD.</p>

<p><strong>Nike Structure Plus by Aurora Loss.</strong> Aurora is 9 and has had a kidney transplant. She wants to run a hotel one day. Her shoe goes full kawaii: fluffy pink, cherry blossoms, an anime character, a bow you can pull off and a charm bracelet that clips on. IX8192-922, $170.</p>

<p><strong>Nike GT Future by Kamoryn Marshall.</strong> Kamoryn got a new hip at 12. During recovery he pictured goldfish swimming down from the ceiling, and they made it onto the shoe. Chrome Swoosh for the titanium hip. Stitching along the scar line. And on the sole: "If you see this, you're too late." No style code or price yet.</p>

<img src="https://res.cloudinary.com/dadulg5bs/image/upload/v1793779516/blog-images/nike-doernbecher-freestyle-22-collection-india-2027-inline-2.jpg" alt="Nike ACG Rufus Doernbecher by Charlye Cosgrove pink camo and moss green" style="width:100%;border-radius:12px;margin:32px 0;box-shadow:0 4px 24px rgba(0,0,0,0.10);" />

<h2>What These Cost if You Import Them to India</h2>

<p>None of the sources we checked lists an India release for the collection. So for most buyers here, a Doernbecher pair means ordering from the US or a resale platform and paying customs on arrival.</p>

<p>The current duty stack under HSN 64039120, per the <a href="https://eximpe.com/hsncode-finder/64039120" target="_blank" rel="noopener">EximPe duty calculator</a> (rates as at May 13, 2026): 20 percent basic customs duty, an agriculture cess equal to 20 percent of that duty, a 10 percent social welfare surcharge on both, then 18 percent IGST on the lot. That comes to 49.15 percent, or about 1.49 times the declared value.</p>

<p>At the open.er-api rate of ₹94.83 to the dollar on 4 November 2026, before shipping:</p>

<ul>
<li>Air Jordan 11 Low IE, $200: about ₹18,970 at retail, roughly ₹28,290 landed</li>
<li>Air Max 1/97 or Structure Plus, $170: about ₹16,120, roughly ₹24,050 landed</li>
<li>Air Force 1 Mid, $140: about ₹13,280, roughly ₹19,800 landed</li>
<li>ACG Rufus, $120: about ₹11,380, roughly ₹16,970 landed</li>
</ul>

<p>That is if you get a pair at retail. On resale there is nothing to quote yet. The shoes do not release until January 2027, so there is no real market on these style codes, only the auction pairs that went in Portland. Anyone quoting you a premium in November is guessing.</p>

<h2>Our Verdict: Chase the Jordan, Wear the Rufus</h2>

<p>The Avery Wilson Jordan 11 Low IE is the pair that goes first. Jordan branding, a $200 tag and a story that is impossible not to like. If you only try for one, try for this one, and be ready to lose.</p>

<p>The sleeper is the ACG Rufus. At $120 it is the cheapest pair in the set, and Charlye's sunlight-reactive graphics and moss texture make it the most interesting object of the six. It is also the one you can actually wear through a Bengaluru monsoon without crying about it.</p>

<p>Skip the idea of flipping any of these. Buying a Doernbecher to resell misses why the program exists. Buy the pair whose story you want on your feet.</p>

<img src="https://res.cloudinary.com/dadulg5bs/image/upload/v1793779523/blog-images/nike-doernbecher-freestyle-22-collection-india-2027-inline-3.jpg" alt="Nike Structure Plus Doernbecher by Aurora Loss kawaii pink cherry blossom design" style="width:100%;border-radius:12px;margin:32px 0;box-shadow:0 4px 24px rgba(0,0,0,0.10);" />

<p>January is a long way off. In the meantime, our <a href="/products?brand=Jordan">Jordan collection</a> has pairs in stock that ship within India without the customs math.</p>

<p>Thinking about importing anyway? Read how the numbers worked out on our <a href="/blogs/air-jordan-12-sumo-japan-import-india-2026">Air Jordan 12 Sumo Japan import guide</a>, and if Jordan 11s are your thing, the <a href="/blogs/comme-des-garcons-air-jordan-11-india-2026">Comme des Garçons Air Jordan 11 story</a> is the other one worth your time this year.</p>
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
