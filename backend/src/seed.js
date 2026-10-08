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
    page(1, "about", "About Kidlo", "company", "Who we are", "🏪", aboutHtml(), 1),
    page(2, "our-story", "Our Story", "company", "Since 2019", "📖", storyHtml(), 2),
    page(3, "careers", "Careers", "company", "Work with Kidlo", "💼", careersHtml(), 3),
    page(4, "press", "Press Kit", "company", "Brand facts", "📰", pressHtml(), 4),
    page(5, "privacy", "Privacy Policy", "company", "How we handle data", "🔒", privacyHtml(), 5),
    page(6, "terms", "Terms of Use", "company", "Shopping terms", "📜", termsHtml(), 6),
    page(7, "wholesale", "Wholesale", "company", "Trade accounts", "🏬", wholesaleHtml(), 7),
    page(8, "returns", "Returns & Refunds", "support", "30-day returns", "🔄", returnsHtml(), 1),
    page(9, "faqs", "FAQs", "support", "Quick answers", "❓", faqHtml(), 2),
    page(10, "shipping", "Shipping Info", "support", "Delivery across Pakistan", "🚚", shippingHtml(), 3),
    page(11, "age-guide", "Size & Age Guide", "support", "Pick the right stage", "🎂", ageGuideHtml(), 4),
    page(12, "gift-cards", "Gift Cards", "support", "Give the choice of play", "🎁", giftHtml(), 5),
    page(13, "bulk-orders", "Bulk Orders", "support", "Schools and events", "📦", bulkHtml(), 6),
    page(14, "contact", "Contact Us", "support", "We are here to help", "💬", contactHtml(), 7),
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

  const orders = [
    { id: 1, order_no: "KD1001", customer_name: "Ayesha Malik", email: "ayesha@example.com", phone: "03001234567", address: "House 12, Block C, Gulberg III", city: "Lahore", country_code: "PK", country_name: "Pakistan", dial_code: "+92", payment_method: "cod", status: "Shipped", subtotal: 2199, shipping: 0, discount: 0, total: 2199, coupon_code: "", notes: "Gift wrap please", created_at: "2025-09-02T08:30:00.000Z" },
  ];
  const order_items = [
    { id: 1, order_id: 1, product_id: 14, name: "Rainbow Unicorn Plush 50cm", emoji: "🦄", price: 2199, qty: 1 },
  ];

  return {
    admins: [{ id: 1, name: "Kidlo Admin", email: "admin@kidlo.pk", password_hash: hashPassword("kidlo123"), role: "owner", created_at: NOW }],
    categories,
    products,
    sections,
    pages,
    blog_posts,
    reviews,
    orders,
    order_items,
    coupons,
    customers: [],
    newsletter: [],
    inquiries: [],
    ...buildPlaces(),
  };
}

function cat(id, slug, name, emoji, blurb, color, count_label, parent_slug, group_name, nav_group, filter_tag, sort_order, show_on_home, show_in_footer, show_in_nav, virtual = "", virtual_value = "") {
  return { id, slug, name, emoji, blurb, color, count_label, parent_slug, group_name, nav_group, filter_tag, sort_order, show_on_home, show_in_footer, show_in_nav, virtual, virtual_value, active: 1 };
}

function product(id, name, emoji, category_slug, gender, age_min, age_max, age_label, price, compare_price, badge, rating, review_count, stock, sold, description, gradient, brand, sku, tags, featured, is_deal) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return { id, slug, name, emoji, category_slug, gender, age_min, age_max, age_label, price, compare_price, badge, rating, review_count, stock, sold, description, gradient: `linear-gradient(135deg,${gradient})`, brand, sku, tags, featured, is_deal, active: 1, created_at: NOW, updated_at: NOW };
}

function section(id, section_key, name, sort_order, payload) {
  return { id, section_key, name, enabled: 1, sort_order, payload, updated_at: NOW };
}

function page(id, slug, title, group_name, excerpt, emoji, content, sort_order) {
  return { id, slug, title, group_name, excerpt, content, emoji, enabled: 1, sort_order, updated_at: NOW };
}

function post(id, slug, title, category, excerpt, emoji, gradient, author, read_time, published_at, content) {
  return { id, slug, title, category, excerpt, content, emoji, gradient: `linear-gradient(135deg,${gradient})`, author, read_time, published_at, enabled: 1 };
}

function review(id, product_id, author, city, role, avatar, stars, text) {
  return { id, product_id, author, city, role, avatar, stars, text, verified: 1, enabled: 1, created_at: NOW };
}

function aboutHtml() {
  return `<p>Kidlo is a Pakistan-based online toy store for babies, toddlers, and growing kids. Parents shop by age, interest, and budget, then pay by cash on delivery, card, or mobile wallet.</p><p>We started in 2019 with a simple idea: safe toys should be easy to find, honestly priced, and delivered to the door. The catalogue mixes imported play sets with everyday favourites — RC cars, dolls, STEM kits, outdoor games, and baby toys.</p><h2>How the shop works</h2><ul><li>Browse by category, age, or search.</li><li>Add to cart and check out with COD, card, EasyPaisa, or JazzCash.</li><li>Orders over PKR 2,000 ship free. Most parcels arrive in 2–5 days.</li><li>Unopened items can be returned within 30 days.</li></ul><p>The storefront you see — hero, deals, categories, reviews, and pages — is edited from the Kidlo admin, so campaigns can change without a new release.</p>`;
}

function storyHtml() {
  return `<p>Kidlo began as a small Lahore storeroom and a WhatsApp catalogue. Parents kept asking for the same three things: an age label they could trust, a price in rupees without surprise fees, and a rider who actually called before arriving.</p><p>By 2022 the catalogue had grown past a thousand toys and delivery covered the major cities. The website now carries that same promise: show the real price, the real age range, and the stock we can ship.</p><h2>What we still care about</h2><ul><li>Age guidance on every product.</li><li>Flash deals that end when the timer ends.</li><li>A person on WhatsApp when a gift has to arrive before a birthday.</li></ul>`;
}

function careersHtml() {
  return `<p>We hire buyers, warehouse leads, riders' coordinators, and customer guides in Lahore. Send a note with the role you want and a phone number. We read every inquiry from this page.</p><h2>Open interests</h2><ul><li>Catalogue buyer — toys and baby</li><li>Customer support — Urdu and English</li><li>Warehouse associate — Gulberg dispatch</li></ul><p>Use the form and choose Careers. There is no public application portal yet.</p>`;
}

function pressHtml() {
  return `<p>Kidlo Toys Pvt. Ltd. is a direct-to-parent toy retailer based in Lahore, selling online across Pakistan since 2019.</p><ul><li>Brand: Kidlo Toys</li><li>Site: this storefront</li><li>Focus: kids and baby toys, STEM, outdoor, gifts</li><li>Office: 14-B, Gulberg III, Lahore</li><li>Press email: hello@kidlotoys.pk</li></ul><p>Please credit the brand as Kidlo when you mention the store.</p>`;
}

function privacyHtml() {
  return `<p>We collect the details needed to deliver an order: name, phone, address, city, and payment choice. Account passwords are stored as a salted hash. We do not sell customer lists.</p><p>Order data stays in the shop database (MySQL when it is available, and a JSON copy that keeps the site online if MySQL is down). Newsletter emails are stored only to send deals you asked for.</p><p>To review or delete an account, write to hello@kidlotoys.pk from the same email you used at checkout.</p>`;
}

function termsHtml() {
  return `<p>Prices are in Pakistani rupees and include the discount shown on the product. A promo code applies once per order and only when the minimum spend is met. Cash on delivery can be refused if the phone number does not answer after two attempts.</p><p>Toys are sold for the age marked on the page. Kidlo is not a marketplace of private sellers; stock is purchased and shipped by us. Risk of loss passes when the courier marks the parcel delivered.</p>`;
}

function wholesaleHtml() {
  return `<p>Schools, birthday planners, and retailers can request a trade list. Tell us the city, the age group, and roughly how many pieces you need. We reply within one working day with availability and a bill.</p><p>Wholesale pricing starts at 12 mixed pieces of the same SKU. Branded gift wrap is optional.</p>`;
}

function returnsHtml() {
  return `<p>You have 30 days from delivery to return an unused toy in its original pack. Defective items are collected at our cost. Change-of-mind returns are picked up in major cities; the customer pays the rider fee elsewhere.</p><h2>Refunds</h2><ul><li>COD orders are refunded by bank transfer or JazzCash.</li><li>Card payments go back to the same card in 5–7 working days after we receive the parcel.</li><li>Opened hygiene-sensitive baby items cannot be resold and are replaced only if faulty.</li></ul>`;
}

function faqHtml() {
  return `<div class="faq"><details open><summary>Do you deliver outside Lahore and Karachi?</summary><p>Yes. Nationwide delivery is 2–5 days. Remote areas can take a day longer, and the courier calls before arrival.</p></details><details><summary>Is cash on delivery available?</summary><p>Yes, across Pakistan. Please keep the exact amount ready if you can. Card, EasyPaisa, and JazzCash are also offered at checkout.</p></details><details><summary>How do I track an order?</summary><p>Open Track My Order and enter the order number (for example KD1001) plus the phone used at checkout.</p></details><details><summary>Are the toys safe for babies?</summary><p>Check the age label on each product. Baby items are chosen for soft materials and no small detachable parts. Still supervise play.</p></details><details><summary>Can I send a gift?</summary><p>Orders over PKR 3,000 include free gift wrap and a short message. Add the message in the order notes.</p></details></div>`;
}

function shippingHtml() {
  return `<p>Orders placed before 2 PM from Lahore or Karachi are dispatched the same day, Saturday included. Everyone else ships on the next working morning.</p><ul><li>Free delivery on orders of PKR 2,000 or more.</li><li>A flat PKR 199 fee under that amount.</li><li>You receive the order number as soon as checkout completes.</li></ul><p>If a toy is out of stock after you pay online, we refund that line before the parcel leaves.</p>`;
}

function ageGuideHtml() {
  return `<p>Age bands on Kidlo match how children actually play, not only the factory label.</p><ul><li><strong>0–2:</strong> sensory mats, teethers, push walkers. Nothing with small parts.</li><li><strong>3–5:</strong> big blocks, pretend play, first puzzles.</li><li><strong>6–8:</strong> RC cars, art sets, simple board games.</li><li><strong>9–11:</strong> STEM kits, strategy games, larger builds.</li><li><strong>12–14:</strong> coding robots, drones with an adult, hobby kits.</li><li><strong>15+:</strong> advanced kits. Drones and planes still need open space and supervision.</li></ul><p>When a gift is between two ages, choose the interest first and the age second. Our WhatsApp team will sanity-check a cart.</p>`;
}

function giftHtml() {
  return `<p>Kidlo gift cards are issued by email as a code you can apply at checkout, same as a coupon. Ask for one through the contact form with the amount (PKR 1,000, 2,000, or 5,000) and the recipient phone.</p><p>Cards do not expire for 12 months and cannot be exchanged for cash.</p>`;
}

function bulkHtml() {
  return `<p>Planning a school stall, mehndi favours, or a society sports day? Send the date, city, and a rough list. We pack mixed boxes of outdoor toys, art kits, or baby gifts.</p><p>Lead time is usually 4 working days inside Punjab and 6 days for other provinces.</p>`;
}

function contactHtml() {
  return `<p>Call or WhatsApp +92 300 1234567, email hello@kidlotoys.pk, or use the form. The Gulberg office is open Monday to Saturday, 9am to 9pm PKT.</p><p>For an order already placed, tracking with your order number is faster than a new message.</p>`;
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
