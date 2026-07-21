export interface ProductCategory {
    id: string;
    name: string;
    subcategories: string[];
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
    {
        id: "sofas",
        name: "Sofas",
        subcategories: [
            "3-Seater Sofas",
            "Corner Sofas",
            "Modular Sofas",
            "Loveseats",
            "Recliner Sofas",
            "Sofa Beds"
        ]
    },
    {
        id: "chairs",
        name: "Chairs",
        subcategories: ["Dining Chairs", "Office Chairs", "Accent Chairs", "Armchairs", "Bar Stools"]
    },
    {
        id: "tables",
        name: "Tables",
        subcategories: [
            "Dining Tables",
            "Coffee Tables",
            "Side Tables",
            "Console Tables",
            "Desks",
            "Extendable Tables"
        ]
    },
    {
        id: "beds",
        name: "Beds",
        subcategories: ["Double Beds", "King Beds", "Queen Beds", "Storage Beds", "Bunk Beds"]
    },
    {
        id: "wardrobes",
        name: "Wardrobes",
        subcategories: ["Sliding Wardrobes", "Hinged Wardrobes", "Walk-in Modules", "Mirrored Wardrobes"]
    },
    {
        id: "mattresses",
        name: "Mattresses",
        subcategories: ["Memory Foam", "Pocket Spring", "Hybrid", "Latex", "Orthopaedic"]
    },
    {
        id: "storage",
        name: "Storage",
        subcategories: ["Bookcases", "Cabinets", "Sideboards", "TV Units", "Shelving", "Ottomans"]
    },
    {
        id: "outdoor",
        name: "Outdoor Furniture",
        subcategories: ["Dining Sets", "Lounge Sets", "Benches", "Sun Loungers"]
    },
    {
        id: "lighting",
        name: "Lighting",
        subcategories: ["Floor Lamps", "Table Lamps", "Pendant Lights", "Wall Lights", "Ceiling Lights"]
    },
    {
        id: "bedroom",
        name: "Bedroom",
        subcategories: ["Nightstands", "Dressers", "Vanities", "Headboards", "Bedroom Benches", "Mirrors"]
    }
];
