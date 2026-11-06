import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

/** When a customer signs in, fill the bag's delivery address from their primary (profile) address, once per sign-in. */
export default function ProfileAddressSync() {
  const { user, primaryAddress, loading } = useAuth();
  const { setAddress } = useCart();
  const appliedFor = useRef(null);

  useEffect(() => {
    if (!user || loading || appliedFor.current === user.id) return;
    appliedFor.current = user.id;
    if (primaryAddress) {
      setAddress({
        name: primaryAddress.name, phone: primaryAddress.phone, street: primaryAddress.street,
        city: primaryAddress.city, state: primaryAddress.state, pin: primaryAddress.pin,
      });
    }
  }, [user, primaryAddress, loading, setAddress]);

  useEffect(() => {
    if (!user) appliedFor.current = null;
  }, [user]);

  return null;
}
