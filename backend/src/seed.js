const crypto = require("crypto");
const { buildPlaces } = require("./places");

function hashPassword(password, salt = "kidlo-static-salt") {
  const hash = crypto.scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  const test = crypto.scryptSync(password, salt, 32).toString("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(test, "hex"));
  } catch {
    return false;
  }
}

const NOW = "2025-08-01T10:00:00.000Z";

function buildSeed() {
  const categories = [
    cat(1, "boys-toys", "Boys Toys", "🚗", "Action, RC & Adventure", "cat-a", "500+", "", "shop", "shop", "", 1, 1, 1, 1),
    cat(2, "girls-toys", "Girls Toys", "🧸", "Dolls, Crafts & More", "cat-b", "480+", "", "shop", "shop", "", 2, 1, 1, 1),
    cat(3, "stem", "STEM & Educational", "🔬", "Learn Through Play", "cat-c", "320+", "", "shop", "shop", "", 3, 1, 1, 1),
    cat(4, "outdoor", "Outdoor & Sports", "🏃", "Sports & Active Fun", "cat-d", "180+", "", "shop", "shop", "", 4, 1, 1, 1),
    cat(5, "puzzles", "Puzzles & Games", "🧩", "Family Fun Time", "cat-e", "240+", "", "shop", "shop", "", 5, 1, 0, 1),
    cat(6, "arts-crafts", "Arts & Crafts", "🎨", "Creative Expression", "cat-f", "160+", "", "shop", "shop", "", 6, 1, 1, 1),
    cat(7, "baby-infant", "Baby & Infant", "🍼", "0–24 Months", "cat-b", "120+", "", "shop", "shop", "", 7, 0, 1, 1),
    cat(8, "new-arrivals", "New Arrivals", "✨", "Just landed", "cat-e", "New", "", "shop", "", "", 8, 0, 1, 0, "badge", "new"),
    cat(9, "sale", "Sale & Deals", "🔥", "Limited prices", "cat-a", "Sale", "", "shop", "", "", 9, 0, 1, 0, "deal", "1"),
    cat(10, "action-figures", "Action Figures", "🚀", "Heroes & Villains", "cat-a", "", "boys-toys", "shop", "boys", "action", 10, 0, 0, 1),
    cat(11, "rc-vehicles", "RC Vehicles", "🚗", "Cars, Trucks, Drones", "cat-a", "", "boys-toys", "shop", "boys", "rc", 11, 0, 0, 1),
    cat(12, "dinosaurs", "Dinosaurs", "🦕", "Prehistoric Fun", "cat-a", "", "boys-toys", "shop", "boys", "dino", 12, 0, 0, 1),
    cat(13, "boys-sports", "Sports", "⚽", "Indoor & Outdoor", "cat-a", "", "boys-toys", "shop", "boys", "sports", 13, 0, 0, 1),
    cat(14, "building-sets", "Building Sets", "🏗️", "Blocks & Castles", "cat-a", "", "boys-toys", "shop", "boys", "building", 14, 0, 0, 1),
    cat(15, "science-kits", "Science Kits", "🔬", "Experiments", "cat-a", "", "boys-toys", "shop", "boys", "science", 15, 0, 0, 1),
    cat(16, "fashion-dolls", "Fashion Dolls", "👗", "Style & Accessories", "cat-b", "", "girls-toys", "shop", "girls", "doll", 16, 0, 0, 1),
    cat(17, "dollhouses", "Dollhouses", "🏠", "Dream Homes", "cat-b", "", "girls-toys", "shop", "girls", "dollhouse", 17, 0, 0, 1),
    cat(18, "girl-art", "Art & Craft", "🎨", "Creative Sets", "cat-b", "", "girls-toys", "shop", "girls", "art", 18, 0, 0, 1),
    cat(19, "plushies", "Plushies", "🧸", "Soft & Cuddly", "cat-b", "", "girls-toys", "shop", "girls", "plush", 19, 0, 0, 1),
    cat(20, "play-kitchen", "Play Kitchen", "🧁", "Pretend Cooking", "cat-b", "", "girls-toys", "shop", "girls", "kitchen", 20, 0, 0, 1),
    cat(21, "fantasy", "Fantasy & Magic", "🦄", "Unicorns & More", "cat-b", "", "girls-toys", "shop", "girls", "fantasy", 21, 0, 0, 1),
    cat(22, "robots", "Robots & Tech", "🤖", "Coding Toys", "cat-c", "", "stem", "shop", "shop", "robot", 22, 0, 0, 1),
  ];

  const products = [
    product(1, "Turbo Speed RC Racing Car", "🚗", "boys-toys", "boys", 6, 10, "Boys · 6–10 yrs", 2799, 3500, "hot", 5, 128, 36, 210, "A fast remote-control racer with grippy tyres and a 2.4GHz controller built for living-room laps and driveway races.", "#E8F0FF,#C8DCFF", "TurboKids", "KD-RC-041", "rc,action", 1, 0),
    product(2, "Fluffy Rainbow Teddy Bear", "🧸", "girls-toys", "girls", 2, 8, "Girls · 2–8 yrs", 1899, 0, "new", 5, 95, 48, 140, "A cloud-soft rainbow teddy with embroidered features and child-safe stuffing. Perfect as a first cuddle toy or birthday gift.", "#FFE8F5,#FFC8E8", "FunWorld", "KD-PL-003", "plush", 1, 0),
    product(3, "Mega 500-Piece Puzzle Set", "🧩", "puzzles", "all", 4, 12, "All · 4–12 yrs", 1649, 2200, "best", 4.5, 203, 40, 260, "Five illustrated puzzles in one box, from 24 to 500 pieces, so the whole family can play at their own level.", "#E8FFF0,#C8FFD8", "PuzzlePro", "KD-PZ-500", "puzzle", 1, 0),
    product(4, "Junior Science Lab Kit", "🔬", "stem", "all", 8, 14, "All · 8–14 yrs", 3299, 0, "new", 5, 67, 22, 80, "Safe, guided experiments for volcanoes, colours, and simple reactions. Includes goggles, cards, and a parent guide.", "#FFFAE0,#FFE8A0", "ScienceJr", "KD-ST-210", "science", 1, 0),
    product(5, "Coding Robot Starter Kit", "🤖", "stem", "all", 7, 14, "All · 7–14 yrs", 4199, 5500, "hot", 5, 89, 18, 120, "A screen-free coding robot that follows arrow cards, lights up, and teaches sequences, loops, and sensors.", "#F0E8FF,#D8C8FF", "RoboLearn", "KD-RB-014", "robot,science", 1, 0),
    product(6, "Dream Dollhouse Mansion", "🏠", "girls-toys", "girls", 4, 10, "Girls · 4–10 yrs", 5499, 7200, "best", 5, 145, 12, 90, "A three-storey mansion with furniture, a lift, and rooms ready for storytelling. Sturdy wood-effect panels, easy to assemble.", "#FFE8F0,#FFD0E0", "MagicPlay", "KD-DH-088", "dollhouse", 1, 0),
    product(7, "Space Explorer Rocket Set", "🚀", "boys-toys", "boys", 5, 12, "Boys · 5–12 yrs", 1999, 2800, "sale", 4.5, 73, 30, 110, "A rocket, rover, and astronaut set for backyard missions. Lights in the cockpit and a play mat of the moon.", "#E0F8FF,#C0ECFF", "StarKids", "KD-SP-077", "action", 1, 0),
    product(8, "Mega Art & Craft Deluxe Kit", "🎨", "arts-crafts", "all", 5, 12, "All · 5–12 yrs", 2499, 0, "new", 5, 112, 44, 150, "Markers, paints, stickers, and paper in one case so rainy afternoons stay creative. Washable colours, school-safe.", "#FFFCE0,#FFF0A0", "ArtKiddo", "KD-AR-300", "art", 1, 0),
    product(9, "Pro Stunt Drone X500", "🚁", "boys-toys", "boys", 8, 16, "Boys · 8–16 yrs", 3499, 6500, "hot", 5, 88, 15, 64, "360° flips, LED lights, and about 20 minutes of flight. A headless mode helps new pilots stay oriented.", "#E8F0FF,#C8DCFF", "TurboKids", "KD-DR-500", "rc,drone", 0, 1),
    product(10, "Jurassic Dino Pack (12 pcs)", "🦕", "boys-toys", "boys", 4, 10, "Boys · 4–10 yrs", 1499, 0, "new", 5, 156, 55, 240, "Twelve chunky dinosaurs with a play map. Realistic enough for collectors, tough enough for sand pits.", "#E0F4FF,#C0E4FF", "FunWorld", "KD-DN-012", "dino", 0, 0),
    product(11, "Mini Football Goal Set", "⚽", "outdoor", "boys", 5, 14, "Boys · 5–14 yrs", 1799, 2400, "sale", 4.5, 64, 20, 70, "Two pop-up goals, a size-3 ball, and cones. Sets up in a minute for the lawn or a safe indoor hall.", "#E8F8E0,#D0F0C0", "SportsTot", "KD-FB-003", "sports", 0, 0),
    product(12, "Mega Castle Building Blocks", "🏗️", "boys-toys", "boys", 3, 8, "Boys · 3–8 yrs", 2399, 3200, "best", 5, 201, 33, 180, "120 large blocks, towers, and a castle gate. Compatible with standard brick sizes and easy for small hands.", "#F5E8FF,#E0C8FF", "BuildBig", "KD-BL-120", "building", 0, 0),
    product(13, "Fashion Doll Style Studio", "👗", "girls-toys", "girls", 3, 10, "Girls · 3–10 yrs", 2899, 3800, "best", 5, 178, 26, 130, "A doll with outfits, a runway stand, and mix-and-match accessories for fashion play.", "#FFE8F5,#FFC8E8", "MagicPlay", "KD-DL-221", "doll", 0, 0),
    product(14, "Rainbow Unicorn Plush 50cm", "🦄", "girls-toys", "girls", 4, 10, "Girls · 4–10 yrs", 2199, 0, "new", 5, 234, 40, 300, "A 50cm unicorn with a satin horn and super-soft pile. A favourite gift across Kidlo orders.", "#F5E8FF,#E8D0FF", "FunWorld", "KD-PL-050", "plush,fantasy", 0, 0),
    product(15, "Gourmet Play Kitchen Set", "🧁", "girls-toys", "girls", 3, 8, "Girls · 3–8 yrs", 3299, 4500, "sale", 5, 142, 14, 95, "Clicking knobs, a pretend hob, and food accessories. Encourages role play, sharing, and little chef stories.", "#FFF8E0,#FFE8A0", "MagicPlay", "KD-KT-019", "kitchen", 0, 0),
    product(16, "Slime & Glow Art Studio", "🎨", "arts-crafts", "girls", 5, 13, "Girls · 5–13 yrs", 1599, 2100, "hot", 4.5, 98, 38, 160, "Glow powders, glitter, and moulds for supervised slime play. Includes a mess mat and storage jars.", "#FFE8E8,#FFCCC8", "ArtKiddo", "KD-AR-088", "art", 0, 0),
    product(17, "Princess Jewelry Making Kit", "🎀", "girls-toys", "girls", 6, 12, "Girls · 6–12 yrs", 1299, 2100, "sale", 4.8, 76, 22, 88, "Beads, cords, and charms to make bracelets for friends and Eid gifts. No small parts under age 6.", "#FFE8F5,#FFD0E8", "ColorBurst", "KD-JW-014", "art,fantasy", 0, 1),
    product(18, "DNA Discovery Lab", "🧬", "stem", "all", 10, 16, "All · 10–16 yrs", 2899, 4200, "hot", 5, 41, 8, 30, "A beginner biology lab that shows extraction steps with safe household-style materials and illustrated cards.", "#F0E8FF,#D8C8FF", "ScienceJr", "KD-ST-318", "science", 0, 1),
    product(19, "Baby Sensory Play Mat", "👶", "baby-infant", "all", 0, 2, "Baby · 0–2 yrs", 2499, 3200, "new", 4.9, 54, 19, 70, "A padded mat with high-contrast arches, a mirror, and crinkle toys for tummy time.", "#E8FFF0,#C8FFD8", "FunWorld", "KD-BB-010", "baby", 0, 0),
    product(20, "Soft Stacking Rings", "🍼", "baby-infant", "all", 0, 2, "Baby · 0–1 yrs", 899, 0, "best", 4.8, 61, 60, 140, "Soft rings on a wobble base. Teething-friendly fabric and a gentle rattle in the top ring.", "#FFF3E0,#FFE0C0", "FunWorld", "KD-BB-004", "baby", 0, 0),
    product(21, "Wooden Activity Walker", "🚶", "baby-infant", "all", 1, 3, "Baby · 1–3 yrs", 4599, 5900, "hot", 4.7, 33, 11, 40, "A wooden walker with beads, gears, and a shape sorter. Helps first steps without a noisy electronic panel.", "#E8F0FF,#D0E4FF", "BuildBig", "KD-BB-021", "baby", 0, 0),
    product(22, "Junior Cricket Set", "🏏", "outdoor", "all", 6, 14, "All · 6–14 yrs", 1899, 0, "new", 4.6, 47, 25, 55, "A plastic bat, stump set, and soft ball sized for streets and parks. Carrying bag included.", "#E8F8E0,#D0F0C0", "SportsTot", "KD-CR-006", "sports", 0, 0),
    product(23, "Bubble Blaster Gun", "🫧", "outdoor", "all", 4, 10, "All · 4–10 yrs", 699, 1200, "sale", 4.4, 120, 70, 400, "A fan-powered bubble blaster for parties and summer evenings. Solution bottle included.", "#E0F8FF,#C0ECFF", "ColorBurst", "KD-BB-009", "sports", 0, 0),
    product(24, "Watercolor Magic Studio", "🖌️", "arts-crafts", "all", 6, 12, "All · 6–12 yrs", 1399, 0, "", 4.7, 39, 28, 45, "Watercolour pans, brushes, and thick paper. Colours lift cleanly from skin and most school desks.", "#FFFCE0,#FFF0A0", "ArtKiddo", "KD-AR-044", "art", 0, 0),
    product(25, "Family Board Game Night", "🎲", "puzzles", "all", 6, 99, "All · 6+ yrs", 1999, 2500, "best", 4.8, 82, 34, 100, "Three short games in one box: a racing game, a memory match, and a team quiz about Pakistan.", "#F5E8FF,#E0C8FF", "PuzzlePro", "KD-BG-003", "puzzle", 0, 0),
    product(26, "Musical Xylophone Baby", "🎵", "baby-infant", "all", 1, 4, "Baby · 1–4 yrs", 999, 0, "new", 4.6, 44, 42, 90, "A colourful xylophone with a song card. Mallets store under the frame so they stay in the toy box.", "#FFFAE0,#FFE8A0", "FunWorld", "KD-BB-016", "baby", 0, 0),
    product(27, "Remote Control Plane", "✈️", "boys-toys", "boys", 8, 16, "Boys · 8–16 yrs", 3999, 5500, "sale", 4.5, 29, 9, 22, "A lightweight foam plane with a 2.4GHz remote. Best for a park on a calm evening, with an adult nearby.", "#E0F8FF,#C0ECFF", "StarKids", "KD-RC-090", "rc", 0, 0),
    product(28, "Doctor Pretend Kit", "🩺", "girls-toys", "all", 3, 8, "All · 3–8 yrs", 1799, 0, "hot", 4.9, 70, 31, 85, "Coat, stethoscope, and soft tools for clinic play. A gentle way to talk about doctor visits.", "#FFE8F0,#FFD0E0", "MagicPlay", "KD-RL-012", "doll", 0, 0),
  ];

  const sections = [
    section(1, "announcement", "Announcement bar", 1, { highlight: "SUMMER SALE", text: "Up to 50% OFF! Use code", code: "KIDLO50", extra: "Free delivery over PKR 2,000" }),
    section(2, "hero", "Hero", 2, {
      badge: "Pakistan's #1 Kids Toy Store",
      lines: [
        { text: "Play.", color: "c1" },
        { text: "Discover.", color: "c2" },
        { text: "Grow.", color: "c3" },
      ],
      subtitle: "Over 2,000 safe, educational, and thrilling toys for every child — from newborns to teens. Delivered fast, right to your door!",
      primary_label: "Shop Now",
      primary_href: "/shop/boys-toys",
      secondary_label: "Today's Deals",
      secondary_href: "/shop/sale",
      stats: [
        { num: "2K+", label: "Products" },
        { num: "50K+", label: "Happy Kids" },
        { num: "4.9★", label: "Rating" },
        { num: "99%", label: "Safe Certified" },
      ],
      toy: "🧸",
      chips: [
        { emoji: "🚗", label: "RC Cars" },
        { emoji: "⭐", label: "Top Rated" },
        { emoji: "🛡️", label: "100% Safe" },
        { emoji: "🚀", label: "Fast Delivery" },
      ],
    }),
    section(3, "marquee", "Marquee", 3, {
      items: ["FREE DELIVERY OVER PKR 2,000", "SAFE & NON-TOXIC CERTIFIED", "AGE-APPROPRIATE TOYS", "30-DAY EASY RETURNS", "EDUCATIONAL & FUN", "NATIONWIDE DELIVERY", "COD AVAILABLE", "SECURE CHECKOUT"],
    }),
    section(4, "shop_categories", "Shop by category", 4, {
      label: "Shop by Category",
      title: "What Are You Looking For?",
      subtitle: "Browse our curated categories — something magical for every child",
      button: "View All Categories",
    }),
    section(5, "featured", "Featured products", 5, {
      label: "Best Sellers",
      title: "Kids Are Loving These!",
      subtitle: "Our most popular, top-rated toys this season",
    }),
    section(6, "deals", "Flash sale", 6, {
      label: "Deal of the Day",
      title: "Flash Sale — Grab It Fast!",
      subtitle: "Limited stock. Timer resets daily at midnight PKT.",
      hero_slug: "pro-stunt-drone-x500",
    }),
    section(7, "promos", "Promo banners", 7, {
      cards: [
        { title: "Free Gift Wrapping!", text: "On all orders over PKR 3,000 — perfect for birthdays & Eid gifts!", tag: "FREE", tag_small: "GIFT", href: "/p/gift-cards", theme: "pc1" },
        { title: "Summer Bundle Deals", text: "Buy 3 get 1 FREE on selected outdoor & sports toys this season!", tag: "3+1", tag_small: "FREE", href: "/shop/outdoor", theme: "pc2" },
      ],
    }),
    section(8, "gender", "Boys and girls heroes", 8, {
      boys: { emojis: "🚗🚀🤖🦕⚽🏗️", label: "FOR BOYS", title: "Adventure & Action!", text: "Fuel their curiosity, drive, and imagination with toys built for big adventures and bold discoveries.", tags: ["RC Cars", "Action Heroes", "Dinosaurs", "Building Blocks", "Science Kits", "Sports", "Drones", "Robots"], href: "/shop/boys-toys" },
      girls: { emojis: "🧸👗🏠🎨🦄🧁", label: "FOR GIRLS", title: "Dream & Create!", text: "Spark imagination, nurture creativity, and inspire every little girl to dream big and play bigger.", tags: ["Fashion Dolls", "Dollhouses", "Art Kits", "Plushies", "Play Kitchen", "Fantasy", "Dress-Up", "Jewelry Kits"], href: "/shop/girls-toys" },
    }),
    section(9, "boys_picks", "Boys product row", 9, { label: "New For Boys", title: "Top Picks For Boys" }),
    section(10, "girls_picks", "Girls product row", 10, { label: "New For Girls", title: "Top Picks For Girls" }),
    section(11, "ages", "Shop by age", 11, {
      label: "Shop by Age",
      title: "Every Stage, Every Joy",
      subtitle: "Expertly curated toys matched to your child's development stage",
      steps: [
        { emoji: "👶", range: "0–2 Years", key: "0-2", desc: "Sensory & Infant Play", min: 0, max: 2, color: "#FF6B00" },
        { emoji: "🧒", range: "3–5 Years", key: "3-5", desc: "Preschool & Building", min: 3, max: 5, color: "#CC9900" },
        { emoji: "👦", range: "6–8 Years", key: "6-8", desc: "Action & Creative Play", min: 6, max: 8, color: "#5DC800" },
        { emoji: "🧑", range: "9–11 Years", key: "9-11", desc: "STEM & Strategy", min: 9, max: 11, color: "#00B8C8" },
        { emoji: "👧", range: "12–14 Years", key: "12-14", desc: "Hobbies & Collections", min: 12, max: 14, color: "#3B6FE8" },
        { emoji: "🎓", range: "15+ Years", key: "15-99", desc: "Advanced Kits & Tech", min: 15, max: 99, color: "#8B5CF6" },
      ],
    }),
    section(12, "stem", "Educational play", 12, {
      label: "Educational Play",
      title: "Learn While You Play",
      subtitle: "Award-winning STEM & educational toys that make kids smarter",
      cards: [
        { emoji: "💻", title: "Coding & Robotics", text: "Teach programming concepts through play. Ages 7–14.", theme: "s1", href: "/shop/stem" },
        { emoji: "🔭", title: "Space & Astronomy", text: "Telescopes, planetarium kits and space models. Ages 8+.", theme: "s2", href: "/shop/boys-toys" },
        { emoji: "🌿", title: "Nature & Biology", text: "Grow, observe, and explore the natural world with hands-on kits.", theme: "s3", href: "/shop/stem" },
        { emoji: "⚗️", title: "Chemistry & Lab", text: "Safe experiments, volcano kits, and crystal growing. Ages 8–14.", theme: "s4", href: "/shop/stem" },
        { emoji: "🧮", title: "Math & Logic", text: "Puzzles and strategy games that sharpen young minds. Ages 4–12.", theme: "s5", href: "/shop/puzzles" },
        { emoji: "🎭", title: "Creative Arts", text: "Drawing, painting, and mixed media for the little artist.", theme: "s6", href: "/shop/arts-crafts" },
      ],
    }),
    section(13, "brands", "Brands", 13, {
      label: "Top Brands",
      title: "Brands Kids Love",
      items: ["🧸 FunWorld", "🚗 TurboKids", "🔬 ScienceJr", "🤖 RoboLearn", "🎨 ArtKiddo", "🦄 MagicPlay", "⚽ SportsTot", "🏗️ BuildBig", "🧩 PuzzlePro", "🎮 PlayTech", "🌈 ColorBurst", "🚀 StarKids"],
    }),
    section(14, "why", "Why Kidlo", 14, {
      label: "Why Choose Us",
      title: "Safety First, Fun Always",
      subtitle: "Every toy at Kidlo is carefully selected with your child's safety and joy in mind",
      cards: [
        { icon: "🛡️", title: "100% Safe", text: "Every toy is tested and certified non-toxic, BPA-free, and age-appropriate.", bg: "#FFF3E0" },
        { icon: "🚚", title: "Fast Delivery", text: "2–5 day nationwide delivery. Same-day dispatch in Lahore and Karachi for orders before 2 PM.", bg: "#E8F8FF" },
        { icon: "🔄", title: "Easy Returns", text: "Return within 30 days. We cover return shipping on defective items.", bg: "#E8FFF0" },
        { icon: "🎓", title: "Expert Curated", text: "Child-development minded buyers pick toys that encourage learning and play.", bg: "#F5E8FF" },
        { icon: "💳", title: "Secure Payments", text: "COD, Visa, Mastercard, EasyPaisa, JazzCash, and bank transfer.", bg: "#FFF8E0" },
        { icon: "💬", title: "24/7 Support", text: "WhatsApp, call, or the contact form — we help you find the right toy.", bg: "#FFE8F0" },
        { icon: "🎁", title: "Gift Wrapping", text: "Free gift wrapping and a message card on orders over PKR 3,000.", bg: "#E0F8FF" },
        { icon: "📦", title: "Quality Packaging", text: "Sturdy packs so toys arrive ready to play.", bg: "#EDFFD9" },
      ],
    }),
    section(15, "reviews_header", "Reviews header", 15, {
      label: "Reviews",
      title: "50,000+ Happy Families!",
      subtitle: "Real reviews from real parents across Pakistan",
      score: "4.9",
      based_on: "Based on 12,400+ reviews",
      bars: [
        { star: 5, width: 86 },
        { star: 4, width: 9 },
        { star: 3, width: 3 },
        { star: 2, width: 1 },
        { star: 1, width: 1 },
      ],
      metrics: ["98% on-time delivery", "97% packaging satisfaction", "99% safety satisfaction", "96% support satisfaction"],
    }),
    section(16, "blog_header", "Blog header", 16, { label: "Kidlo Blog", title: "Tips for Parents", subtitle: "Expert advice on choosing the right toys for your child's growth" }),
    section(17, "app_banner", "App banner", 17, {
      label: "Kidlo App",
      title: "Shop Smarter on the Go!",
      text: "Get exclusive app-only deals, track your orders in real time, save wishlists, and get personalised toy recommendations — all from your phone!",
    }),
    section(18, "newsletter", "Newsletter", 18, {
      title: "Get Exclusive Toy Deals!",
      text: "Join 80,000+ parents who get the best toy deals, parenting tips, and new arrivals straight to their inbox.",
      perks: ["10% off first order", "Early access to sales", "Free parenting guides", "Birthday surprises"],
    }),
    section(19, "footer", "Footer", 19, {
      blurb: "Pakistan's most loved kids toy store. Delivering joy, learning, and laughter to children across the country since 2019.",
      social: [
        { icon: "📘", href: "https://facebook.com", bg: "#3b5998" },
        { icon: "📸", href: "https://instagram.com", bg: "#e1306c" },
        { icon: "🐦", href: "https://twitter.com", bg: "#1da1f2" },
        { icon: "💬", href: "https://wa.me/923001234567", bg: "#25d366" },
        { icon: "▶️", href: "https://youtube.com", bg: "#ff0000" },
      ],
      address: "14-B, Gulberg III, Lahore, Pakistan",
      phone: "+92 300 1234567",
      email: "hello@kidlotoys.pk",
      hours: "Mon–Sat: 9am – 9pm PKT",
      copyright: "© 2026 Kidlo Toys Pvt. Ltd. All rights reserved. Made with love for Pakistan's children.",
    }),
    section(20, "nav_links", "Top navigation links", 20, {
      items: [
        { label: "By Age", href: "/shop/by-age" },
        { label: "Educational", href: "/shop/stem" },
        { label: "Deals", href: "/shop/sale" },
      ],
    }),
    section(21, "commerce", "Checkout rules", 21, {
      free_shipping_over: 2000,
      shipping_fee: 199,
      gift_wrap_over: 3000,
      currency: "PKR",
      cod_note: "Pay when the parcel arrives. Available across Pakistan.",
    }),
    section(22, "recent", "Recently viewed header", 22, { label: "Recently Viewed", title: "Still Thinking?" }),
  ];

  const pages = [
    page(1, "about", "About Kidlo", "company", "Thoughtful toys, dependable service, and clearer choices for families across Pakistan.", "🏪", aboutHtml(), 1),
    page(2, "our-story", "Our Story", "company", "How a small Lahore catalogue grew into a nationwide destination for play.", "📖", storyHtml(), 2),
    page(3, "careers", "Careers", "company", "Build a more thoughtful toy-shopping experience with the Kidlo team.", "💼", careersHtml(), 3),
    page(4, "press", "Press Kit", "company", "Company facts, media contacts, and guidance for using the Kidlo brand.", "📰", pressHtml(), 4),
    page(5, "privacy", "Privacy Policy", "company", "A clear explanation of how Kidlo collects, uses, and protects personal information.", "🔒", privacyHtml(), 5),
    page(6, "terms", "Terms of Use", "company", "The terms that apply when browsing Kidlo or placing an order.", "📜", termsHtml(), 6),
    page(7, "wholesale", "Wholesale", "company", "Trade supply and tailored quotations for retailers, institutions, and organisations.", "🏬", wholesaleHtml(), 7),
    page(8, "returns", "Returns & Refunds", "support", "Eligibility, return steps, and refund timing explained clearly.", "🔄", returnsHtml(), 1),
    page(9, "faqs", "FAQs", "support", "Practical answers about orders, products, payment, delivery, gifts, and returns.", "❓", faqHtml(), 2),
    page(10, "shipping", "Shipping Info", "support", "Delivery charges, estimates, tracking, and important courier information.", "🚚", shippingHtml(), 3),
    page(11, "age-guide", "Size & Age Guide", "support", "Choose safer, more engaging toys for every stage of childhood.", "🎂", ageGuideHtml(), 4),
    page(12, "gift-cards", "Gift Cards", "support", "Give families the freedom to choose play they will genuinely enjoy.", "🎁", giftHtml(), 5),
    page(13, "bulk-orders", "Bulk Orders", "support", "Planned toy sourcing for schools, celebrations, communities, and teams.", "📦", bulkHtml(), 6),
    page(14, "contact", "Contact Us", "support", "Reach the right Kidlo team for products, orders, delivery, or business enquiries.", "💬", contactHtml(), 7),
  ];

  const blog_posts = [
    post(1, "best-stem-toys-8-12", "Best STEM Toys for 8–12 Year Olds in 2025", "Child Development", "Discover our expert picks for science and coding toys that make learning irresistibly fun for school-age children.", "👩‍💻", "#E8F0FF,#C8DCFF", "Kidlo Team", "5 min read", "2025-05-12", stemArticle()),
    post(2, "birthday-gifts-girls-under-3000", "Top 10 Birthday Gift Ideas for Girls Under PKR 3,000", "Gift Guides", "Budget-friendly, thoughtful gifts that will make any little girl's birthday truly magical and memorable.", "🎁", "#FFE8F3,#FFC8E8", "Amna Farooq", "4 min read", "2025-04-02", giftArticle()),
    post(3, "safe-toys-for-toddlers", "How to Choose Safe Toys for Toddlers: A Parent's Complete Guide", "Safety Guide", "Everything you need to know about toy safety certifications, age labels, and what to look out for.", "🛡️", "#E8FFF0,#C8FFD8", "Dr. Ali Hussain", "7 min read", "2025-03-18", safetyArticle()),
  ];

  const reviews = [
    review(1, 14, "Ayesha Malik", "Lahore", "Mom of 2", "👩", 5, "My daughter absolutely adores the unicorn plushie! The quality is incredible — so soft and well-made. It arrived in 2 days with beautiful gift wrapping. Kidlo is our family's go-to toy store now!"),
    review(2, 4, "Ahmed Raza", "Karachi", "Dad of 3", "👨", 5, "The science kit kept my son busy for 3 weekends straight! He's doing real experiments and learning so much. The customer support also helped me choose the right age group. Highly recommend!"),
    review(3, 5, "Sara Hussain", "Islamabad", "Mom", "👩‍💻", 5, "Best toy experience in Pakistan! Ordered the coding robot as an Eid gift and it arrived perfectly wrapped. My son is obsessed with it. The variety is unmatched and prices are very reasonable!"),
    review(4, 9, "Faran J.", "Karachi", "Parent", "👨", 5, "Good product. I was looking for a stable drone and this one flies well, especially considering the price."),
    review(5, 1, "Mrs. Zaidi", "Lahore", "Parent", "👩", 5, "A very good racing car. Delivery was quick and the remote paired on the first try."),
  ];

  const coupons = [
    { id: 1, code: "KIDLO50", type: "percent", value: 10, min_order: 2000, active: 1, description: "10% off orders over PKR 2,000" },
    { id: 2, code: "WELCOME10", type: "percent", value: 10, min_order: 1000, active: 1, description: "10% off a first order over PKR 1,000" },
    { id: 3, code: "EID500", type: "flat", value: 500, min_order: 4000, active: 1, description: "PKR 500 off orders over PKR 4,000" },
  ];

  const seo_entries = buildSeoEntries({ pages, products, categories, blog_posts });

  const orders = [
    { id: 1, order_no: "KD1001", customer_name: "Ayesha Malik", email: "ayesha@example.com", phone: "03001234567", address: "House 12, Block C, Gulberg III", city: "Lahore", country_code: "PK", country_name: "Pakistan", dial_code: "+92", payment_method: "cod", status: "Shipped", subtotal: 2199, shipping: 0, discount: 0, total: 2199, coupon_code: "", notes: "Gift wrap please", created_at: "2025-09-02T08:30:00.000Z" },
  ];
  const order_items = [
    { id: 1, order_id: 1, product_id: 14, name: "Rainbow Unicorn Plush 50cm", emoji: "🦄", image_url: "", price: 2199, qty: 1 },
  ];

  return {
    admins: [{ id: 1, name: "Kidlo Admin", email: "admin@kidlo.pk", password_hash: hashPassword("kidlo123"), role: "owner", created_at: NOW }],
    categories,
    products,
    sections,
    pages,
    seo_entries,
    blog_posts,
    reviews,
    orders,
    order_items,
    media_files: [],
    coupons,
    customers: [],
    newsletter: [],
    inquiries: [],
    ...buildPlaces(),
  };
}

function cat(id, slug, name, emoji, blurb, color, count_label, parent_slug, group_name, nav_group, filter_tag, sort_order, show_on_home, show_in_footer, show_in_nav, virtual = "", virtual_value = "") {
  return { id, slug, name, emoji, image_url: "", image_alt: "", blurb, color, count_label, parent_slug, group_name, nav_group, filter_tag, sort_order, show_on_home, show_in_footer, show_in_nav, virtual, virtual_value, active: 1 };
}

function product(id, name, emoji, category_slug, gender, age_min, age_max, age_label, price, compare_price, badge, rating, review_count, stock, sold, description, gradient, brand, sku, tags, featured, is_deal) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return { id, slug, name, emoji, image_url: "", image_alt: "", category_slug, gender, age_min, age_max, age_label, price, compare_price, badge, rating, review_count, stock, sold, description, gradient: `linear-gradient(135deg,${gradient})`, brand, sku, tags, featured, is_deal, active: 1, created_at: NOW, updated_at: NOW };
}

function section(id, section_key, name, sort_order, payload) {
  return { id, section_key, name, enabled: 1, sort_order, payload, updated_at: NOW };
}

function page(id, slug, title, group_name, excerpt, emoji, content, sort_order) {
  return { id, slug, title, group_name, excerpt, content, emoji, enabled: 1, sort_order, updated_at: NOW };
}

function buildSeoEntries({ pages, products, categories, blog_posts }) {
  const rows = [
    seo("/", "Kidlo Toys Pakistan | Toys for Every Age", "Shop trusted toys for babies and kids in Pakistan. Discover STEM, outdoor, pretend-play and gift ideas with COD and nationwide delivery.", "toys pakistan,kids toys,baby toys,online toy store", "website"),
    seo("/search", "Search Toys | Kidlo Toys Pakistan", "Search Kidlo's toy collection by age, interest, category and price.", "search toys pakistan,kids toys", "website"),
    seo("/blog", "Parenting Tips & Toy Guides | Kidlo Blog", "Practical toy safety, age guidance, learning ideas and gift inspiration for families.", "toy guides,parenting tips,gift ideas", "website"),
    seo("/track", "Track My Order | Kidlo Toys", "Track your Kidlo order securely using your order number and checkout phone.", "track kidlo order,toy delivery pakistan", "website"),
    seo("/cart", "Shopping Cart | Kidlo Toys", "Review the toys in your Kidlo shopping cart before checkout.", "", "website", "noindex,nofollow"),
    seo("/checkout", "Secure Checkout | Kidlo Toys", "Complete your Kidlo order with secure delivery and payment details.", "", "website", "noindex,nofollow"),
    seo("/wishlist", "My Wishlist | Kidlo Toys", "View your saved Kidlo toys and gift ideas.", "", "website", "noindex,nofollow"),
    seo("/account", "My Account | Kidlo Toys", "Manage your Kidlo account and view your orders.", "", "website", "noindex,nofollow"),
  ];
  for (const item of pages) rows.push(seo(`/p/${item.slug}`, `${item.title} | Kidlo Toys`, item.excerpt, `${item.title.toLowerCase()},kidlo toys`, "article"));
  for (const item of categories.filter((row) => row.active)) rows.push(seo(`/shop/${item.slug}`, `${item.name} | Shop Toys Online at Kidlo`, item.blurb || `Shop ${item.name.toLowerCase()} with nationwide delivery across Pakistan.`, `${item.name.toLowerCase()},toys pakistan`, "website"));
  for (const item of products.filter((row) => row.active)) rows.push(seo(`/product/${item.slug}`, `${item.name} | Buy Online at Kidlo`, item.description, `${item.name.toLowerCase()},${item.tags},toys pakistan`, "product"));
  for (const item of blog_posts.filter((row) => row.enabled)) rows.push(seo(`/blog/${item.slug}`, `${item.title} | Kidlo Blog`, item.excerpt, `${item.category.toLowerCase()},toy guide,pakistan`, "article"));
  return rows.map((row, index) => ({ id: index + 1, ...row, updated_at: NOW }));
}

function seo(path, title, description, keywords, og_type, robots = "index,follow") {
  return {
    path,
    title,
    description,
    keywords,
    canonical: path,
    image: "/logo.png",
    robots,
    og_type,
    schema_json: {},
    enabled: 1,
  };
}

function post(id, slug, title, category, excerpt, emoji, gradient, author, read_time, published_at, content) {
  return { id, slug, title, category, excerpt, content, emoji, image_url: "", image_alt: "", gradient: `linear-gradient(135deg,${gradient})`, author, read_time, published_at, enabled: 1 };
}

function review(id, product_id, author, city, role, avatar, stars, text) {
  return { id, product_id, author, city, role, avatar, stars, text, verified: 1, enabled: 1, created_at: NOW };
}

function aboutHtml() {
  return `<p>Kidlo is a Pakistan-based toy retailer helping families choose thoughtful, age-appropriate play without the uncertainty of an endless marketplace. Since 2019, we have served parents, gift-givers, schools, and businesses across the country.</p><div class="info-grid"><div class="info-card"><h3>Chosen with purpose</h3><p>We assess play value, age suitability, build quality, and the clarity of every product before it reaches the catalogue.</p></div><div class="info-card"><h3>Made for Pakistan</h3><p>Prices are in rupees, local payment methods are supported, and our delivery team understands addresses across Pakistan.</p></div><div class="info-card"><h3>Clear guidance</h3><p>Honest age bands, stock status, dimensions, and practical descriptions help customers choose with confidence.</p></div><div class="info-card"><h3>Human support</h3><p>Our Lahore team assists with gifts, product questions, orders, returns, schools, and business purchases.</p></div></div><h2>What you can expect</h2><ul><li>Cash on delivery, cards, EasyPaisa, and JazzCash at checkout.</li><li>Free standard delivery above PKR 2,000 and transparent fees below it.</li><li>Nationwide delivery, usually within 2–5 working days.</li><li>A practical 30-day return policy for eligible unused products.</li></ul><blockquote>Our purpose is simple: help every child discover something that invites imagination, movement, curiosity, or connection.</blockquote>`;
}

function storyHtml() {
  return `<p>Kidlo began in Lahore in 2019 with a small storeroom, a carefully selected range, and a WhatsApp catalogue. The goal was not to list every toy available; it was to make choosing the right one easier.</p><h2>From conversations to a better store</h2><p>Parents repeatedly asked for dependable age guidance, clear prices, reliable stock, and a delivery rider who would call before arriving. Those everyday concerns became the operating principles behind Kidlo.</p><div class="info-grid"><div class="info-card"><h3>2019 · The beginning</h3><p>A small local catalogue focused on gifts and early-years play.</p></div><div class="info-card"><h3>2021 · Beyond Lahore</h3><p>Courier partnerships expanded delivery to families across Pakistan.</p></div><div class="info-card"><h3>2023 · Smarter discovery</h3><p>Age, interest, gender, and budget filters made the growing range easier to navigate.</p></div><div class="info-card"><h3>Today · The same promise</h3><p>Real guidance, responsive support, and products we can confidently dispatch.</p></div></div><h2>What has not changed</h2><p>We remain focused on practical service: accurate listings, fair offers, careful packing, and a real person to help when a birthday or school event cannot wait.</p>`;
}

function careersHtml() {
  return `<p>Kidlo brings together retail, e-commerce, customer care, buying, content, and fulfilment. We value thoughtful people who take ownership, communicate clearly, and understand that small service details matter to families.</p><h2>Teams at Kidlo</h2><div class="info-grid"><div class="info-card"><h3>Buying & catalogue</h3><p>Product research, supplier coordination, quality checks, merchandising, and accurate listings.</p></div><div class="info-card"><h3>Customer experience</h3><p>Order support in Urdu and English across phone, WhatsApp, email, and social channels.</p></div><div class="info-card"><h3>Operations</h3><p>Inventory accuracy, careful packing, dispatch, courier coordination, and returns.</p></div><div class="info-card"><h3>Digital & creative</h3><p>E-commerce, campaigns, photography, content, analytics, and product experience.</p></div></div><h2>How to apply</h2><p>Send your preferred role, city, relevant experience, availability, and a CV or portfolio link through the form below. If there is a suitable opening, our team will contact you. Kidlo is an equal-opportunity employer and never charges an application fee.</p>`;
}

function pressHtml() {
  return `<p>Kidlo Toys is a Lahore-based, direct-to-consumer toy retailer serving families across Pakistan since 2019. We focus on age-appropriate toys, educational play, gifts, and a straightforward local shopping experience.</p><h2>Company facts</h2><div class="info-grid"><div class="info-card"><h3>Brand name</h3><p>Kidlo Toys</p></div><div class="info-card"><h3>Founded</h3><p>2019 in Lahore, Pakistan</p></div><div class="info-card"><h3>Categories</h3><p>Baby, pretend play, STEM, arts, outdoor, vehicles, dolls, and gifts.</p></div><div class="info-card"><h3>Service area</h3><p>Online delivery across Pakistan.</p></div></div><h2>Media enquiries</h2><p>For interviews, company information, product samples, or brand assets, email <strong>hello@kidlotoys.pk</strong> with your publication, deadline, and request. Please refer to the business as “Kidlo Toys” on first mention and “Kidlo” thereafter.</p><p class="policy-note">Logos and brand material may not be altered or used to imply a partnership or endorsement without written approval.</p>`;
}

function privacyHtml() {
  return `<p>This policy explains what information Kidlo collects, why we use it, and the choices available to you when you browse, create an account, contact us, or place an order.</p><p><strong>Last updated: 9 October 2026.</strong></p><h2>Information we collect</h2><ul><li>Identity and contact details such as name, email, phone number, and delivery address.</li><li>Order information including products, payment method, delivery status, returns, and support history.</li><li>Account credentials stored as a protected password hash; Kidlo cannot view your password.</li><li>Basic device, browser, and site-usage information used for security and service improvement.</li></ul><h2>How we use information</h2><p>We use personal information to fulfil orders, process payments and refunds, provide support, prevent fraud, meet legal obligations, and improve our services. Marketing messages are sent only where you have requested them, and you may unsubscribe at any time.</p><h2>Sharing and retention</h2><p>Necessary details may be shared with payment providers, couriers, technology suppliers, and professional advisers working on our behalf. We do not sell personal information. Records are retained only for as long as reasonably required for service, accounting, dispute, and legal purposes.</p><h2>Your choices</h2><p>You may request access, correction, deletion, or marketing opt-out by emailing <strong>hello@kidlotoys.pk</strong> from the address associated with your account. Some transaction records may need to be retained where required by law.</p><p class="policy-note">Never send card numbers, PINs, passwords, or one-time codes to Kidlo by email, WhatsApp, or an inquiry form.</p>`;
}

function termsHtml() {
  return `<p>These terms govern your use of Kidlo and purchases made through the store. By placing an order, you confirm that the information supplied is accurate and that you are authorised to use the selected payment method.</p><p><strong>Last updated: 9 October 2026.</strong></p><h2>Orders and pricing</h2><p>Prices are shown in Pakistani rupees. Product availability, promotions, and delivery estimates may change. An order is accepted when Kidlo confirms it for fulfilment; we may cancel or adjust an order affected by a genuine pricing error, failed payment, unavailable stock, suspected fraud, or an unreachable delivery number.</p><h2>Payments, delivery, and ownership</h2><p>Available payment methods are displayed at checkout. Cash-on-delivery orders may require phone confirmation. Delivery dates are estimates and can be affected by courier capacity, weather, public holidays, security restrictions, or incomplete addresses. Responsibility for the parcel passes to the customer when delivery is recorded at the supplied address.</p><h2>Products and safe use</h2><p>Colours and packaging can vary slightly from images. Age labels, warnings, instructions, and adult-supervision guidance must be followed. Batteries and accessories are included only where the product description says so.</p><h2>Returns and acceptable use</h2><p>Eligible returns are handled under our Returns & Refunds policy. You may not misuse the site, attempt unauthorised access, copy protected material at scale, submit unlawful content, or use Kidlo for fraudulent transactions.</p><h2>Contact</h2><p>Questions about these terms may be sent to <strong>hello@kidlotoys.pk</strong>. Nothing in these terms removes rights that cannot legally be excluded under applicable Pakistani law.</p>`;
}

function wholesaleHtml() {
  return `<p>Kidlo supplies selected toys to retailers, schools, event planners, corporate teams, and other registered organisations. Availability and trade pricing depend on product, quantity, destination, and lead time.</p><h2>Who we work with</h2><div class="info-grid"><div class="info-card"><h3>Retailers</h3><p>Repeat stock, mixed cartons, seasonal ranges, and product information.</p></div><div class="info-card"><h3>Schools & institutions</h3><p>Age-based learning, activity, reward, and recreation products.</p></div><div class="info-card"><h3>Events & gifting</h3><p>Birthday favours, family days, launches, and employee gifting.</p></div><div class="info-card"><h3>Corporate buyers</h3><p>Quotations, invoices, grouped packing, and planned delivery.</p></div></div><h2>Trade terms</h2><ul><li>Wholesale consideration generally begins at 12 units per SKU or an agreed mixed-carton value.</li><li>Prices exclude delivery unless the quotation states otherwise.</li><li>A deposit may be required for reserved, imported, customised, or high-volume stock.</li><li>Lead times begin after quotation approval and payment confirmation.</li></ul><p>Use the form below with your business name, city, product interest, estimated quantities, and required date. Our team will respond with availability and next steps.</p>`;
}

function returnsHtml() {
  return `<p>We want every purchase to arrive complete and as described. Eligible unused products may be returned within 30 calendar days of delivery, while damaged, defective, or incorrect items should be reported as soon as possible.</p><h2>Start a return</h2><ol class="process"><li>Contact Kidlo with your order number and the item you want to return.</li><li>For damage, defects, or an incorrect item, share clear photos or a short video of the product and packaging.</li><li>Keep the item, accessories, manuals, labels, and original packaging together for collection.</li><li>After inspection, we confirm replacement, store credit, or refund and the expected timing.</li></ol><h2>Eligibility</h2><ul><li><strong>Change of mind:</strong> unused, unopened where sealed, complete, and in resalable packaging.</li><li><strong>Faulty or incorrect:</strong> Kidlo arranges collection and covers reasonable return delivery.</li><li><strong>Not eligible:</strong> used, damaged after delivery, incomplete, personalised, clearance marked final sale, or opened hygiene-sensitive baby items unless faulty.</li></ul><h2>Refund timing</h2><p>Card and wallet refunds are returned to the original method where possible, usually within 5–7 working days after approval. Cash-on-delivery refunds are sent by verified bank transfer or mobile wallet. Your bank or provider may require additional processing time.</p><p class="policy-note">A damaged outer courier bag does not always mean the product is damaged. If it is safe, photograph the parcel before opening and retain all packaging until your case is resolved.</p>`;
}

function faqHtml() {
  return `<p>Find quick answers about ordering, delivery, products, payments, gifts, and returns. For help with an existing purchase, include your order number when contacting us.</p><div class="faq"><details open><summary>Where does Kidlo deliver?</summary><p>We deliver across Pakistan through courier partners. Most orders arrive within 2–5 working days; remote destinations and high-volume periods may take longer.</p></details><details><summary>Which payment methods are available?</summary><p>Available options appear at checkout and may include cash on delivery, card, EasyPaisa, and JazzCash. Never share your PIN or one-time code with anyone claiming to be Kidlo.</p></details><details><summary>How do I track an order?</summary><p>Open Track My Order and enter the Kidlo order number plus the phone used at checkout. The demo order is KD1001 with 03001234567.</p></details><details><summary>Can I change or cancel an order?</summary><p>Contact us promptly. We can usually update an order before packing; after dispatch, a change may not be possible and courier or return charges can apply.</p></details><details><summary>How should I choose an age?</summary><p>Use the recommended age on the product page and consider the child's abilities and interests. For children under three, avoid products with small detachable parts and supervise all play.</p></details><details><summary>Are batteries included?</summary><p>Only when the product description specifically says they are included. We recommend having the stated battery type ready before gifting.</p></details><details><summary>Can Kidlo wrap a gift?</summary><p>Gift wrapping is complimentary on qualifying orders over PKR 3,000. Add the recipient message and any delivery instructions in the checkout notes.</p></details><details><summary>What if an item arrives damaged?</summary><p>Keep the item and packaging, take clear photos or a short video, and contact us with your order number. Eligible cases are replaced or refunded under our return policy.</p></details><details><summary>Do you support schools and bulk orders?</summary><p>Yes. Share the age group, quantities, budget, city, and required date through our Bulk Orders or Wholesale page for a tailored quotation.</p></details></div>`;
}

function shippingHtml() {
  return `<p>Kidlo delivers throughout Pakistan using established courier partners. Most in-stock orders arrive within 2–5 working days after confirmation.</p><div class="info-grid"><div class="info-card"><h3>Standard delivery</h3><p>Free on qualifying orders of PKR 2,000 or more; PKR 199 below the threshold.</p></div><div class="info-card"><h3>Dispatch cut-off</h3><p>Confirmed Lahore and Karachi orders placed before 2 PM may dispatch the same day.</p></div><div class="info-card"><h3>Order tracking</h3><p>Use your order number and checkout phone on the Track My Order page.</p></div><div class="info-card"><h3>Courier contact</h3><p>Keep your phone available; the rider may call for directions or delivery confirmation.</p></div></div><h2>Delivery estimates</h2><ul><li><strong>Lahore and Karachi:</strong> typically 1–3 working days.</li><li><strong>Other major cities:</strong> typically 2–4 working days.</li><li><strong>Remote areas:</strong> typically 3–6 working days where courier service is available.</li></ul><h2>Important information</h2><p>Orders placed after the cut-off, on public holidays, or during major campaigns may dispatch the next working day. Weather, road closures, security restrictions, and courier capacity can affect estimates. Please provide a complete address, city, landmark, and reachable phone number.</p><p class="policy-note">Inspect the parcel for obvious damage or tampering before accepting it. If there is a concern, photograph the package and contact Kidlo promptly.</p>`;
}

function ageGuideHtml() {
  return `<p>Age guidance is a starting point, not a measure of ability. Choose a toy that is safe for the youngest child who may access it, then consider interests, confidence, attention span, and the level of adult support available.</p><div class="info-grid"><div class="info-card"><h3>0–2 years</h3><p>Sensory textures, soft toys, rattles, stacking, push-and-pull play. Avoid small parts, long cords, and accessible batteries.</p></div><div class="info-card"><h3>3–5 years</h3><p>Pretend play, large building pieces, first puzzles, art, movement, and simple cause-and-effect games.</p></div><div class="info-card"><h3>6–8 years</h3><p>Construction sets, beginner STEM, craft kits, outdoor games, RC toys, and rule-based family games.</p></div><div class="info-card"><h3>9–11 years</h3><p>Detailed builds, science kits, strategy games, creative projects, robotics, and skill-based outdoor play.</p></div><div class="info-card"><h3>12–14 years</h3><p>Advanced STEM, coding, hobby kits, complex strategy, model making, and supervised drones.</p></div><div class="info-card"><h3>15+ years</h3><p>Collector pieces, advanced projects, technical builds, social games, and specialist hobby products.</p></div></div><h2>Size and fit</h2><p>For ride-ons, sports equipment, costumes, and wearable accessories, check product dimensions rather than relying on age alone. Compare measurements with an item that currently fits and allow room for safe movement—not excessive growth.</p><h2>Safety comes first</h2><ul><li>Follow the strictest age warning shown on the product or packaging.</li><li>Inspect toys regularly and remove damaged pieces, loose batteries, or broken cords.</li><li>Use helmets and protective equipment where recommended.</li><li>Supervise water, projectile, electrical, chemistry, ride-on, and drone play.</li></ul>`;
}

function giftHtml() {
  return `<p>A Kidlo gift card lets parents and children choose the toy that suits them. Digital cards are issued as a unique checkout code and can be sent to the purchaser or directly to the recipient.</p><h2>Available values</h2><div class="info-grid"><div class="info-card"><h3>PKR 1,000</h3><p>A thoughtful contribution toward a favourite toy.</p></div><div class="info-card"><h3>PKR 2,000</h3><p>A flexible choice for birthdays and small celebrations.</p></div><div class="info-card"><h3>PKR 5,000</h3><p>Ideal for family gifting and milestone occasions.</p></div><div class="info-card"><h3>Custom value</h3><p>Ask our team about larger personal or corporate requirements.</p></div></div><h2>How it works</h2><ol class="process"><li>Submit the form with the value, recipient details, and preferred delivery date.</li><li>Our team confirms payment and prepares the unique digital card.</li><li>The recipient enters the code at checkout before completing payment.</li></ol><h2>Gift card terms</h2><ul><li>Valid for 12 months from issue unless the card states otherwise.</li><li>May be used toward products and standard delivery charges on Kidlo.</li><li>Not redeemable for cash and cannot be replaced after unauthorised sharing or use.</li><li>If the order exceeds the balance, the remaining amount is paid using an available checkout method.</li></ul>`;
}

function bulkHtml() {
  return `<p>We help schools, organisations, event planners, and families source larger quantities without making every item identical. Tell us the audience and occasion; we can suggest an age-appropriate mix within your budget.</p><h2>Popular requirements</h2><div class="info-grid"><div class="info-card"><h3>Schools</h3><p>Prizes, activity days, classroom kits, sports events, and learning resources.</p></div><div class="info-card"><h3>Celebrations</h3><p>Birthday favours, Eid gifts, mehndi activities, and family events.</p></div><div class="info-card"><h3>Community events</h3><p>Society events, charity distributions, recreation, and children's programmes.</p></div><div class="info-card"><h3>Corporate gifting</h3><p>Family days, employee gifts, branded notes, and grouped delivery.</p></div></div><h2>What to include</h2><ul><li>Event date and delivery city.</li><li>Number of children and approximate age range.</li><li>Per-child or total budget.</li><li>Preferred categories, packaging, and any items to avoid.</li></ul><p>Standard lead time is around four working days within Punjab and six working days for other provinces after approval and payment. Large, customised, or imported requirements may need longer.</p>`;
}

function contactHtml() {
  return `<p>Our Lahore support team can help with products, orders, delivery, returns, gifts, schools, and business purchases. For the quickest resolution, include your order number where relevant.</p><div class="info-grid"><div class="info-card"><h3>Call or WhatsApp</h3><p><strong>+92 300 1234567</strong><br>Monday–Saturday, 9am–9pm PKT</p></div><div class="info-card"><h3>Email</h3><p><strong>hello@kidlotoys.pk</strong><br>Replies usually arrive within one working day.</p></div><div class="info-card"><h3>Visit or write</h3><p>14-B, Gulberg III<br>Lahore, Pakistan</p></div><div class="info-card"><h3>Existing orders</h3><p>Use Track My Order first for the latest fulfilment status.</p></div></div><h2>Before sending a message</h2><p>Do not share card details, PINs, passwords, or one-time codes. Kidlo representatives will never request them. Product and order enquiries should include enough detail for us to identify the item or purchase.</p>`;
}

function stemArticle() {
  return `<p>Between 8 and 12, children can follow a multi-step build and still want it to feel like a toy. That is the window where a coding robot or a junior lab earns its shelf space.</p><h2>What we put in the cart</h2><p>Start with one open-ended kit, not five boxed experiments. The Coding Robot Starter Kit teaches sequence without a screen. The Junior Science Lab is better if they already like "why does this fizz?".</p><p>Leave the instructions nearby for the first session, then let them repeat it wrong. The repeat is the lesson.</p>`;
}

function giftArticle() {
  return `<p>A PKR 3,000 budget in Pakistan still covers a doll studio, a jewellery kit, or a plush that becomes the bedtime toy. Skip anything that needs extra batteries you have not bought.</p><ul><li>Rainbow unicorn plush — PKR 2,199</li><li>Princess jewellery kit — PKR 1,299</li><li>Slime and glow studio — PKR 1,599</li><li>Doctor pretend kit — PKR 1,799</li></ul><p>Add a handwritten note. On orders over PKR 3,000 we wrap it for you.</p>`;
}

function safetyArticle() {
  return `<p>Read the age floor before the photos. For toddlers, reject toys with button batteries, long cords, and parts that fit through a toilet-paper tube.</p><h2>A quick check</h2><ul><li>Edges are smooth and paint does not smell sharp.</li><li>Soft toys have embroidered eyes, not plastic ones that pull off.</li><li>The box names a real brand you can search.</li></ul><p>Kidlo marks an age range on every product page. If a listing and a box disagree, trust the stricter age and message us — we will correct the page.</p>`;
}

module.exports = { buildSeed, hashPassword, verifyPassword };
