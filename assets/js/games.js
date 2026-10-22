(function () {
"use strict";
const dishes = [
  {id:'fufu',name:'Fufu',region:'ガーナなど',ingredients:'キャッサバ、プランテンなど',detail:'素材を加熱して搗き、滑らかな生地状にするものなど、地域差がある。',image:'assets/img/food/fufu.jpg'},
  {id:'foutou',name:'Foutou',region:'コートジボワールなど',ingredients:'プランテン、キャッサバなど',detail:'素材を加熱して搗き、まとまりのある生地状に仕上げる。',image:'assets/img/food/foutou.jpg'},
  {id:'akpu',name:'Akpu',region:'ナイジェリア南東部など',ingredients:'発酵キャッサバ',detail:'発酵・加工したキャッサバから作るフフの一種。',image:'assets/img/food/akpu.jpg'},
  {id:'yam',name:'Pounded Yam',region:'ナイジェリアなど',ingredients:'ヤム',detail:'ゆでたヤムを搗き、伸びのある滑らかな生地にする。',image:'assets/img/food/pounded-yam.jpg'},
  {id:'ugali',name:'Ugali',region:'ケニア、タンザニアなど',ingredients:'主にトウモロコシ粉',detail:'穀粉を湯で練った厚い粥・生地状の主食。フフそのものではなく、近縁・類似料理として扱う。',image:'assets/img/food/ugali.jpg'},
  {id:'nsima',name:'Nsima',region:'マラウイ',ingredients:'主にトウモロコシ粉',detail:'穀粉を湯で練った主食。形や食べ方に共通点があるが、固有の文化的文脈を持つ。',image:'assets/img/food/nsima.jpg'},

];

// Memory game images are deliberately not unique to each dish. The same image
// can be displayed for different card identities, by design.
const memoryPhotos = {
  fufu: 'assets/img/food/fufu.jpg', ugali: 'assets/img/food/fufu.jpg',
  foutou: 'assets/img/food/foutou.jpg', akpu: 'assets/img/food/foutou.jpg',
  yam: 'assets/img/food/ugali.jpg', nsima: 'assets/img/food/ugali.jpg'
};
const $ = id => document.getElementById(id);
const shuffle = items => { const a = items.slice(); for(let i = a.length-1; i>0; i--){const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; };
const show = (node,message) => { node.textContent = message; };
const memoryBoard = $('memory-board');
let memory = null;
let roundToken = 0;
let memoryTimer = null;
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2,'0')}:${String(rest).padStart(2,'0')}`;
}
function updateMemoryTime() {
  if (!memory) return;
  show($('memory-time'),formatTime(Math.floor((Date.now() - memory.startedAt) / 1000)));
}
function setMemoryStatus(message) { show($('memory-status'),message); }
function makeMemoryCard(item,index) {
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'memory-card'; btn.dataset.index = String(index);
  btn.setAttribute('aria-label',`カード${index+1}、裏向き`);
  const back = document.createElement('span'); back.className = 'memory-card__back'; back.setAttribute('aria-hidden','true'); back.textContent = 'フフ';
  const front = document.createElement('span'); front.className = 'memory-card__front'; front.setAttribute('aria-hidden','true');
  const img = document.createElement('img'); img.src=memoryPhotos[item.id]; img.alt=''; img.loading='lazy';
  const caption = document.createElement('small'); caption.textContent=item.name;
  front.append(img,caption); btn.append(back,front);
  btn.addEventListener('click',()=>reveal(index));
  return btn;
}
function startMemory() {
  roundToken += 1;
  if (memoryTimer) window.clearInterval(memoryTimer);
  memory = {cards:shuffle(dishes.flatMap(item => [item,item])), flipped:[], matched:new Set(), tries:0, locked:false, token:roundToken, startedAt:Date.now()};
  memoryBoard.replaceChildren(...memory.cards.map(makeMemoryCard));
  updateMemoryCounters();
  updateMemoryTime();
  memoryTimer = window.setInterval(updateMemoryTime,1000);
  setMemoryStatus('12枚のカードから、同じ料理を6組揃えてください。');
}
function updateMemoryCounters() {
  show($('memory-pairs'),String(memory.matched.size/2));
  show($('memory-tries'),String(memory.tries));
}
function reveal(index){
  if(!memory || memory.locked || memory.matched.has(index) || memory.flipped.includes(index))return;
  const b=memoryBoard.children[index]; const item=memory.cards[index];
  b.classList.add('is-open'); b.setAttribute('aria-label',`カード${index+1}、表向き。判定待ち`);
  memory.flipped.push(index);
  if(memory.flipped.length < 2) return;
  memory.tries++; updateMemoryCounters();
  const [a,z]=memory.flipped;
  [a,z].forEach(n=>{memoryBoard.children[n].classList.add('is-revealed');memoryBoard.children[n].setAttribute('aria-label',`カード${n+1}、${memory.cards[n].name}`);});
  if(memory.cards[a].id === memory.cards[z].id){
    memory.matched.add(a); memory.matched.add(z);updateMemoryCounters();
    memoryBoard.children[a].classList.add('is-matched'); memoryBoard.children[z].classList.add('is-matched');
    memory.flipped = [];
    if(memory.matched.size===memory.cards.length){
      if (memoryTimer) window.clearInterval(memoryTimer);
      updateMemoryTime();
      setMemoryStatus(`合格。全6組を${memory.tries}回、${$('memory-time').textContent}で揃えました。`);
    }else setMemoryStatus(`一致：${item.name}と${item.name}でした。`);
  }else{
    memory.locked=true;
    setMemoryStatus(`不一致。${memory.cards[a].name}と${memory.cards[z].name}でした。`);
    const token=memory.token;
    window.setTimeout(()=>{
      if(!memory || memory.token!==token) return;
      [a,z].forEach(n=>{const el=memoryBoard.children[n];el.classList.remove('is-open','is-revealed');el.setAttribute('aria-label',`カード${n+1}、裏向き`);});
      memory.flipped=[];memory.locked=false;
      // Keep the result visible until the next choice.
    },1500);
  }
}
$('memory-reset').addEventListener('click',startMemory);

let quiz=null;
function beginQuiz(){
  quiz={questions:shuffle(dishes),index:0,score:0,answered:false};
  $('quiz-restart').hidden=true;
  $('quiz-next').hidden=true;
  drawQuestion();
}
function drawQuestion(){
  if(quiz.index >= quiz.questions.length){
    const total = quiz.score;
    $('quiz-visual').hidden=true; $('quiz-options').replaceChildren();
    $('quiz-next').hidden=true; $('quiz-restart').hidden=false;
    show($('quiz-progress'),'全問終了');show($('quiz-score'),String(total));
    show($('quiz-feedback'),`試験終了。12点満点中 ${total}点。似た料理の文化的な違いも「世界のフフ」で確認できます。`);
    return;
  }
  const q=quiz.questions[quiz.index]; quiz.answered=false;
  $('quiz-visual').hidden=false; $('quiz-next').hidden=true;
  show($('quiz-progress'),`第${quiz.index+1}問／全${quiz.questions.length}問`);
  show($('quiz-score'),String(quiz.score));
  $('quiz-image').src=q.image; $('quiz-image').alt='出題中のでんぷん質の料理のAI生成イメージ。名称は選択肢から回答してください。';
  show($('quiz-feedback'),'料理の名称を選んでください。');
  let options=shuffle([q,...shuffle(dishes.filter(other=>other.id!==q.id)).slice(0,3)]);
  const buttons=options.map(d=>{
    const btn=document.createElement('button');btn.type='button';btn.className='quiz-choice';btn.textContent=d.name;
    btn.addEventListener('click',()=>answerQuiz(d.id,btn));return btn;
  });
  $('quiz-options').replaceChildren(...buttons);
}
function answerQuiz(id,button){
  if(!quiz || quiz.answered)return;
  quiz.answered=true;const q=quiz.questions[quiz.index];const correct=id===q.id;
  if(correct)quiz.score += 2;
  show($('quiz-score'),String(quiz.score));
  for(const b of $('quiz-options').children){
    b.disabled=true;
    if(b.textContent===q.name)b.classList.add('is-correct');
    else if(b===button)b.classList.add('is-incorrect');
  }
  show($('quiz-feedback'), `${correct?'正解です。':'不正解です。'} 正答：${q.name}。主な地域：${q.region}。原材料：${q.ingredients}。${q.detail}`);
  $('quiz-next').hidden=false;
  $('quiz-next').textContent = quiz.index+1 === quiz.questions.length ? '成績を確認する ▶' : '次の問題へ ▶';
}
$('quiz-next').addEventListener('click',()=>{ if(!quiz || !quiz.answered)return; quiz.index++;drawQuestion(); });
$('quiz-restart').addEventListener('click',beginQuiz);
startMemory();beginQuiz();
window.FufuGamesTest = {
  getMemoryState: () => memory && ({tries:memory.tries,pairs:memory.matched.size/2,elapsed:$('memory-time').textContent}),
  getQuizState: () => quiz && ({index:quiz.index,score:quiz.score,answered:quiz.answered})
};
})();
