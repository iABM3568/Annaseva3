export default function Loader({ text = 'Loading...' }) {
  return <p className="p-6 text-center text-gray-500" role="status">{text}</p>;
}
