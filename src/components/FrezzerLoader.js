import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import clsx from "clsx";
import LinearProgress from "@material-ui/core/LinearProgress/LinearProgress";


const useStyles = makeStyles(theme => ({
    loader: {
        zIndex: 1111,
        opacity: 0.6,
        top: 0,
        left: 0,
        position: 'absolute',
        width: '100%',
        height: '100%',
        display: 'flex',
        background: theme.palette.background.paper
    }
}));

export default function ({ backdropClass }) {
    const classes = useStyles();
    return (
        <div className={clsx(classes.loader, backdropClass)}>
            <LinearProgress className="full-width"/>
        </div>
    );
}
