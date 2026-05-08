import 'dotenv/config';
import { connectDB } from '../config/database';
import { SneakerProfile } from '../models/SneakerProfile';

const profiles = [
  {
    slug: 'adidas-gazelle',
    name: 'Adidas Gazelle',
    brand: 'Adidas',
    tagline: "Adidas's first suede shoe — from training pitch to street icon since 1966.",
    description: `The Adidas Gazelle began as a training shoe in 1966, evolving from the brand's earlier Olympiade model. At launch it was unique as Adidas's first shoe crafted from suede rather than canvas or leather, immediately setting it apart from everything else in the catalogue. The original Gazelle came in two versions: a red outdoor model and a blue indoor version, each featuring specific traction suited to its environment.

In 1979, Adidas revisited the Gazelle and introduced a transparent sole, giving the Indoor version a distinctive silhouette described as longer and less bulky than the standard model. The Indoor's trefoil-patterned outsole became a defining detail of the shoe.

Over subsequent decades the Gazelle moved well beyond the training ground. It found a home in the British Britpop and hip-hop scenes of the 1980s and 1990s as an affordable yet stylish alternative to pricier offerings. The shoe experienced a fresh cultural surge in 2023 when Harry Styles wore the Gazelle Indoor on his Love On Tour, with fans coining the nickname "Satellite Stompers." The Adidas Originals line has continued to reissue the Gazelle across updated colourways and contemporary variants including the Bold and ADV.`,
    releaseYear: 1966,
    designer: '',
    silhouette: 'low',
    category: 'lifestyle',
    originalRetailPrice: null,
    searchTags: ['adidas gazelle', 'adidas gazelle indoor', 'gazelle suede', 'adidas originals', 'gazelle shoes'],
    relatedSlugs: ['adidas-samba', 'adidas-stan-smith', 'adidas-campus'],
    image: 'https://res.cloudinary.com/dadulg5bs/image/upload/v1778224941/blog-images/sneaker-profile-adidas-gazelle.jpg',
    published: true,
  },
  {
    slug: 'adidas-superstar',
    name: 'Adidas Superstar',
    brand: 'Adidas',
    tagline: 'The shell toe that conquered basketball courts, then conquered the world.',
    description: `Introduced in 1969 as a low-top version of Adidas's Pro Model basketball shoe, the Adidas Superstar marked a turning point for both the brand and the sport. It was the first low-top basketball shoe to feature an all-leather upper, offering enhanced support compared to the canvas alternatives that dominated the market at the time. The shoe's most recognisable feature — its rubber shell toe cap — quickly earned it a set of enduring nicknames: "shell toe," "shell shoe," and "shell top."

The Superstar's adoption by NBA players was rapid. Legends including Kareem Abdul-Jabbar and George Gervin wore the shoe, and by 1973 reportedly more than 75 percent of all NBA players were wearing Superstars on the court.

The shoe's cultural trajectory shifted decisively in 1986, when hip-hop group Run-DMC released "My Adidas" — a track written in direct celebration of the shell-toe silhouette. The resulting partnership between Adidas and Run-DMC became the first endorsement deal ever struck between a hip-hop artist and a major corporation. Since then, the Superstar has remained one of streetwear's defining silhouettes, reissued in hundreds of colourways and collaborations across more than five decades.`,
    releaseYear: 1969,
    designer: '',
    silhouette: 'low',
    category: 'basketball',
    originalRetailPrice: null,
    searchTags: ['adidas superstar', 'shell toe', 'adidas shell toe', 'run dmc adidas', 'adidas superstar white'],
    relatedSlugs: ['adidas-samba', 'adidas-gazelle', 'adidas-stan-smith'],
    image: 'https://res.cloudinary.com/dadulg5bs/image/upload/v1778224947/blog-images/sneaker-profile-adidas-superstar.jpg',
    published: true,
  },
  {
    slug: 'new-balance-574',
    name: 'New Balance 574',
    brand: 'New Balance',
    tagline: 'The most New Balance shoe ever made.',
    description: `The New Balance 574 launched in 1988 as a budget-friendly option within New Balance's 500 series, a range originally aimed at off-road runners. Designed by Steven Smith, the 574 was built from existing components: the upper borrowed from the 576, while the sole was taken from the then-unreleased 577. The resulting shoe was practical and unpretentious — an accessible entry point into the New Balance catalogue without sacrificing quality.

Central to the 574's construction is ENCAP technology: a midsole system in which soft EVA foam is encapsulated within a rigid polyurethane outer ring. This unit sits under the heel, delivering both cushioned comfort and structural support. The upper pairs durable suede panels with breathable mesh for a construction that has remained consistent across decades.

What elevated the 574 from a catalogue footnote to a genuine icon was its restraint. Its grey tonal colourways became synonymous with the understated "dad shoe" aesthetic that New Balance helped define. The 574 is often cited by New Balance as the most iconic shoe in the brand's history, and it continues to anchor the brand's originals range alongside the 550 and 990 series.`,
    releaseYear: 1988,
    designer: 'Steven Smith',
    silhouette: 'low',
    category: 'lifestyle',
    originalRetailPrice: null,
    searchTags: ['new balance 574', 'nb 574', 'new balance grey', 'new balance 574 grey', 'new balance dad shoe'],
    relatedSlugs: ['new-balance-550', 'new-balance-990v6', 'adidas-samba'],
    image: 'https://res.cloudinary.com/dadulg5bs/image/upload/v1778224954/blog-images/sneaker-profile-new-balance-574.jpg',
    published: true,
  },
  {
    slug: 'air-jordan-5',
    name: 'Air Jordan 5',
    brand: 'Jordan',
    tagline: 'Inspired by a WWII fighter plane, built for Michael Jordan to fly.',
    description: `The Air Jordan 5 released in February 1990, designed by Tinker Hatfield, and is widely regarded as one of the most significant shoes in the Jordan Brand lineage. For the fifth signature model, Hatfield drew inspiration from the WWII Mustang fighter aircraft — translating aerodynamic cues into a mid-top basketball silhouette worn by Michael Jordan during a standout period of his career.

The Jordan 5 introduced several design elements new to the Air Jordan line. A reflective tongue with a protruding design was added for high-visibility on court. Translucent rubber soles — a first for the line — gave the shoe a contemporary look unlike anything else in basketball footwear at the time. Lace locks were also introduced, keeping laces secured during aggressive play. The shoe launched at $125 USD in colourways including Fire Red, Grape, and Black Metallic.

Beyond basketball, the Jordan 5 gained lasting cultural traction through its appearances in The Fresh Prince of Bel-Air, where Will Smith wore the Metallic Silver, Grape, and Fire Red colourways across multiple episodes. Jordan Brand subsequently released tribute "Bel Air" editions in 2013 and 2020 to honour this cultural connection.`,
    releaseYear: 1990,
    designer: 'Tinker Hatfield',
    silhouette: 'mid',
    category: 'basketball',
    originalRetailPrice: 125,
    searchTags: ['air jordan 5', 'jordan 5', 'jordan 5 fire red', 'jordan 5 retro', 'tinker hatfield jordan'],
    relatedSlugs: ['air-jordan-4', 'air-jordan-3', 'air-jordan-1'],
    image: 'https://res.cloudinary.com/dadulg5bs/image/upload/v1778224964/blog-images/sneaker-profile-air-jordan-5.jpg',
    published: true,
  },
  {
    slug: 'nike-air-max-1',
    name: 'Nike Air Max 1',
    brand: 'Nike',
    tagline: 'The shoe that made the invisible visible — the first Nike with exposed Air.',
    description: `The Nike Air Max 1 released on March 26, 1987, and permanently changed how sneakers are conceived. Tinker Hatfield — who trained as an architect before joining Nike's design team — drew direct inspiration from a visit to the Centre Georges Pompidou in Paris. The Pompidou building, designed by Renzo Piano and Richard Rogers, placed all functional infrastructure on the exterior rather than concealing it inside. Hatfield applied the same principle to footwear: he removed part of the midsole to expose the Air-cushioning unit rather than hide it.

The result was the first sneaker to feature a visible air bubble in the sole. Nike's Air technology had been patented in 1979 but had remained concealed in previous models. Hatfield reduced the exposed unit's size from early prototypes after engineers warned that a larger bubble risked cracking in cold temperatures. The final Air Max 1 placed a small visible unit under the heel, delivering responsive cushioning while making the technology the visual centrepiece of the design.

Since its 1987 debut, the Air Max 1 has been rereleased continuously and inspired a lineage of Air Max models that remains one of Nike's most commercially significant product families. Air Max Day — celebrated annually on March 26 — marks the anniversary of the original release.`,
    releaseYear: 1987,
    designer: 'Tinker Hatfield',
    silhouette: 'low',
    category: 'running',
    originalRetailPrice: null,
    searchTags: ['nike air max 1', 'air max 1', 'nike air max 87', 'nike air max og', 'tinker hatfield air max'],
    relatedSlugs: ['nike-air-max-90', 'nike-air-max-97', 'nike-air-force-1'],
    image: 'https://res.cloudinary.com/dadulg5bs/image/upload/v1778224970/blog-images/sneaker-profile-nike-air-max-1.jpg',
    published: true,
  },
];

async function seed() {
  await connectDB();
  for (const p of profiles) {
    const exists = await SneakerProfile.findOne({ slug: p.slug });
    if (exists) { console.log('⏭  Skip:', p.slug); continue; }
    const created = await SneakerProfile.create(p);
    console.log('✅ Added:', created.name, '|', created.slug);
  }
  process.exit(0);
}

seed().catch(e => { console.error('❌', e.message); process.exit(1); });
