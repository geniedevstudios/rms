import './journal.styles.css';
import { JournalCard } from '../../components/journal-card/journal-card';
import { Link } from '../../routing/link';
import { ArrowLeft,ArrowRight } from 'lucide-react';
import { siteContent } from '../../content/content';
export function Journal({pathname}:{pathname:string}){
 const stories=siteContent.journals.filter(j=>j.status==='published');
 if(pathname==='/journal')return <section className="section"><div className="page-intro"><span className="eyebrow">NOTES FROM OUR WORLD</span><h1>The RMS journal</h1><p>Ideas, perspectives and the art of getting dressed.</p></div><div className="journal-grid">{stories.map(j=><JournalCard key={j.id} title={j.title} label={j.label} image={j.image} hover={j.hover} to={`/journal/${j.id}`}/>)}</div>{!stories.length&&<p>Our next story is taking shape. Come back soon.</p>}</section>;
 const story=stories.find(j=>pathname===`/journal/${j.id}`);
 if(!story)return <section className="empty-page"><h1>This story is still being written.</h1><Link to="/journal" className="text-link">Return to the journal <ArrowRight size={15}/></Link></section>;
 return <article className="journal-article"><div className="page-intro"><Link to="/journal" className="text-link"><ArrowLeft size={14}/> The journal</Link><span className="eyebrow">{story.label} / {String(story.readMinutes).padStart(2,'0')} MIN READ</span><h1>{story.title}</h1><p>{story.excerpt}</p></div><img className="article-cover" src={story.image} alt={story.alt}/><div className="article-body">{story.body.split(/\n\s*\n/).map((paragraph,index)=>paragraph.startsWith('## ')?<h2 key={index}>{paragraph.slice(3)}</h2>:<p className={index===0?'article-lead':undefined} key={index}>{paragraph}</p>)}<Link to="/collection" className="text-link">Explore the edit <ArrowRight size={15}/></Link></div></article>;
}
