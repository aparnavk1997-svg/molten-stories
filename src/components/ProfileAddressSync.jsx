import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { isAddressValid } from '../utils/pricing';

/** When a customer signs in, fill the bag's delivery address from their saved profile (once per sign-in). */
export default function ProfileAddressSync() {
  const { user, profile } = useAuth();
  const { setAddress } = useCart();
  const appliedFor = useRef(null);

  useEffect(() => {
    if (!user || !profile || appliedFor.current === user.id) return;
    appliedFor.current = user.id;
    const address = {
      name: profile.fullName, phone: profile.phone, street: profile.street,
      city: profile.city, state: profile.state, pin: profile.pin,
    };
    if (isAddressValid(address)) setAddress(address);
  }, [user, profile, setAddress]);

  useEffect(() => {
    if (!user) appliedFor.current = null;
  }, [user]);

  return null;
}
