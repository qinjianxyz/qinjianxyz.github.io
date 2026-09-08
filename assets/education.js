(() => {
  window.rayLanguage = () => 'bilingual';
  window.rayPair = (tag, en, zh, cls) => {
    const node=document.createElement(tag);if(cls)node.className=cls;
    for(const [lang,text,name] of [['zh-CN',zh,'copy-zh'],['en',en,'copy-en']]){const span=document.createElement('span');span.lang=lang;span.className=name;span.textContent=text;node.append(span);}return node;
  };
  function revealProject(){
    const id=new URLSearchParams(location.search).get('project') || decodeURIComponent(location.hash.slice(1));
    const target=document.getElementById(id==='blockchain'?'token':id);
    if(target?.tagName==='DETAILS'){target.open=true;target.scrollIntoView({block:'start'});}
  }
  window.addEventListener('hashchange',revealProject);
  revealProject();
  document.querySelector('#print-poster')?.addEventListener('click',()=>window.print());
})();
