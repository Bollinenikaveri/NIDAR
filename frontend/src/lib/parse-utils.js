import xml2js from 'xml2js';

function fileToString(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export async function parseKmlPolygon(file) {
  const kmlString = await fileToString(file);
  const parser = new xml2js.Parser();

  return new Promise((resolve, reject) => {
    parser.parseString(kmlString, (err, result) => {
      if (err) {
        console.error('Error parsing KML:', err);
        reject(err);
        return;
      }

      try {
        const coordinates = result.kml.Document[0].Placemark[0].Polygon[0]
          .outerBoundaryIs[0].LinearRing[0].coordinates[0];

        const coordsArray = coordinates.trim().split(/\s+/).map(coord => {
          const [lng, lat] = coord.split(',').map(Number);
          return { lat, lng };
        });

        console.log('Parsed KML coordinates:', coordsArray);
        resolve(coordsArray);
      } catch (e) {
        reject(e);
      }
    });
  });
}
