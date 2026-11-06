import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
};

/** Round pencil button laid over a product image; only rendered when signed in as admin. */
export function AdminEditLink({ product }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return null;
  const label = `Edit ${product.name} in admin`;
  return (
    <Link to={`/admin?edit=${product.id}`} className="admin-edit-btn" aria-label={label} title="Edit in admin">
      <svg {...iconProps}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    </Link>
  );
}

/** Padlock icon that goes to the admin page (which asks for sign-in when needed). */
export function AdminLink({ className = '' }) {
  return (
    <Link to="/admin" className={`admin-link ${className}`} aria-label="Admin" title="Admin">
      <svg {...iconProps}>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
    </Link>
  );
}
