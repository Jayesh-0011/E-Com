/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Geocode an address to get coordinates using OpenStreetMap Nominatim
 * @param {string} addressLine1 - Address line 1
 * @param {string} city - City name
 * @param {string} pincode - Postal code
 * @param {string} state - State name
 * @returns {Promise<{lat: number, lon: number} | null>} Coordinates or null if not found
 */
export async function geocodeAddress(addressLine1, city, pincode, state) {
  try {
    // Build search query
    const queryParts = [];
    if (addressLine1) queryParts.push(addressLine1);
    if (city) queryParts.push(city);
    if (pincode) queryParts.push(pincode);
    if (state) queryParts.push(state);
    
    const query = queryParts.join(", ");
    
    if (!query.trim()) {
      return null;
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      {
        headers: {
          'User-Agent': 'QuickShop E-Commerce App'
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}





