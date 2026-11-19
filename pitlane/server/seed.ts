import {db, initSchema} from './db.ts';
import {hashPassword} from './auth.ts';
import {DEFAULT_CURRENCIES, DEFAULT_SHIPPING_ZONES} from './pricing.ts';

const IMG = {
  hero: '/src/assets/images/hero_pitlane_campaign_1795087933257.jpg',
  hoodie: '/src/assets/images/product_apex_hoodie_1795087933583.jpg',
  jacket: '/src/assets/images/product_paddock_jacket_1795087933898.jpg',
  tee: '/src/assets/images/product_telemetry_tee_1795087933704.jpg',
  cap: '/src/assets/images/product_monocoque_cap_1795087933375.jpg',
  diecast: '/src/assets/images/product_diecast_collector_1795087933569.jpg',
  joggers: '/src/assets/images/product_trackside_joggers_1795087933442.jpg',
  circuit: '/src/assets/images/editorial_circuit_night_1795087933791.jpg',
  womensJacket: '/src/assets/images/product_womens_racing_jacket_1795088860304.jpg',
  womensTracksuit: '/src/assets/images/product_womens_tracksuit_1795088860640.jpg',
  windbreaker: '/src/assets/images/product_windbreaker_shell_1795088861071.jpg',
  jumpsuit: '/src/assets/images/product_motorsport_jumpsuit_1795088860587.jpg',
  polo: '/src/assets/images/product_paddock_polo_1795088860361.jpg',
  backpack: '/src/assets/images/product_pitlane_backpack_1795088860786.jpg',
  watch: '/src/assets/images/product_chronograph_watch_1795088860573.jpg',
};

interface SeedProduct {
  name: string;
  slug: string;
  skuPrefix: string;
  description: string;
  material: string;
  washing: string;
  fit: string;
  price: number;
  discount: number;
  cat: string;
  col: string;
  gender: 'MALE' | 'FEMALE' | 'UNISEX';
  featured: number;
  newArrival: number;
  bestseller: number;
  limited: number;
  edition: string;
  images: string[];
  variants: Array<{
    size: string;
    color: string;
    hex: string;
    stock: number;
    priceOverride?: number;
  }>;
}

const CATALOG_PRODUCTS: SeedProduct[] = [
  {
    name: 'Apex Heavyweight Paddock Hoodie',
    slug: 'apex-heavyweight-paddock-hoodie',
    skuPrefix: 'PTL-HD-01',
    description:
      'Engineered from 480gsm combed cotton French terry with precision racing red twin-needle seam piping, structured double-layer hood, and tonal woven chassis specification patch.',
    material: '100% Combed Organic Cotton · 480 GSM Heavyweight Loopback Terry',
    washing: 'Machine wash cold inside out (30°C). Do not tumble dry. Iron on reverse.',
    fit: 'Boxy dropped-shoulder silhouette. Take your true size for an editorial drape.',
    price: 11500,
    discount: 0,
    cat: 'hoodies',
    col: 'midnight-racing',
    gender: 'MALE',
    featured: 1,
    newArrival: 1,
    bestseller: 1,
    limited: 0,
    edition: 'DROP 04 // CORE',
    images: [IMG.hoodie, IMG.hero],
    variants: [
      {size: 'S', color: 'Matte Black', hex: '#111315', stock: 12},
      {size: 'M', color: 'Matte Black', hex: '#111315', stock: 18},
      {size: 'L', color: 'Matte Black', hex: '#111315', stock: 14},
      {size: 'XL', color: 'Matte Black', hex: '#111315', stock: 7},
      {size: 'M', color: 'Carbon Slate', hex: '#38393C', stock: 6},
      {size: 'L', color: 'Carbon Slate', hex: '#38393C', stock: 5},
    ],
  },
  {
    name: 'Monocoque Technical Racing Jacket',
    slug: 'monocoque-technical-racing-jacket',
    skuPrefix: 'PTL-JK-02',
    description:
      'Structured 3-layer weather-sealed paddock bomber featuring a storm stand collar, articulated elbow darts, concealed storm-flap pockets, and anodized matte black hardware.',
    material: 'Shell: 100% Ripstop Technical Nylon (DWR Finish) · Lining: Breathable Micro-Mesh',
    washing: 'Wipe clean or gentle cold wash at 30°C. Hang dry away from direct heat.',
    fit: 'Tailored motorsport cut with room for layering over a midweight hoodie.',
    price: 22500,
    discount: 10,
    cat: 'racing-jackets',
    col: 'trackside',
    gender: 'MALE',
    featured: 1,
    newArrival: 1,
    bestseller: 1,
    limited: 1,
    edition: 'EDITION // 050/150',
    images: [IMG.jacket, IMG.hero],
    variants: [
      {size: 'S', color: 'Black / Pitlane Red', hex: '#EF2929', stock: 4},
      {size: 'M', color: 'Black / Pitlane Red', hex: '#EF2929', stock: 9},
      {size: 'L', color: 'Black / Pitlane Red', hex: '#EF2929', stock: 8},
      {size: 'XL', color: 'Black / Pitlane Red', hex: '#EF2929', stock: 3},
    ],
  },
  {
    name: "Apex Women's Cropped Racing Jacket",
    slug: 'apex-womens-cropped-racing-jacket',
    skuPrefix: 'PTL-WJK-09',
    description:
      'Tailored women’s cropped paddock jacket combining grained matte black panels with Pitlane Red shoulder ribbing, snap-tab collar, and brushed steel zip hardware.',
    material: 'Outer: Technical Vegan Leather & Ballistic Nylon Panels · Satin Twill Lining',
    washing: 'Professional specialist spot clean only.',
    fit: "Contoured women's cropped waist silhouette.",
    price: 21500,
    discount: 0,
    cat: 'racing-jackets',
    col: 'midnight-racing',
    gender: 'FEMALE',
    featured: 1,
    newArrival: 1,
    bestseller: 1,
    limited: 1,
    edition: 'WOMEN // DROP 04',
    images: [IMG.womensJacket],
    variants: [
      {size: 'XS', color: 'Black / Crimson', hex: '#EF2929', stock: 6},
      {size: 'S', color: 'Black / Crimson', hex: '#EF2929', stock: 11},
      {size: 'M', color: 'Black / Crimson', hex: '#EF2929', stock: 9},
      {size: 'L', color: 'Black / Crimson', hex: '#EF2929', stock: 5},
    ],
  },
  {
    name: "Velocity Women's Fitted Tracksuit",
    slug: 'velocity-womens-fitted-tracksuit',
    skuPrefix: 'PTL-WTS-10',
    description:
      'Two-piece women’s motorsport tracksuit pairing a sculpted zip paddock jacket with flared seam-piped track pants in 340gsm double-knit technical interlock.',
    material: '78% Polyamide · 22% Elastane · 340 GSM Sculpted Interlock',
    washing: 'Machine wash cold at 30°C on delicate cycle. Hang dry.',
    fit: "Tailored women's athletic cut with elongated leg drape.",
    price: 16800,
    discount: 0,
    cat: 'tracksuits',
    col: 'trackside',
    gender: 'FEMALE',
    featured: 1,
    newArrival: 1,
    bestseller: 0,
    limited: 0,
    edition: 'WOMEN // TRACKSIDE',
    images: [IMG.womensTracksuit],
    variants: [
      {size: 'XS', color: 'Obsidian / Red Piping', hex: '#111315', stock: 8},
      {size: 'S', color: 'Obsidian / Red Piping', hex: '#111315', stock: 12},
      {size: 'M', color: 'Obsidian / Red Piping', hex: '#111315', stock: 10},
      {size: 'L', color: 'Obsidian / Red Piping', hex: '#111315', stock: 6},
    ],
  },
  {
    name: 'Paddock Utility Belted Jumpsuit',
    slug: 'paddock-utility-belted-jumpsuit',
    skuPrefix: 'PTL-JMP-11',
    description:
      'Full-length utilitarian pit crew jumpsuit cut for women in durable charcoal cotton-ripstop with articulated knee pleats, cargo thigh pockets, and anodized red Cobra waist buckle.',
    material: '97% Cotton Ripstop · 3% Elastane · 310 GSM',
    washing: 'Cold machine wash separately. Line dry.',
    fit: 'Adjustable waist belt with relaxed tapered leg.',
    price: 19200,
    discount: 0,
    cat: 'jumpsuits',
    col: 'speed-culture',
    gender: 'FEMALE',
    featured: 1,
    newArrival: 1,
    bestseller: 1,
    limited: 0,
    edition: 'PADDOCK // 11',
    images: [IMG.jumpsuit],
    variants: [
      {size: 'XS', color: 'Charcoal Slate', hex: '#38393C', stock: 5},
      {size: 'S', color: 'Charcoal Slate', hex: '#38393C', stock: 9},
      {size: 'M', color: 'Charcoal Slate', hex: '#38393C', stock: 8},
      {size: 'L', color: 'Charcoal Slate', hex: '#38393C', stock: 4},
    ],
  },
  {
    name: 'Paddock Pit-Wall Windbreaker Shell',
    slug: 'paddock-pit-wall-windbreaker',
    skuPrefix: 'PTL-WB-12',
    description:
      'Ultralight water-repellent pit-wall anorak built with sealed chest storm zip, carbon ripstop yoke panels, and storm-toggle hood for sudden circuit downpours.',
    material: '100% Matte Micro-Ripstop Nylon · 5000mm DWR Coating',
    washing: 'Cold gentle wash. Re-activate DWR with low warm iron over cloth.',
    fit: 'Relaxed technical shell engineered for layering.',
    price: 15900,
    discount: 0,
    cat: 'windbreakers',
    col: 'trackside',
    gender: 'MALE',
    featured: 1,
    newArrival: 1,
    bestseller: 0,
    limited: 0,
    edition: 'TRACKSIDE // 12',
    images: [IMG.windbreaker],
    variants: [
      {size: 'S', color: 'Black / Carbon', hex: '#111315', stock: 10},
      {size: 'M', color: 'Black / Carbon', hex: '#111315', stock: 14},
      {size: 'L', color: 'Black / Carbon', hex: '#111315', stock: 11},
      {size: 'XL', color: 'Black / Carbon', hex: '#111315', stock: 6},
    ],
  },
  {
    name: 'Trackside Pique Performance Polo',
    slug: 'trackside-pique-performance-polo',
    skuPrefix: 'PTL-PL-13',
    description:
      'Structured heavyweight cotton-pique polo featuring a concealed button placket, fine Pitlane Red collar tipping, and breathable side-hem vents.',
    material: '100% Mercerized Cotton Pique · 260 GSM',
    washing: 'Machine wash cold at 30°C. Dry flat.',
    fit: 'Clean tailored men’s paddock fit.',
    price: 6800,
    discount: 0,
    cat: 'polo-shirts',
    col: 'racing-essentials',
    gender: 'MALE',
    featured: 0,
    newArrival: 1,
    bestseller: 1,
    limited: 0,
    edition: 'ESSENTIALS // 13',
    images: [IMG.polo],
    variants: [
      {size: 'S', color: 'Matte Black / Red Trim', hex: '#111315', stock: 14},
      {size: 'M', color: 'Matte Black / Red Trim', hex: '#111315', stock: 20},
      {size: 'L', color: 'Matte Black / Red Trim', hex: '#111315', stock: 16},
      {size: 'XL', color: 'Matte Black / Red Trim', hex: '#111315', stock: 9},
    ],
  },
  {
    name: 'Wind-Tunnel Aero Graphic Tee',
    slug: 'wind-tunnel-aero-graphic-tee',
    skuPrefix: 'PTL-TS-03',
    description:
      'Washed charcoal 280gsm heavyweight jersey t-shirt featuring an original laminar airflow vector diagram printed in high-density racing red discharge ink.',
    material: '100% Heavyweight Jersey Cotton · 280 GSM Enzyme Washed',
    washing: 'Cold gentle wash with similar colors. Do not bleach or iron directly over print.',
    fit: 'Relaxed unisex streetwear fit with ribbed 1.2-inch collar.',
    price: 5400,
    discount: 0,
    cat: 'graphic-t-shirts',
    col: 'racing-essentials',
    gender: 'UNISEX',
    featured: 1,
    newArrival: 1,
    bestseller: 1,
    limited: 0,
    edition: 'ESSENTIALS // 03',
    images: [IMG.tee],
    variants: [
      {size: 'S', color: 'Washed Charcoal', hex: '#27272A', stock: 22},
      {size: 'M', color: 'Washed Charcoal', hex: '#27272A', stock: 30},
      {size: 'L', color: 'Washed Charcoal', hex: '#27272A', stock: 25},
      {size: 'XL', color: 'Washed Charcoal', hex: '#27272A', stock: 11},
    ],
  },
  {
    name: "Chicane Women's Fitted Aero Tee",
    slug: 'chicane-womens-fitted-aero-tee',
    skuPrefix: 'PTL-WTS-14',
    description:
      'Tailored women’s silhouette cut from enzyme-washed 240gsm combed jersey featuring our wind-tunnel vector artwork and a contoured rib neckline.',
    material: '95% Combed Cotton · 5% Elastane · 240 GSM',
    washing: 'Machine wash cold inside out.',
    fit: "Tailored women's fit.",
    price: 4900,
    discount: 0,
    cat: 'graphic-t-shirts',
    col: 'speed-culture',
    gender: 'FEMALE',
    featured: 0,
    newArrival: 1,
    bestseller: 0,
    limited: 0,
    edition: 'WOMEN // 14',
    images: [IMG.tee],
    variants: [
      {size: 'XS', color: 'Washed Charcoal', hex: '#27272A', stock: 14},
      {size: 'S', color: 'Washed Charcoal', hex: '#27272A', stock: 18},
      {size: 'M', color: 'Washed Charcoal', hex: '#27272A', stock: 15},
      {size: 'L', color: 'Washed Charcoal', hex: '#27272A', stock: 8},
    ],
  },
  {
    name: 'Trackside Articulated Cargo Joggers',
    slug: 'trackside-articulated-cargo-joggers',
    skuPrefix: 'PTL-JG-04',
    description:
      'Tapered technical cargo trousers built with pleated knee articulation, dual zipped bellows pockets, D-ring lanyard hardware, and red-tipped woven drawcords.',
    material: '92% Stretch Cotton Twill · 8% Elastane · 320 GSM',
    washing: 'Machine wash cold at 30°C. Line dry in shade.',
    fit: 'Tapered athletic leg with elasticated ankle cuff.',
    price: 9800,
    discount: 0,
    cat: 'joggers',
    col: 'trackside',
    gender: 'MALE',
    featured: 1,
    newArrival: 1,
    bestseller: 0,
    limited: 0,
    edition: 'TRACKSIDE // 04',
    images: [IMG.joggers],
    variants: [
      {size: 'S', color: 'Asphalt Black', hex: '#111315', stock: 10},
      {size: 'M', color: 'Asphalt Black', hex: '#111315', stock: 16},
      {size: 'L', color: 'Asphalt Black', hex: '#111315', stock: 13},
      {size: 'XL', color: 'Asphalt Black', hex: '#111315', stock: 6},
    ],
  },
  {
    name: 'Sector-3 Insulated Bomber Jacket',
    slug: 'sector-3-insulated-bomber-jacket',
    skuPrefix: 'PTL-BM-07',
    description:
      'Heavy-duty winter paddock bomber lined with quilted thermal insulation, matte black storm zippers, and utility arm pocket.',
    material: 'Outer: Matte Ballistic Nylon · Fill: 180g Recycled Thermal Poly',
    washing: 'Dry clean recommended or gentle cold machine wash.',
    fit: 'Relaxed cropped bomber fit.',
    price: 19500,
    discount: 15,
    cat: 'bomber-jackets',
    col: 'racing-classics',
    gender: 'MALE',
    featured: 0,
    newArrival: 0,
    bestseller: 1,
    limited: 0,
    edition: 'WINTER PADDOCK',
    images: [IMG.hero, IMG.jacket],
    variants: [
      {size: 'M', color: 'Obsidian Black', hex: '#111315', stock: 7},
      {size: 'L', color: 'Obsidian Black', hex: '#111315', stock: 5},
      {size: 'XL', color: 'Obsidian Black', hex: '#111315', stock: 2},
    ],
  },
  {
    name: 'Night Circuit Crewneck Sweatshirt',
    slug: 'night-circuit-crewneck-sweatshirt',
    skuPrefix: 'PTL-SW-08',
    description:
      'Minimalist 440gsm loopback crewneck sweatshirt with flatlock mechanical shoulder seams and understated rear hem woven spec label.',
    material: '100% Heavyweight Loopback Cotton · 440 GSM',
    washing: 'Machine wash cold at 30°C. Dry flat.',
    fit: 'Relaxed unisex athletic fit.',
    price: 8900,
    discount: 0,
    cat: 'sweatshirts',
    col: 'speed-culture',
    gender: 'UNISEX',
    featured: 0,
    newArrival: 1,
    bestseller: 0,
    limited: 0,
    edition: 'SPEED CULTURE // 08',
    images: [IMG.hoodie],
    variants: [
      {size: 'S', color: 'Matte Black', hex: '#111315', stock: 8},
      {size: 'M', color: 'Matte Black', hex: '#111315', stock: 12},
      {size: 'L', color: 'Matte Black', hex: '#111315', stock: 9},
    ],
  },
  {
    name: "Midnight Women's Cropped Paddock Hoodie",
    slug: 'midnight-womens-cropped-paddock-hoodie',
    skuPrefix: 'PTL-WHD-15',
    description:
      'Tailored women’s boxy cropped hoodie in 460gsm brushed cotton with tonal Pitlane Red contrast seam stitching and double-lined hood.',
    material: '100% Combed Organic Cotton · 460 GSM',
    washing: 'Machine wash cold inside out.',
    fit: "Relaxed cropped women's fit.",
    price: 10500,
    discount: 0,
    cat: 'hoodies',
    col: 'midnight-racing',
    gender: 'FEMALE',
    featured: 0,
    newArrival: 1,
    bestseller: 1,
    limited: 0,
    edition: 'WOMEN // CORE',
    images: [IMG.hoodie],
    variants: [
      {size: 'XS', color: 'Matte Black', hex: '#111315', stock: 9},
      {size: 'S', color: 'Matte Black', hex: '#111315', stock: 14},
      {size: 'M', color: 'Matte Black', hex: '#111315', stock: 11},
    ],
  },
  {
    name: 'Carbon Sandwich 6-Panel Racing Cap',
    slug: 'carbon-sandwich-cap',
    skuPrefix: 'PTL-CP-05',
    description:
      'Structured brushed cotton twill 6-panel cap featuring 3D tonal chest-plate embroidery, signature Pitlane Red under-brim piping, and matte black metal clasp closure.',
    material: '100% Brushed Cotton Twill · Structured Buckram Crown',
    washing: 'Spot clean only with damp microfiber cloth. Do not machine wash.',
    fit: 'One size adjustable (55cm – 61cm circumference).',
    price: 3800,
    discount: 0,
    cat: 'caps',
    col: 'racing-essentials',
    gender: 'UNISEX',
    featured: 1,
    newArrival: 0,
    bestseller: 1,
    limited: 0,
    edition: 'HEADWEAR // 05',
    images: [IMG.cap],
    variants: [
      {size: 'OS', color: 'Matte Black / Red', hex: '#111315', stock: 35},
      {size: 'OS', color: 'Stealth Black', hex: '#27272A', stock: 19},
    ],
  },
  {
    name: 'Cordura Ballistic Paddock Backpack',
    slug: 'cordura-ballistic-paddock-backpack',
    skuPrefix: 'PTL-BP-16',
    description:
      '24-liter commuter & circuit backpack built from 1000D Cordura ballistic nylon with suspended 16-inch laptop sleeve, anodized aluminum buckles, and YKK AquaGuard zips.',
    material: '1000D Cordura Nylon · YKK AquaGuard Zippers · Aluminum Buckles',
    washing: 'Wipe clean with damp cloth.',
    fit: 'Dimensions: 48cm × 31cm × 17cm · 24L Capacity',
    price: 14200,
    discount: 0,
    cat: 'backpacks',
    col: 'trackside',
    gender: 'UNISEX',
    featured: 1,
    newArrival: 1,
    bestseller: 0,
    limited: 0,
    edition: 'CARRY // 16',
    images: [IMG.backpack],
    variants: [{size: 'OS', color: 'Ballistic Black', hex: '#111315', stock: 15}],
  },
  {
    name: 'Apex DLC Titanium Chronograph Watch',
    slug: 'apex-dlc-titanium-chronograph-watch',
    skuPrefix: 'PTL-WT-17',
    description:
      '42mm bead-blasted DLC titanium motorsport chronograph featuring a woven carbon fiber dial, sapphire crystal, 100m water resistance, and perforated racing leather strap.',
    material: 'Grade 5 DLC Titanium Case · Sapphire Crystal · Carbon Dial · FKM/Leather Strap',
    washing: 'Wipe case with dry microfiber cloth.',
    fit: '42mm Case Diameter · 20mm Lug Width',
    price: 44500,
    discount: 0,
    cat: 'watches',
    col: 'limited-edition',
    gender: 'UNISEX',
    featured: 1,
    newArrival: 1,
    bestseller: 1,
    limited: 1,
    edition: 'CHRONO // 025/050',
    images: [IMG.watch],
    variants: [{size: '42MM', color: 'DLC Black / Red Hand', hex: '#EF2929', stock: 7}],
  },
  {
    name: 'Apex 1:18 Carbon Aero Display Model',
    slug: 'apex-1-18-carbon-aero-display-model',
    skuPrefix: 'PTL-DC-06',
    description:
      'Precision-cast 1:18 scale open-wheel motorsport collector model finished in matte carbon weave and crimson accents, mounted on an engraved serialized acrylic display plinth.',
    material: 'Diecast Zinc Alloy Body · Rubber Slick Tires · Acrylic Display Plinth',
    washing: 'Dust gently with soft dry camel-hair brush. Keep out of direct UV light.',
    fit: 'Display Scale 1:18 · Dimensions: 31cm × 11.5cm × 7cm',
    price: 34500,
    discount: 0,
    cat: 'diecast-cars',
    col: 'limited-edition',
    gender: 'UNISEX',
    featured: 1,
    newArrival: 1,
    bestseller: 1,
    limited: 1,
    edition: 'COLLECTOR // 012/100',
    images: [IMG.diecast],
    variants: [
      {size: '1:18', color: 'Carbon / Crimson', hex: '#EF2929', stock: 5},
      {size: '1:43', color: 'Carbon / Crimson', hex: '#111315', stock: 9, priceOverride: 14500},
    ],
  },
  {
    name: 'Night Straight Archival Circuit Print',
    slug: 'night-straight-archival-circuit-print',
    skuPrefix: 'PTL-PS-18',
    description:
      'Museum-grade 310gsm Hahnemühle matte cotton rag archival art print capturing floodlit night circuit curbing and wet tarmac reflections.',
    material: '310 GSM Hahnemühle Photo Rag · Archival Pigment Ink',
    washing: 'Handle by edges; frame behind UV-filtering glass.',
    fit: 'A2 Format (420mm × 594mm)',
    price: 4200,
    discount: 0,
    cat: 'posters',
    col: 'racing-classics',
    gender: 'UNISEX',
    featured: 0,
    newArrival: 0,
    bestseller: 0,
    limited: 0,
    edition: 'ARCHIVE // A2',
    images: [IMG.circuit],
    variants: [{size: 'A2', color: 'Archival Matte', hex: '#111315', stock: 24}],
  },
];

export function seedDatabaseIfEmpty(): void {
  initSchema();

  const existingUserCount = (db.prepare(`SELECT COUNT(*) as c FROM users`).get() as {c: number}).c;
  if (existingUserCount === 0) {
    const insertUser = db.prepare(
      `INSERT INTO users (name, email, phone, password_hash, role, email_verified, preferred_currency, marketing_opt_in, whatsapp_opt_in)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    insertUser.run(
      'Zainab Tariq (Admin)',
      'admin@pitlane.pk',
      '+923001234567',
      hashPassword('PitlaneAdmin!2026'),
      'ADMIN',
      1,
      'PKR',
      1,
      1
    );
    const driverInfo = insertUser.run(
      'Hamza Raza',
      'driver@pitlane.pk',
      '+923219876543',
      hashPassword('PitlaneDriver!2026'),
      'CUSTOMER',
      1,
      'PKR',
      1,
      1
    );

    db.prepare(
      `INSERT INTO addresses (user_id, label, recipient_name, phone, country, city, postal_code, street_address, is_default)
       VALUES (?, 'Home', 'Hamza Raza', '+923219876543', 'Pakistan', 'Lahore', '54660', 'House 42, Street 7, Phase 5 DHA', 1)`
    ).run(driverInfo.lastInsertRowid);
  }

  const categoryCount = (db.prepare(`SELECT COUNT(*) as c FROM categories`).get() as {c: number}).c;
  if (categoryCount === 0) {
    const categories: Array<[string, string, string, number]> = [
      ['Hoodies', 'hoodies', 'APPAREL', 1],
      ['Sweatshirts', 'sweatshirts', 'APPAREL', 2],
      ['Racing Jackets', 'racing-jackets', 'APPAREL', 3],
      ['Bomber Jackets', 'bomber-jackets', 'APPAREL', 4],
      ['Windbreakers', 'windbreakers', 'APPAREL', 5],
      ['Jumpsuits', 'jumpsuits', 'APPAREL', 6],
      ['Tracksuits', 'tracksuits', 'APPAREL', 7],
      ['Joggers', 'joggers', 'APPAREL', 8],
      ['Graphic T-Shirts', 'graphic-t-shirts', 'APPAREL', 9],
      ['Polo Shirts', 'polo-shirts', 'APPAREL', 10],
      ['Caps', 'caps', 'ACCESSORIES', 11],
      ['Beanies', 'beanies', 'ACCESSORIES', 12],
      ['Backpacks', 'backpacks', 'ACCESSORIES', 13],
      ['Keychains', 'keychains', 'ACCESSORIES', 14],
      ['Watches', 'watches', 'ACCESSORIES', 15],
      ['Posters', 'posters', 'ACCESSORIES', 16],
      ['Diecast Cars', 'diecast-cars', 'COLLECTIBLES', 17],
      ['Miniature Racing Cars', 'miniature-racing-cars', 'COLLECTIBLES', 18],
      ['Display Models', 'display-models', 'COLLECTIBLES', 19],
    ];
    const insertCat = db.prepare(
      `INSERT INTO categories (name, slug, group_name, sort_order) VALUES (?, ?, ?, ?)`
    );
    for (const c of categories) insertCat.run(...c);
  }

  const collectionCount = (db.prepare(`SELECT COUNT(*) as c FROM collections`).get() as {c: number}).c;
  if (collectionCount === 0) {
    const collections: Array<[string, string, string, string, number, number]> = [
      [
        'Midnight Racing',
        'midnight-racing',
        'Nocturnal circuit silhouettes engineered in 480gsm brushed French terry and matte technical nylon.',
        IMG.hero,
        1,
        1,
      ],
      [
        'Trackside',
        'trackside',
        'Weather-resistant outerwear and articulated cargo trousers built for paddock transitions.',
        IMG.jacket,
        1,
        2,
      ],
      [
        'Racing Essentials',
        'racing-essentials',
        'Foundational heavyweight tees, caps, polos, and daily pit crew staples in carbon monochrome.',
        IMG.tee,
        1,
        3,
      ],
      [
        'Speed Culture',
        'speed-culture',
        'Graphic wind-tunnel capsules and utility jumpsuits inspired by grand prix engineering blueprints.',
        IMG.jumpsuit,
        1,
        4,
      ],
      [
        'Racing Classics',
        'racing-classics',
        'Timeless heritage motorsport outerwear and archival prints with sharp geometric construction.',
        IMG.hoodie,
        0,
        5,
      ],
      [
        'Limited Edition',
        'limited-edition',
        'Numbered production runs, titanium chronographs, and serialized collector pieces.',
        IMG.diecast,
        1,
        6,
      ],
    ];
    const insertCol = db.prepare(
      `INSERT INTO collections (name, slug, description, hero_image, is_featured, sort_order) VALUES (?, ?, ?, ?, ?, ?)`
    );
    for (const col of collections) insertCol.run(...col);
  }

  // Upsert all catalog products cleanly by sku_prefix so existing DBs gain new Male/Female/Accessory products
  const getCatId = (slug: string) =>
    (db.prepare(`SELECT id FROM categories WHERE slug = ?`).get(slug) as {id: number}).id;
  const getColId = (slug: string) =>
    (db.prepare(`SELECT id FROM collections WHERE slug = ?`).get(slug) as {id: number}).id;

  const insertProduct = db.prepare(
    `INSERT INTO products (
      name, slug, sku_prefix, description, material_info, washing_instructions, fit_notes,
      base_price_pkr, discount_percent, category_id, collection_id,
      is_featured, is_new_arrival, is_bestseller, is_limited_edition, edition_run, gender
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertImg = db.prepare(
    `INSERT INTO product_images (product_id, url, alt_text, sort_order) VALUES (?, ?, ?, ?)`
  );
  const insertVariant = db.prepare(
    `INSERT INTO product_variants (product_id, sku, size, color_name, color_hex, stock_qty, price_override_pkr)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  for (const p of CATALOG_PRODUCTS) {
    const existing = db
      .prepare(`SELECT id FROM products WHERE sku_prefix = ?`)
      .get(p.skuPrefix) as {id: number} | undefined;

    if (existing) {
      // Ensure gender stays synced on pre-existing seeded products
      db.prepare(`UPDATE products SET gender = ? WHERE id = ?`).run(p.gender, existing.id);
      continue;
    }

    const info = insertProduct.run(
      p.name,
      p.slug,
      p.skuPrefix,
      p.description,
      p.material,
      p.washing,
      p.fit,
      p.price,
      p.discount,
      getCatId(p.cat),
      getColId(p.col),
      p.featured,
      p.newArrival,
      p.bestseller,
      p.limited,
      p.edition,
      p.gender
    );
    const pid = Number(info.lastInsertRowid);
    p.images.forEach((url, idx) => {
      insertImg.run(pid, url, `${p.name} — studio view ${idx + 1}`, idx);
    });
    p.variants.forEach((v, idx) => {
      const sku = `${p.skuPrefix}-${v.size}-${String(idx + 1).padStart(2, '0')}`;
      insertVariant.run(pid, sku, v.size, v.color, v.hex, v.stock, v.priceOverride ?? null);
    });
  }

  const reviewCount = (db.prepare(`SELECT COUNT(*) as c FROM reviews`).get() as {c: number}).c;
  if (reviewCount === 0) {
    const insertReview = db.prepare(
      `INSERT INTO reviews (product_id, author_name, author_city, rating, title, comment, verified_purchase)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    insertReview.run(
      1,
      'Bilal Ahmed',
      'Lahore',
      5,
      '480gsm fabric weight feels genuinely luxury',
      'Delivered to DHA Lahore in 2 days via COD. The twin-needle red seam stitching and hood structure sit better than imported brands twice the price.',
      1
    );
    insertReview.run(
      1,
      'Saad Mansoor',
      'Karachi',
      5,
      'Clean boxy fit and crisp embroidery',
      'Ordered size L after checking via WhatsApp concierge. Fits true to the chest chart.',
      1
    );
    insertReview.run(
      2,
      'Zara Khan',
      'Islamabad',
      5,
      'Built like real paddock gear',
      'Windproof shell handles evening Margalla rides easily and the matte black zippers feel solid.',
      1
    );
    insertReview.run(
      3,
      'Ayesha Malik',
      'Karachi',
      5,
      'Cropped fit on the women’s jacket is razor sharp',
      'Ordered size S — love the red shoulder quilting and heavy zip pullers.',
      1
    );
  }

  const couponCount = (db.prepare(`SELECT COUNT(*) as c FROM coupons`).get() as {c: number}).c;
  if (couponCount === 0) {
    const insertCoupon = db.prepare(
      `INSERT INTO coupons (code, discount_type, discount_value, min_order_pkr, max_uses, active) VALUES (?, ?, ?, ?, ?, 1)`
    );
    insertCoupon.run('PITLANE10', 'PERCENT', 10, 5000, 500);
    insertCoupon.run('TRACKSIDE1500', 'FIXED_PKR', 1500, 12000, 250);
    insertCoupon.run('PADDOCK15', 'PERCENT', 15, 20000, 100);
  }

  const waCfgCount = (db.prepare(`SELECT COUNT(*) as c FROM whatsapp_config`).get() as {c: number}).c;
  if (waCfgCount === 0) {
    db.prepare(
      `INSERT INTO whatsapp_config (id, business_phone, waba_id, phone_number_id, access_token, webhook_verify_token, admin_notify_phone, notify_new_order, notify_payment, notify_high_value_pkr, notify_low_stock)
       VALUES (1, ?, '', '', '', 'pitlane-verify-token', '', 1, 1, 25000, 1)`
    ).run(process.env.WHATSAPP_BUSINESS_PHONE || '+923001234567');
  }

  const tplCount = (db.prepare(`SELECT COUNT(*) as c FROM whatsapp_templates`).get() as {c: number}).c;
  if (tplCount === 0) {
    const insertTpl = db.prepare(
      `INSERT INTO whatsapp_templates (name, event_key, category, language, body_text, approval_status) VALUES (?, ?, ?, ?, ?, ?)`
    );
    insertTpl.run(
      'pitlane_order_received',
      'ORDER_RECEIVED',
      'UTILITY',
      'en',
      'Hello {{1}}, PITLANE has received your order {{2}}. Status: {{3}}. Reply here anytime for sizing or delivery help.',
      'APPROVED'
    );
    insertTpl.run(
      'pitlane_order_confirmed',
      'ORDER_CONFIRMED',
      'UTILITY',
      'en',
      'Hello {{1}}, your PITLANE order {{2}} is confirmed and queued for dispatch. {{3}}',
      'APPROVED'
    );
    insertTpl.run(
      'pitlane_payment_confirmed',
      'PAYMENT_CONFIRMED',
      'UTILITY',
      'en',
      'Hello {{1}}, payment for PITLANE order {{2}} has been verified. {{3}}',
      'APPROVED'
    );
    insertTpl.run(
      'pitlane_order_shipped',
      'ORDER_SHIPPED',
      'UTILITY',
      'en',
      'Hello {{1}}, your PITLANE order {{2}} has left our Lahore studio. Tracking: {{3}}',
      'APPROVED'
    );
    insertTpl.run(
      'pitlane_order_delivered',
      'ORDER_DELIVERED',
      'UTILITY',
      'en',
      'Hello {{1}}, order {{2}} has been delivered. Welcome to the racing culture. {{3}}',
      'APPROVED'
    );
    insertTpl.run(
      'pitlane_order_cancelled',
      'ORDER_CANCELLED',
      'UTILITY',
      'en',
      'Hello {{1}}, your PITLANE order {{2}} has been cancelled. {{3}}',
      'APPROVED'
    );
    insertTpl.run(
      'pitlane_abandoned_cart',
      'ABANDONED_CART',
      'MARKETING',
      'en',
      'Hello {{1}}, your selected PITLANE gear ({{2}}) is still reserved in your bag. Complete checkout anytime: {{3}}',
      'APPROVED'
    );
  }

  const newsCount = (db.prepare(`SELECT COUNT(*) as c FROM news_articles`).get() as {c: number}).c;
  if (newsCount === 0) {
    const insertNews = db.prepare(
      `INSERT INTO news_articles (title, slug, summary, content, category, source_name, source_url, image_url, published_at, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    insertNews.run(
      'Night Circuit Aerodynamics: How Street-Track Downforce Shapes Paddock Outerwear',
      'night-circuit-aerodynamics-paddock-outerwear',
      'An engineering look at how pit-wall wind resistance, seam sealing, and nocturnal visibility inform our Trackside capsule.',
      'Across floodlit street circuits, track temperatures drop rapidly after sunset while pit crews move between high-humidity garages and exposed grid lanes. PITLANE translates those demands into 3-layer DWR ripstop shells, articulated elbow geometry, and high-contrast red seam indicators designed for city streets from Lahore to London.',
      'Atelier Engineering',
      'PITLANE Editorial Desk',
      'https://pitlane.pk/racing-centre',
      IMG.circuit,
      new Date().toISOString(),
      1
    );
    insertNews.run(
      'Official FIA & Formula 1 Season Calendar: Follow Every Grand Prix Session',
      'official-fia-formula-1-season-calendar',
      'Real-time schedule synchronization powered by the Jolpica / Ergast motorsport data adapter with automatic session status updates.',
      'Track Free Practice, Qualifying, Sprint, and Grand Prix start times directly in the PITLANE Racing Centre. All timings synchronize from our licensed open motorsport feed and display verified last-updated timestamps.',
      'Championship Briefing',
      'Formula1.com / Jolpica Data Feed',
      'https://www.formula1.com/en/racing',
      IMG.hero,
      new Date(Date.now() - 86400 * 1000).toISOString(),
      0
    );
    insertNews.run(
      'Collector Focus: Why 1:18 Matte Carbon Models Define Modern Desk Architecture',
      'collector-focus-1-18-matte-carbon-models',
      'Precision zinc-alloy casting, realistic slick tire compounds, and serialized acrylic bases in our Collector’s Corner.',
      'Serious motorsport collectors value proportion accuracy over glossy gimmicks. Our 1:18 scale display pieces pair matte carbon finishes with crisp front-wing aero vanes and numbered plinth plates.',
      "Collector's Corner",
      'PITLANE Editorial Desk',
      'https://pitlane.pk/shop',
      IMG.diecast,
      new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
      0
    );
  }

  const settingCount = (db.prepare(`SELECT COUNT(*) as c FROM site_settings`).get() as {c: number}).c;
  if (settingCount === 0) {
    const insertSetting = db.prepare(`INSERT INTO site_settings (key, value_json) VALUES (?, ?)`);
    insertSetting.run(
      'announcement_bar',
      JSON.stringify({
        enabled: true,
        text: 'FREE NATIONWIDE SHIPPING IN PAKISTAN OVER PKR 15,000 · WORLDWIDE DHL EXPRESS · USE CODE PITLANE10',
      })
    );
    insertSetting.run(
      'hero_banner',
      JSON.stringify({
        kicker: 'DROP 04 // INDEPENDENT MOTORSPORT ATELIER',
        headline: 'BUILT FOR THE RACING CULTURE.',
        subheadline:
          'Technical paddock outerwear, 480gsm heavyweight streetwear, and 1:18 scale collector pieces. Crafted in Pakistan, shipped globally.',
        imageUrl: IMG.hero,
      })
    );
    insertSetting.run('currencies', JSON.stringify(DEFAULT_CURRENCIES));
    insertSetting.run('shipping_zones', JSON.stringify(DEFAULT_SHIPPING_ZONES));
  }
}
