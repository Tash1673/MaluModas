(() => {
  'use strict';
  const config = window.MALU_CONFIG || {};
  const products = Array.isArray(window.MALU_PRODUTOS) ? window.MALU_PRODUTOS : [];
  const STORAGE_KEY = 'malu_modas_sacola_v1';
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = (num) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(num);
  const money = (p) => Number.isFinite(p.preco) && p.preco >= 0 ? fmt(p.preco) : 'Valor sob consulta';
  const findProduct = (id) => products.find(p => p.id === id);
  let activeCategory = 'Todas';
  let activeSector = 'Todos';
  let activePanel = null;
  let previousFocus = null;
  let pendingOrderText = '';
  let toastTimer = null;
  let cart = [];
  try { const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); cart = Array.isArray(stored) ? stored.filter(i => findProduct(i.id) && Number.isInteger(i.qty) && i.qty > 0 && i.qty <= 99) : []; } catch (_) { cart = []; }

  function getPhone() {
    let phone = String(config.whatsapp || '').replace(/\D/g,'');
    if (phone.length === 10 || phone.length === 11) phone = '55' + phone;
    return /^55\d{10,11}$/.test(phone) ? phone : '';
  }
  function toast(message) {
    const el=$('toast'); el.textContent=message; el.classList.add('visible');
    clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('visible'),3600);
  }
  function saveCart() { try { localStorage.setItem(STORAGE_KEY,JSON.stringify(cart)); } catch(_){} renderCart(); }
  function setBodyLock(locked){ document.body.classList.toggle('no-scroll',locked); }
  function openPanel(id) {
    if (activePanel) closePanel(false);
    previousFocus = document.activeElement;
    activePanel = id;
    $(id).hidden = false;
    $('overlay').hidden = false;
    setBodyLock(true);
    $(id).focus();
  }
  function closePanel(restore=true){
    if (!activePanel) return;
    $(activePanel).hidden = true;
    $('overlay').hidden = true;
    activePanel=null;
    setBodyLock(false);
    if (restore && previousFocus && previousFocus.isConnected && typeof previousFocus.focus==='function') previousFocus.focus();
  }
  function WhatsApp(message) {
    const phone = getPhone();
    if (!phone) { pendingOrderText = message; openPanel('noticeModal'); return; }
    window.location.assign('https://wa.me/'+phone+'?text='+encodeURIComponent(message));
  }
  function cartCount(){return cart.reduce((total,i)=>total+i.qty,0);}
  function getCategories(){return ['Todas', ...new Set(products.filter(p=>activeSector==='Todos'||p.setor===activeSector).map(p=>p.categoria))];}
  function renderFilters() {
    $('sectorFilters').innerHTML=['Todos','Feminino','Masculino','Infantil'].map(s=>`<button type="button" class="filter-button ${s===activeSector?'active':''}" data-sector="${s}" aria-pressed="${s===activeSector}">${s}</button>`).join('');
    $('categoryFilters').innerHTML = getCategories().map(c=>`<button class="filter-button ${c===activeCategory?'active':''}" type="button" data-category="${esc(c)}" aria-pressed="${c===activeCategory}">${esc(c)}</button>`).join('');
  }
  function renderProducts() {
    const search=$('searchInput').value.trim().toLocaleLowerCase('pt-BR');
    const sort=$('sortSelect').value;
    let result=products.filter(p=>(activeSector==='Todos'||p.setor===activeSector) && (activeCategory==='Todas'||p.categoria===activeCategory) && (!search || `${p.nome} ${p.setor} ${p.categoria} ${p.id}`.toLocaleLowerCase('pt-BR').includes(search)));
    if(sort==='az')result.sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
    else if(sort==='menor'||sort==='maior')result.sort((a,b)=>{
      const an = Number.isFinite(a.preco),bn=Number.isFinite(b.preco);
      if(an!==bn)return an?-1:1;
      if(!an)return 0;
      return sort==='menor'?a.preco-b.preco:b.preco-a.preco;
    });
    $('productGrid').innerHTML=result.map(p=>{
      const unavailable=p.disponivel===false;
      const badge=config.demonstracao?'Exemplo':(p.destaque && p.destaque!=='Exemplo'?p.destaque:'');
      return `<article class="product-card ${unavailable?'unavailable':''}">
        <button class="product-photo" type="button" data-open-product="${esc(p.id)}" aria-label="Ver detalhes de ${esc(p.nome)}">
          <img src="${esc(p.imagem)}" loading="lazy" alt="${config.demonstracao?'Ilustração demonstrativa: ':''}${esc(p.nome)}" onerror="this.onerror=null;this.src='assets/pecas/vestido-classico.svg'">
          ${badge?`<span class="product-tag">${esc(badge)}</span>`:''}
          <span class="product-view">VER DETALHES +</span>
        </button>
        <div class="product-information">
          <p class="product-category">${esc(p.setor)} · ${esc(p.categoria)}</p><h3 class="product-name">${esc(p.nome)}</h3>
          <p class="product-price ${Number.isFinite(p.preco)?'':'muted'}">${money(p)}</p>
          <button class="add-link" type="button" data-open-product="${esc(p.id)}">${unavailable?'Ver detalhes':'Escolher peça'} <span aria-hidden="true">↗</span></button>
        </div></article>`;
    }).join('');
    $('noResults').hidden=result.length>0;
    $('itemCounter').textContent=result.length===1?'1 peça na coleção':`${result.length} peças na coleção`;
  }
  function getItemKey(item){return JSON.stringify([item.id,item.size,item.color]);}
  function addCart(id,size,color,qty){
    const p=findProduct(id);
    if(!p || p.disponivel===false)return toast('Esta peça está indisponível.');
    const key=getItemKey({id,size,color});
    const existing=cart.find(item=>getItemKey(item)===key);
    if(existing)existing.qty=Math.min(99,existing.qty+qty);
    else cart.push({id,size,color,qty:Math.min(99,qty)});
    saveCart(); closePanel(); toast('Peça adicionada à sua sacola.');
  }
  function renderCart() {
    const total=cartCount(); $('cartCount').textContent=total; $('cartCount').hidden=total===0;
    $('drawerCount').textContent=`(${total})`;
    $('checkoutButton').disabled=total===0;
    if(total===0){
      $('cartItems').innerHTML='<div class="empty-cart"><span class="empty-cart-icon">✧</span><h3>Sua sacola está vazia.</h3><p>Explore nossa coleção e escolha as peças que você mais gostou.</p></div>';
      $('subtotalText').textContent='';return;
    }
    $('cartItems').innerHTML=cart.map((item,index)=>{
      const p=findProduct(item.id);
      if(!p) return '';
      return `<article class="cart-row"><img src="${esc(p.imagem)}" alt="${esc(p.nome)}" loading="lazy">
        <div><h3>${esc(p.nome)}</h3><div class="cart-meta">${esc(item.size)} · ${esc(item.color)} · ${esc(p.id)}</div>
        <p class="cart-line-price">${Number.isFinite(p.preco)?fmt(p.preco*item.qty):'Valor sob consulta'}</p>
        <div class="cart-row-actions"><div class="qty-widget"><button type="button" data-cart-qty="${index}" data-qty-delta="-1" aria-label="Diminuir quantidade">−</button><span>${item.qty}</span><button type="button" data-cart-qty="${index}" data-qty-delta="1" aria-label="Aumentar quantidade">+</button></div>
        <button class="remove-item" type="button" data-remove="${index}">Remover</button></div></div></article>`;
    }).join('');
    const priced=cart.every(i=>Number.isFinite(findProduct(i.id)?.preco));
    $('subtotalText').textContent=priced?'Subtotal estimado: '+fmt(cart.reduce((t,i)=>t+findProduct(i.id).preco*i.qty,0)):'Valores a confirmar pelo WhatsApp';
  }
  function buildOrderText(){
    let lines=['Olá! Gostaria de fazer um pedido na Malu Modas Evangélica.','','*Meu pedido:*'];
    cart.forEach((i,n)=>{
      const p=findProduct(i.id);
      if(!p)return;
      lines.push(`${n+1}. ${p.nome} (${p.id})`,`   Tamanho: ${i.size} | Cor: ${i.color} | Quantidade: ${i.qty}`,`   ${Number.isFinite(p.preco)?'Valor: '+fmt(p.preco*i.qty):'Valor: a consultar'}`);
    });
    if(cart.every(i=>Number.isFinite(findProduct(i.id)?.preco)))lines.push('',`*Subtotal estimado:* ${fmt(cart.reduce((t,i)=>t+findProduct(i.id).preco*i.qty,0))}`);
    lines.push('','Gostaria de confirmar disponibilidade, valores e opções de entrega. Agradeço!');
    return lines.join('\n');
  }
  function renderProductModal(id) {
    const p=findProduct(id); if(!p)return;
    const sizes=(p.tamanhos?.length ? p.tamanhos : ['A consultar']);
    const colors=(p.cores?.length ? p.cores : ['A consultar']);
    const options=(values,group)=>values.map((v,i)=>`<button type="button" class="option ${i===0?'selected':''}" aria-pressed="${i===0}" data-select="${group}" data-option="${esc(v)}">${esc(v)}</button>`).join('');
    $('productModalContent').innerHTML=`<div class="product-detail"><img src="${esc(p.imagem)}" alt="${esc(p.nome)}"><div class="product-detail-content">
      <span class="detail-category">${esc(p.categoria)} · ${esc(p.id)}</span><h2>${esc(p.nome)}</h2>
      <p class="detail-price">${money(p)}</p><p class="detail-description">${esc(p.descricao || 'Consulte detalhes e disponibilidade com a loja.')}</p>
      ${p.disponivel===false?'<p class="detail-price">Produto indisponível no momento.</p>':`<form class="detail-form" id="detailForm" data-product-id="${esc(p.id)}">
        <div class="option-selector"><label>TAMANHO</label><div class="size-options">${options(sizes,'size')}</div></div>
        <div class="option-selector"><label>COR</label><div class="color-options">${options(colors,'color')}</div></div>
        <div class="detail-qty"><label>QUANTIDADE</label><div class="qty-widget"><button type="button" id="detailMinus" aria-label="Diminuir quantidade">−</button><span id="detailQty">1</span><button type="button" id="detailPlus" aria-label="Aumentar quantidade">+</button></div></div>
        <button class="button button-dark detail-submit" type="submit">Adicionar à sacola <span aria-hidden="true">↗</span></button>
        <p class="detail-tip">Você poderá revisar suas escolhas antes de enviar o pedido pelo WhatsApp.</p>
      </form>`}</div></div>`;
    openPanel('productModal');
  }
  function copyText(text){
    if(!text){toast('Sua sacola ainda está vazia.');return;}
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(()=>toast('Mensagem copiada!')).catch(()=>fallbackCopy(text));
    } else fallbackCopy(text);
  }
  function fallbackCopy(text){
    const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.focus();area.select();
    try {document.execCommand('copy');toast('Mensagem copiada!');}catch(_){toast('Não foi possível copiar automaticamente.');}finally{area.remove();}
  }
  function updateTemplate(){
    const phone = getPhone();
    document.querySelectorAll('a[data-whatsapp]').forEach(link=>{
      link.href=phone?'https://wa.me/'+phone+'?text='+encodeURIComponent('Olá! Gostaria de conhecer as peças da Malu Modas Evangélica.'):'#contato';
    });
    $('year').textContent=String(new Date().getFullYear());
    $('demoNotice').hidden=!config.demonstracao;
    if(config.sobre)$('aboutCopy').textContent=config.sobre;
    if(config.entrega)$('deliveryNote').textContent=config.entrega;
    if(config.endereco){$('storeAddress').textContent=config.endereco;$('storeAddress').hidden=false;}
    if(config.instagram){
      const insta=String(config.instagram).replace(/^@/,'').replace(/[^a-zA-Z0-9._]/g,'');
      if(insta){
        ['instagramLink','contactInstagramLink'].forEach(id=>{
          $(id).href='https://www.instagram.com/'+insta+'/';
          $(id).hidden=false;
        });
      }
    }
    renderFilters();renderProducts();renderCart();
  }
  document.addEventListener('click',(event)=>{
    const productButton=event.target.closest('[data-open-product]');
    if(productButton){renderProductModal(productButton.dataset.openProduct);return;}
    const sectorButton=event.target.closest('[data-sector]');
    if(sectorButton){activeSector=sectorButton.dataset.sector;activeCategory='Todas';$('searchInput').value='';renderFilters();renderProducts();return;}
    const catButton=event.target.closest('[data-category]');
    if(catButton){activeCategory=catButton.dataset.category;renderFilters();renderProducts();return;}
    const option=event.target.closest('[data-select]');
    if(option){
      const parent=option.parentElement;
      parent.querySelectorAll('[data-select]').forEach(b=>{b.classList.remove('selected');b.setAttribute('aria-pressed','false')});
      option.classList.add('selected');option.setAttribute('aria-pressed','true');return;
    }
    const wh=event.target.closest('[data-whatsapp]');
    if(wh){
      if(!getPhone()){event.preventDefault();WhatsApp('Olá! Gostaria de conhecer as peças da Malu Modas Evangélica.');}
      return;
    }
    const cartQty=event.target.closest('[data-cart-qty]');
    if(cartQty){
      const index=Number(cartQty.dataset.cartQty),delta=Number(cartQty.dataset.qtyDelta);
      if(!cart[index])return;
      cart[index].qty=Math.max(1,Math.min(99,cart[index].qty+delta));saveCart();return;
    }
    const removed=event.target.closest('[data-remove]');
    if(removed){cart.splice(Number(removed.dataset.remove),1);saveCart();toast('Peça removida da sacola.');return;}
  });
  $('searchInput').addEventListener('input',renderProducts);
  $('sortSelect').addEventListener('change',renderProducts);
  $('clearFilters').addEventListener('click',()=>{activeSector='Todos';activeCategory='Todas';$('searchInput').value='';renderFilters();renderProducts()});
  $('openCart').addEventListener('click',()=>openPanel('cartDrawer'));
  $('closeCart').addEventListener('click',()=>closePanel());
  $('continueShopping').addEventListener('click',()=>{closePanel();document.querySelector('#colecao').scrollIntoView({behavior:'smooth'})});
  $('closeProduct').addEventListener('click',()=>closePanel());
  $('closeNotice').addEventListener('click',()=>closePanel());
  $('noticeOk').addEventListener('click',()=>closePanel());
  $('overlay').addEventListener('click',()=>closePanel());
  $('checkoutButton').addEventListener('click',()=>{if(cart.length)WhatsApp(buildOrderText())});
  $('copyPending').addEventListener('click',()=>copyText(pendingOrderText));
  $('productModalContent').addEventListener('click',event=>{
    if(event.target.closest('#detailMinus'))$('detailQty').textContent=Math.max(1,Number($('detailQty').textContent)-1);
    if(event.target.closest('#detailPlus'))$('detailQty').textContent=Math.min(99,Number($('detailQty').textContent)+1);
  });
  $('productModalContent').addEventListener('submit',event=>{
    if(event.target.id!=='detailForm')return;
    event.preventDefault();
    const form=event.target;
    const size=form.querySelector('.size-options .selected')?.dataset.option||'A consultar';
    const color=form.querySelector('.color-options .selected')?.dataset.option||'A consultar';
    addCart(form.dataset.productId,size,color,Number($('detailQty').textContent));
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&activePanel)closePanel();
    if(event.key==='Tab'&&activePanel){
      const panel=$(activePanel);
      const nodes=[...panel.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(n=>!n.hidden&&n.offsetParent!==null);
      if(!nodes.length)return;
      const first=nodes[0],last=nodes[nodes.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
  $('openMenu').addEventListener('click',()=>{
    const menu=$('mobileNav');menu.hidden=!menu.hidden;
    $('openMenu').setAttribute('aria-expanded',String(!menu.hidden));
  });
  $('mobileNav').querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{$('mobileNav').hidden=true;$('openMenu').setAttribute('aria-expanded','false')}));
  updateTemplate();
})();
