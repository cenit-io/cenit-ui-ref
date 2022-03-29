import React from "react";
import NavBar from './NavBar';
import { makeStyles } from "@material-ui/core";

const H = 6;

const useStyles = makeStyles(theme => ({
    root: {
        position: 'relative',
        paddingTop: theme.spacing(H)
    }
}));

export default function Layout() {

    const classes = useStyles();

    return (
        <div className={classes.root}>
            <NavBar />
        </div>
    );
}
