/* ------------------------------------------------------------------
   moravchick — details for the demo pieces the cart and wishlist start with
   (cart-store.html / cart.html seed them with only a name, seller, price and
   category). The product page (product-showcase.html) fills any field a piece
   is missing from here, by name, so a demo piece shows a full spec table like
   a real listing. Real listings always win: only empty fields are filled.
------------------------------------------------------------------ */
(function () {
    'use strict';
    var C = function (fabric, color, size, condition, style, gender, season, collection, extra) {
        var o = { fabric: fabric, color: color, size: size, condition: condition, style: style, gender: gender, season: season, collection: collection };
        for (var k in (extra || {})) o[k] = extra[k];
        return o;
    };
    var A = function (material, color, size, condition, style, year, edition, signed, collection) {
        return { material: material, color: color, size: size, condition: condition, style: style, year: year, edition: edition, signed: signed, collection: collection };
    };
    window.veroDemoDetails = {
        'Cotton Oxford Shirt': C('Cotton', 'White', 'M', 'Very good', ['Classic', 'Minimal'], 'Men', 'All-season', 'autumn', { colorCombo: ['White', 'Blue'], description: 'A crisp oxford in heavy cotton, button-down collar, worn a handful of times.' }),
        'Linen Overshirt':     C('Linen', 'Beige', 'L', 'Like new', ['Minimal', 'Casual'], 'Men', 'Summer', 'summer', { description: 'Loose linen overshirt with two chest pockets — wear it open over a tee.' }),
        'Striped Tee':         C('Cotton', 'Navy', 'S', 'Good', ['Casual', 'Classic'], 'Unisex', 'Summer', 'summer', { colorCombo: ['Navy', 'White'] }),
        'Slim Selvedge Jeans': C('Denim', 'Indigo', '32', 'Very good', ['Classic', 'Streetwear'], 'Men', 'All-season', 'autumn', { description: 'Raw selvedge denim, slim through the leg, softly faded at the knees.' }),
        'Wool Trousers':       C('Wool', 'Grey', '34', 'Like new', ['Classic', 'Formal'], 'Men', 'Winter', 'winter'),
        'Cargo Pants':         C('Cotton', 'Olive', 'M', 'Good', ['Streetwear', 'Casual'], 'Unisex', 'Transitional', 'autumn'),
        'Leather Sneakers':    C('Leather', 'White', '43', 'Very good', ['Minimal', 'Casual'], 'Unisex', 'All-season', 'spring'),
        'Chelsea Boots':       C('Leather', 'Brown', '42', 'Very good', ['Classic'], 'Men', 'Winter', 'winter', { description: 'Pull-on Chelsea boots in smooth leather, resoled once, plenty of wear left.' }),
        'Suede Loafers':       C('Suede', 'Tan', '41', 'Like new', ['Classic', 'Formal'], 'Men', 'Transitional', 'spring'),
        'Automatic Watch':     C('Steel', 'Silver', '40 mm', 'Very good', ['Classic', 'Formal'], 'Unisex', 'All-season', 'autumn', { year: '2018' }),
        'Diver Chronograph':   C('Steel', 'Black', '42 mm', 'Like new', ['Sport'], 'Men', 'All-season', 'summer', { year: '2020' }),
        'Wool Overcoat':       C('Wool', 'Camel', 'L', 'Very good', ['Classic', 'Minimal'], 'Men', 'Winter', 'winter', { description: 'Double-faced wool overcoat, below the knee, fully lined.' }),
        'Denim Jacket':        C('Denim', 'Light blue', 'M', 'Good', ['Vintage', 'Casual'], 'Unisex', 'Transitional', 'spring'),
        'Leather Belt':        C('Leather', 'Black', '90 cm', 'Very good', ['Classic'], 'Unisex', 'All-season', 'autumn'),
        'Silk Scarf':          C('Silk', 'Burgundy', 'One size', 'Like new', ['Classic', 'Bohemian'], 'Women', 'All-season', 'autumn', { colorCombo: ['Burgundy', 'Gold'] }),
        'Sunset Landscape':    A('Oil on canvas', 'Orange', '60 × 80 cm', 'Excellent', ['Landscape', 'Impressionist'], '2021', 'Original', 'Yes', 'interiors'),
        'Harbour at Dawn':     A('Oil on canvas', 'Blue', '50 × 70 cm', 'Excellent', ['Landscape'], '2019', 'Original', 'Yes', 'interiors'),
        'Abstract No. 4':      A('Acrylic on canvas', 'Black', '100 × 100 cm', 'Excellent', ['Abstract', 'Modern'], '2022', 'Original', 'Yes', 'interiors'),
        'Colour Field II':     A('Acrylic on canvas', 'Red', '90 × 120 cm', 'Very good', ['Abstract', 'Minimal'], '2020', 'Original', 'Yes', 'interiors'),
        'Morning Mist':        A('Watercolour on paper', 'Grey', '40 × 50 cm', 'Excellent', ['Landscape', 'Minimal'], '2023', 'Original', 'Yes', 'interiors'),
        'Marble Bust':         A('Marble', 'White', '45 cm tall', 'Very good', ['Classical', 'Sculpture'], '2015', 'Original', 'No', 'interiors'),
        'Bronze Figure':       A('Bronze', 'Bronze', '38 cm tall', 'Excellent', ['Modern', 'Sculpture'], '2018', '3 of 8', 'Yes', 'interiors'),
        'Neon Print':          A('Giclée print', 'Pink', '50 × 70 cm', 'New', ['Pop', 'Digital'], '2023', '12 of 50', 'Yes', 'interiors'),
        'Generative Grid':     A('Archival print', 'Black', '60 × 60 cm', 'New', ['Digital', 'Minimal'], '2024', '5 of 25', 'Yes', 'interiors'),
        'City Nights':         A('Photographic print', 'Blue', '40 × 60 cm', 'Excellent', ['Photography', 'Urban'], '2022', '7 of 30', 'No', 'interiors')
    };

    // Any other demo piece: a full, believable set of details worked out from its
    // name and category — the same answer every time for the same piece.
    function hash(t) { var h = 0; t = String(t); for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0; return h; }
    var COLOURS = ['black', 'white', 'cream', 'beige', 'camel', 'brown', 'grey', 'navy', 'blue', 'green', 'olive', 'red', 'burgundy', 'pink', 'yellow', 'orange', 'gold', 'silver'];
    var PALETTE = ['Black', 'Ivory', 'Camel', 'Navy', 'Grey', 'Brown', 'Olive', 'Burgundy', 'Beige'];
    var ART_CAT = /paint|acrylic|oil|watercol|gouache|pastel|sculpt|ceramic|photo|digital|print|mixed|art|epoxy|stone|metal/i;
    var CLOTH = [
        [/dress|skirt|midi|gown/i,               'Viscose', 'S',   ['Romantic', 'Bohemian'], 'Women'],
        [/coat|jacket|parka|blazer|outer|trench/i, 'Wool',  'L',   ['Classic', 'Minimal'],   ''],
        [/jean|denim|trouser|pant|chino|short/i,  'Denim',  '32',  ['Casual', 'Classic'],    ''],
        [/knit|cardigan|sweater|jumper|wool/i,    'Wool',   'M',   ['Classic', 'Cosy'],      ''],
        [/boot|shoe|sneaker|loafer|heel|sandal/i, 'Leather', '41', ['Classic'],              ''],
        [/bag|tote|clutch|purse|backpack/i,       'Leather', 'One size', ['Minimal', 'Classic'], 'Women'],
        [/scarf|hat|cap|belt|glove|accessor|watch|jewel|ring|neck/i, 'Mixed', 'One size', ['Classic'], ''],
        [/shirt|tee|top|blouse|polo|tank/i,       'Cotton', 'M',   ['Casual', 'Minimal'],    '']
    ];
    var ART = [
        [/sculpt|bronze|figure|bust|stone|metal/i, 'Bronze', '40 cm tall'],
        [/ceramic|vase|bowl/i,                    'Glazed stoneware', '30 cm tall'],
        [/photo/i,                                'Photographic print', '40 × 60 cm'],
        [/watercol/i,                             'Watercolour on paper', '40 × 50 cm'],
        [/digital|print|neon|grid/i,              'Archival print', '50 × 70 cm'],
        [/oil/i,                                  'Oil on canvas', '60 × 80 cm']
    ];
    window.veroDemoGen = function (p) {
        p = p || {};
        var name = String(p.name || ''), cat = String(p.category || p.itemType || ''), key = name + ' ' + cat, h = hash(name + '|' + (p.seller || ''));
        var colour = (key.toLowerCase().match(new RegExp('\\b(' + COLOURS.join('|') + ')\\b')) || [])[1];
        colour = colour ? colour.charAt(0).toUpperCase() + colour.slice(1) : PALETTE[h % PALETTE.length];
        var second = PALETTE[(h >>> 3) % PALETTE.length]; if (second === colour) second = PALETTE[(h >>> 5) % PALETTE.length];
        var condition = p.condition || ['Like new', 'Very good', 'Excellent', 'Very good', 'Good'][(h >>> 2) % 5];
        if (p.color) colour = String(p.color);
        var year = String(2015 + (h >>> 4) % 9);
        var isArt = p.type === 'art' || /^art$/i.test(cat) || ART_CAT.test(cat);
        if (isArt) {
            var a = ART.filter(function (r) { return r[0].test(key); })[0] || [null, 'Acrylic on canvas', '70 × 90 cm'];
            return { material: a[1], size: a[2], color: colour, colorCombo: [colour, second], condition: condition,
                style: [['Abstract', 'Modern'], ['Landscape'], ['Minimal', 'Modern'], ['Figurative']][(h >>> 6) % 4],
                year: year, edition: h % 3 ? 'Original' : (1 + h % 9) + ' of 25', signed: h % 4 ? 'Yes' : 'No', collection: 'interiors',
                description: name + ' — ' + String(p.material || a[1]).toLowerCase() + ', ' + (p.size || a[2]) + ', ' + String(condition).toLowerCase() + '. Signed and dated ' + year + '.' };
        }
        var c = CLOTH.filter(function (r) { return r[0].test(key); })[0] || [null, 'Cotton', 'M', ['Casual'], ''];
        var gender = c[4] || ['Women', 'Men', 'Unisex', 'Women'][(h >>> 7) % 4];
        var collection = p.collection || ['autumn', 'winter', 'spring', 'summer'][(h >>> 8) % 4];
        var season = { spring: 'Transitional', summer: 'Summer', autumn: 'Transitional', winter: 'Winter' }[collection] || 'All-season';
        return { fabric: c[1], size: c[2], color: colour, colorCombo: [colour, second], condition: condition, style: c[3],
            gender: gender, season: season, collection: collection, year: year,
            description: name + ' in ' + String(p.fabric || c[1]).toLowerCase() + ', ' + colour.toLowerCase() + ', size ' + (p.size || c[2]) + ' — ' + String(condition).toLowerCase() + ', from ' + (p.seller || 'the seller') + '.' };
    };
})();
