import React from 'react';
import ReactDOM from 'react-dom'
import AppBar from '@material-ui/core/AppBar';
import FilterCondition from './FilterCondition'
import ImageGrid from './ImageGrid';
import VideoModal from './Modal';
import Grid from '@material-ui/core/Grid';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import CssBaseLine from '@material-ui/core/CssBaseline'
import Container from '@material-ui/core/Container';
import { makeStyles } from '@material-ui/core/styles';
import axios from 'axios';

const useStyles = makeStyles(theme => ({
  outerGrid: {
    maxWidth: '100%',
  }
}));

const HOST = "localhost:3000";

function initWsCon(cb, statusController){
    let ws = new WebSocket(`ws://${HOST}`);
    ws.onopen = () => {
      console.log("a new connection has been made");
    };
    ws.onmessage =  (data) => {
      cb(data);
    };
    ws.onclose =  () => {
      console.log("ws has closed");
      ws = null;
      setTimeout(()=>statusController((oldStatus) => !oldStatus), 5000);
    };
    ws.onerror = (e) => {
      console.error(e);
      ws.close();
    };
    return ws;

}

export default function ImageFlow() {
  let [buildings, setBuildings] = React.useState(["zhonghai", "nanjingxilu"]);
  let [floors, setFloors] = React.useState(["3rd floor", "second floor"]);
  let [images, setImages] = React.useState([]);
  let [modalImage, setModalImage] = React.useState({});
  let [videoModal, setVideoModal] = React.useState(false);
  let [wsStatus, setWsStatus] = React.useState(true);
  const classes = useStyles();
  let imagesCache = [];

  React.useEffect(() => {
      initWsCon((data) => {
          let events = JSON.parse(data.data);
          if(imagesCache.length > 500) {
              imagesCache = imagesCache.slice(100, imagesCache.length);
          }
          imagesCache = events.map((event) => {
              return {
                  source: event.result.source,
                  title: event.description,
                  timestamp: event.ec_event_time,
                  behaviors: event.result.behaviors,
                  location: "CNZH",
                  id: event.id,
              }
          }).concat(imagesCache);
      }, setWsStatus);
      setInterval(() => {
          setImages((oldImages) => {
              return imagesCache.splice(0, 3).concat(oldImages);
          });
      }, 1000);

  }, [wsStatus]);
  function onClickImage(image) {
     setVideoModal(true)
     setModalImage(image)
  }

  function filterRequest(condition){
      let query = `http://${HOST}/recognition`;
      let condArr = [];
      if("startTime" in condition){
          condArr.push(`startTime=${Date.parse(condition.startTime)}`);
      }
      if("endTime" in condition) {
          condArr.push(`endTime=${Date.parse(condition.endTime)}`);
      }
      if(condArr.length > 0) {
          query += `?${condArr.join("&&")}`;
      }
      axios.get(query).then((res) => {
          setImages(res.data);
      }).catch((e) => {
          console.log(e);
      });
  }

  return (
    <React.Fragment>
      <CssBaseLine />
      <AppBar position="relative">
        <Toolbar>
          <Typography variant="h5" color="inherit" noWrap>
            WeWork
          </Typography>
        </Toolbar>
      </AppBar>
      <main>
        <Container className={classes.outerGrid}>
            <Grid container>
             <FilterCondition
                floors={floors}
                buildings={buildings}
                filter={(condition) => filterRequest(condition)}/>
             <ImageGrid onClickImage={onClickImage} images={images} />
             <VideoModal open={videoModal} image={modalImage} close={() => setVideoModal(false)}/>
            </Grid>
        </Container>
      </main>
    </React.Fragment>
  );
}

ReactDOM.render(
    <ImageFlow />,
    document.getElementById('root')
);
