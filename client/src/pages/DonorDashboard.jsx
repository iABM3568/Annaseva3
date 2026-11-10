import { useAuth } from '../context/AuthContext';

// Placeholder: Day 6 turns this into the real donor dashboard.
export default function DonorDashboard() {
  const { user } = useAuth();
  return <main className="p-6"><h1 className="text-2xl font-bold">Welcome, {user.name}, donor</h1></main>;
}
