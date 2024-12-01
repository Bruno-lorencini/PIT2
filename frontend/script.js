const API_URL = 'http://localhost:3000';

const productList = document.getElementById('product-list');
const cart = document.getElementById('cart');
const checkoutButton = document.getElementById('checkout');
let cartItems = [];

// Fetch products from the server
fetch(`${API_URL}/products`)
  .then((response) => {
    if (response.status === 401) {
      alert('Faça login para acessar a loja');
      window.location.href = 'login.html';
    } else {
      return response.json();
    }
  })
  .then((products) => {
    if (products) {
      products.forEach((product) => {
        const div = document.createElement('div');
        div.className = 'col-md-4 mb-4';
        div.innerHTML = `
          <div class="card">
            <div class="card-body text-center">
              <h5 class="card-title">${product.name}</h5>
              <p class="card-text">Preço: R$${product.price.toFixed(2)}</p>
              <div class="d-flex justify-content-center gap-2">
                <a href="details.html?id=${product.id}" class="btn btn-info">Ver Detalhes</a>
                <button class="btn btn-success" onclick="addToCart('${product.name}', ${product.price})">Adicionar</button>
              </div>
            </div>
          </div>
        `;
        productList.appendChild(div);
      });
    }
  });

function requireLogin(req, res, next) {
  if (req.session && req.session.user) {
    return next(); // Sessão válida, continue
  }
  res.status(401).json({ error: 'Usuário não autenticado' }); // Usuário não está logado
}


function addToCart(name, price) {
  cartItems.push({ name, price });
  renderCart();
}

function renderCart() {
  cart.innerHTML = '';
  cartItems.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.textContent = `${item.name} - R$${item.price.toFixed(2)}`;
    cart.appendChild(li);
  });
}

checkoutButton.addEventListener('click', () => {
  fetch(`${API_URL}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cartItems),
  })
    .then(() => {
      alert('Compra finalizada com sucesso!');
      cartItems = [];
      renderCart();
    })
    .catch((error) => console.error('Erro ao finalizar compra:', error));
});

function renderCart() {
  cart.innerHTML = '';
  cartItems.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.innerHTML = `
        ${item.name} - R$${item.price.toFixed(2)}
        <button class="btn btn-danger btn-sm" onclick="removeFromCart(${index})">Remover</button>
      `;
    cart.appendChild(li);
  });
}

function removeFromCart(index) {
  cartItems.splice(index, 1);
  renderCart();
}

function renderCart() {
  cart.innerHTML = '';
  let total = 0;

  cartItems.forEach((item, index) => {
    total += item.price;

    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.innerHTML = `
        ${item.name} - R$${item.price.toFixed(2)}
        <button class="btn btn-danger btn-sm" onclick="removeFromCart(${index})">Remover</button>
      `;
    cart.appendChild(li);
  });

  const totalLi = document.createElement('li');
  totalLi.className = 'list-group-item active';
  totalLi.textContent = `Total: R$${total.toFixed(2)}`;
  cart.appendChild(totalLi);
}

document.getElementById('logout').addEventListener('click', () => {
  fetch(`${API_URL}/logout`, { method: 'POST' })
    .then((response) => {
      if (response.ok) {
        alert('Você saiu da conta.');
        window.location.href = 'login.html';
      } else {
        throw new Error('Erro ao fazer logout');
      }
    })
    .catch((error) => alert(error.message));
});

function filterProducts(category) {
  fetch(`${API_URL}/products`)
    .then((response) => response.json())
    .then((products) => {
      // Limpa a lista de produtos
      productList.innerHTML = '';

      // Filtra os produtos pela categoria selecionada
      products
        .filter(product => category === '' || product.category === category)
        .forEach((product) => {
          const div = document.createElement('div');
          div.className = 'col-md-4 mb-4';
          div.innerHTML = `
              <div class="card">
                <div class="card-body text-center">
                  <h5 class="card-title">${product.name}</h5>
                  <p class="card-text">Preço: R$${product.price.toFixed(2)}</p>
                  <div class="d-flex justify-content-center gap-2">
                    <a href="details.html?id=${product.id}" class="btn btn-info">Ver Detalhes</a>
                    <button class="btn btn-success" onclick="addToCart('${product.name}', ${product.price})">Adicionar</button>
                  </div>
                </div>
              </div>
            `;
          productList.appendChild(div);
        });
    })
    .catch((error) => console.error('Erro ao carregar produtos:', error));
}

// Carregar todos os produtos inicialmente
filterProducts('');

let currentPage = 1; // Página inicial
let totalPages = 1; // Total de páginas
let currentSearch = ''; // Busca atual

function loadProducts(page = 1, search = '') {
  console.log(`Carregando produtos para a página ${page} com busca: '${search}'`); // Depuração

  const url = `${API_URL}/products?page=${page}&limit=9&search=${encodeURIComponent(search)}`;
  console.log(`Requisição para o servidor: ${url}`); // Verifica a URL gerada

  fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error('Erro ao buscar produtos');
      return response.json();
    })
    .then((data) => {
      console.log('Resposta do servidor:', data); // Verifica os dados recebidos do servidor

      const products = data.products || [];
      totalPages = data.totalPages || 1;
      currentPage = page;

      // Limpar e renderizar produtos
      productList.innerHTML = '';
      if (products.length === 0) {
        productList.innerHTML = '<p class="text-center">Nenhum produto encontrado.</p>';
        renderPagination();
        return;
      }

      products.forEach((product) => {
        const div = document.createElement('div');
        div.className = 'col-md-4 mb-4';
        div.innerHTML = `
          <div class="card">
            <div class="card-body text-center">
              <h5 class="card-title">${product.name}</h5>
              <p class="card-text">Preço: R$${product.price.toFixed(2)}</p>
              <div class="d-flex justify-content-center gap-2">
                <a href="details.html?id=${product.id}" class="btn btn-info">Ver Detalhes</a>
                <button class="btn btn-success" onclick="addToCart('${product.name}', ${product.price})">Adicionar</button>
              </div>
            </div>
          </div>
        `;
        productList.appendChild(div);
      });

      renderPagination();
    })
    .catch((error) => console.error('Erro ao carregar produtos:', error));
}


  




function renderPagination() {
  const pagination = document.getElementById('pagination');

  if (totalPages <= 1) {
    pagination.innerHTML = ''; // Ocultar paginação se só houver 1 página
    return;
  }

  pagination.innerHTML = `
    <button class="btn btn-primary" onclick="loadProducts(${currentPage - 1}, '${currentSearch}')" ${currentPage === 1 ? 'disabled' : ''}>Anterior</button>
    <span class="mx-2">Página ${currentPage} de ${totalPages}</span>
    <button class="btn btn-primary" onclick="loadProducts(${currentPage + 1}, '${currentSearch}')" ${currentPage === totalPages ? 'disabled' : ''}>Próximo</button>
  `;
}



// Carregar a primeira página ao iniciar
loadProducts();


// Configurar a barra de pesquisa
document.getElementById('search-button').addEventListener('click', () => {
  const searchTerm = document.getElementById('search-bar').value.trim(); // Captura o valor digitado
  console.log(`Buscando produtos com o termo: '${searchTerm}'`); // Log de depuração
  loadProducts(1, searchTerm); // Passa o termo de busca para a função de carregamento
});


