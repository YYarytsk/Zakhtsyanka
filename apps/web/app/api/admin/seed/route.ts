import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

// One-time sample data seed — only works when product table is empty.
// Uses the service role key if available, otherwise falls back to RPC.

async function requireStaff() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('staff').select('role').eq('id', user.id).single()
  return data ?? null
}

export async function POST() {
  if (!await requireStaff()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY not set in .env.local. Add it and restart the dev server.' },
      { status: 500 },
    )
  }

  const db = createAdminClient()

  // Safety guard: only seed if no products exist
  const { count } = await db.from('products').select('id', { count: 'exact', head: true })
  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: 'Products already exist — seed skipped to avoid duplicates.' }, { status: 409 })
  }

  // Get category IDs
  const { data: cats } = await db.from('categories').select('id, slug')
  if (!cats || cats.length === 0) {
    return NextResponse.json({ error: 'Categories not found. Run migrations 001 first.' }, { status: 500 })
  }
  const catId = (slug: string) => cats.find((c) => c.slug === slug)?.id ?? ''

  // ── Products ──────────────────────────────────────────────────────────────
  const products = [
    // BREAD
    {
      category_id: catId('bread'), slug: 'sourdough-loaf',
      name_uk: 'Хліб на заквасці', name_en: 'Sourdough Loaf',
      description_uk: 'Наш фірмовий хліб на живій заквасці з 72-годинним визріванням. Хрустка скоринка, пружний м\'якуш з характерною кислинкою. Випікається в чавунній формі.',
      description_en: 'Our signature sourdough, made with a live starter and a 72-hour cold fermentation. Crisp crust, open crumb, and a gentle tang. Baked in a cast-iron vessel.',
      allergens_uk: 'Містить: пшеничне борошно, жито, сіль, вода, закваска. Без молока, яєць, горіхів.',
      allergens_en: 'Contains: wheat flour, rye, salt, water, sourdough starter. Free from milk, eggs, nuts.',
      price_cents: 8900, dietary_tags: ['vegan'], fulfillment_types: ['pickup','delivery'],
      photos: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80','https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=800&q=80'],
      daily_cap: 20, is_available: true,
    },
    {
      category_id: catId('bread'), slug: 'baguette',
      name_uk: 'Французький багет', name_en: 'French Baguette',
      description_uk: 'Класичний французький багет із хрусткою золотистою скоринкою та повітряним м\'якушем. Випікається двічі на день — завжди свіжий.',
      description_en: 'A classic French baguette with a crackly golden crust and airy crumb. Baked twice daily — always fresh off the stone.',
      allergens_uk: 'Містить: пшеничне борошно, дріжджі, сіль, вода. Без молока, яєць, горіхів.',
      allergens_en: 'Contains: wheat flour, yeast, salt, water. Free from milk, eggs, nuts.',
      price_cents: 5500, dietary_tags: ['vegan'], fulfillment_types: ['pickup','delivery'],
      photos: ['https://images.unsplash.com/photo-1549931319-a545dcf3bc7c?w=800&q=80'],
      daily_cap: 40, is_available: true,
    },
    {
      category_id: catId('bread'), slug: 'borodino-bread',
      name_uk: 'Бородинський хліб', name_en: 'Borodino Dark Rye Bread',
      description_uk: 'Темний житньо-пшеничний хліб з коріандром та тмином за класичним рецептом. Щільний, ароматний, ідеальний для бутербродів.',
      description_en: 'Dark rye-wheat bread with coriander and caraway seeds. Dense, aromatic, and ideal with herring or bryndza cheese.',
      allergens_uk: 'Містить: житнє борошно, пшеничне борошно, патока, сіль, дріжджі, коріандр, тмин. Без молока, яєць, горіхів.',
      allergens_en: 'Contains: rye flour, wheat flour, molasses, salt, yeast, coriander, caraway. Free from milk, eggs, nuts.',
      price_cents: 7500, dietary_tags: ['vegan'], fulfillment_types: ['pickup','delivery'],
      photos: ['https://images.unsplash.com/photo-1580739015786-48e5d7a0f3a1?w=800&q=80'],
      daily_cap: 15, is_available: true,
    },
    {
      category_id: catId('bread'), slug: 'focaccia-rosemary',
      name_uk: 'Фокача з розмарином', name_en: 'Rosemary Focaccia',
      description_uk: 'Ніжна та пухка фокача, рясно полита оливковою олією, присипана крупною морською сіллю та свіжим розмарином.',
      description_en: 'Soft and pillowy focaccia generously drizzled with olive oil, topped with coarse sea salt and fresh rosemary.',
      allergens_uk: 'Містить: пшеничне борошно, оливкова олія, сіль, дріжджі, розмарин. Без молока, яєць, горіхів.',
      allergens_en: 'Contains: wheat flour, olive oil, sea salt, yeast, rosemary. Free from milk, eggs, nuts.',
      price_cents: 7900, dietary_tags: ['vegan'], fulfillment_types: ['pickup'],
      photos: ['https://images.unsplash.com/photo-1585478259715-4d3a17e65b6a?w=800&q=80'],
      daily_cap: 12, is_available: true,
    },
    // PASTRIES
    {
      category_id: catId('pastries'), slug: 'butter-croissant',
      name_uk: 'Масляний круасан', name_en: 'Classic Butter Croissant',
      description_uk: 'Круасан з французьким вершковим маслом 84% жирності, 27 шарів. Золотистий, хрусткий зовні, ніжно-шаруватий усередині. Наш бестселер.',
      description_en: 'Made with 84% fat French butter, laminated to 27 flaky layers. Golden and shatteringly crisp outside, tender-layered within. Our bestseller.',
      allergens_uk: 'Містить: пшеничне борошно, вершкове масло, молоко, яйця, цукор, сіль, дріжджі. Може містити сліди горіхів.',
      allergens_en: 'Contains: wheat flour, butter, milk, eggs, sugar, salt, yeast. May contain traces of nuts.',
      price_cents: 6500, dietary_tags: [], fulfillment_types: ['pickup'],
      photos: ['https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80','https://images.unsplash.com/photo-1597131628165-84ef2e4de6f3?w=800&q=80'],
      daily_cap: 60, is_available: true,
    },
    {
      category_id: catId('pastries'), slug: 'almond-croissant',
      name_uk: 'Круасан з мигдалем', name_en: 'Almond Croissant',
      description_uk: 'Круасан, просочений ромовим сиропом та наповнений вершковим мигдалевим кремом "франжипан". Хрусткий мигдаль зверху.',
      description_en: 'A day-old croissant soaked in rum syrup, filled with silky almond frangipane cream, and finished with toasted flaked almonds.',
      allergens_uk: 'Містить: пшеничне борошно, вершкове масло, молоко, яйця, цукор, мигдаль, ром. Містить горіхи (мигдаль).',
      allergens_en: 'Contains: wheat flour, butter, milk, eggs, sugar, almonds, rum. Contains nuts (almonds).',
      price_cents: 8500, dietary_tags: [], fulfillment_types: ['pickup'],
      photos: ['https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80'],
      daily_cap: 30, is_available: true,
    },
    {
      category_id: catId('pastries'), slug: 'cinnamon-roll',
      name_uk: 'Синабон з кремом', name_en: 'Cinnamon Roll with Cream Cheese Frosting',
      description_uk: 'Пухкий рулет з корицею та тростинним цукром, залитий густим вершковим кремом. Теплий, духмяний та невимовно м\'який.',
      description_en: 'A pillowy roll swirled with cinnamon and brown sugar, generously topped with cream cheese frosting. Warm, fragrant, and impossibly soft.',
      allergens_uk: 'Містить: пшеничне борошно, вершкове масло, молоко, яйця, вершковий сир, кориця, цукор, дріжджі.',
      allergens_en: 'Contains: wheat flour, butter, milk, eggs, cream cheese, cinnamon, sugar, yeast.',
      price_cents: 7500, dietary_tags: [], fulfillment_types: ['pickup'],
      photos: ['https://images.unsplash.com/photo-1604971666149-1ff95c9e31fb?w=800&q=80'],
      daily_cap: 25, is_available: true,
    },
    {
      category_id: catId('pastries'), slug: 'cheese-bun-vynychanka',
      name_uk: 'Ватрушка з сиром', name_en: 'Cottage Cheese Bun',
      description_uk: 'Пухке дріжджове тісто з начинкою зі свіжого домашнього сиру з ваніллю та родзинками. Смак дитинства.',
      description_en: 'Soft yeasted dough filled with fresh farmer\'s cottage cheese scented with vanilla and golden raisins. Pure childhood nostalgia.',
      allergens_uk: 'Містить: пшеничне борошно, вершкове масло, молоко, яйця, сир, цукор, родзинки, ваніль, дріжджі.',
      allergens_en: 'Contains: wheat flour, butter, milk, eggs, cottage cheese, sugar, raisins, vanilla, yeast.',
      price_cents: 5500, dietary_tags: [], fulfillment_types: ['pickup'],
      photos: ['https://images.unsplash.com/photo-1553452118-621e1f860f43?w=800&q=80'],
      daily_cap: 30, is_available: true,
    },
    {
      category_id: catId('pastries'), slug: 'eclair-chocolate',
      name_uk: 'Еклер шоколадний', name_en: 'Chocolate Éclair',
      description_uk: 'Класичний французький еклер із заварного тіста, наповнений ніжним кремом із темного шоколаду та вкритий блискучою глазур\'ю.',
      description_en: 'A classic French éclair of light choux pastry filled with silky dark chocolate pastry cream and glazed with glossy chocolate icing.',
      allergens_uk: 'Містить: пшеничне борошно, вершкове масло, молоко, яйця, темний шоколад, цукор.',
      allergens_en: 'Contains: wheat flour, butter, milk, eggs, dark chocolate (cocoa, sugar, cocoa butter), sugar.',
      price_cents: 7500, dietary_tags: [], fulfillment_types: ['pickup'],
      photos: ['https://images.unsplash.com/photo-1603532648955-039310d9ed75?w=800&q=80'],
      daily_cap: 40, is_available: true,
    },
    // CAKES
    {
      category_id: catId('cakes'), slug: 'honey-cake-medivnyk',
      name_uk: 'Медівник (Медовик)', name_en: 'Honey Layer Cake',
      description_uk: 'Дванадцять тонких медових коржів, просочених ніжним сметанним кремом з натуральним медом. Класика української пекарні.',
      description_en: 'Twelve thin honey sponge layers soaked overnight in a silky smetana and natural honey cream. A Ukrainian bakery classic.',
      allergens_uk: 'Містить: пшеничне борошно, вершкове масло, яйця, мед, цукор, сметана. Без горіхів.',
      allergens_en: 'Contains: wheat flour, butter, eggs, honey, sugar, smetana (sour cream). Nut-free.',
      price_cents: 38000, dietary_tags: [], fulfillment_types: ['pickup','delivery','preorder'],
      photos: ['https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80','https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=800&q=80'],
      daily_cap: 5, is_available: true,
    },
    {
      category_id: catId('cakes'), slug: 'napoleon-cake',
      name_uk: 'Торт "Наполеон"', name_en: 'Napoleon Mille-Feuille Cake',
      description_uk: 'Сотні шарів хрусткого листкового тіста власного виробництва, перекладених кремом "Патіс\'єр" на основі натуральної ванілі.',
      description_en: 'Hundreds of layers of crisp rough-puff pastry alternating with a rich vanilla pastry cream (crème pâtissière). Served chilled.',
      allergens_uk: 'Містить: пшеничне борошно, вершкове масло, яйця, молоко, ванільний стручок, цукор.',
      allergens_en: 'Contains: wheat flour, butter, eggs, milk, vanilla pod, sugar.',
      price_cents: 42000, dietary_tags: [], fulfillment_types: ['pickup','delivery','preorder'],
      photos: ['https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80'],
      daily_cap: 4, is_available: true,
    },
    {
      category_id: catId('cakes'), slug: 'new-york-cheesecake',
      name_uk: 'Чізкейк Нью-Йорк', name_en: 'New York Cheesecake',
      description_uk: 'Класичний нью-йоркський чізкейк на основі крему Philadelphia та підставці зі злегка солоного крекерного печива. Щільний, оксамитовий.',
      description_en: 'Pure Philadelphia cream cheese filling on a salted graham cracker base. Dense, velvety, with the signature gentle tang.',
      allergens_uk: 'Містить: вершковий сир (молоко), яйця, цукор, пшеничне борошно, пісочне печиво (пшениця, вершкове масло, сіль).',
      allergens_en: 'Contains: cream cheese (milk), eggs, sugar, wheat flour, graham crackers (wheat, butter, salt).',
      price_cents: 39000, dietary_tags: [], fulfillment_types: ['pickup','delivery','preorder'],
      photos: ['https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?w=800&q=80','https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&q=80'],
      daily_cap: 4, is_available: true,
    },
    {
      category_id: catId('cakes'), slug: 'ptychye-moloko-cake',
      name_uk: 'Торт "Пташине молоко"', name_en: "Bird's Milk Cake",
      description_uk: 'Два шари бісквіту з повітряним суфле на агар-агарі та збитих білках, вкрите тонким шаром темного шоколаду.',
      description_en: 'Two light génoise sponge layers sandwiching an airy soufflé made with agar-agar, encased in a thin dark chocolate shell.',
      allergens_uk: 'Містить: яйця, цукор, пшеничне борошно, вершкове масло, темний шоколад, агар-агар, ваніль.',
      allergens_en: 'Contains: eggs, sugar, wheat flour, butter, dark chocolate, agar-agar, vanilla extract.',
      price_cents: 41000, dietary_tags: [], fulfillment_types: ['pickup','delivery','preorder'],
      photos: ['https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=800&q=80'],
      daily_cap: 3, is_available: true,
    },
    {
      category_id: catId('cakes'), slug: 'chocolate-tart',
      name_uk: 'Шоколадний тарт', name_en: 'Dark Chocolate Tart',
      description_uk: 'Хрустке пісочне тісто, наповнене ганашем із 70% темного шоколаду Valrhona. Подається при кімнатній температурі.',
      description_en: 'Crisp shortcrust pastry shell filled with a glossy ganache made from 70% Valrhona dark chocolate.',
      allergens_uk: 'Містить: пшеничне борошно, вершкове масло, яйця, темний шоколад 70%, вершки.',
      allergens_en: 'Contains: wheat flour, butter, eggs, 70% dark chocolate (cocoa, sugar, cocoa butter), cream.',
      price_cents: 9500, dietary_tags: [], fulfillment_types: ['pickup','delivery'],
      photos: ['https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80'],
      daily_cap: 12, is_available: true,
    },
    {
      category_id: catId('cakes'), slug: 'lemon-tart',
      name_uk: 'Лимонний тарт', name_en: 'Lemon Tart',
      description_uk: 'Хрустке тісто-сабле з кислуватим лимонним кердом та обпаленим меренгою зверху. Ідеальний баланс кислого та солодкого.',
      description_en: 'Crumbly sablé pastry filled with bright lemon curd and finished with toasted Italian meringue.',
      allergens_uk: 'Містить: пшеничне борошно, вершкове масло, яйця, лимони, цукор.',
      allergens_en: 'Contains: wheat flour, butter, eggs, lemons (juice and zest), sugar.',
      price_cents: 9200, dietary_tags: [], fulfillment_types: ['pickup','delivery'],
      photos: ['https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=800&q=80'],
      daily_cap: 10, is_available: true,
    },
    // SEASONAL
    {
      category_id: catId('seasonal'), slug: 'paska-easter-bread',
      name_uk: 'Паска з ізюмом та цукатами', name_en: 'Easter Paska Bread',
      description_uk: 'Традиційний великодній хліб з шафраном, ваніллю, родзинками та цукатами. Вкритий білою глазур\'ю. Доступна лише напередодні Великодня.',
      description_en: 'Traditional Easter bread with saffron, vanilla, raisins, and candied peel, finished with white royal icing. Available pre-Easter only.',
      allergens_uk: 'Містить: пшеничне борошно, яйця, вершкове масло, молоко, цукор, шафран, ваніль, родзинки, цукати, дріжджі.',
      allergens_en: 'Contains: wheat flour, eggs, butter, milk, sugar, saffron, vanilla, raisins, candied peel, yeast.',
      price_cents: 12000, dietary_tags: [], fulfillment_types: ['pickup','delivery','preorder'],
      photos: ['https://images.unsplash.com/photo-1609951651556-5b96d523e32b?w=800&q=80'],
      daily_cap: null, is_available: true,
    },
    {
      category_id: catId('seasonal'), slug: 'gingerbread-cookies',
      name_uk: 'Медові пряники', name_en: 'Decorated Honey Gingerbread',
      description_uk: 'Ароматні пряники з імбиром, корицею та гвоздикою, прикрашені розписом із глазурі вручну. Мінімальне замовлення — 6 штук.',
      description_en: 'Fragrant gingerbread spiced with ginger, cinnamon and cloves, hand-decorated with royal icing. Minimum order 6 pieces.',
      allergens_uk: 'Містить: пшеничне борошно, вершкове масло, яйця, мед, цукор, імбир, кориця, гвоздика. Без горіхів.',
      allergens_en: 'Contains: wheat flour, butter, eggs, honey, sugar, ginger, cinnamon, cloves. Nut-free.',
      price_cents: 4500, dietary_tags: [], fulfillment_types: ['pickup','delivery','preorder'],
      photos: ['https://images.unsplash.com/photo-1607246873139-fec19b8d3c6d?w=800&q=80'],
      daily_cap: null, is_available: true,
    },
    {
      category_id: catId('seasonal'), slug: 'panettone',
      name_uk: 'Панетоне з сухофруктами', name_en: 'Panettone with Dried Fruits',
      description_uk: 'Італійський різдвяний хліб 48-годинного бродіння з цукатами та родзинками, ароматизований ромом та ваніллю. Тільки в грудні.',
      description_en: 'A 48-hour naturally leavened Italian Christmas bread studded with candied citrus and golden raisins, aromatised with rum and vanilla. December only.',
      allergens_uk: 'Містить: пшеничне борошно, вершкове масло, яйця, цукор, цукати, родзинки, ром, ваніль, закваска.',
      allergens_en: 'Contains: wheat flour, butter, eggs, sugar, candied peel, raisins, rum, vanilla, sourdough starter.',
      price_cents: 24000, dietary_tags: [], fulfillment_types: ['pickup','delivery','preorder'],
      photos: ['https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=800&q=80'],
      daily_cap: 10, is_available: true,
    },
  ]

  const { error: prodError } = await db.from('products').insert(products)
  if (prodError) {
    return NextResponse.json({ error: `Products insert failed: ${prodError.message}` }, { status: 500 })
  }

  // ── Gallery items ──────────────────────────────────────────────────────────
  const { count: galleryCount } = await db.from('gallery').select('id', { count: 'exact', head: true })
  if ((galleryCount ?? 0) === 0) {
    await db.from('gallery').insert([
      { caption_uk: 'Весільний торт: три яруси, живі квіти та золоте листя', caption_en: 'Wedding cake: three tiers, fresh flowers and gold leaf', photos: ['https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=800&q=80','https://images.unsplash.com/photo-1562440499-64c9a111f713?w=800&q=80'], tags: ['wedding','custom','floral'], sort_order: 10 },
      { caption_uk: 'Торт "Русалка" на день народження дівчинки', caption_en: 'Mermaid birthday cake for a little girl', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'], tags: ['birthday','children','custom'], sort_order: 20 },
      { caption_uk: 'Корпоративний набір: еклери та макарони у брендових кольорах', caption_en: 'Corporate set: éclair and macaron assortment in brand colours', photos: ['https://images.unsplash.com/photo-1611293388250-580b08c4a145?w=800&q=80'], tags: ['corporate','macarons','eclairs'], sort_order: 30 },
      { caption_uk: 'Гола шоколадна торт "Чорний ліс" з вишнями та вершками', caption_en: 'Naked Black Forest cake with cherries and whipped cream', photos: ['https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=800&q=80'], tags: ['chocolate','birthday','naked'], sort_order: 40 },
      { caption_uk: 'Новорічна колекція пряників: ялинки, зірки та сніжинки', caption_en: 'Christmas gingerbread collection: trees, stars and snowflakes', photos: ['https://images.unsplash.com/photo-1607246873139-fec19b8d3c6d?w=800&q=80'], tags: ['christmas','gingerbread','seasonal'], sort_order: 50 },
      { caption_uk: 'Торт-серце на День закоханих: малина та рожевий оксамит', caption_en: "Valentine's heart cake: raspberry and pink velvet", photos: ['https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=800&q=80'], tags: ['valentines','romantic','custom'], sort_order: 60 },
      { caption_uk: 'Паска, прикрашена живими квітами та зеленню', caption_en: 'Easter paska decorated with fresh spring flowers', photos: ['https://images.unsplash.com/photo-1609951651556-5b96d523e32b?w=800&q=80'], tags: ['easter','seasonal','traditional'], sort_order: 70 },
    ])
  }

  return NextResponse.json({
    ok: true,
    productsInserted: products.length,
    message: `Seeded ${products.length} products and gallery items successfully.`,
  })
}
