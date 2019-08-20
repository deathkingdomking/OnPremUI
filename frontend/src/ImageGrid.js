import React from 'react';
import Image from 'react-shimmer';
import { Eclipse } from "react-loading-io";
import LazyLoad from 'react-lazyload';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
const HOST = "http://localhost:3000"

const useStyles = makeStyles(theme => ({
    cardGrid: {
      paddingTop: theme.spacing(3),
      paddingBottom: theme.spacing(3),
      marginRight: theme.spacing(3),
      maxWidth: '100%',
    },
    card: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    },
    paragraph: {
      marginBottom: 0, // 16:9
    },
    cardContent: {
      flexGrow: 1,
      padding: theme.spacing(1),
    }
  }));
function Spiner(props) {
    return <Eclipse size={225} />;
}
export default function ImageGrid(props) {
    const classes = useStyles();
    return (
     <Grid item key="image-grid" xs={12} sm={10} md={9}>
        <Container className={classes.cardGrid}>
          <Grid container spacing={2}>
            {props.images.map((card) => (
               <Grid  item  onClick={() => props.onClickImage(card)} key={card.id} xs={12} sm={6} md={4}>
                 <Card className={classes.card}>
                     <LazyLoad throttle={200}  placeholder={<Spiner/>}>
                        <Image
                            src={`${HOST}${card.source}`}
                            style={{objectFit: 'cover'}}
                            width={350}
                            height={200}
                            duration={0.9}
                            delay={25}
                            fallback={<Spiner/>}
                        />
                     </LazyLoad>
                  <CardContent style={{paddingBottom: 'inherit'}} className={classes.cardContent}>
                  <Typography paragraph={true} className={classes.paragraph}>
                      date: {new Date(card.timestamp).toLocaleString()}
                  </Typography>
                  <Typography paragraph={true} className={classes.paragraph}>
                      location: {card.location}
                  </Typography>
                  </CardContent>
                 </Card>
               </Grid>
            ))}
           </Grid>
         </Container>
       </Grid>
    )
}
