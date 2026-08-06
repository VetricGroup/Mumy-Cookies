(function() {
  // Productos integrados de respaldo para asegurar que carguen SIEMPRE
  const PRODUCTOS_DEFAULT = [
    {
      "id": "caja-galletas",
      "categoria": "Cookies",
      "nombre": "Signature Cookie Box",
      "precio": 120.00,
      "imagen": "images/menu/caja-galletas.jpg",
      "descripcion": "Nuestra caja signature con un surtido artesanal de nuestras galletas más queridas: Choc Chip, Double Choc y Red Velvet recién horneadas.",
      "badge": "BEST SELLER"
    },
    {
      "id": "tubo-cookies",
      "categoria": "Cookies",
      "nombre": "Tubo de Cookies Especiales",
      "precio": 85.00,
      "imagen": "images/menu/tubo-cookies.jpg",
      "descripcion": "Torre artesanal de galletas especiales bañadas con glaseado y crocante de nuez. Empaque especial de regalo.",
      "badge": "MÁS PEDIDO"
    },
    {
      "id": "alfajores-tradicionales",
      "categoria": "Alfajores",
      "nombre": "Alfajores de Dulce de Leche",
      "precio": 45.00,
      "imagen": "images/menu/alfajores.jpg",
      "descripcion": "Suaves tapas de alfajor tradicional rellenas con abundante dulce de leche artesanal y bordes decorados con coco rallado.",
      "badge": "CLÁSICO"
    }
  ];

  let productos = [];
  let categoriaSeleccionada = 'Todos';

  const grid = document.getElementById('menuGrid');
  const countHeader = document.getElementById('productCountHeader');
  const catContainer = document.getElementById('categoryFilterContainer');
  const sortSelect = document.getElementById('sortSelect');
  const stockInCheck = document.getElementById('stockIn');
  const stockOutCheck = document.getElementById('stockOut');
  const priceMinInput = document.getElementById('priceMin');
  const priceMaxInput = document.getElementById('priceMax');
  const countInStockEl = document.getElementById('countInStock');
  const countOutStockEl = document.getElementById('countOutStock');

  const detalleModal = document.getElementById('productoDetalle');
  const detalleCerrar = document.getElementById('detalleCerrar');

  // Intentar cargar productos desde el archivo JSON, si falla usa el respaldo integrado
  fetch('assets/js/productos.json')
    .then(res => {
      if(!res.ok) throw new Error('Error al leer JSON');
      return res.json();
    })
    .then(data => {
      productos = (data && data.length > 0) ? data : PRODUCTOS_DEFAULT;
      iniciar();
    })
    .catch(err => {
      console.log('Cargando productos de respaldo:', err);
      productos = PRODUCTOS_DEFAULT;
      iniciar();
    });

  function iniciar() {
    renderCategorias();
    aplicarFiltros();
    revisarHash();
  }

  // Renderizar filtros de categoría en la barra lateral
  function renderCategorias() {
    if(!catContainer) return;
    const categorias = ['Todos', ...new Set(productos.map(p => p.categoria))];
    catContainer.innerHTML = categorias.map(cat => `
      <label class="checkbox-label">
        <input type="radio" name="categoria" value="${cat}" ${cat === categoriaSeleccionada ? 'checked' : ''}>
        <span>${cat}</span>
      </label>
    `).join('');

    catContainer.querySelectorAll('input[name="categoria"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        categoriaSeleccionada = e.target.value;
        aplicarFiltros();
      });
    });
  }

  // Filtrar y ordenar productos dinámicamente
  function aplicarFiltros() {
    let resultado = [...productos];

    // 1. Filtro por categoría
    if (categoriaSeleccionada !== 'Todos') {
      resultado = resultado.filter(p => p.categoria === categoriaSeleccionada);
    }

    // 2. Filtro por disponibilidad
    const showInStock = stockInCheck ? stockInCheck.checked : true;
    const showOutStock = stockOutCheck ? stockOutCheck.checked : false;

    const totalIn = resultado.filter(p => !p.agotado).length;
    const totalOut = resultado.filter(p => p.agotado).length;
    if(countInStockEl) countInStockEl.textContent = `(${totalIn})`;
    if(countOutStockEl) countOutStockEl.textContent = `(${totalOut})`;

    resultado = resultado.filter(p => {
      const isOut = !!p.agotado;
      if (showInStock && !isOut) return true;
      if (showOutStock && isOut) return true;
      return false;
    });

    // 3. Filtro por precio
    const minVal = parseFloat(priceMinInput.value) || 0;
    const maxVal = parseFloat(priceMaxInput.value) || Infinity;
    resultado = resultado.filter(p => p.precio >= minVal && p.precio <= maxVal);

    // 4. Ordenamiento
    const sortVal = sortSelect ? sortSelect.value : 'featured';
    if (sortVal === 'price-low') {
      resultado.sort((a, b) => a.precio - b.precio);
    } else if (sortVal === 'price-high') {
      resultado.sort((a, b) => b.precio - a.precio);
    } else if (sortVal === 'name-az') {
      resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    // Actualizar conteo header y renderizar grid
    if (countHeader) countHeader.textContent = `${resultado.length} productos`;
    renderGrid(resultado);
  }

  // Renderizar Tarjetas de Productos
  function renderGrid(lista) {
    if(!grid) return;
    if (lista.length === 0) {
      grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding:40px; color:#777;">No se encontraron productos con los filtros seleccionados.</p>';
      return;
    }

    grid.innerHTML = lista.map(p => `
      <a href="#${p.id}" class="product-card" data-id="${p.id}">
        <div class="img-container">
          <img src="${p.imagen}" alt="${p.nombre}" loading="lazy" onerror="this.src='images/Logo.png'">
          ${p.badge ? `<span class="badge-bestseller">${p.badge}</span>` : ''}
        </div>
        <div class="product-info">
          <h3>${p.nombre}</h3>
          <p class="price">${formatearPrecio(p.precio)}</p>
        </div>
      </a>
    `).join('');

    // Evento de clic en tarjetas para abrir modal
    grid.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const id = card.dataset.id;
        mostrarDetalle(id);
      });
    });
  }

  function formatearPrecio(valor) {
    if (!valor || valor === 0) return 'Q 0.00';
    return 'Q ' + Number(valor).toFixed(2);
  }

  // Modal de Detalle de Producto
  function mostrarDetalle(id) {
    const p = productos.find(prod => prod.id === id);
    if (!p) return;

    document.getElementById('detalleImagen').src = p.imagen;
    document.getElementById('detalleImagen').alt = p.nombre;
    document.getElementById('detalleCategoria').textContent = p.categoria;
    document.getElementById('detalleNombre').textContent = p.nombre;
    document.getElementById('detallePrecio').textContent = formatearPrecio(p.precio);
    document.getElementById('detalleDescripcion').textContent = p.descripcion || '';
    document.getElementById('detalleWhatsapp').href =
      `https://wa.me/50248356549?text=${encodeURIComponent('Hola Mumy! Me gustaría pedir: ' + p.nombre)}`;

    detalleModal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function cerrarDetalle() {
    if(!detalleModal) return;
    detalleModal.classList.remove('is-open');
    document.body.style.overflow = '';
    history.pushState('', document.title, window.location.pathname + window.location.search);
  }

  function revisarHash() {
    const id = location.hash.replace('#', '');
    if (id) mostrarDetalle(id);
  }

  // Listeners para filtros y modal
  if (sortSelect) sortSelect.addEventListener('change', aplicarFiltros);
  if (stockInCheck) stockInCheck.addEventListener('change', aplicarFiltros);
  if (stockOutCheck) stockOutCheck.addEventListener('change', aplicarFiltros);
  if (priceMinInput) priceMinInput.addEventListener('input', aplicarFiltros);
  if (priceMaxInput) priceMaxInput.addEventListener('input', aplicarFiltros);

  if (detalleCerrar) detalleCerrar.addEventListener('click', cerrarDetalle);
  if (detalleModal) {
    detalleModal.addEventListener('click', (e) => {
      if (e.target === detalleModal) cerrarDetalle();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && detalleModal && detalleModal.classList.contains('is-open')) cerrarDetalle();
  });
  window.addEventListener('hashchange', revisarHash);
})();