
import xml2js from 'xml2js';



function fileToString(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      resolve(event.target.result); // The result is the file content as a string
    };

    reader.onerror = (error) => {
      reject(error); // Handle potential errors during reading
    };

    // Read the file content as a text string (UTF-8 by default)
    reader.readAsText(file); 
  });
}


async function parseKmlPolygon(file) {
    try {
        const kmlString = await fileToString(file);
        const parser = new xml2js.Parser();
        
    
        parser.parseString(kmlString, (err, result) => {
            if (err) {
                console.error('Error parsing KML:', err);
                return null;
            }
    
            // Extract coordinates from the parsed KML
            const coordinates = result.kml.Document[0].Placemark[0].Polygon[0].outerBoundaryIs[0].LinearRing[0].coordinates[0];
            const coordsArray = coordinates.trim().split(/\s+/).map(coord => {
                const [lng, lat] = coord.split(',').map(Number);
                return { lat, lng };
            });
            console.log('Parsed KML coordinates:', coordsArray);
            return coordsArray;
        });
    } catch (error) {
        console.error('Error reading KML file:', error);
        return null;
    } 
}
   




export { parseKmlPolygon };