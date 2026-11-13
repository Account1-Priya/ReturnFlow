# Product imagery

One photo per catalogue SKU, named `<SKU>.jpg` and resolved at runtime by
[`index.ts`](./index.ts). The `Product` table has no image column and the
backend is out of scope, so artwork is matched to the product's stable SKU on
the client instead — adding a column was not an option, and nothing here
changes the API payload.

All files are centre-cropped to a square and normalised to **512×512, JPEG
q82** (≈620 KB for the full set) so every thumbnail shares one aspect ratio and
the UI never has to letterbox or distort. They are imported through Vite, so
they are content-hashed and served from the app's own origin — there is no
runtime dependency on a third-party CDN.

## Adding or replacing a photo

Drop a square `<SKU>.jpg` into this folder; the glob in `index.ts` picks it up
with no code change. A SKU with no file falls back to a representative photo
for its category, and failing that `ProductImage` renders its icon placeholder.

## Sources

Both licences (Unsplash, Pexels) permit commercial use without attribution;
this list is kept for provenance.

### Unsplash — `https://unsplash.com/photos/<id>`

| SKU | Product | Photo ID |
| --- | --- | --- |
| ELEC-001 | Wireless Headphones | `photo-1505740420928-5e560c06d30e` |
| ELEC-003 | Bluetooth Speaker | `photo-1608043152269-423dbba4e7e1` |
| ELEC-005 | Smart Watch | `photo-1579586337278-3befd40fd17a` |
| CLTH-001 | Cotton T-Shirt | `photo-1521572163474-6864f9cf17ab` |
| CLTH-002 | Denim Jeans | `photo-1542272604-787c3835535d` |
| BOOK-002 | Design Patterns | `photo-1543002588-bfa74002ed7e` |
| PERI-001 | Organic Coffee Beans 1kg | `photo-1447933601403-0c6688de566e` |
| PERI-002 | Vitamin C Supplements | `photo-1584308666744-24d5c474f2ae` |
| PERS-002 | Engraved Watch | `photo-1524592094714-0f0654e20314` |
| SPRT-001 | Yoga Mat | `photo-1601925260368-ae2f83cf8b7f` |
| SPRT-003 | Running Shoes | `photo-1542291026-7eec264c27ff` |
| OTHR-001 | Phone Case | `photo-1601593346740-925612772716` |

### Pexels — `https://www.pexels.com/photo/<id>`

| SKU | Product | Photo ID |
| --- | --- | --- |
| ELEC-002 | USB-C Charging Cable | `4072683` |
| ELEC-004 | Laptop Stand | `4792712` |
| CLTH-003 | Winter Jacket | `7026778` |
| BOOK-001 | Clean Code | `8762862` |
| GIFT-001 | Amazon Gift Card $50 | `5706020` |
| GIFT-002 | Store Credit $25 | `6651190` |
| HOME-001 | Coffee Maker | `6032797` |
| HOME-002 | Air Purifier | `2123430` |
| PERS-001 | Custom Name Necklace | `19564918` |
| SPRT-002 | Resistance Bands Set | `863977` |

Books and gift cards use representative stock photography rather than a
specific cover or branded card, so no product is depicted with artwork that
misstates what it is.
