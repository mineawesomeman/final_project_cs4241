import React from "react"
import {Map, ZoomControl, GeoJsonLoader} from "pigeon-maps"
import {maptiler} from 'pigeon-maps/providers'

const map_tiler_api_key = 'GcgeMxfDe9G83TPjIASJ',
      maptilerProvider = maptiler(map_tiler_api_key, 'basic')

const geoJsonLink = '/buildings.geojson'

class App extends React.Component {

  featureClick(info) {
    console.log(info.payload.properties.name)
  }

  render() {
    return (
      <div>
        <h1>GoatChats</h1>
        <Map  
          height={500} 
          center={[42.27431,-71.80839]} 
          defaultZoom={17}
          minZoom={16}
          maxZoom={18}
          provider={maptilerProvider}>
          <GeoJsonLoader
            link={geoJsonLink}
            styleCallback={(feature, hover) =>
              hover
                ? { fill: '#d0312d99', strokeWidth: '2'}
                : { fill: '#4e070799', strokeWidth: '1'}
            }
            onClick={this.featureClick}
          />
        </Map>
      </div>
    )
  }
}

export default App;
