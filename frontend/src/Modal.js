import React from 'react';
import Modal from '@material-ui/core/Modal';
import { makeStyles } from '@material-ui/core/styles';
import Image from 'react-shimmer';
import { maxHeight } from '@material-ui/system';
const HOST = "http://localhost:3000"


function getModalStyle() {
    const top = 50;
    const left = 50;
  
    return {
      top: `${top}%`,
      left: `${left}%`,
      transform: `translate(-${top}%, -${left}%)`,
    };
  }

const useStyles = makeStyles(theme => ({
    paper: {
      position: 'absolute',
      width: 800,
      height: 600,
      backgroundColor: theme.palette.background.paper,
      border: '2px solid #000',
      boxShadow: theme.shadows[5],
      padding: theme.spacing(2, 4, 4),
      outline: 'none',
    },
    img: {
      width: 720,
      height: "auto",
      maxHeight: 450
    }
  }));

export default function VideoModal(props) {
  const classes = useStyles();
  const modalStyle = getModalStyle();
  function handleClose(){
      props.close();
  }

  return (
    <Modal
      aria-labelledby="simple-modal-title"
      aria-describedby="simple-modal-description"
      open={props.open}
      onClose={handleClose}
     >
    <div style={modalStyle} className={classes.paper}>
      <h2 id="modal-title">{new Date(props.image.timestamp).toLocaleString()}</h2>
       <p id="simple-modal-description">
          {props.image.location}
      </p>
      <img className={classes.img} src={`${HOST}${props.image.source}`}/>
    </div>
    </Modal>
  )
}
