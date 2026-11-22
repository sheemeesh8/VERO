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
})();
