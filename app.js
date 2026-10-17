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
function embed(box,v){
  var q="?autoplay=1&rel=0&modestbranding=1&playsinline=1&start="+v.start+(v.end?"&end="+v.end:"");
  var f=document.createElement("iframe");
  f.src="https://www.youtube-nocookie.com/embed/"+v.id+q;
  f.title=v.videoTitle;f.allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen";f.allowFullscreen=true;f.referrerPolicy="strict-origin-when-cross-origin";
  box.textContent="";box.appendChild(f);
}
function screenStrats(map,side,st){
  document.title=st.name+" · R6 Strategies";
  crumb([{label:"Maps",path:[]},{label:map.name,path:[map.id]},{label:sideName(side),path:[map.id,side]},{label:st.name}]);
  app.appendChild(el("h1",null,(st.floor?st.floor+" ":"")+st.name));
  app.appendChild(el("p","dim",map.name+" · "+sideName(side)));
  var list=map.strategies.filter(function(s){return s.side===side&&s.site===st.id});
  if(!list.length)app.appendChild(el("div","empty","Strategies for this site are coming soon."));
  list.forEach(function(s){
    var c=el("article","strat");
    c.appendChild(el("h3",null,s.title));
    var tags=el("div","tags");s.tags.forEach(function(t){tags.appendChild(el("span","tag "+t.split(" ")[0],t))});c.appendChild(tags);
    c.appendChild(el("p",null,s.summary));
    var v=s.video,box=el("div","vid");
    var img=document.createElement("img");img.loading="lazy";img.alt="";img.src="https://i.ytimg.com/vi/"+v.id+"/hqdefault.jpg";box.appendChild(img);
    var pb=el("button","play");pb.type="button";pb.setAttribute("aria-label","Play video: "+s.title);pb.appendChild(el("span",null,"▶"));
    pb.addEventListener("click",function(){embed(box,v)});box.appendChild(pb);c.appendChild(box);
    c.appendChild(el("p","meta",v.creator+" · "+ym(v.uploaded)+" · "+(v.note.indexOf("Full")===0?"full video, ":"clip ")+mmss(v.seconds)+(v.note.indexOf("Long")===0?" (long)":"")));
    var a=el("a","yt","Open on YouTube ↗");a.href="https://www.youtube.com/watch?v="+v.id+(v.start?"&t="+v.start+"s":"");a.target="_blank";a.rel="noopener noreferrer";c.appendChild(a);
    list.length&&app.appendChild(c);
  });
  if(list.length&&list.length<4)app.appendChild(el("div","empty","More strategies coming for this site."));
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
