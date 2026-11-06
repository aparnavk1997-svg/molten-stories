import { useEffect, useId, useRef, useState } from 'react';
import { DEFAULT_FIT, PHOTO_RATIO, drawFit, loadImage, renderFit } from '../utils/imageFit';

const PREVIEW_W = 288;
const PREVIEW_H = Math.round((PREVIEW_W * PHOTO_RATIO.h) / PHOTO_RATIO.w);

/** Modal for fitting a photo into the product photo ratio: fill or fit, zoom, and position. */
export default function ImageFitDialog({ src, onApply, onCancel }) {
  const ref = useRef(null);
  const canvasRef = useRef(null);
  const titleId = useId();
  const [img, setImg] = useState(null);
  const [error, setError] = useState('');
  const [opts, setOpts] = useState(DEFAULT_FIT);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog.open) dialog.showModal();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    let live = true;
    loadImage(src)
      .then((i) => live && setImg(i))
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [src]);

  useEffect(() => {
    if (img) drawFit(canvasRef.current.getContext('2d'), img, PREVIEW_W, PREVIEW_H, opts);
  }, [img, opts]);

  const set = (key) => (e) => setOpts((o) => ({ ...o, [key]: key === 'bg' ? e.target.value : Number(e.target.value) }));
  const setMode = (mode) => setOpts((o) => ({ ...o, mode, zoom: 1, x: 0.5, y: 0.5 }));

  return (
    <dialog
      ref={ref}
      className="fit-dialog"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClick={(e) => e.target === ref.current && onCancel()}
    >
      <h2 id={titleId} className="confirm-title">Fit photo to frame</h2>
      <p className="muted small fit-note">
        All product photos are shown at {PHOTO_RATIO.w}:{PHOTO_RATIO.h}. Choose how this one fills the frame.
      </p>

      <div className="fit-body">
        <canvas
          ref={canvasRef}
          className="fit-canvas"
          width={PREVIEW_W}
          height={PREVIEW_H}
          role="img"
          aria-label="Preview of the photo in the product frame"
        />

        <div className="fit-controls">
          <div className="fit-modes" role="group" aria-label="Fit mode">
            <button
              type="button"
              className={`chip ${opts.mode === 'fill' ? 'active' : ''}`}
              aria-pressed={opts.mode === 'fill'}
              onClick={() => setMode('fill')}
            >
              Fill frame
            </button>
            <button
              type="button"
              className={`chip ${opts.mode === 'fit' ? 'active' : ''}`}
              aria-pressed={opts.mode === 'fit'}
              onClick={() => setMode('fit')}
            >
              Fit whole photo
            </button>
          </div>
          <p className="muted small">
            {opts.mode === 'fill'
              ? 'The photo covers the frame; edges may be cropped.'
              : 'The whole photo is visible, with a background colour around it.'}
          </p>

          <label className="field">
            Zoom
            <input type="range" min="1" max="3" step="0.05" value={opts.zoom} onChange={set('zoom')} />
          </label>
          <label className="field">
            Left / right
            <input type="range" min="0" max="1" step="0.01" value={opts.x} onChange={set('x')} />
          </label>
          <label className="field">
            Up / down
            <input type="range" min="0" max="1" step="0.01" value={opts.y} onChange={set('y')} />
          </label>
          {opts.mode === 'fit' && (
            <label className="field">
              Background colour
              <input type="color" value={opts.bg} onChange={set('bg')} className="color-input" />
            </label>
          )}
          {error && <span className="error" role="alert">{error}</span>}
        </div>
      </div>

      <div className="confirm-actions">
        <button type="button" className="btn btn-outline btn-small" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn btn-small" onClick={() => onApply(renderFit(img, opts))} disabled={!img}>
          Apply
        </button>
      </div>
    </dialog>
  );
}
