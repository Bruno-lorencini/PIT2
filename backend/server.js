const express = require('express');
const cors = require('cors');
const db = require('./database');
const session = require('express-session');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Configurar sessões
app.use(session({
  secret: 'step-sneakers-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Secure deve ser true em produção com HTTPS
}));

// Endpoint para buscar produtos no SQLite
app.get('/products', (req, res) => {
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
    res.json(rows);
  });
});

// Middleware para verificar login
function requireLogin(req, res, next) {
  if (req.session.user) return next();
  res.status(401).json({ error: 'Usuário não autenticado' });
}

// Protege endpoints usando requireLogin
app.get('/products', requireLogin, (req, res) => {
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
    res.json(rows);
  });
});

app.get('/products', (req, res) => {
  const { page = 1, limit = 9, search = '' } = req.query;
  const offset = (page - 1) * limit;
  const searchQuery = `%${search}%`;

  console.log(`Parâmetros recebidos: Página=${page}, Limite=${limit}, Busca='${search}'`); // Depuração

  db.all(
    `SELECT * FROM products WHERE name LIKE ? LIMIT ? OFFSET ?`,
    [searchQuery, parseInt(limit), parseInt(offset)],
    (err, rows) => {
      if (err) {
        console.error('Erro ao buscar produtos:', err);
        return res.status(500).json({ error: 'Erro ao buscar produtos' });
      }

      db.get(
        `SELECT COUNT(*) AS total FROM products WHERE name LIKE ?`,
        [searchQuery],
        (err, result) => {
          if (err) {
            console.error('Erro ao contar produtos:', err);
            return res.status(500).json({ error: 'Erro ao contar produtos' });
          }

          const totalProducts = result ? result.total : 0;
          const totalPages = Math.ceil(totalProducts / limit);

          console.log(`Produtos encontrados: ${rows.length}, Total: ${totalProducts}`); // Depuração
          res.json({
            products: rows || [],
            total: totalProducts,
            currentPage: parseInt(page),
            totalPages,
          });
        }
      );
    }
  );
});

// Adicionar uma avaliação
app.post('/reviews', requireLogin, (req, res) => {
  const { product_id, rating, comment } = req.body;
  const user_id = req.session.user.id;

  db.run(
    `INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)`,
    [product_id, user_id, rating, comment],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao adicionar avaliação' });
      }
      res.json({ message: 'Avaliação adicionada com sucesso', reviewId: this.lastID });
    }
  );
});

// Listar avaliações de um produto
app.get('/reviews/:product_id', (req, res) => {
  const { product_id } = req.params;

  db.all(
    `SELECT r.rating, r.comment, u.username, r.created_at
     FROM reviews r
     JOIN users u ON r.user_id = u.id
     WHERE r.product_id = ?
     ORDER BY r.created_at DESC`,
    [product_id],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao buscar avaliações' });
      }
      res.json(rows);
    }
  );
});

// Endpoint para buscar detalhes de um produto
app.get('/products/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao buscar produto' });
    }
    if (!row) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json(row);
  });
});

// Endpoint para registro de usuários
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  db.run(
    'INSERT INTO users (username, password) VALUES (?, ?)',
    [username, password],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(400).json({ error: 'Erro ao criar usuário' });
      }
      res.status(201).json({ message: 'Usuário criado com sucesso', id: this.lastID });
    }
  );
});

// Endpoint de login atualizado para salvar sessão
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password],
    (err, user) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro no servidor' });
      }
      if (!user) return res.status(401).json({ error: 'Usuário ou senha inválidos' });

      req.session.user = { id: user.id, username: user.username }; // Salva a sessão
      res.json({ message: 'Login bem-sucedido', user });
    }
  );
});

// Endpoint para logout
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Erro ao fazer logout' });
    res.json({ message: 'Logout realizado com sucesso' });
  });
});

// Endpoint para finalizar compra
app.post('/checkout', requireLogin, (req, res) => {
  const userId = req.session.user.id;
  const items = JSON.stringify(req.body); // Carrinho enviado do front-end
  const total = req.body.reduce((sum, item) => sum + item.price, 0);

  db.run(
    `INSERT INTO orders (user_id, items, total) VALUES (?, ?, ?)`,
    [userId, items, total],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao salvar pedido' });
      }
      res.json({ message: 'Pedido finalizado com sucesso!', orderId: this.lastID });
    }
  );
});

// Endpoint para buscar histórico de pedidos (protegido)
app.get('/orders', requireLogin, (req, res) => {
  const userId = req.session.user.id;

  db.all(
    `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao buscar pedidos' });
      }
      res.json(rows);
    }
  );
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});