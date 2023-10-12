import React from "react"
import {Map, ZoomControl, GeoJsonLoader} from "pigeon-maps"
import {maptiler} from 'pigeon-maps/providers'
import './App.css'
import Chat from './Chat'

const map_tiler_api_key = 'GcgeMxfDe9G83TPjIASJ',
      maptilerProvider = maptiler(map_tiler_api_key, 'basic')

const geoJsonLink = '/buildings.geojson'


window.onmousemove = function(e) {
  document.querySelector("#hover_elem").style.top = e.clientY
  document.querySelector("#hover_elem").style.left = e.clientX
}


class SelectionPage extends React.Component {
  constructor(props) {
    super(props)

    this.state = {chat: "Kaven Hall"}

    this.featureClick = this.featureClick.bind(this)
  }


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
              if (hover) {
                document.querySelector("#hover_text").innerHTML = feature.properties.name
                document.querySelector("#hover_elem").style.display = "initial"

                if (feature.properties.building === "residential") {
                  return { fill: '#028a0f99', strokeWidth: '2'};
                } else {
                  return { fill: '#d0312d99', strokeWidth: '2'};
                }
              } else {
                document.querySelector("#hover_elem").style.display = "none"

                if (feature.properties.building === "residential") {
                  return { fill: '#234f1399', strokeWidth: '1'}
                } else {
                  return { fill: '#4e070799', strokeWidth: '1'}
                }
              }
            }
            }
            onClick={this.featureClick}
          />
        </Map>
        <dialog id="chat" className="chat" style={{"display": "none"}}>
          <h2 id="chat_name" className="chat_name"></h2>
          <button className="close_button" onClick={this.closeChat}>Close</button> 
          <div className="chat_elem">
            <Chat room={this.state.chat} />
          </div>
        </dialog>
        <div className="hover_elem" id="hover_elem">
          <p id="hover_text">Building Name</p>
        </div>
      </div>
    )
  }
}

export default SelectionPage;
