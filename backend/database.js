const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./ecommerce.db');

// Inicializar tabela de produtos
db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      price REAL
    )
  `);

    // Inserir produtos de exemplo
    db.run(`INSERT INTO products (name, price) VALUES ('Produto 1', 19.99)`);
    db.run(`INSERT INTO products (name, price) VALUES ('Produto 2', 29.99)`);
    db.run(`INSERT INTO products (name, price) VALUES ('Produto 3', 39.99)`);
});

module.exports = db;

db.serialize(() => {
    db.run(`DROP TABLE IF EXISTS products`); // Limpa a tabela anterior (para dev)

    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        price REAL,
        description TEXT,
        image TEXT
      )
    `);

    db.run(`INSERT INTO products (name, price, description, image) VALUES 
      ('Nike Air Max', 499.90, 'Conforto e estilo para o dia a dia.', 'https://imgnike-a.akamaihd.net/1300x1300/0265315CA8.jpg'),
      ('Adidas Ultraboost', 599.90, 'Tênis ideal para corridas.', 'https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/d2a64cf9cd824e5d9fcc950b5eb0b2c8_9366/Tenis_Ultraboost_5_Azul_ID8817_HM1.jpg'),
      ('Nike Air Zoom Pegasus 39', 549.90, 'Ideal para quem busca agilidade e leveza, com tecnologia de amortecimento que oferece suporte durante o treino ou corrida.', 'https://imgnike-a.akamaihd.net/1920x1920/021832IE.jpg'),
      ('puma rs-x3 puzzle', 599.90, 'Design arrojado e confortável, perfeito para quem gosta de um visual urbano e descolado.', 'https://artwalk.vtexassets.com/arquivos/ids/224077/Tenis-Puma-RS-X3-Puzzle-Multicolor.jpg?v=637272442422670000'),
      ('New Balance 990v5', 899.90, 'Conforto incomparável com um estilo clássico, ideal para o uso diário e longas caminhadas.', 'https://acdn.mitiendanube.com/stores/001/038/770/products/tenis-new-balance-990v5-made-in-usa-triple-black-m990bb5-7b299c36ed53f2ba1416796640663574-1024-1024.jpg'),
      ('Reebok Classic Leather', 599.90, 'Um ícone do estilo retrô, com acabamento em couro para conforto e durabilidade ao longo do dia.', 'https://imgmarketplace.lojasrenner.com.br/20001/3903/7010703895926/7510707847500/0.jpg'),
      ('Asics Gel-Kayano 29', 1099.90, 'O equilíbrio perfeito entre estabilidade e conforto, ideal para quem corre longas distâncias.', 'https://m.media-amazon.com/images/I/41A+n7GznkL._AC_SY580_.jpg'),
      ('Nike Air Force 1', 499.90, 'O clássico do streetwear, com solado emborrachado e design atemporal que combina com qualquer look.', 'https://authenticfeet.vtexassets.com/arquivos/ids/440348/FN473-1-200-1.jpg?v=638574465527630000'),
      ('Fila Disruptor 2', 349.90, 'Tênis robusto com design esportivo e visual moderno, ideal para quem adora um estilo mais ousado.', 'https://fila.vtexassets.com/arquivos/ids/842252/5XM01136_103.jpg?v=637607406719800000'),
      ('Vans Old Skool', 349.90, 'A famosa silhueta da Vans, combinando com diversos estilos e proporcionando o conforto necessário para o dia a dia.', 'https://secure-static.vans.com.br/medias/sys_master/vans/vans/had/h0d/h00/h00/12093657645086/1002900210002U-01-BASEIMAGE-Midres.jpg'),
      ('Under Armour HOVR Phantom 3', 799.90, 'Tênis de corrida de alta performance, com amortecimento responsivo que oferece mais retorno de energia a cada passo.', 'https://underarmourbr.vtexassets.com/arquivos/ids/324946/3026582-100-01.jpg?v=638339298273670000'),
      ('Puma RS-X', 399.90, 'Design moderno e arrojado.', 'https://images.puma.com/image/upload/f_auto,q_auto,b_rgb:fafafa/global/394311/01/sv01/fnd/BRA/w/1000/h/1000/fmt/png')`,);
});

db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
      )
    `);

    // Usuário de exemplo
    db.run(`INSERT OR IGNORE INTO users (username, password) VALUES ('user1', '1234')`);
});

db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        items TEXT,
        total REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);
});

db.serialize(() => {
    db.run(`ALTER TABLE products ADD COLUMN category TEXT`);
});

db.run(`UPDATE products SET category = 'Corrida' WHERE name = 'Nike Air Max'`);
db.run(`UPDATE products SET category = 'Casual' WHERE name = 'Puma RS-X'`);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      user_id INTEGER,
      rating INTEGER,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(product_id) REFERENCES products(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
});


