"use strict";
/**
 * ReturnFlow – Database Seed Script
 * ----------------------------------
 * Creates a known, reproducible baseline for development and testing.
 *
 * Run:  npx ts-node prisma/seed.ts
 * Reset: npx ts-node prisma/reset.ts
 *
 * Credentials after seed:
 *   admin@returnflow.com  / admin123   (ADMIN)
 *   admin2@returnflow.com / admin123   (ADMIN)
 *   alice@example.com     / password123 (CUSTOMER)
 *   bob@example.com       / password123 (CUSTOMER)
 *   charlie@example.com   / password123 (CUSTOMER)
 *   diana@example.com     / password123 (CUSTOMER)
 *   eve@example.com       / password123 (CUSTOMER)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
/** Returns a Date exactly n full days before now (ms precision) */
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
/** 8% tax rounded to nearest cent */
const applyTax = (cents) => Math.round(cents * 0.08);
// ────────────────────────────────────────────────────────────────────────────
// PRODUCTS (defined once; referenced by SKU throughout)
// ────────────────────────────────────────────────────────────────────────────
const PRODUCTS = [
    { sku: 'ELEC-001', name: 'Wireless Headphones', category: 'ELECTRONICS', unitPriceCents: 8999, isFinalSale: false, description: 'Premium over-ear wireless headphones with ANC.' },
    { sku: 'ELEC-002', name: 'USB-C Charging Cable', category: 'ELECTRONICS', unitPriceCents: 1999, isFinalSale: false, description: '2-metre braided USB-C to USB-C cable, 100W.' },
    { sku: 'ELEC-003', name: 'Bluetooth Speaker', category: 'ELECTRONICS', unitPriceCents: 4999, isFinalSale: false, description: 'Portable waterproof speaker, 24-hour battery.' },
    { sku: 'ELEC-004', name: 'Laptop Stand', category: 'ELECTRONICS', unitPriceCents: 3499, isFinalSale: true, description: 'Aluminium adjustable laptop stand. FINAL SALE.' },
    { sku: 'ELEC-005', name: 'Smart Watch', category: 'ELECTRONICS', unitPriceCents: 29999, isFinalSale: false, description: 'GPS smartwatch with heart-rate monitor.' },
    { sku: 'CLTH-001', name: 'Cotton T-Shirt', category: 'CLOTHING', unitPriceCents: 2499, isFinalSale: false, description: '100% organic cotton unisex t-shirt.' },
    { sku: 'CLTH-002', name: 'Denim Jeans', category: 'CLOTHING', unitPriceCents: 5999, isFinalSale: false, description: 'Slim-fit stretch denim jeans.' },
    { sku: 'CLTH-003', name: 'Winter Jacket', category: 'CLOTHING', unitPriceCents: 12999, isFinalSale: false, description: 'Insulated waterproof winter jacket.' },
    { sku: 'BOOK-001', name: 'Clean Code', category: 'BOOKS', unitPriceCents: 3999, isFinalSale: false, description: 'A handbook of agile software craftsmanship.' },
    { sku: 'BOOK-002', name: 'Design Patterns', category: 'BOOKS', unitPriceCents: 4499, isFinalSale: false, description: 'Elements of reusable object-oriented software.' },
    { sku: 'GIFT-001', name: 'Amazon Gift Card $50', category: 'GIFT_CARD', unitPriceCents: 5000, isFinalSale: false, description: '$50 digital gift card. Non-returnable.' },
    { sku: 'GIFT-002', name: 'Store Credit $25', category: 'GIFT_CARD', unitPriceCents: 2500, isFinalSale: false, description: '$25 store credit voucher. Non-returnable.' },
    { sku: 'PERI-001', name: 'Organic Coffee Beans 1kg', category: 'PERISHABLE', unitPriceCents: 2299, isFinalSale: false, description: 'Single-origin arabica coffee beans. Non-returnable.' },
    { sku: 'PERI-002', name: 'Vitamin C Supplements', category: 'PERISHABLE', unitPriceCents: 1599, isFinalSale: false, description: '1000mg vitamin C, 90 tablets. Non-returnable.' },
    { sku: 'PERS-001', name: 'Custom Name Necklace', category: 'PERSONALIZED', unitPriceCents: 7999, isFinalSale: false, description: 'Sterling silver personalised name necklace. Non-returnable.' },
    { sku: 'PERS-002', name: 'Engraved Watch', category: 'PERSONALIZED', unitPriceCents: 19999, isFinalSale: false, description: 'Stainless steel watch with custom engraving. Non-returnable.' },
    { sku: 'HOME-001', name: 'Coffee Maker', category: 'HOME', unitPriceCents: 6999, isFinalSale: false, description: '12-cup programmable drip coffee maker.' },
    { sku: 'HOME-002', name: 'Air Purifier', category: 'HOME', unitPriceCents: 8999, isFinalSale: false, description: 'True HEPA air purifier for rooms up to 500 sq ft.' },
    { sku: 'SPRT-001', name: 'Yoga Mat', category: 'SPORTS', unitPriceCents: 2999, isFinalSale: false, description: 'Non-slip 6mm yoga mat with carrying strap.' },
    { sku: 'SPRT-002', name: 'Resistance Bands Set', category: 'SPORTS', unitPriceCents: 2499, isFinalSale: false, description: '5-piece resistance band set, 10–50 lbs.' },
    { sku: 'SPRT-003', name: 'Running Shoes', category: 'SPORTS', unitPriceCents: 8999, isFinalSale: false, description: 'Lightweight cushioned running shoes.' },
    { sku: 'OTHR-001', name: 'Phone Case', category: 'OTHER', unitPriceCents: 1499, isFinalSale: false, description: 'Clear TPU phone case, universal fit.' },
];
// ────────────────────────────────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────────────────────────────────
async function main() {
    console.log('🌱 Starting ReturnFlow seed...\n');
    // ── 1. Clear all data (child → parent order) ─────────────────────────────
    await prisma.refund.deleteMany();
    await prisma.returnStatusHistory.deleteMany();
    await prisma.returnImage.deleteMany();
    await prisma.returnItem.deleteMany();
    await prisma.returnRequest.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
    console.log('  ✓ Cleared existing data');
    // ── 2. Users ──────────────────────────────────────────────────────────────
    const hash = (pw) => bcrypt_1.default.hash(pw, 10);
    const admin1 = await prisma.user.create({ data: { email: 'admin@returnflow.com', passwordHash: await hash('admin123'), name: 'Admin User', role: 'ADMIN' } });
    const admin2 = await prisma.user.create({ data: { email: 'admin2@returnflow.com', passwordHash: await hash('admin123'), name: 'Admin Two', role: 'ADMIN' } });
    const alice = await prisma.user.create({ data: { email: 'alice@example.com', passwordHash: await hash('password123'), name: 'Alice Smith', role: 'CUSTOMER' } });
    const bob = await prisma.user.create({ data: { email: 'bob@example.com', passwordHash: await hash('password123'), name: 'Bob Jones', role: 'CUSTOMER' } });
    const charlie = await prisma.user.create({ data: { email: 'charlie@example.com', passwordHash: await hash('password123'), name: 'Charlie Brown', role: 'CUSTOMER' } });
    const diana = await prisma.user.create({ data: { email: 'diana@example.com', passwordHash: await hash('password123'), name: 'Diana Prince', role: 'CUSTOMER' } });
    const eve = await prisma.user.create({ data: { email: 'eve@example.com', passwordHash: await hash('password123'), name: 'Eve Wilson', role: 'CUSTOMER' } });
    console.log('  ✓ Created 2 admins + 5 customers');
    // ── 3. Products ───────────────────────────────────────────────────────────
    const p = {};
    for (const prod of PRODUCTS) {
        const created = await prisma.product.create({
            data: {
                sku: prod.sku,
                name: prod.name,
                description: prod.description,
                category: prod.category,
                isFinalSale: prod.isFinalSale,
                unitPriceCents: prod.unitPriceCents,
                stock: 100,
            },
        });
        p[prod.sku] = created;
    }
    console.log('  ✓ Created 22 products');
    /**
     * Creates an order + its order_items in a single transaction.
     *
     * Money rules:
     *   lineTotalCents   = unitPriceCents * qty - lineDiscountCents
     *   subtotalCents    = Σ(lineTotalCents)
     *   discountCents    = order-level discount (applied to subtotal)
     *   taxCents         = round(8% * (subtotal - orderDiscount))
     *   totalCents       = subtotal - orderDiscount + shipping + tax
     */
    async function createOrder(opts) {
        const { customerId, status, items, orderDiscountCents = 0, shippingCents = 599, deliveredAt, placedAt, } = opts;
        let subtotalCents = 0;
        const lineItems = items.map((item) => {
            const lineDiscount = item.discountCents ?? 0;
            const lineTotalCents = item.unitPriceCents * item.quantity - lineDiscount;
            subtotalCents += lineTotalCents;
            return { ...item, lineDiscount, lineTotalCents };
        });
        const taxCents = applyTax(subtotalCents - orderDiscountCents);
        const totalCents = subtotalCents - orderDiscountCents + shippingCents + taxCents;
        return prisma.order.create({
            data: {
                customerId,
                status,
                subtotalCents,
                discountCents: orderDiscountCents,
                shippingCents,
                taxCents,
                totalCents,
                deliveredAt: deliveredAt ?? null,
                createdAt: placedAt ?? daysAgo(45),
                updatedAt: deliveredAt ?? placedAt ?? daysAgo(45),
                items: {
                    create: lineItems.map((li) => ({
                        productId: li.productId,
                        quantity: li.quantity,
                        unitPriceCents: li.unitPriceCents,
                        discountCents: li.lineDiscount,
                        taxCents: Math.round(applyTax(li.lineTotalCents)),
                        lineTotalCents: li.lineTotalCents,
                    })),
                },
            },
            include: { items: true },
        });
    }
    // ── 5. Orders (36 scenarios) ──────────────────────────────────────────────
    console.log('  Creating orders...');
    // ── BOUNDARY CASES ────────────────────────────────────────────────────────
    // Order 1: delivered EXACTLY 30 days ago — still eligible (day 30 is within window)
    const orderDay30 = await createOrder({
        customerId: alice.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(30),
        placedAt: daysAgo(37),
        shippingCents: 599,
        items: [{ productId: p['ELEC-001'].id, quantity: 1, unitPriceCents: 8999 }],
    });
    // Order 2: delivered EXACTLY 31 days ago — NOT eligible
    const orderDay31 = await createOrder({
        customerId: alice.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(31),
        placedAt: daysAgo(38),
        shippingCents: 599,
        items: [{ productId: p['ELEC-002'].id, quantity: 1, unitPriceCents: 1999 }],
    });
    // Order 3: delivered 1 day ago — clearly eligible
    const orderDay1 = await createOrder({
        customerId: alice.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(1),
        placedAt: daysAgo(8),
        shippingCents: 599,
        items: [{ productId: p['ELEC-003'].id, quantity: 1, unitPriceCents: 4999 }],
    });
    // Order 4: delivered 60 days ago — NOT eligible
    await createOrder({
        customerId: bob.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(60),
        placedAt: daysAgo(67),
        shippingCents: 599,
        items: [{ productId: p['CLTH-001'].id, quantity: 1, unitPriceCents: 2499 }],
    });
    // ── NON-RETURNABLE CATEGORIES ─────────────────────────────────────────────
    // Order 5: all non-returnable (GIFT_CARD + PERISHABLE)
    await createOrder({
        customerId: bob.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(5),
        placedAt: daysAgo(12),
        shippingCents: 0,
        items: [
            { productId: p['GIFT-001'].id, quantity: 1, unitPriceCents: 5000 },
            { productId: p['PERI-001'].id, quantity: 1, unitPriceCents: 2299 },
        ],
    });
    // Order 6: PERSONALIZED items (non-returnable)
    await createOrder({
        customerId: charlie.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(10),
        placedAt: daysAgo(17),
        shippingCents: 599,
        items: [
            { productId: p['PERS-001'].id, quantity: 1, unitPriceCents: 7999 },
            { productId: p['PERS-002'].id, quantity: 1, unitPriceCents: 19999 },
        ],
    });
    // Order 7: final-sale item (ELEC-004 is_final_sale=true)
    await createOrder({
        customerId: diana.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(7),
        placedAt: daysAgo(14),
        shippingCents: 599,
        items: [
            { productId: p['ELEC-004'].id, quantity: 1, unitPriceCents: 3499 }, // FINAL SALE
            { productId: p['CLTH-001'].id, quantity: 1, unitPriceCents: 2499 }, // returnable
        ],
    });
    // ── DISCOUNT SCENARIOS ────────────────────────────────────────────────────
    // Order 8: no discount, no shipping (free shipping)
    await createOrder({
        customerId: alice.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(5),
        placedAt: daysAgo(12),
        shippingCents: 0,
        orderDiscountCents: 0,
        items: [{ productId: p['HOME-001'].id, quantity: 1, unitPriceCents: 6999 }],
    });
    // Order 9: 10% order-level discount  (~$8.99 off $89.99 headphones)
    await createOrder({
        customerId: bob.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(14),
        placedAt: daysAgo(21),
        shippingCents: 599,
        orderDiscountCents: 900, // $9.00 discount
        items: [{ productId: p['ELEC-001'].id, quantity: 1, unitPriceCents: 8999 }],
    });
    // Order 10: 20% order-level discount on two items
    await createOrder({
        customerId: charlie.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(20),
        placedAt: daysAgo(27),
        shippingCents: 599,
        orderDiscountCents: 2600, // $26 off
        items: [
            { productId: p['CLTH-003'].id, quantity: 1, unitPriceCents: 12999 },
            { productId: p['SPRT-003'].id, quantity: 1, unitPriceCents: 8999 },
        ],
    });
    // Order 11: line-level discounts (not order-level)
    await createOrder({
        customerId: eve.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(17),
        placedAt: daysAgo(24),
        shippingCents: 599,
        items: [
            { productId: p['SPRT-002'].id, quantity: 2, unitPriceCents: 2499, discountCents: 250 }, // $2.50 off
            { productId: p['SPRT-003'].id, quantity: 1, unitPriceCents: 8999, discountCents: 500 }, // $5.00 off
        ],
    });
    // ── MULTI-QUANTITY ────────────────────────────────────────────────────────
    // Order 12: multiple quantities of same product
    await createOrder({
        customerId: diana.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(10),
        placedAt: daysAgo(17),
        shippingCents: 599,
        items: [
            { productId: p['CLTH-001'].id, quantity: 3, unitPriceCents: 2499 }, // qty=3
            { productId: p['SPRT-001'].id, quantity: 2, unitPriceCents: 2999 }, // qty=2
        ],
    });
    // ── NON-DELIVERED STATUSES (not eligible) ─────────────────────────────────
    // Order 13: PENDING
    await createOrder({
        customerId: diana.id,
        status: 'PENDING',
        placedAt: daysAgo(1),
        shippingCents: 599,
        items: [{ productId: p['OTHR-001'].id, quantity: 1, unitPriceCents: 1499 }],
    });
    // Order 14: PROCESSING
    await createOrder({
        customerId: diana.id,
        status: 'PROCESSING',
        placedAt: daysAgo(2),
        shippingCents: 599,
        items: [{ productId: p['ELEC-002'].id, quantity: 1, unitPriceCents: 1999 }],
    });
    // Order 15: SHIPPED
    await createOrder({
        customerId: diana.id,
        status: 'SHIPPED',
        placedAt: daysAgo(4),
        shippingCents: 599,
        items: [{ productId: p['BOOK-001'].id, quantity: 1, unitPriceCents: 3999 }],
    });
    // Order 16: CANCELLED
    await createOrder({
        customerId: eve.id,
        status: 'CANCELLED',
        placedAt: daysAgo(3),
        shippingCents: 599,
        items: [{ productId: p['HOME-002'].id, quantity: 1, unitPriceCents: 8999 }],
    });
    // ── PARTIAL RETURN ORDER (pre-seeded returns) ─────────────────────────────
    // Items: ELEC-002 (returned+refunded), ELEC-003 (pending return), SPRT-002 (untouched)
    const orderPartialReturn = await createOrder({
        customerId: alice.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(15),
        placedAt: daysAgo(22),
        shippingCents: 599,
        items: [
            { productId: p['ELEC-002'].id, quantity: 1, unitPriceCents: 1999 },
            { productId: p['ELEC-003'].id, quantity: 1, unitPriceCents: 4999 },
            { productId: p['SPRT-002'].id, quantity: 1, unitPriceCents: 2499 },
        ],
    });
    // ── FULLY RETURNED ORDER (pre-seeded) ────────────────────────────────────
    // Items: BOOK-001 + BOOK-002 — both returned and refunded
    const orderFullReturn = await createOrder({
        customerId: bob.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(25),
        placedAt: daysAgo(32),
        shippingCents: 599,
        items: [
            { productId: p['BOOK-001'].id, quantity: 1, unitPriceCents: 3999 },
            { productId: p['BOOK-002'].id, quantity: 1, unitPriceCents: 4499 },
        ],
    });
    // ── ADDITIONAL DIVERSE ORDERS ─────────────────────────────────────────────
    // Order 19: Alice – Smart Watch, 29 days ago
    await createOrder({
        customerId: alice.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(29),
        placedAt: daysAgo(36),
        shippingCents: 999,
        items: [{ productId: p['ELEC-005'].id, quantity: 1, unitPriceCents: 29999 }],
    });
    // Order 20: Bob – Home + Sports, 7 days ago
    await createOrder({
        customerId: bob.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(7),
        placedAt: daysAgo(14),
        shippingCents: 599,
        items: [
            { productId: p['HOME-001'].id, quantity: 1, unitPriceCents: 6999 },
            { productId: p['SPRT-001'].id, quantity: 1, unitPriceCents: 2999 },
        ],
    });
    // Order 21: Charlie – Books, 3 days ago
    await createOrder({
        customerId: charlie.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(3),
        placedAt: daysAgo(10),
        shippingCents: 0,
        items: [
            { productId: p['BOOK-001'].id, quantity: 1, unitPriceCents: 3999 },
            { productId: p['BOOK-002'].id, quantity: 1, unitPriceCents: 4499 },
        ],
    });
    // Order 22: Diana – Clothing, 12 days, with discount
    await createOrder({
        customerId: diana.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(12),
        placedAt: daysAgo(19),
        shippingCents: 599,
        orderDiscountCents: 1000,
        items: [
            { productId: p['CLTH-002'].id, quantity: 1, unitPriceCents: 5999 },
            { productId: p['CLTH-003'].id, quantity: 1, unitPriceCents: 12999 },
        ],
    });
    // Order 23: Eve – Electronics, 2 days
    await createOrder({
        customerId: eve.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(2),
        placedAt: daysAgo(9),
        shippingCents: 599,
        items: [{ productId: p['ELEC-001'].id, quantity: 1, unitPriceCents: 8999 }],
    });
    // Order 24: Bob – Winter jacket, 25 days
    await createOrder({
        customerId: bob.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(25),
        placedAt: daysAgo(32),
        shippingCents: 599,
        items: [{ productId: p['CLTH-003'].id, quantity: 1, unitPriceCents: 12999 }],
    });
    // Order 25: Charlie – Mixed returnable + non-returnable, 8 days
    await createOrder({
        customerId: charlie.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(8),
        placedAt: daysAgo(15),
        shippingCents: 599,
        items: [
            { productId: p['ELEC-003'].id, quantity: 1, unitPriceCents: 4999 },
            { productId: p['GIFT-002'].id, quantity: 1, unitPriceCents: 2500 }, // non-returnable
        ],
    });
    // Order 26: Alice – High-value with 20% discount, 4 days
    await createOrder({
        customerId: alice.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(4),
        placedAt: daysAgo(11),
        shippingCents: 999,
        orderDiscountCents: 6000, // $60 off
        items: [
            { productId: p['ELEC-005'].id, quantity: 1, unitPriceCents: 29999 },
            { productId: p['HOME-002'].id, quantity: 1, unitPriceCents: 8999 },
        ],
    });
    // Order 27: Eve – Air purifier, free shipping, 6 days
    await createOrder({
        customerId: eve.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(6),
        placedAt: daysAgo(13),
        shippingCents: 0,
        items: [{ productId: p['HOME-002'].id, quantity: 1, unitPriceCents: 8999 }],
    });
    // Order 28: Diana – Running shoes × 2 pair, 18 days
    await createOrder({
        customerId: diana.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(18),
        placedAt: daysAgo(25),
        shippingCents: 599,
        items: [{ productId: p['SPRT-003'].id, quantity: 2, unitPriceCents: 8999 }],
    });
    // Order 29: Charlie – Yoga mat + resistance bands, 21 days
    await createOrder({
        customerId: charlie.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(21),
        placedAt: daysAgo(28),
        shippingCents: 599,
        orderDiscountCents: 500,
        items: [
            { productId: p['SPRT-001'].id, quantity: 1, unitPriceCents: 2999 },
            { productId: p['SPRT-002'].id, quantity: 2, unitPriceCents: 2499 },
        ],
    });
    // Order 30: Bob – Phone case × 3, 29 days
    await createOrder({
        customerId: bob.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(29),
        placedAt: daysAgo(36),
        shippingCents: 299,
        items: [{ productId: p['OTHR-001'].id, quantity: 3, unitPriceCents: 1499 }],
    });
    // Order 31: Eve – Perishable + clothing (perishable non-returnable)
    await createOrder({
        customerId: eve.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(9),
        placedAt: daysAgo(16),
        shippingCents: 599,
        items: [
            { productId: p['PERI-002'].id, quantity: 2, unitPriceCents: 1599 }, // non-returnable
            { productId: p['CLTH-002'].id, quantity: 1, unitPriceCents: 5999 }, // returnable
        ],
    });
    // Order 32: Alice – Mixed, 45 days ago — NOT eligible
    await createOrder({
        customerId: alice.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(45),
        placedAt: daysAgo(52),
        shippingCents: 599,
        items: [
            { productId: p['HOME-001'].id, quantity: 1, unitPriceCents: 6999 },
            { productId: p['CLTH-001'].id, quantity: 2, unitPriceCents: 2499 },
        ],
    });
    // Order 33: Diana – Bluetooth speaker, 13 days
    await createOrder({
        customerId: diana.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(13),
        placedAt: daysAgo(20),
        shippingCents: 599,
        items: [{ productId: p['ELEC-003'].id, quantity: 1, unitPriceCents: 4999 }],
    });
    // Order 34: Charlie – Winter jacket, 2 days (DEFECTIVE scenario)
    await createOrder({
        customerId: charlie.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(2),
        placedAt: daysAgo(9),
        shippingCents: 599,
        items: [{ productId: p['CLTH-003'].id, quantity: 1, unitPriceCents: 12999 }],
    });
    // Order 35: Eve – Smart Watch, 11 days
    await createOrder({
        customerId: eve.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(11),
        placedAt: daysAgo(18),
        shippingCents: 999,
        items: [{ productId: p['ELEC-005'].id, quantity: 1, unitPriceCents: 29999 }],
    });
    // Order 36: Bob – Headphones, 3 days, free shipping
    const orderForCancel = await createOrder({
        customerId: bob.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(3),
        placedAt: daysAgo(10),
        shippingCents: 0,
        items: [{ productId: p['ELEC-001'].id, quantity: 1, unitPriceCents: 8999 }],
    });
    console.log('  ✓ Created 36 orders with all edge cases');
    // ── 6. Pre-seeded Return Requests ─────────────────────────────────────────
    console.log('  Creating pre-seeded return requests...');
    // Helper to record status history entries
    async function addStatusHistory(returnRequestId, changedById, transitions) {
        for (const t of transitions) {
            await prisma.returnStatusHistory.create({
                data: {
                    returnRequestId,
                    changedById,
                    fromStatus: t.fromStatus,
                    toStatus: t.toStatus,
                    note: t.note,
                    changedAt: t.changedAt,
                },
            });
        }
    }
    // ── 6a. PARTIAL return: ELEC-002 (1 unit) → REFUNDED ──────────────────────
    const partialItem = orderPartialReturn.items.find((i) => i.productId === p['ELEC-002'].id);
    const partialItemRefund = partialItem.unitPriceCents * partialItem.quantity; // 1999
    const partialTaxRefund = Math.round(partialItemRefund * 0.08); // 160
    const partialReturn = await prisma.returnRequest.create({
        data: {
            orderId: orderPartialReturn.id,
            customerId: alice.id,
            reason: 'DEFECTIVE',
            comment: 'The USB-C cable stopped charging after one week of normal use.',
            status: 'REFUNDED',
            reviewedById: admin1.id,
            createdAt: daysAgo(10),
            updatedAt: daysAgo(8),
        },
    });
    await prisma.returnItem.create({
        data: {
            returnRequestId: partialReturn.id,
            orderItemId: partialItem.id,
            quantityReturned: 1,
            itemRefundCents: partialItemRefund,
            taxRefundCents: partialTaxRefund,
            restockingFeeCents: 0,
            shippingRefundCents: 0,
            totalRefundCents: partialItemRefund + partialTaxRefund,
        },
    });
    await prisma.refund.create({
        data: {
            returnRequestId: partialReturn.id,
            totalRefundCents: partialItemRefund + partialTaxRefund,
            status: 'COMPLETED',
            gatewayRef: 'GW-TXN-PARTIAL-001',
            initiatedAt: daysAgo(9),
            completedAt: daysAgo(8),
        },
    });
    await addStatusHistory(partialReturn.id, alice.id, [
        { fromStatus: null, toStatus: 'SUBMITTED', note: 'Return request submitted.', changedAt: daysAgo(10) },
        { fromStatus: 'SUBMITTED', toStatus: 'UNDER_REVIEW', note: 'Admin began review.', changedAt: daysAgo(9) },
        { fromStatus: 'UNDER_REVIEW', toStatus: 'APPROVED', note: 'Item defect confirmed by support team.', changedAt: daysAgo(9) },
        { fromStatus: 'APPROVED', toStatus: 'REFUND_INITIATED', note: 'Refund of $21.59 initiated.', changedAt: daysAgo(9) },
        { fromStatus: 'REFUND_INITIATED', toStatus: 'REFUNDED', note: 'Refund successfully processed.', changedAt: daysAgo(8) },
    ]);
    // ── 6b. PARTIAL return: ELEC-003 → SUBMITTED (open/pending) ───────────────
    const pendingItem = orderPartialReturn.items.find((i) => i.productId === p['ELEC-003'].id);
    const pendingReturn = await prisma.returnRequest.create({
        data: {
            orderId: orderPartialReturn.id,
            customerId: alice.id,
            reason: 'NOT_AS_DESCRIBED',
            comment: 'Speaker sound quality is significantly lower than advertised on the product page.',
            status: 'SUBMITTED',
            createdAt: daysAgo(5),
            updatedAt: daysAgo(5),
        },
    });
    await prisma.returnItem.create({
        data: {
            returnRequestId: pendingReturn.id,
            orderItemId: pendingItem.id,
            quantityReturned: 1,
            itemRefundCents: 4999,
            taxRefundCents: Math.round(4999 * 0.08),
            restockingFeeCents: Math.round(4999 * 0.15), // 15% restocking for NOT_AS_DESCRIBED
            shippingRefundCents: 0,
            totalRefundCents: 4999 + Math.round(4999 * 0.08) - Math.round(4999 * 0.15),
        },
    });
    await addStatusHistory(pendingReturn.id, alice.id, [
        { fromStatus: null, toStatus: 'SUBMITTED', note: 'Return request submitted by customer.', changedAt: daysAgo(5) },
    ]);
    // ── 6c. FULL return: BOOK-001 + BOOK-002 → REFUNDED ──────────────────────
    // Both books returned CHANGED_MIND. Restocking fee (15%) applies.
    // No shipping refund (not seller-fault + not entire-order seller-fault).
    const bookItem1 = orderFullReturn.items.find((i) => i.productId === p['BOOK-001'].id);
    const bookItem2 = orderFullReturn.items.find((i) => i.productId === p['BOOK-002'].id);
    const book1Refund = bookItem1.unitPriceCents;
    const book1Tax = Math.round(book1Refund * 0.08);
    const book1Restock = Math.round(book1Refund * 0.15);
    const book1Total = book1Refund + book1Tax - book1Restock;
    const book2Refund = bookItem2.unitPriceCents;
    const book2Tax = Math.round(book2Refund * 0.08);
    const book2Restock = Math.round(book2Refund * 0.15);
    const book2Total = book2Refund + book2Tax - book2Restock;
    const fullReturn = await prisma.returnRequest.create({
        data: {
            orderId: orderFullReturn.id,
            customerId: bob.id,
            reason: 'CHANGED_MIND',
            comment: 'Bought the wrong edition. Would like a refund.',
            status: 'REFUNDED',
            reviewedById: admin2.id,
            createdAt: daysAgo(20),
            updatedAt: daysAgo(17),
        },
    });
    await prisma.returnItem.createMany({
        data: [
            {
                returnRequestId: fullReturn.id,
                orderItemId: bookItem1.id,
                quantityReturned: 1,
                itemRefundCents: book1Refund,
                taxRefundCents: book1Tax,
                restockingFeeCents: book1Restock,
                shippingRefundCents: 0,
                totalRefundCents: book1Total,
            },
            {
                returnRequestId: fullReturn.id,
                orderItemId: bookItem2.id,
                quantityReturned: 1,
                itemRefundCents: book2Refund,
                taxRefundCents: book2Tax,
                restockingFeeCents: book2Restock,
                shippingRefundCents: 0,
                totalRefundCents: book2Total,
            },
        ],
    });
    await prisma.refund.create({
        data: {
            returnRequestId: fullReturn.id,
            totalRefundCents: book1Total + book2Total,
            status: 'COMPLETED',
            gatewayRef: 'GW-TXN-FULL-001',
            initiatedAt: daysAgo(18),
            completedAt: daysAgo(17),
        },
    });
    await addStatusHistory(fullReturn.id, bob.id, [
        { fromStatus: null, toStatus: 'SUBMITTED', note: 'Return request submitted.', changedAt: daysAgo(20) },
        { fromStatus: 'SUBMITTED', toStatus: 'UNDER_REVIEW', note: 'Admin began review.', changedAt: daysAgo(19) },
        { fromStatus: 'UNDER_REVIEW', toStatus: 'APPROVED', note: 'Changed mind return approved.', changedAt: daysAgo(19) },
        { fromStatus: 'APPROVED', toStatus: 'REFUND_INITIATED', note: 'Refund initiated (minus restocking fee).', changedAt: daysAgo(18) },
        { fromStatus: 'REFUND_INITIATED', toStatus: 'REFUNDED', note: 'Refund successfully processed.', changedAt: daysAgo(17) },
    ]);
    // ── 6d. CANCELLED return request (for orderDay1 — submitted then cancelled) ─
    const cancelledItemRef = orderDay1.items[0];
    const cancelledReturn = await prisma.returnRequest.create({
        data: {
            orderId: orderDay1.id,
            customerId: alice.id,
            reason: 'CHANGED_MIND',
            comment: null,
            status: 'CANCELLED',
            createdAt: daysAgo(1),
            updatedAt: daysAgo(1),
        },
    });
    await prisma.returnItem.create({
        data: {
            returnRequestId: cancelledReturn.id,
            orderItemId: cancelledItemRef.id,
            quantityReturned: 1,
            itemRefundCents: 4999,
            taxRefundCents: Math.round(4999 * 0.08),
            restockingFeeCents: Math.round(4999 * 0.15),
            shippingRefundCents: 0,
            totalRefundCents: 4999 + Math.round(4999 * 0.08) - Math.round(4999 * 0.15),
        },
    });
    await addStatusHistory(cancelledReturn.id, alice.id, [
        { fromStatus: null, toStatus: 'SUBMITTED', note: 'Return submitted.', changedAt: daysAgo(1) },
        { fromStatus: 'SUBMITTED', toStatus: 'CANCELLED', note: 'Cancelled by customer.', changedAt: daysAgo(1) },
    ]);
    // ── 6e. REJECTED return (orderDay30, WRONG_ITEM — rejected with reason) ───
    const rejectedItemRef = orderDay30.items[0];
    const rejectedReturn = await prisma.returnRequest.create({
        data: {
            orderId: orderDay30.id,
            customerId: alice.id,
            reason: 'WRONG_ITEM',
            comment: 'I received a completely different product than what I ordered.',
            status: 'REJECTED',
            reviewedById: admin1.id,
            rejectionReason: 'Serial number on item matches the item ordered. Provided photo shows the correct product. Rejection stands.',
            createdAt: daysAgo(28),
            updatedAt: daysAgo(27),
        },
    });
    await prisma.returnItem.create({
        data: {
            returnRequestId: rejectedReturn.id,
            orderItemId: rejectedItemRef.id,
            quantityReturned: 1,
            itemRefundCents: 8999,
            taxRefundCents: Math.round(8999 * 0.08),
            restockingFeeCents: 0,
            shippingRefundCents: 599,
            totalRefundCents: 8999 + Math.round(8999 * 0.08) + 599,
        },
    });
    await addStatusHistory(rejectedReturn.id, alice.id, [
        { fromStatus: null, toStatus: 'SUBMITTED', note: 'Return submitted with photo evidence.', changedAt: daysAgo(28) },
        { fromStatus: 'SUBMITTED', toStatus: 'UNDER_REVIEW', note: 'Admin reviewing photo evidence.', changedAt: daysAgo(27) },
        { fromStatus: 'UNDER_REVIEW', toStatus: 'REJECTED', note: 'Serial number matches ordered item. Rejected.', changedAt: daysAgo(27) },
    ]);
    // ── 6f. UNDER_REVIEW return (orderDay31 → orderDay1 for charlie) ──────────
    // charlie's order 21 (3 days ago) — currently under review
    const reviewOrder = await createOrder({
        customerId: charlie.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(5),
        placedAt: daysAgo(12),
        shippingCents: 599,
        items: [{ productId: p['ELEC-001'].id, quantity: 1, unitPriceCents: 8999 }],
    });
    const underReviewReturn = await prisma.returnRequest.create({
        data: {
            orderId: reviewOrder.id,
            customerId: charlie.id,
            reason: 'DAMAGED_IN_TRANSIT',
            comment: 'Package arrived with significant external damage. Device will not turn on.',
            status: 'UNDER_REVIEW',
            reviewedById: admin1.id,
            createdAt: daysAgo(4),
            updatedAt: daysAgo(3),
        },
    });
    await prisma.returnItem.create({
        data: {
            returnRequestId: underReviewReturn.id,
            orderItemId: reviewOrder.items[0].id,
            quantityReturned: 1,
            itemRefundCents: 8999,
            taxRefundCents: Math.round(8999 * 0.08),
            restockingFeeCents: 0,
            shippingRefundCents: 599,
            totalRefundCents: 8999 + Math.round(8999 * 0.08) + 599,
        },
    });
    await addStatusHistory(underReviewReturn.id, charlie.id, [
        { fromStatus: null, toStatus: 'SUBMITTED', note: 'Return submitted with damage photos.', changedAt: daysAgo(4) },
        { fromStatus: 'SUBMITTED', toStatus: 'UNDER_REVIEW', note: 'Admin reviewing damage claim.', changedAt: daysAgo(3) },
    ]);
    // ── 6g. APPROVED return (waiting for refund trigger) ─────────────────────
    const approvedOrder = await createOrder({
        customerId: diana.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(8),
        placedAt: daysAgo(15),
        shippingCents: 599,
        items: [{ productId: p['HOME-001'].id, quantity: 1, unitPriceCents: 6999 }],
    });
    const approvedReturn = await prisma.returnRequest.create({
        data: {
            orderId: approvedOrder.id,
            customerId: diana.id,
            reason: 'DEFECTIVE',
            comment: 'Coffee maker stopped working after 3 uses. Heating element failure.',
            status: 'APPROVED',
            reviewedById: admin2.id,
            createdAt: daysAgo(6),
            updatedAt: daysAgo(5),
        },
    });
    await prisma.returnItem.create({
        data: {
            returnRequestId: approvedReturn.id,
            orderItemId: approvedOrder.items[0].id,
            quantityReturned: 1,
            itemRefundCents: 6999,
            taxRefundCents: Math.round(6999 * 0.08),
            restockingFeeCents: 0,
            shippingRefundCents: 599,
            totalRefundCents: 6999 + Math.round(6999 * 0.08) + 599,
        },
    });
    await addStatusHistory(approvedReturn.id, diana.id, [
        { fromStatus: null, toStatus: 'SUBMITTED', note: 'Return submitted.', changedAt: daysAgo(6) },
        { fromStatus: 'SUBMITTED', toStatus: 'UNDER_REVIEW', note: 'Admin began review.', changedAt: daysAgo(5) },
        { fromStatus: 'UNDER_REVIEW', toStatus: 'APPROVED', note: 'Defect confirmed. Approved.', changedAt: daysAgo(5) },
    ]);
    // ── 6h. REFUND_FAILED then retried → REFUND_INITIATED ────────────────────
    const failedOrder = await createOrder({
        customerId: eve.id,
        status: 'DELIVERED',
        deliveredAt: daysAgo(14),
        placedAt: daysAgo(21),
        shippingCents: 599,
        items: [{ productId: p['CLTH-002'].id, quantity: 1, unitPriceCents: 5999 }],
    });
    const failedReturn = await prisma.returnRequest.create({
        data: {
            orderId: failedOrder.id,
            customerId: eve.id,
            reason: 'WRONG_ITEM',
            comment: 'Received size L instead of size M as ordered.',
            status: 'REFUND_INITIATED',
            reviewedById: admin1.id,
            createdAt: daysAgo(12),
            updatedAt: daysAgo(1),
        },
    });
    await prisma.returnItem.create({
        data: {
            returnRequestId: failedReturn.id,
            orderItemId: failedOrder.items[0].id,
            quantityReturned: 1,
            itemRefundCents: 5999,
            taxRefundCents: Math.round(5999 * 0.08),
            restockingFeeCents: 0,
            shippingRefundCents: 599,
            totalRefundCents: 5999 + Math.round(5999 * 0.08) + 599,
        },
    });
    await prisma.refund.create({
        data: {
            returnRequestId: failedReturn.id,
            totalRefundCents: 5999 + Math.round(5999 * 0.08) + 599,
            status: 'PROCESSING',
            gatewayRef: 'GW-TXN-RETRY-001',
            initiatedAt: daysAgo(1),
        },
    });
    await addStatusHistory(failedReturn.id, eve.id, [
        { fromStatus: null, toStatus: 'SUBMITTED', note: 'Return submitted.', changedAt: daysAgo(12) },
        { fromStatus: 'SUBMITTED', toStatus: 'UNDER_REVIEW', note: 'Admin reviewing.', changedAt: daysAgo(11) },
        { fromStatus: 'UNDER_REVIEW', toStatus: 'APPROVED', note: 'Wrong item confirmed.', changedAt: daysAgo(10) },
        { fromStatus: 'APPROVED', toStatus: 'REFUND_INITIATED', note: 'Refund initiated.', changedAt: daysAgo(5) },
        { fromStatus: 'REFUND_INITIATED', toStatus: 'REFUND_FAILED', note: 'Gateway timeout. Will retry.', changedAt: daysAgo(4) },
        { fromStatus: 'REFUND_FAILED', toStatus: 'REFUND_INITIATED', note: 'Retrying refund.', changedAt: daysAgo(1) },
    ]);
    // ── 6i. Cancellable SUBMITTED return (for E2E cancel test) ───────────────
    const cancelReturn = await prisma.returnRequest.create({
        data: {
            orderId: orderForCancel.id,
            customerId: bob.id,
            reason: 'CHANGED_MIND',
            comment: null,
            status: 'SUBMITTED',
            createdAt: daysAgo(2),
            updatedAt: daysAgo(2),
        },
    });
    await prisma.returnItem.create({
        data: {
            returnRequestId: cancelReturn.id,
            orderItemId: orderForCancel.items[0].id,
            quantityReturned: 1,
            itemRefundCents: 8999,
            taxRefundCents: Math.round(8999 * 0.08),
            restockingFeeCents: Math.round(8999 * 0.15),
            shippingRefundCents: 0,
            totalRefundCents: 8999 + Math.round(8999 * 0.08) - Math.round(8999 * 0.15),
        },
    });
    await addStatusHistory(cancelReturn.id, bob.id, [
        { fromStatus: null, toStatus: 'SUBMITTED', note: 'Return submitted.', changedAt: daysAgo(2) },
    ]);
    console.log('  ✓ Created 9 pre-seeded return requests (all statuses covered)');
    // ── Done ──────────────────────────────────────────────────────────────────
    console.log('\n✅ Seed complete!\n');
    console.log('  Test Accounts:');
    console.log('  ┌─────────────────────────────────┬────────────┬──────────┐');
    console.log('  │ Email                           │ Password   │ Role     │');
    console.log('  ├─────────────────────────────────┼────────────┼──────────┤');
    console.log('  │ admin@returnflow.com             │ admin123   │ ADMIN    │');
    console.log('  │ admin2@returnflow.com            │ admin123   │ ADMIN    │');
    console.log('  │ alice@example.com                │ password123│ CUSTOMER │');
    console.log('  │ bob@example.com                  │ password123│ CUSTOMER │');
    console.log('  │ charlie@example.com              │ password123│ CUSTOMER │');
    console.log('  │ diana@example.com                │ password123│ CUSTOMER │');
    console.log('  │ eve@example.com                  │ password123│ CUSTOMER │');
    console.log('  └─────────────────────────────────┴────────────┴──────────┘');
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map