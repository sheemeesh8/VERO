/**
 * FEATURE 2 — <PhotoGuide/> (React).
 *
 * A collapsible drawer that adapts its tips and required photo slots to the
 * selected item category, and shows completed vs. missing slots.
 *
 * Props:
 *   category    one of: shoes | tops | outerwear | bags | bottoms | accessories
 *   done        array of completed slot indices, e.g. [0, 2]   (default [])
 *   filled      number — mark the first N slots done (alternative to `done`)
 *   defaultOpen open on mount (default true)
 *
 * Usage:
 *   <PhotoGuide category={selectedCategory} filled={photos.length} />
 */
import { useState } from 'react';
import { PHOTO_GUIDE, CORE_TIPS } from './photoGuideData.js';
import './PhotoGuide.css';

export default function PhotoGuide({ category = 'shoes', done, filled = 0, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const data = PHOTO_GUIDE[category] || PHOTO_GUIDE.shoes;

  const doneSet = new Set(done ?? Array.from({ length: filled }, (_, i) => i));
  const doneCount = data.slots.filter((_, i) => doneSet.has(i)).length;

  return (
    <div className="pg" dir="rtl">
      <button className="pg-head" type="button" onClick={() => setOpen(o => !o)}>
        <span className="pg-ic">📸</span>
        <span className="pg-tt">
          <b>מדריך צילום — {data.title}</b>
          <span>איך לצלם את הפריט הזה נכון</span>
        </span>
        <span className="pg-count">{doneCount}/{data.slots.length}</span>
        <span className={`pg-chev${open ? ' up' : ''}`} aria-hidden>⌄</span>
      </button>

      {open && (
        <div className="pg-pad">
          <div className="pg-hero">
            <b>זווית שער:</b> {data.heroAngle}
            <span className="pg-tip">💡 {data.tip}</span>
          </div>

          <div className="pg-core">
            {CORE_TIPS.map((t) => (
              <div className="pg-c" key={t.title}>
                <span className="pg-g">{t.icon}</span>
                <b>{t.title}</b>
                <span>{t.text}</span>
              </div>
            ))}
          </div>

          <div className="pg-slots-h">תמונות נדרשות</div>
          <div className="pg-slots">
            {data.slots.map((label, i) => (
              <div className={`pg-slot${doneSet.has(i) ? ' done' : ''}`} key={label}>
                <span className="pg-dot">{doneSet.has(i) ? '✓' : ''}</span>
                <span className="pg-lbl">{label}</span>
                <span className="pg-num">{String(i + 1).padStart(2, '0')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
