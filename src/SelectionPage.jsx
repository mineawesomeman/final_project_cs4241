import React from "react"
import {Map, ZoomControl, GeoJsonLoader} from "pigeon-maps"
import {maptiler} from 'pigeon-maps/providers'
import './App.css'
import Chat from './Chat'

const map_tiler_api_key = 'GcgeMxfDe9G83TPjIASJ',
      maptilerProvider = maptiler(map_tiler_api_key, 'basic')

const geoJsonLink = '/buildings.geojson'
const otherGeoJsonLink = '/townhouses.geojson'

class SelectionPage extends React.Component {
  constructor(props) {
    super(props)

    this.state = {chat: "Kaven Hall"}

    this.featureClick = this.featureClick.bind(this)
  }

    // Function to handle the logout button click
    handleLogoutClick = () => {
        // Redirect to the server's logout route
        window.location.href = '/logout';
    };


  featureClick(info) {
    this.setState({chat: info.payload.properties.name})

    document.querySelector("#chat_name").innerHTML = info.payload.properties.name;
    document.querySelector("#chat").style.display = "grid";
    document.querySelector("#chat").showModal();
    
    console.log(info.payload.properties.name)
  }

  closeChat() {
    document.querySelector("#chat").style.display = "none"
    document.querySelector("#chat").close();
  }

  render() {
    return (
      <div>
        <h1>GoatChats</h1>
        <Map  
          height={600}
          center={[42.27431,-71.80839]} 
          defaultZoom={17}
          minZoom={16}
          maxZoom={18}
          provider={maptilerProvider}>
          <GeoJsonLoader
            link={geoJsonLink}
            styleCallback={(feature, hover) => {
              if (feature.properties.building === "residential") {
                return hover
                  ? { fill: '#028a0f99', strokeWidth: '2'}
                  : { fill: '#234f1399', strokeWidth: '1'}
              } else {
                return hover
                  ? { fill: '#d0312d99', strokeWidth: '2'}
                  : { fill: '#4e070799', strokeWidth: '1'}
              }
            }
            }
            onClick={this.featureClick}
          />
        </Map>
        <dialog id="chat" className="chat" style={{"display": "none"}}>
          <h2 id="chat_name" className="chat_name"></h2>
          <button className="close_button" onClick={this.closeChat} style={{"margin": "5px"}}>Close</button> 
          <div className="chat_elem">
            <Chat room={this.state.chat} />
          </div>
        </dialog>
          <button onClick={this.handleLogoutClick}>Logout</button> {/* Add the logout button */}
      </div>
    )
  }
}

export default SelectionPage;
