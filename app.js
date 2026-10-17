(function(){
"use strict";
var app=document.getElementById("app"),crumbs=document.getElementById("crumbs"),backBtn=document.getElementById("backBtn"),homeBtn=document.getElementById("homeBtn");
var DATA=null,query="";
function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}
function mmss(s){s=Math.round(s);return Math.floor(s/60)+":"+("0"+(s%60)).slice(-2)}
var MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function ym(s){var p=s.split("-");return MONTHS[+p[1]-1]+" "+p[0]}
function parts(){return location.hash.replace(/^#\/?/,"").split("/").filter(Boolean).map(decodeURIComponent)}
function go(path){history.pushState(null,"","#"+path.join("/"));render()}
function mapBy(id){return DATA.maps.filter(function(m){return m.id===id})[0]}
function sideName(s){return s==="attack"?"Attacking":"Defending"}

function crumb(items){
  crumbs.textContent="";
  items.forEach(function(it,i){
    if(i)crumbs.appendChild(el("span","sep","›"));
    if(it.path){var a=el("a",null,it.label);a.href="#"+it.path.join("/");a.addEventListener("click",function(ev){ev.preventDefault();go(it.path)});crumbs.appendChild(a)}
    else crumbs.appendChild(el("span","cur",it.label));
  });
}
function card(tag,title,sub,cls,href){
  var c=el(tag,"card"+(cls?" "+cls:""));
  if(tag==="a")c.href=href;else c.type="button";
  c.appendChild(el("span","t",title));
  if(sub)c.appendChild(el("span","s",sub));
  return c;
}
function linkTo(c,path){c.addEventListener("click",function(ev){ev.preventDefault();go(path)});if(c.tagName==="A")c.href="#"+path.join("/")}

function screenMaps(){
  document.title="R6 Strategies";
  crumb([{label:"Maps"}]);
  var h=el("h1",null,"Pick a map");app.appendChild(h);
  app.appendChild(el("p","dim","Then Attacking or Defending, then the bomb site."));
  var m=DATA.meta,d=document.createElement("details");d.className="note";d.open=false;
  var sm=el("summary",null,"Ranked pool: "+m.season.split(" · ")[0]+" (checked "+fmtDate(m.checked)+")");
  d.appendChild(sm);d.appendChild(el("p",null,m.poolNote));d.appendChild(el("p",null,m.videoNote));app.appendChild(d);
  var s=document.createElement("input");s.type="search";s.placeholder="Search maps…";s.setAttribute("aria-label","Search maps");s.value=query;s.autocomplete="off";app.appendChild(s);
  var box=el("div");app.appendChild(box);
  function draw(){
    box.textContent="";var q=query.trim().toLowerCase();
    [["pro","Pro maps"],["additional","Other ranked maps"]].forEach(function(g){
      var ms=DATA.maps.filter(function(x){return x.pool===g[0]&&(!q||x.name.toLowerCase().indexOf(q)>-1)});
      if(!ms.length)return;
      box.appendChild(el("h2",null,g[1]));
      var grid=el("div","grid");
      ms.forEach(function(x){
        var c=card("a",x.name,x.sites.length+" sites · "+x.strategies.length+" plays",g[0]==="pro"?"pro":"","#"+x.id);linkTo(c,[x.id]);grid.appendChild(c)});
      box.appendChild(grid);
    });
    if(!box.firstChild)box.appendChild(el("div","empty","No map matches “"+query+"”."));
  }
  s.addEventListener("input",function(){query=s.value;draw()});
  draw();
}
function fmtDate(iso){var p=iso.split("-");return MONTHS[+p[1]-1]+" "+(+p[2])+", "+p[0]}

function screenSide(map){
  document.title=map.name+" · R6 Strategies";
  crumb([{label:"Maps",path:[]},{label:map.name}]);
  app.appendChild(el("h1",null,map.name));
  app.appendChild(el("p","dim","Which side are you on?"));
  var list=el("div","list");
  ["attack","defense"].forEach(function(side){
    var n=map.strategies.filter(function(s){return s.side===side}).length;
    var c=card("a",sideName(side),n+" plays","big "+(side==="attack"?"atk":"def"),"#"+map.id+"/"+side);
    c.querySelector(".s").className="s";
    linkTo(c,[map.id,side]);list.appendChild(c);
  });
  app.appendChild(list);
}
function screenSites(map,side){
  document.title=map.name+" "+sideName(side)+" · R6 Strategies";
  crumb([{label:"Maps",path:[]},{label:map.name,path:[map.id]},{label:sideName(side)}]);
  app.appendChild(el("h1",null,map.name+": "+sideName(side).toLowerCase()));
  app.appendChild(el("p","dim","Which bomb site? Each site is two rooms (the bomb is in one of them)."));
  var list=el("div","list");
  map.sites.forEach(function(st){
    var n=map.strategies.filter(function(s){return s.side===side&&s.site===st.id}).length;
    var c=card("a",(st.floor?st.floor+" ":"")+st.name,n?n+" plays":"More coming",null,"#");
    if(!n)c.querySelector(".s").classList.add("more");
    if(st.note)c.querySelector(".s").textContent+=" · "+st.note;
    linkTo(c,[map.id,side,st.id]);list.appendChild(c);
  });
  app.appendChild(list);
}
var filt="all",active=null;
var CPTAGS=["Crazy Peak","Flashy","Advanced","Crazy play"];
function isCP(s){return s.tags.some(function(t){return CPTAGS.indexOf(t)>-1})}
function slug(t){return t.toLowerCase().replace(/[^a-z]+/g,"-")}
function restore(box){
  if(!box||!box._thumb)return;
  box.textContent="";box.appendChild(box._thumb);box._playing=false;
}
function embed(box,v,title){
  if(active&&active!==box)restore(active);
  active=box;box._playing=true;
  var q="?autoplay=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&fs=1&enablejsapi=1&start="+v.start+(v.end?"&end="+v.end:"")+"&origin="+encodeURIComponent(location.origin);
  var f=document.createElement("iframe");
  f.src="https://www.youtube-nocookie.com/embed/"+v.id+q;
  f.title=v.videoTitle||title;f.allow="autoplay; encrypted-media; picture-in-picture; fullscreen";f.allowFullscreen=true;
  f.referrerPolicy="strict-origin-when-cross-origin";
  /* sandbox without allow-popups: nothing inside the player can open a new tab or window */
  f.setAttribute("sandbox","allow-scripts allow-same-origin allow-presentation");
  f.setAttribute("data-vid",v.id);
  f.addEventListener("load",function(){try{f.contentWindow.postMessage(JSON.stringify({event:"listening",id:v.id}),"https://www.youtube-nocookie.com")}catch(e){}});
  box.textContent="";box.appendChild(f);box._frame=f;
}
window.addEventListener("message",function(ev){
  if(ev.origin!=="https://www.youtube-nocookie.com")return;
  var m;try{m=typeof ev.data==="string"?JSON.parse(ev.data):ev.data}catch(e){return}
  if(!m)return;
  window.__ytEvents=window.__ytEvents||[];window.__ytEvents.push(m.event+":"+JSON.stringify(m.info&&m.info.playerState!==undefined?m.info.playerState:(m.info&&m.info.error)||""));
  if(m.event==="onError"&&active){
    var b=active;b.textContent="";
    var n=el("div","noembed","No in-app video for this one yet.");b.appendChild(n);
  }
});
function stratCard(s){
  var c=el("article","strat"+(isCP(s)?" cp":""));
  var v=s.video,box=el("div","vid");
  var h=el("h3",null);var tb=el("button","ttl",s.title);tb.type="button";h.appendChild(tb);c.appendChild(h);
  var tags=el("div","tags");s.tags.forEach(function(t){tags.appendChild(el("span","tag t-"+slug(t),t))});c.appendChild(tags);
  c.appendChild(el("p",null,s.summary));
  var thumb=document.createDocumentFragment();
  var img=document.createElement("img");img.loading="lazy";img.alt="";img.src="https://i.ytimg.com/vi/"+v.id+"/hqdefault.jpg";
  var pb=el("button","play");pb.type="button";pb.setAttribute("aria-label","Play video in the app: "+s.title);pb.appendChild(el("span",null,"▶"));
  var tw=el("div","tw");tw.appendChild(img);tw.appendChild(pb);
  box._thumb=tw;box.appendChild(tw);
  function play(){if(!box._playing)embed(box,v,s.title)}
  pb.addEventListener("click",play);tb.addEventListener("click",play);
  c.appendChild(box);
  var yr=+v.uploaded.slice(0,4);
  var meta=v.creator+" · "+ym(v.uploaded)+" · "+mmss(v.seconds)+(v.seconds>420?" (long)":"")+(yr&&yr<=2023?" · older video, map may have changed":"");
  c.appendChild(el("p","meta",meta));
  return c;
}
function screenStrats(map,side,st){
  document.title=st.name+" · R6 Strategies";
  active=null;
  crumb([{label:"Maps",path:[]},{label:map.name,path:[map.id]},{label:sideName(side),path:[map.id,side]},{label:st.name}]);
  app.appendChild(el("h1",null,(st.floor?st.floor+" ":"")+st.name));
  app.appendChild(el("p","dim",map.name+" · "+sideName(side)));
  var all=map.strategies.filter(function(s){return s.side===side&&s.site===st.id});
  if(!all.length){app.appendChild(el("div","empty","No strategies for this site yet. More coming."));return}
  var nd=all.filter(function(s){return s.tags.indexOf("Default")>-1}).length,nc=all.filter(isCP).length;
  var chips=el("div","chips");chips.setAttribute("role","group");chips.setAttribute("aria-label","Filter strategies");
  var defs=[["all","All",all.length],["default","Default",nd],["cp","Crazy Peak",nc]];
  var listBox=el("div");
  function draw(){
    listBox.textContent="";active=null;
    var l=all.filter(function(s){return filt==="all"||(filt==="default"&&s.tags.indexOf("Default")>-1)||(filt==="cp"&&isCP(s))});
    if(!l.length)listBox.appendChild(el("div","empty",filt==="cp"?"No Crazy Peak plays for this site yet.":"No Default plays for this site yet."));
    l.forEach(function(s){listBox.appendChild(stratCard(s))});
    if(l.length&&l.length<4&&filt==="all")listBox.appendChild(el("div","empty","More strategies coming for this site."));
    [].forEach.call(chips.children,function(b){b.setAttribute("aria-pressed",String(b.dataset.f===filt))});
  }
  defs.forEach(function(d){
    var b=el("button","chip",d[1]+" ("+d[2]+")");b.type="button";b.dataset.f=d[0];
    b.addEventListener("click",function(){filt=d[0];draw()});chips.appendChild(b);
  });
  app.appendChild(chips);app.appendChild(listBox);draw();
}
function render(){
  if(!DATA)return;
  app.textContent="";var p=parts(),map=p[0]&&mapBy(p[0]);
  if(!map){screenMaps()}
  else if(!p[1]||(p[1]!=="attack"&&p[1]!=="defense"))screenSide(map);
  else{
    var st=p[2]&&map.sites.filter(function(x){return x.id===p[2]})[0];
    if(!st)screenSites(map,p[1]);else screenStrats(map,p[1],st);
  }
  var depth=map?(p[1]==="attack"||p[1]==="defense"?(p[2]?3:2):1):0;
  backBtn.disabled=depth===0;
  window.scrollTo(0,0);
}
backBtn.addEventListener("click",function(){
  var p=parts();if(!p.length)return;
  if(history.state&&history.state.seeded!==undefined||window.__pushed)history.back();else{history.replaceState(null,"","#"+p.slice(0,-1).join("/"));render()}
});
homeBtn.addEventListener("click",function(){query="";if(parts().length)go([]);else{render()}});
var origPush=history.pushState;history.pushState=function(){window.__pushed=true;return origPush.apply(this,arguments)};
window.addEventListener("popstate",render);
window.addEventListener("hashchange",render);
fetch("data.json",{cache:"no-cache"}).then(function(r){return r.json()}).then(function(d){
  DATA=d;
  var p=parts();
  if(p.length>1){history.replaceState(null,"","#");for(var i=1;i<=p.length;i++)origPush.call(history,null,"","#"+p.slice(0,i).join("/"));window.__pushed=true}
  render();
}).catch(function(e){app.textContent="";app.appendChild(el("div","empty","Could not load data.json. Check your connection and reload."))});
if("serviceWorker" in navigator&&location.protocol.indexOf("http")===0){navigator.serviceWorker.register("sw.js").catch(function(){})}
})();
