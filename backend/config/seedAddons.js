const AddonService = require("../models/AddonService");

// A starter add-on catalogue so the feature is usable out of the box. Every
// entry is fully admin-editable (price, stock, availability, portfolio).
// Equipment items match the list in the product spec.
const SEED = [
    // ---------------- PHOTOGRAPHY ----------------
    {
        type: "photography",
        name: "Standard Photography Package",
        description: "A photographer covers your session — candid + action shots, edited gallery delivered within 3 days.",
        rating: 4.7,
        price: 1500,
        priceUnit: "2 hours",
        durationLabel: "2 hours",
        packageDetails: "~150 edited photos, online gallery, 1 photographer",
        image: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=800&auto=format&fit=crop"
    },
    {
        type: "photography",
        name: "Premium Photography Package",
        description: "Full-match coverage with two photographers, same-day teaser and a printed highlights set.",
        rating: 4.9,
        price: 2500,
        priceUnit: "4 hours",
        durationLabel: "4 hours",
        packageDetails: "300+ edited photos, 2 photographers, printed set of 20",
        image: "https://images.unsplash.com/photo-1526403224735-a11c0d6a0a1e?q=80&w=800&auto=format&fit=crop"
    },

    // ---------------- VIDEOGRAPHY ----------------
    {
        type: "videography",
        name: "Match Videography",
        description: "Single-camera full-match recording with scoreboard overlay. Full video delivered next day.",
        rating: 4.6,
        price: 2500,
        priceUnit: "match",
        durationLabel: "Full match",
        packageDetails: "1080p full match video, 1 camera operator",
        image: "https://images.unsplash.com/photo-1601506521937-0121a7fc2a6b?q=80&w=800&auto=format&fit=crop"
    },
    {
        type: "videography",
        name: "Highlights Reel + Match Video",
        description: "Full match plus a 3–4 minute edited highlights reel with music and slow-mo.",
        rating: 4.8,
        price: 3500,
        priceUnit: "match",
        durationLabel: "Full match",
        packageDetails: "Full video + edited highlights reel, 2 cameras",
        image: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=800&auto=format&fit=crop"
    },

    // ---------------- COACHES ----------------
    {
        type: "coach",
        name: "Cricket Coaching Session",
        sport: "Cricket",
        experienceYears: 5,
        specialization: "Batting & fielding drills",
        description: "One-on-one or small group coaching — technique, net practice and match tactics.",
        rating: 4.8,
        price: 500,
        priceUnit: "session",
        durationLabel: "1 hour session",
        image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=800&auto=format&fit=crop"
    },
    {
        type: "coach",
        name: "Football Coaching Session",
        sport: "Football",
        experienceYears: 4,
        specialization: "Passing, positioning & finishing",
        description: "Structured session covering ball control, pressing and small-sided games.",
        rating: 4.7,
        price: 500,
        priceUnit: "session",
        durationLabel: "1 hour session",
        image: "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?q=80&w=800&auto=format&fit=crop"
    },
    {
        type: "coach",
        name: "Badminton Coaching Session",
        sport: "Badminton",
        experienceYears: 3,
        specialization: "Footwork & smash technique",
        description: "Court movement, stroke correction and shuttle drills for beginners to intermediate.",
        rating: 4.6,
        price: 400,
        priceUnit: "session",
        durationLabel: "1 hour session",
        image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=800&auto=format&fit=crop"
    },

    // ---------------- EQUIPMENT: CRICKET ----------------
    { type: "equipment", category: "Cricket", name: "Cricket Bat", price: 100, priceUnit: "session", stock: 10, description: "Kashmir willow bat, size SH.", image: "https://images.unsplash.com/photo-1593766827228-8737b4534aa6?q=80&w=600&auto=format&fit=crop" },
    { type: "equipment", category: "Cricket", name: "Cricket Ball", price: 50, priceUnit: "session", stock: 20, description: "Leather / tennis ball (specify at venue).", image: "https://images.unsplash.com/photo-1607734834519-d8576ae60ea6?q=80&w=600&auto=format&fit=crop" },
    { type: "equipment", category: "Cricket", name: "Stumps Set", price: 80, priceUnit: "session", stock: 8, description: "Full stumps + bails set.", image: "https://images.unsplash.com/photo-1624880357913-a8539238245b?q=80&w=600&auto=format&fit=crop" },
    { type: "equipment", category: "Cricket", name: "Batting Gloves", price: 60, priceUnit: "session", stock: 12, description: "Pair of batting gloves.", image: "https://images.unsplash.com/photo-1531379410502-63bfe8cdaf80?q=80&w=600&auto=format&fit=crop" },
    { type: "equipment", category: "Cricket", name: "Wicket Keeping Gloves", price: 70, priceUnit: "session", stock: 6, description: "Pair of keeping gloves.", image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=600&auto=format&fit=crop" },

    // ---------------- EQUIPMENT: FOOTBALL ----------------
    { type: "equipment", category: "Football", name: "Football", price: 80, priceUnit: "session", stock: 15, description: "Size 5 match football.", image: "https://images.unsplash.com/photo-1614632537190-23e4146777db?q=80&w=600&auto=format&fit=crop" },
    { type: "equipment", category: "Football", name: "Bibs (set of 10)", price: 120, priceUnit: "session", stock: 10, description: "Set of 10 training bibs.", image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=600&auto=format&fit=crop" },
    { type: "equipment", category: "Football", name: "Cones (set of 20)", price: 60, priceUnit: "session", stock: 12, description: "Set of 20 marker cones.", image: "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?q=80&w=600&auto=format&fit=crop" },
    { type: "equipment", category: "Football", name: "Shin Guards", price: 40, priceUnit: "session", stock: 20, description: "Pair of shin guards.", image: "https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=600&auto=format&fit=crop" },
    { type: "equipment", category: "Football", name: "Goalkeeper Gloves", price: 70, priceUnit: "session", stock: 8, description: "Pair of goalkeeper gloves.", image: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?q=80&w=600&auto=format&fit=crop" }
];

async function seedAddons() {
    try {
        let inserted = 0;
        for (const data of SEED) {
            const exists = await AddonService.findOne({
                type: data.type,
                name: new RegExp(`^${data.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
            });
            if (!exists) {
                await AddonService.create({ ...data, active: true });
                inserted += 1;
            }
        }
        if (inserted > 0) {
            console.log("----------------------------------");
            console.log(`✨ Add-on seed: +${inserted} service(s)`);
            console.log("----------------------------------");
        }
    } catch (err) {
        console.error("⚠️  Failed to seed add-ons:", err.message);
    }
}

module.exports = seedAddons;
