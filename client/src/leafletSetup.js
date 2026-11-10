import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // the map's own styles (without this, tiles are scattered around the page)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Vite renames image files when it builds, so Leaflet can't find its default pin images by itself.
// We import them (so Vite knows about them) and give Leaflet the correct URLs.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
