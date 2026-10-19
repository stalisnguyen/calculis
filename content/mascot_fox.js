/* ================= MASCOT: Max the fox =================
   foxSVG(state, size, rank). state: calm | hi | idea | yay | ok | hmm | zzz ; rank 0..7 (Intern -> CEO) adds work gear. */
const FX={fur:'#E8692A',dark:'#B9481A',white:'#FFF6EC',ear:'#5A2A20',eye:'#21151F',nose:'#21151F',plum:'#5A1F4E',plum2:'#7A2D6B',gold:'#E0A72E',paper:'#FFFDF6'};
function foxAcc(r){
  let s='';
  if(r<=1)s+=`<path d="M84 112q16 18 32 0" stroke="${FX.plum2}" stroke-width="3" fill="none"/><rect x="92" y="128" width="16" height="20" rx="3" fill="${FX.paper}" stroke="${FX.plum}" stroke-width="2"/><rect x="95" y="132" width="10" height="3" fill="${FX.gold}"/>`; // lanyard badge
  if(r>=3)s+=`<path d="M64 140c4-18 18-28 36-28s32 10 36 28c4 22-6 40-36 40s-40-18-36-40z" fill="${FX.plum}"/><path d="M100 114l-14 34 14 22 14-22z" fill="${FX.white}"/><path d="M86 118l14 30M114 118l-14 30" stroke="${FX.plum2}" stroke-width="3"/>`; // blazer
  if(r>=2)s+=`<path d="M95 116h10l-2 6 5 30-8 8-8-8 5-30z" fill="${FX.gold}" stroke="${FX.dark}" stroke-width="1"/>`; // tie
  if(r>=1)s+=`<g fill="none" stroke="${FX.plum}" stroke-width="3.5"><circle cx="82" cy="80" r="11"/><circle cx="118" cy="80" r="11"/><path d="M93 80h14"/></g>`; // glasses
  if(r>=4)s+=`<g transform="translate(146 146)"><rect x="0" y="8" width="38" height="28" rx="4" fill="${FX.dark}"/><path d="M12 8V3h14v5" stroke="${FX.dark}" stroke-width="3" fill="none"/><rect x="0" y="18" width="38" height="3" fill="${FX.gold}"/></g>`; // briefcase
  if(r>=5)s+=`<path d="M118 130l10-4 2 8-10 3z" fill="${FX.white}"/><circle cx="84" cy="132" r="3.5" fill="${FX.gold}"/>`; // pocket square + pin
  if(r>=6)s+=`<path d="M150 98l8 4-4 8 9 1-6 7 7 5-9 1 1 9-8-4" fill="none"/>`;
  if(r>=7)s+=`<g><rect x="72" y="14" width="56" height="26" rx="3" fill="${FX.eye}"/><rect x="62" y="38" width="76" height="7" rx="3" fill="${FX.eye}"/><rect x="72" y="30" width="56" height="6" fill="${FX.gold}"/></g>`; // CEO top hat
  return s;
}
function foxSVG(state,size,rank){
  state=state||'calm';size=size||120;rank=rank||0;
  const yay=state==='yay',zzz=state==='zzz';
  const eyes=zzz?`<path d="M74 82q8 6 16 0M110 82q8 6 16 0" stroke="${FX.eye}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
    :yay?`<path d="M74 84q8-10 16 0M110 84q8-10 16 0" stroke="${FX.eye}" stroke-width="4" fill="none" stroke-linecap="round"/>`
    :`<ellipse cx="82" cy="81" rx="6.5" ry="8" fill="${FX.eye}"/><ellipse cx="118" cy="81" rx="6.5" ry="8" fill="${FX.eye}"/><circle cx="84.5" cy="78" r="2.4" fill="#fff"/><circle cx="120.5" cy="78" r="2.4" fill="#fff"/>`;
  const mouth=yay?`<path d="M92 104q8 10 16 0z" fill="#7A2430"/>`:state==='hmm'?`<path d="M93 106q7-3 14 1" stroke="${FX.eye}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
    :`<path d="M100 100v4M100 104q-5 5-10 2M100 104q5 5 10 2" stroke="${FX.eye}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  const armL=yay?'M68 132c-14-8-22-22-20-36':'M68 136c-6 8-8 14-6 20';
  const armR=state==='hi'||yay?'M132 132c14-8 22-22 20-36':state==='hmm'?'M132 128c12-14 6-34-10-42':state==='ok'?'M132 134c10-2 16-8 16-16':'M132 136c6 8 8 14 6 20';
  const extra=state==='idea'?`<g transform="translate(150 12)"><circle cx="14" cy="16" r="12" fill="${FX.gold}"/><rect x="9" y="26" width="10" height="8" rx="2" fill="#9AA3A0"/></g>`
    :zzz?`<g font-family="sans-serif" font-weight="800" fill="${FX.plum}"><text x="144" y="46" font-size="18">z</text><text x="158" y="32" font-size="13">z</text></g>`
    :yay?`<circle cx="30" cy="46" r="4" fill="${FX.gold}"/><rect x="160" y="34" width="8" height="5" fill="${FX.plum2}" transform="rotate(30 164 36)"/><circle cx="170" cy="76" r="3.5" fill="#2C5FC4"/>`:'';
  return `<svg class="mascot fox-${state}" viewBox="0 0 200 200" width="${size}" height="${size}" role="img" aria-label="Max the fox">
  <path d="M132 172c34 4 54-14 48-42-4-18-20-26-30-20 14 8 12 32-8 40z" fill="${FX.fur}"/><path d="M168 118c8 4 14 14 12 26-8-2-16-10-18-22z" fill="${FX.white}"/>
  <ellipse cx="100" cy="190" rx="46" ry="6" fill="#000" opacity=".08"/>
  <ellipse cx="82" cy="184" rx="13" ry="8" fill="${FX.ear}"/><ellipse cx="118" cy="184" rx="13" ry="8" fill="${FX.ear}"/>
  <path d="M62 150c0-28 17-40 38-40s38 12 38 40c0 24-15 36-38 36s-38-12-38-36z" fill="${FX.fur}"/>
  <path d="M82 152c0-16 8-26 18-26s18 10 18 26-8 26-18 26-18-10-18-26z" fill="${FX.white}"/>
  <path d="${armL}" stroke="${FX.fur}" stroke-width="13" fill="none" stroke-linecap="round"/><path d="${armR}" stroke="${FX.fur}" stroke-width="13" fill="none" stroke-linecap="round"/>
  <path d="M54 64l-6-46 38 26z" fill="${FX.fur}"/><path d="M146 64l6-46-38 26z" fill="${FX.fur}"/>
  <path d="M56 50l-3-24 18 14z" fill="${FX.ear}"/><path d="M144 50l3-24-18 14z" fill="${FX.ear}"/>
  <path d="M50 78c0-26 22-44 50-44s50 18 50 44c0 10-4 18-10 24-10 12-24 18-40 18s-30-6-40-18c-6-6-10-14-10-24z" fill="${FX.fur}"/>
  <path d="M52 86c10 4 24 6 34 14 6 5 10 10 14 18 4-8 8-13 14-18 10-8 24-10 34-14-2 10-8 18-16 24-10 9-20 12-32 12s-22-3-32-12c-8-6-14-14-16-24z" fill="${FX.white}"/>
  <path d="M94 96h12l-6 6z" fill="${FX.nose}"/>
  ${eyes}${mouth}${foxAcc(rank)}${extra}</svg>`;
}
