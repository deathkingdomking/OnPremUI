import React, {useEffect} from 'react';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField'
import FormControl from '@material-ui/core/FormControl'
import InputLabel from '@material-ui/core/InputLabel'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
    dateField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      marginTop: theme.spacing(5),
      width: '70%',
    },
    formControl: {
      marginLeft: theme.spacing(1),
      marginTop: theme.spacing(5),
      width: '70%',
    }
  }));

function formatDate(timestamp) {
  return new Date(timestamp+1000*60*60*8).toISOString().split(":").slice(0,2).join(":")
}

export default function FilterCondition(props){
    let timeNow = Date.now()+1000*60*60*24;
    let timeBefore = timeNow - 1000*60*60*24*2;
    timeNow = formatDate(timeNow);
    timeBefore = formatDate(timeBefore);
    let [condition, setCondition] = React.useState({
        startTime: timeBefore,
        endTime: timeNow,
        floor: "",
        building: "",
    });
    const classes = useStyles();
    useEffect(() => {
        props.filter(condition);
    }, [condition]);
    function handleChange(event) {
       let changed = {};
      if(event.target.name === "startTime") {
            changed = {
                startTime: event.target.value
            };
      } else if(event.target.name === "endTime") {
            changed  = {
                endTime: event.target.value
            };
      } else if(event.target.name === "buildings") {
            changed = {
                building: event.target.value
            };
      } else if(event.target.name === "floors") {
           changed = {
               floor: event.target.value
           };
      }
      setCondition((oldCondition) => {
          return {...oldCondition, ...changed};
      });
    }
    

    return (
    <Grid item key="filter-condition"  sm={2} md={3}>
        <TextField
            id="startTime"
            label="startTime"
            name="startTime"
            type="datetime-local"
            defaultValue={condition.startTime}
            onChange={handleChange}
            className={classes.dateField}
            InputLabelProps={{
                shrink: true,
        }}
        />
        <TextField
            id="endTime"
            label="endTime"
            name="endTime"
            type="datetime-local"
            defaultValue={condition.endTime}
            onChange={handleChange}
            className={classes.dateField}
            InputLabelProps={{
                shrink: true,
        }}
        />
       <FormControl className={classes.formControl}>
        <InputLabel htmlFor="buildings">Building</InputLabel>
        <Select
          value={condition.building}
          onChange={handleChange}
          inputProps={{
            name: 'buildings',
            id: 'buildings',
          }}
        >
          {props.buildings.map((building) => {
            return (<MenuItem key={building} value={building}>{building}</MenuItem>)
          })}
        </Select>
      </FormControl>
      <FormControl className={classes.formControl}>
        <InputLabel htmlFor="floors">Floor</InputLabel>
        <Select
          value={condition.floor}
          onChange={handleChange}
          inputProps={{
            name: 'floors',
            id: 'floors',
          }}
        >
          {props.floors.map((floor) => {
            return (<MenuItem key={floor} value={floor}>{floor}</MenuItem>)
          })}
        </Select>
      </FormControl>
      
    </Grid> )
}