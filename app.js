
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const dialog=$('#dialog'),toast=$('#toast');let toastTimer;

function notify(text){
  toast.textContent=text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>toast.classList.remove('show'),3000)
}

function openDialog(role=''){
  $('#dialogTitle').textContent=
    role==='buyer'?'Join as a buyer':
    role==='seller'?'Apply as a seller':
    'How would you like to join?';

  $('#dialogText').textContent=
    role==='buyer'
      ?'Buyer accounts will let you explore products, follow shops, save items and contact sellers.'
      :role==='seller'
        ?'Seller registration will collect shop details. An admin must approve you before you can publish products.'
        :'Choose an account type to continue. Registration will be connected in a later build stage.';

  dialog.showModal()
}

function filterProducts(){
  const q=$('#query').value.trim().toLowerCase(),
        loc=($('#location').value.trim()||$('#filter').value).toLowerCase();

  let count=0;

  $$('#grid article').forEach(card=>{
    const ok=
      (!q||
        card.dataset.name.toLowerCase().includes(q)||
        card.dataset.category.toLowerCase().includes(q)
      )&&
      (!loc||card.dataset.location.toLowerCase().includes(loc));

    card.hidden=!ok;
    if(ok)count++
  });

  $('#empty').hidden=count!==0;
  $('#products').scrollIntoView({behavior:'smooth'});

  if(!count)notify('No sample match yet. Try another product or location.')
}

$('#searchForm').addEventListener('submit',e=>{
  e.preventDefault();
  filterProducts()
});

$$('[data-search]').forEach(b=>b.addEventListener('click',()=>{
  $('#query').value=b.dataset.search;
  filterProducts()
}));

$$('[data-category]').forEach(b=>b.addEventListener('click',()=>{
  $('#query').value=b.dataset.category;
  filterProducts()
}));

$('#filter').addEventListener('change',()=>{
  $('#location').value=$('#filter').value;
  filterProducts()
});

$('#signin').addEventListener('click',()=>openDialog());
$('#join').addEventListener('click',()=>openDialog());
$('#sellerJoin').addEventListener('click',()=>openDialog('seller'));

$('#browse').addEventListener('click',()=>{
  window.scrollTo({top:0,behavior:'smooth'});
  $('#location').focus();
  notify('Enter any Nigerian state, city, town or market.')
});

$('#close').addEventListener('click',()=>dialog.close());

dialog.addEventListener('click',e=>{
  if(e.target===dialog)dialog.close()
});

$$('[data-role]').forEach(b=>b.addEventListener('click',()=>{
  const role=b.dataset.role;
  dialog.close();

  notify(
    role==='seller'
      ?'Seller applications are planned for the next build stage.'
      :'Buyer registration is planned for the next build stage.'
  )
}));

$$('.detail').forEach(b=>b.addEventListener('click',()=>{
  notify('Preview only. Live product details will be connected after the database is built.')
}));

$('#hamburger').addEventListener('click',()=>{
  const nav=$('#nav'),open=nav.classList.toggle('open');
  $('#hamburger').textContent=open?'×':'☰'
});

$$('#nav a').forEach(a=>a.addEventListener('click',()=>{
  $('#nav').classList.remove('open')
}));

$('#year').textContent=new Date().getFullYear();
             
