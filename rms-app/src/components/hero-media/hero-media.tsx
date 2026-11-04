import { useEffect,useState } from 'react';
import { ArrowUpRight,Pause,Play } from 'lucide-react';
import { siteContent } from '../../content/content';
import { Link } from '../../routing/link';
import './hero-media.styles.css';
export function HeroMedia(){const {slides,interval,caption}=siteContent.hero;const [index,setIndex]=useState(0);const [paused,setPaused]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);const [hovering,setHovering]=useState(false);
 useEffect(()=>{if(paused||hovering||slides.length<2)return;const timer=setInterval(()=>setIndex(i=>(i+1)%slides.length),interval*1000);return()=>clearInterval(timer);},[paused,hovering,slides.length,interval]);
 const slide=slides[index]||slides[0];
 return <div className="hero-image managed-hero" onMouseEnter={()=>setHovering(true)} onMouseLeave={()=>setHovering(false)} onFocusCapture={()=>setHovering(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setHovering(false);}}><Link to="/collection" className="hero-media-link">{slide.type==='video'?<video key={slide.id} src={slide.src} muted loop playsInline autoPlay={!paused} preload="metadata" aria-label={slide.alt} ref={video=>{if(video){if(paused)video.pause();else void video.play().catch(()=>{});}}}/>:<img key={slide.id} src={slide.src} alt={slide.alt} fetchPriority="high"/>}<div className="hero-image-caption"><span>{caption}</span><ArrowUpRight size={22}/></div></Link><span className="image-index">{String(index+1).padStart(2,'0')} / {String(slides.length).padStart(2,'0')}</span>{(slides.length>1||slide.type==='video')&&<div className="hero-media-controls">{slides.map((s,i)=><button key={s.id} className={i===index?'active':''} onClick={()=>setIndex(i)} aria-label={`Show hero slide ${i+1}`} aria-pressed={i===index}/>) }<button className="hero-pause" aria-label={paused?'Resume hero rotation':'Pause hero rotation'} onClick={()=>setPaused(p=>!p)}>{paused?<Play size={13}/>:<Pause size={13}/>}</button></div>}</div>;
}
