import { useAuth } from '../context/AuthContext';

// Placeholder: Day 7 turns this into the map of nearby food.
export default function NgoNearby() {
  const { user } = useAuth();
  return <main className="p-6"><h1 className="text-2xl font-bold">Welcome, {user.name}: food near you</h1></main>;
}
