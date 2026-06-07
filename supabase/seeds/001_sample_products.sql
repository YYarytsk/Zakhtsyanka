-- ─────────────────────────────────────────────────────────────────────────────
-- Sample product catalog for Захцянка bakery
-- Run this AFTER running all migrations (001–009).
-- Images use Unsplash — replace with Supabase Storage URLs in production.
-- ALLERGEN DATA is entered manually and reviewed — never AI-generated.
-- ─────────────────────────────────────────────────────────────────────────────

-- Helper: get category ids
-- We'll use CTEs to keep this readable

with cats as (
  select id, slug from categories
),

inserted_products as (
  insert into products (
    category_id, slug,
    name_uk, name_en,
    description_uk, description_en,
    allergens_uk, allergens_en,
    price_cents, photos, dietary_tags, fulfillment_types,
    daily_cap, is_available
  )

  -- ── BREAD ────────────────────────────────────────────────────────────────
  values

  (
    (select id from cats where slug = 'bread'),
    'sourdough-loaf',
    'Хліб на заквасці',
    'Sourdough Loaf',
    'Наш фірмовий хліб на живій заквасці з 72-годинним визріванням. Хрустка скоринка, пружний м''якуш з характерною кислинкою. Випікається в чавунній формі для ідеального підйому.',
    'Our signature sourdough, made with a live starter and a 72-hour cold fermentation. Crisp crust, open crumb, and a gentle tang. Baked in a cast-iron vessel for the perfect oven spring.',
    'Містить: пшеничне борошно, жито, сіль, вода, закваска. Без молока, яєць, горіхів. Виробляється на виробництві, де використовується глютен.',
    'Contains: wheat flour, rye, salt, water, sourdough starter. Free from milk, eggs, nuts. Made in a facility that handles gluten.',
    8900,
    array['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
          'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=800&q=80'],
    array['vegan'],
    array['pickup','delivery'],
    20, true
  ),

  (
    (select id from cats where slug = 'bread'),
    'baguette',
    'Французький багет',
    'French Baguette',
    'Класичний французький багет із хрусткою золотистою скоринкою та повітряним м''якушем. Випікається двічі на день — вранці та вдень, завжди свіжий.',
    'A classic French baguette with a crackly golden crust and airy crumb. Baked twice daily — morning and afternoon — always fresh off the stone.',
    'Містить: пшеничне борошно, дріжджі, сіль, вода. Без молока, яєць, горіхів.',
    'Contains: wheat flour, yeast, salt, water. Free from milk, eggs, nuts.',
    5500,
    array['https://images.unsplash.com/photo-1549931319-a545dcf3bc7c?w=800&q=80'],
    array['vegan'],
    array['pickup','delivery'],
    40, true
  ),

  (
    (select id from cats where slug = 'bread'),
    'borodino-bread',
    'Бородинський хліб',
    'Borodino Dark Rye Bread',
    'Темний житньо-пшеничний хліб з коріандром та тмином за класичним рецептом. Щільний, ароматний, ідеальний для бутербродів із оселедцем або бринзою.',
    'Dark rye-wheat bread with coriander and caraway seeds, made to a classic recipe. Dense, aromatic, and ideal with herring or bryndza cheese.',
    'Містить: житнє борошно, пшеничне борошно, патока, сіль, дріжджі, коріандр, тмин. Без молока, яєць, горіхів.',
    'Contains: rye flour, wheat flour, molasses, salt, yeast, coriander, caraway. Free from milk, eggs, nuts.',
    7500,
    array['https://images.unsplash.com/photo-1580739015786-48e5d7a0f3a1?w=800&q=80'],
    array['vegan'],
    array['pickup','delivery'],
    15, true
  ),

  (
    (select id from cats where slug = 'bread'),
    'focaccia-rosemary',
    'Фокача з розмарином',
    'Rosemary Focaccia',
    'Ніжна та пухка фокача, рясно полита оливковою олією, присипана крупною морською сіллю та свіжим розмарином. Хрустить ззовні — тане всередині.',
    'Soft and pillowy focaccia generously drizzled with olive oil, topped with coarse sea salt and fresh rosemary. Crisp outside, melts inside.',
    'Містить: пшеничне борошно, оливкова олія, сіль, дріжджі, розмарин. Без молока, яєць, горіхів.',
    'Contains: wheat flour, olive oil, sea salt, yeast, rosemary. Free from milk, eggs, nuts.',
    7900,
    array['https://images.unsplash.com/photo-1585478259715-4d3a17e65b6a?w=800&q=80'],
    array['vegan'],
    array['pickup'],
    12, true
  ),

  -- ── PASTRIES ─────────────────────────────────────────────────────────────

  (
    (select id from cats where slug = 'pastries'),
    'butter-croissant',
    'Масляний круасан',
    'Classic Butter Croissant',
    'Круасан з французьким вершковим маслом 84% жирності, приготований методом ламінування тіста з 27 шарами. Золотистий, хрусткий зовні, ніжно-шаруватий усередині. Наш бестселер.',
    'Made with 84% fat French butter and laminated to 27 flaky layers. Golden, shatteringly crisp outside and tender-layered within. Our bestseller.',
    'Містить: пшеничне борошно, вершкове масло, молоко, яйця, цукор, сіль, дріжджі. Може містити сліди горіхів.',
    'Contains: wheat flour, butter, milk, eggs, sugar, salt, yeast. May contain traces of nuts.',
    6500,
    array['https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80',
          'https://images.unsplash.com/photo-1597131628165-84ef2e4de6f3?w=800&q=80'],
    array[]::text[],
    array['pickup'],
    60, true
  ),

  (
    (select id from cats where slug = 'pastries'),
    'almond-croissant',
    'Круасан з мигдалем',
    'Almond Croissant',
    'Учорашній круасан, розрізаний навпіл, просочений ромовим сиропом та наповнений вершковим мигдалевим кремом "франжипан". Хрусткий мигдаль зверху — апофеоз смаку.',
    'A day-old croissant soaked in rum syrup, filled with silky almond frangipane cream, and finished with toasted flaked almonds. Decadent and deeply satisfying.',
    'Містить: пшеничне борошно, вершкове масло, молоко, яйця, цукор, мигдаль, ром. Містить горіхи (мигдаль).',
    'Contains: wheat flour, butter, milk, eggs, sugar, almonds, rum. Contains nuts (almonds).',
    8500,
    array['https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80'],
    array[]::text[],
    array['pickup'],
    30, true
  ),

  (
    (select id from cats where slug = 'pastries'),
    'cinnamon-roll',
    'Синабон з кремом',
    'Cinnamon Roll with Cream Cheese Frosting',
    'Пухкий рулет з корицею та тростинним цукром, залитий густим вершковим кремом на основі крім-чізу. Теплий, духмяний та невимовно м''який.',
    'A pillowy roll swirled with cinnamon and brown sugar, generously topped with cream cheese frosting. Warm, fragrant, and impossibly soft.',
    'Містить: пшеничне борошно, вершкове масло, молоко, яйця, вершковий сир, кориця, цукор, дріжджі.',
    'Contains: wheat flour, butter, milk, eggs, cream cheese, cinnamon, sugar, yeast.',
    7500,
    array['https://images.unsplash.com/photo-1604971666149-1ff95c9e31fb?w=800&q=80'],
    array[]::text[],
    array['pickup'],
    25, true
  ),

  (
    (select id from cats where slug = 'pastries'),
    'cheese-bun-vynychanka',
    'Ватрушка з сиром',
    'Cottage Cheese Bun',
    'Пухке дріжджове тісто з начинкою зі свіжого домашнього сиру з ваніллю та родзинками. Теплі ватрушки — це смак дитинства. Подаємо свіжовипеченими.',
    'Soft yeasted dough filled with fresh farmer''s cottage cheese scented with vanilla and golden raisins. Warm cottage cheese buns — pure childhood nostalgia. Served fresh-baked.',
    'Містить: пшеничне борошно, вершкове масло, молоко, яйця, сир, цукор, родзинки, ваніль, дріжджі.',
    'Contains: wheat flour, butter, milk, eggs, cottage cheese, sugar, raisins, vanilla, yeast.',
    5500,
    array['https://images.unsplash.com/photo-1553452118-621e1f860f43?w=800&q=80'],
    array[]::text[],
    array['pickup'],
    30, true
  ),

  (
    (select id from cats where slug = 'pastries'),
    'apple-turnover',
    'Яблучний штрудель',
    'Apple Strudel',
    'Тонке листкове тісто з начинкою з печених яблук, кориці, горіхів та родзинок, посипане цукровою пудрою. Подається теплим з кулькою ванільного морозива за запитом.',
    'Thin, crispy filo pastry wrapped around a filling of baked apples, cinnamon, walnuts, and raisins, dusted with icing sugar. Served warm, with a scoop of vanilla ice cream upon request.',
    'Містить: пшеничне борошно, вершкове масло, яблука, волоські горіхи, родзинки, кориця, цукор. Містить горіхи (волоські).',
    'Contains: wheat flour, butter, apples, walnuts, raisins, cinnamon, sugar. Contains nuts (walnuts).',
    8900,
    array['https://images.unsplash.com/photo-1567171466295-4afa63d45416?w=800&q=80'],
    array[]::text[],
    array['pickup','delivery'],
    null, true
  ),

  (
    (select id from cats where slug = 'pastries'),
    'eclair-chocolate',
    'Еклер шоколадний',
    'Chocolate Éclair',
    'Класичний французький еклер із заварного тіста, наповнений ніжним кремом із темного шоколаду та вкритий блискучою шоколадною глазур''ю. Елегантно і спокусливо.',
    'A classic French éclair of light choux pastry filled with silky dark chocolate pastry cream and glazed with glossy chocolate icing. Elegant and irresistible.',
    'Містить: пшеничне борошно, вершкове масло, молоко, яйця, темний шоколад (какао, цукор, масло какао), цукор.',
    'Contains: wheat flour, butter, milk, eggs, dark chocolate (cocoa, sugar, cocoa butter), sugar.',
    7500,
    array['https://images.unsplash.com/photo-1603532648955-039310d9ed75?w=800&q=80'],
    array[]::text[],
    array['pickup'],
    40, true
  ),

  -- ── CAKES ─────────────────────────────────────────────────────────────────

  (
    (select id from cats where slug = 'cakes'),
    'honey-cake-medivnyk',
    'Медівник (Медовик)',
    'Honey Layer Cake',
    'Дванадцять тонких медових коржів, просочених ніжним сметанним кремом із натуральним медом. Торт готується за добу до замовлення — крем повинен просочити кожен корж до ідеальної консистенції. Класика української пекарні.',
    'Twelve thin honey sponge layers soaked overnight in a silky smetana (sour cream) and natural honey cream. Prepared a full day ahead so every layer is perfectly saturated — a Ukrainian bakery classic.',
    'Містить: пшеничне борошно, вершкове масло, яйця, мед, цукор, сметана, харчова сода. Без горіхів.',
    'Contains: wheat flour, butter, eggs, honey, sugar, smetana (sour cream), bicarbonate of soda. Nut-free.',
    38000,
    array['https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80',
          'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=800&q=80'],
    array[]::text[],
    array['pickup','delivery','preorder'],
    5, true
  ),

  (
    (select id from cats where slug = 'cakes'),
    'napoleon-cake',
    'Торт "Наполеон"',
    'Napoleon Mille-Feuille Cake',
    'Сотні шарів хрусткого листкового тіста власного виробництва, перекладених кремом "Патіс''єр" на основі натуральної ванілі. Верхній корж посипається крихтою. Подається охолодженим.',
    'Hundreds of layers of our own crisp rough-puff pastry alternating with a rich vanilla pastry cream (crème pâtissière). The top is crowned with pastry crumble. Served chilled.',
    'Містить: пшеничне борошно, вершкове масло, яйця, молоко, ванільний стручок, цукор.',
    'Contains: wheat flour, butter, eggs, milk, vanilla pod, sugar.',
    42000,
    array['https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80'],
    array[]::text[],
    array['pickup','delivery','preorder'],
    4, true
  ),

  (
    (select id from cats where slug = 'cakes'),
    'new-york-cheesecake',
    'Чізкейк Нью-Йорк',
    'New York Cheesecake',
    'Класичний нью-йоркський чізкейк на основі крему зі справжнього вершкового сиру "Філадельфія" та підставці зі злегка солоного крекерного печива. Щільний, оксамитовий, з легкою кислинкою.',
    'The real deal: pure Philadelphia cream cheese filling on a salted graham cracker base. Dense, velvety, with the signature gentle tang. Served plain or with seasonal berry compote.',
    'Містить: вершковий сир (молоко), яйця, цукор, борошно пшеничне, пісочне печиво (пшениця, вершкове масло, цукор, сіль).',
    'Contains: cream cheese (milk), eggs, sugar, wheat flour, graham crackers (wheat, butter, sugar, salt).',
    39000,
    array['https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?w=800&q=80',
          'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&q=80'],
    array[]::text[],
    array['pickup','delivery','preorder'],
    4, true
  ),

  (
    (select id from cats where slug = 'cakes'),
    'ptychye-moloko-cake',
    'Торт "Пташине молоко"',
    'Bird''s Milk Cake',
    'Легкий бісквіт із двох шарів, між якими — повітряне суфле на основі агар-агару та збитих білків, вкрите тонким шаром темного шоколаду. Ніжний і вишуканий радянський класик у сучасному виконанні.',
    'Two light génoise sponge layers sandwiching an airy soufflé made with agar-agar and beaten egg whites, encased in a thin dark chocolate shell. A beloved Soviet-era classic, reimagined.',
    'Містить: яйця, цукор, пшеничне борошно, вершкове масло, темний шоколад, агар-агар, ванільний екстракт.',
    'Contains: eggs, sugar, wheat flour, butter, dark chocolate, agar-agar, vanilla extract.',
    41000,
    array['https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=800&q=80'],
    array[]::text[],
    array['pickup','delivery','preorder'],
    3, true
  ),

  (
    (select id from cats where slug = 'cakes'),
    'chocolate-tart',
    'Шоколадний тарт',
    'Dark Chocolate Tart',
    'Хрустке пісочне тісто, наповнене ганашем із 70% темного шоколаду Valrhona. Подається при кімнатній температурі для максимального розкриття аромату. Без борошна в начинці — можна подати як gluten-free.',
    'Crisp shortcrust pastry shell filled with a glossy dark chocolate ganache made from 70% Valrhona couverture. Served at room temperature for maximum flavour. The filling itself is gluten-free.',
    'Містить: пшеничне борошно (тісто), вершкове масло, яйця, темний шоколад 70% (какао, цукор, масло какао), вершки. Начинка без глютену.',
    'Contains: wheat flour (pastry shell), butter, eggs, 70% dark chocolate (cocoa, sugar, cocoa butter), cream. Filling is gluten-free.',
    9500,
    array['https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80'],
    array[]::text[],
    array['pickup','delivery'],
    12, true
  ),

  (
    (select id from cats where slug = 'cakes'),
    'lemon-tart',
    'Лимонний тарт',
    'Lemon Tart',
    'Хрустке тісто-сабле з кислуватим лимонним кердом та обпаленим меренгою зверху. Яскравий смак — ідеальний баланс кислого та солодкого.',
    'Crumbly sablé pastry filled with bright lemon curd and finished with toasted Italian meringue. Sharp, zesty, and perfectly balanced between tart and sweet.',
    'Містить: пшеничне борошно, вершкове масло, яйця, лимони (сік та цедра), цукор.',
    'Contains: wheat flour, butter, eggs, lemons (juice and zest), sugar.',
    9200,
    array['https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=800&q=80'],
    array[]::text[],
    array['pickup','delivery'],
    10, true
  ),

  -- ── SEASONAL ─────────────────────────────────────────────────────────────

  (
    (select id from cats where slug = 'seasonal'),
    'paska-easter-bread',
    'Паска з ізюмом та цукатами',
    'Easter Paska Bread',
    'Традиційний великодній хліб на основі здобного тіста з шафраном, ваніллю, родзинками та цукатами. Вкритий білою цукровою глазур''ю та кольоровим посипом. Замовляйте заздалегідь — доступна лише напередодні Великодня.',
    'Traditional Easter bread made from an enriched, saffron-scented dough with vanilla, golden raisins, and candied peel. Finished with white royal icing and coloured sprinkles. Order in advance — available in the week leading up to Easter only.',
    'Містить: пшеничне борошно, яйця, вершкове масло, молоко, цукор, шафран, ваніль, родзинки, цукати, дріжджі.',
    'Contains: wheat flour, eggs, butter, milk, sugar, saffron, vanilla, raisins, candied peel, yeast.',
    12000,
    array['https://images.unsplash.com/photo-1609951651556-5b96d523e32b?w=800&q=80'],
    array[]::text[],
    array['pickup','delivery','preorder'],
    null, true
  ),

  (
    (select id from cats where slug = 'seasonal'),
    'gingerbread-cookies',
    'Медові пряники',
    'Decorated Honey Gingerbread',
    'Ароматні пряники з імбиром, корицею та гвоздикою, прикрашені розписом із глазурі вручну. Кожен пряник — маленький витвір мистецтва. Ідеальний подарунок. Мінімальне замовлення — 6 штук.',
    'Fragrant gingerbread spiced with ginger, cinnamon, and cloves, hand-decorated with royal icing. Each piece is a small work of art and makes a perfect gift. Minimum order 6 pieces.',
    'Містить: пшеничне борошно, вершкове масло, яйця, мед, цукор, імбир, кориця, гвоздика. Без горіхів.',
    'Contains: wheat flour, butter, eggs, honey, sugar, ginger, cinnamon, cloves. Nut-free.',
    4500,
    array['https://images.unsplash.com/photo-1607246873139-fec19b8d3c6d?w=800&q=80'],
    array[]::text[],
    array['pickup','delivery','preorder'],
    null, true
  ),

  (
    (select id from cats where slug = 'seasonal'),
    'panettone',
    'Паnetone з сухофруктами',
    'Panettone with Dried Fruits',
    'Італійський різдвяний хліб тривалого бродіння (48 годин) з цукатами та родзинками, ароматизований ромом та ваніллю. Легкий, пухнастий, з характерним тягучим м''якушем. Доступний лише в грудні.',
    'A 48-hour naturally leavened Italian Christmas bread studded with candied citrus peel and golden raisins, aromatised with rum and vanilla. Light, airy, and distinctively stretchy. Available December only.',
    'Містить: пшеничне борошно, вершкове масло, яйця, цукор, цукати (апельсин, лимон), родзинки, ром, ваніль, закваска.',
    'Contains: wheat flour, butter, eggs, sugar, candied peel (orange, lemon), raisins, rum, vanilla, sourdough starter.',
    24000,
    array['https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=800&q=80'],
    array[]::text[],
    array['pickup','delivery','preorder'],
    10, true
  )

  returning id
)

select 'Products inserted: ' || count(*) from inserted_products;


-- ── Sample gallery items ──────────────────────────────────────────────────────

insert into gallery (caption_uk, caption_en, photos, tags, sort_order) values

(
  'Весільний торт: три яруси, живі квіти та золоте листя',
  'Wedding cake: three tiers, fresh flowers and gold leaf',
  array['https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=800&q=80',
        'https://images.unsplash.com/photo-1562440499-64c9a111f713?w=800&q=80'],
  array['wedding','custom','floral'],
  10
),

(
  'Торт "Русалка" на день народження дівчинки',
  'Mermaid birthday cake for a little girl',
  array['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'],
  array['birthday','children','custom'],
  20
),

(
  'Корпоративний набір: асорті еклерів та макаронів у брендових кольорах',
  'Corporate set: éclair and macaron assortment in brand colours',
  array['https://images.unsplash.com/photo-1611293388250-580b08c4a145?w=800&q=80',
        'https://images.unsplash.com/photo-1558326567-98ae2405596b?w=800&q=80'],
  array['corporate','macarons','eclairs'],
  30
),

(
  'Гола шоколадна торт "Чорний ліс" з вишнями та збитими вершками',
  'Naked Black Forest cake with cherries and whipped cream',
  array['https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=800&q=80'],
  array['chocolate','birthday','naked'],
  40
),

(
  'Новорічна колекція пряників: ялинки, зірки та сніжинки',
  'Christmas gingerbread collection: trees, stars and snowflakes',
  array['https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=800&q=80',
        'https://images.unsplash.com/photo-1607246873139-fec19b8d3c6d?w=800&q=80'],
  array['christmas','gingerbread','seasonal'],
  50
),

(
  'Торт-серце на День закоханих: малина та рожевий оксамит',
  'Valentine''s heart cake: raspberry and pink velvet',
  array['https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=800&q=80'],
  array['valentines','romantic','custom'],
  60
),

(
  'Торт "Захід сонця" — омбре від жовтого до темно-оранжевого',
  'Sunset cake — ombre from golden yellow to deep orange',
  array['https://images.unsplash.com/photo-1562440499-64c9a111f713?w=800&q=80'],
  array['ombre','custom','birthday'],
  70
),

(
  'Паска великодня, прикрашена живими квітами та зеленню',
  'Easter paska decorated with fresh spring flowers and greens',
  array['https://images.unsplash.com/photo-1609951651556-5b96d523e32b?w=800&q=80'],
  array['easter','seasonal','traditional'],
  80
);
